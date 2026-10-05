"use client";

import { useRef, useState } from "react";

import { ApiError } from "@/lib/api-error";
import { requestTaskRemix } from "@/lib/request-task-remix";
import type { ServiceErrorCode } from "@/types/errors";
import type { RemixTaskResult } from "@/types/remix";
import type { Task } from "@/types/task";

export type RemixPhase = "form" | "running" | "ready";

const errorMessages: Record<ServiceErrorCode | "request_failed", string> = {
  missing_audio: "The remix could not be prepared.",
  unsupported_audio: "The remix could not be prepared.",
  audio_too_large: "The remix could not be prepared.",
  empty_transcript: "The remix could not be prepared.",
  transcript_too_long: "That instruction is too long.",
  invalid_model_output: "Gemma's suggestion could not be read. Try again.",
  malformed_json: "Gemma's suggestion could not be read. Try again.",
  missing_key: "The remix could not be prepared.",
  model_not_installed: "The local model is not installed.",
  ollama_unavailable: "Gemma is offline. Ollama is not running.",
  timeout: "Gemma timed out. Try again.",
  upstream_failed: "Gemma could not finish the remix. Try again.",
  request_failed: "The remix could not be prepared.",
};

export function useTaskRemix() {
  const [phase, setPhase] = useState<RemixPhase>("form");
  const [suggestion, setSuggestion] = useState<RemixTaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const running = useRef(false);

  async function remix(task: Task, instruction: string) {
    if (running.current) {
      return;
    }

    running.current = true;
    const id = requestId.current + 1;
    requestId.current = id;
    setPhase("running");
    setError(null);
    setSuggestion(null);

    try {
      const result = await requestTaskRemix(task, instruction);
      if (id !== requestId.current) {
        return;
      }

      setSuggestion(result);
      setPhase("ready");
    } catch (remixError) {
      if (id !== requestId.current) {
        return;
      }

      setError(messageFor(remixError));
      setPhase("form");
    } finally {
      if (id === requestId.current) {
        running.current = false;
      }
    }
  }

  function reset() {
    requestId.current += 1;
    running.current = false;
    setPhase("form");
    setSuggestion(null);
    setError(null);
  }

  return { phase, suggestion, error, remix, reset };
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return errorMessages[error.code];
  }

  return errorMessages.request_failed;
}
