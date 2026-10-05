import { ApiError, readErrorCode } from "@/lib/api-error";
import { transcribeVoiceMemo } from "@/lib/transcribe-voice-memo";
import { parseTaskDraft } from "@/services/ollama/parse-draft";
import { ServiceError } from "@/types/errors";
import type { TaskDraft } from "@/types/task";

export { ApiError } from "@/lib/api-error";

export function requestTranscript(audio: Blob): Promise<string> {
  return transcribeVoiceMemo(audio);
}

const DRAFT_TIMEOUT_MS = 70_000;

export async function requestTaskDraft(transcript: string): Promise<TaskDraft> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DRAFT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/tasks/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; draft?: unknown }
      | null;

    if (!response.ok) {
      throw new ApiError(readErrorCode(payload?.error), response.status);
    }

    if (!payload?.draft) {
      throw new ApiError("request_failed", response.status);
    }

    return parseTaskDraft(payload.draft);
  } catch (error) {
    if (error instanceof ServiceError) {
      throw new ApiError(error.code, 422);
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("timeout", 504);
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}
