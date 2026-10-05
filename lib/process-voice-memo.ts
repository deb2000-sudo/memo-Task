import { detectAudioKind, extensionForAudio } from "@/lib/audio-format";
import { ApiError, readErrorCode } from "@/lib/api-error";
import { parseTaskDraft } from "@/services/ollama/parse-draft";
import { ServiceError } from "@/types/errors";
import type { VoiceMemoResult } from "@/types/voice-memo";

export type VoiceMemoProgress = {
  phase: "uploading" | "processing";
  upload: number | null;
};

type ProcessOptions = {
  onProgress?: (progress: VoiceMemoProgress) => void;
};

const REQUEST_TIMEOUT_MS = 120_000;

export async function processVoiceMemo(
  audio: Blob,
  options: ProcessOptions = {},
): Promise<VoiceMemoResult> {
  if (audio.size === 0) {
    throw new ApiError("missing_audio", 400);
  }

  const header = new Uint8Array(await audio.slice(0, 16).arrayBuffer());
  const kind = detectAudioKind(header);

  if (!kind) {
    throw new ApiError("unsupported_audio", 415);
  }

  const body = new FormData();
  body.set("audio", audio, `memo.${extensionForAudio(kind)}`);

  const payload = await postAudio(body, options.onProgress);

  try {
    return {
      transcript: payload.transcript.trim(),
      task: parseTaskDraft(payload.task),
      metadata: payload.metadata,
    };
  } catch (error) {
    if (error instanceof ServiceError) {
      throw new ApiError(error.code, 422);
    }

    throw new ApiError("request_failed", 500);
  }
}

function postAudio(
  body: FormData,
  onProgress: ProcessOptions["onProgress"],
): Promise<VoiceMemoResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/voice-memo");
    request.responseType = "json";
    request.timeout = REQUEST_TIMEOUT_MS;

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) {
        return;
      }

      onProgress?.({
        phase: "uploading",
        upload: event.loaded / event.total,
      });
    };

    request.upload.onload = () => {
      onProgress?.({ phase: "processing", upload: null });
    };

    request.onerror = () => {
      reject(new ApiError("request_failed", 0));
    };

    request.ontimeout = () => {
      reject(new ApiError("timeout", 504));
    };

    request.onload = () => {
      const payload = readPayload(request.response);

      if (request.status >= 200 && request.status < 300 && payload?.result) {
        resolve(payload.result);
        return;
      }

      reject(new ApiError(readErrorCode(payload?.error), request.status));
    };

    onProgress?.({ phase: "uploading", upload: 0 });
    request.send(body);
  });
}

function readPayload(value: unknown): {
  result: VoiceMemoResult | null;
  error?: string;
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as {
    transcript?: unknown;
    task?: unknown;
    metadata?: unknown;
    error?: unknown;
  };
  const error = typeof record.error === "string" ? record.error : undefined;

  if (typeof record.transcript !== "string" || !isMetadata(record.metadata)) {
    return { result: null, error };
  }

  return {
    result: {
      transcript: record.transcript,
      task: record.task as VoiceMemoResult["task"],
      metadata: record.metadata,
    },
    error,
  };
}

function isMetadata(value: unknown): value is VoiceMemoResult["metadata"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const metadata = value as VoiceMemoResult["metadata"];
  return (
    metadata.transcriptionProvider === "elevenlabs" &&
    metadata.reasoningModel === "gemma3:4b" &&
    metadata.reasoningLocation === "local"
  );
}
