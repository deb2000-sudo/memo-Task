import { ServiceError } from "@/types/errors";

export function toOllamaServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }

  if (isTimeout(error)) {
    return new ServiceError("timeout", "Ollama timed out.");
  }

  return new ServiceError("ollama_unavailable", "Ollama did not respond.");
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
