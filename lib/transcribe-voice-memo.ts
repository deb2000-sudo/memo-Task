import { detectAudioKind, extensionForAudio } from "@/lib/audio-format";
import { ApiError, readErrorCode } from "@/lib/api-error";

export type TranscriptionProgress = {
  phase: "uploading" | "transcribing";
  upload: number | null;
};

type TranscribeOptions = {
  onProgress?: (progress: TranscriptionProgress) => void;
};

const REQUEST_TIMEOUT_MS = 60_000;

export async function transcribeVoiceMemo(
  audio: Blob,
  options: TranscribeOptions = {},
): Promise<string> {
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

  return postAudio(body, options.onProgress);
}

function postAudio(
  body: FormData,
  onProgress: TranscribeOptions["onProgress"],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/transcribe");
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
      onProgress?.({ phase: "transcribing", upload: null });
    };

    request.onerror = () => {
      reject(new ApiError("request_failed", 0));
    };

    request.ontimeout = () => {
      reject(new ApiError("timeout", 504));
    };

    request.onload = () => {
      const payload = readPayload(request.response);

      if (request.status >= 200 && request.status < 300) {
        const transcript = payload?.transcript?.trim() ?? "";
        if (!transcript) {
          reject(new ApiError("empty_transcript", 422));
          return;
        }

        resolve(transcript);
        return;
      }

      reject(new ApiError(readErrorCode(payload?.error), request.status));
    };

    onProgress?.({ phase: "uploading", upload: 0 });
    request.send(body);
  });
}

function readPayload(value: unknown): { transcript?: string; error?: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { transcript?: unknown; error?: unknown };
  return {
    transcript: typeof record.transcript === "string" ? record.transcript : undefined,
    error: typeof record.error === "string" ? record.error : undefined,
  };
}
