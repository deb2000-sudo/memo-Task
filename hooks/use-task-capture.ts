"use client";

import { useState } from "react";

import { requestTaskDraft } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { transcribeVoiceMemo } from "@/lib/transcribe-voice-memo";
import type { TaskDraft } from "@/types/task";

export type CaptureResult = {
  transcript: string;
  draft: TaskDraft | null;
};

export function useTaskCapture() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function capture(audio: Blob): Promise<CaptureResult> {
    setPending(true);
    setError(null);

    try {
      const transcript = await transcribeVoiceMemo(audio);

      try {
        const draft = await requestTaskDraft(transcript);
        return { transcript, draft };
      } catch (parseError) {
        if (
          parseError instanceof ApiError &&
          (parseError.code === "invalid_model_output" ||
            parseError.code === "malformed_json")
        ) {
          return { transcript, draft: null };
        }

        throw parseError;
      }
    } catch (captureError) {
      const apiError =
        captureError instanceof ApiError
          ? captureError
          : new ApiError("request_failed", 500);
      setError(apiError);
      throw apiError;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, capture };
}
