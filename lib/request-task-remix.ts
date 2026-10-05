import { ApiError, readErrorCode } from "@/lib/api-error";
import { parseRemixResult } from "@/services/ollama/parse-remix";
import { ServiceError } from "@/types/errors";
import type { RemixMetadata, RemixTaskResult } from "@/types/remix";
import type { Task } from "@/types/task";

function quietText(value: string | null): string | null {
  const text = value?.trim() ?? "";
  if (text === "" || text.toLowerCase() === "null" || text.toLowerCase() === "none") {
    return null;
  }

  return value;
}

const REQUEST_TIMEOUT_MS = 70_000;

export async function requestTaskRemix(
  task: Task,
  instruction: string,
): Promise<RemixTaskResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/ai/remix-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        task: {
          title: task.title,
          description: quietText(task.details),
          priority: task.priority,
          category: task.category,
          subtasks: task.subtasks,
        },
        instruction,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      success?: unknown;
      result?: unknown;
      metadata?: RemixMetadata;
    } | null;

    if (!response.ok) {
      throw new ApiError(readErrorCode(payload?.error), response.status);
    }

    if (
      payload?.success !== true ||
      !payload.metadata ||
      payload.metadata.model !== "gemma3:4b" ||
      payload.metadata.provider !== "ollama" ||
      payload.metadata.location !== "local"
    ) {
      throw new ApiError("request_failed", response.status);
    }

    return parseRemixResult(payload.result);
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
