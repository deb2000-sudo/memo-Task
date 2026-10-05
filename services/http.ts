import "server-only";

import { ServiceError, type ServiceErrorCode } from "@/types/errors";

const statusByCode: Record<ServiceErrorCode, number> = {
  missing_audio: 400,
  unsupported_audio: 415,
  audio_too_large: 413,
  empty_transcript: 422,
  transcript_too_long: 413,
  invalid_model_output: 422,
  malformed_json: 422,
  missing_key: 503,
  model_not_installed: 503,
  ollama_unavailable: 503,
  timeout: 504,
  upstream_failed: 502,
};

export function errorResponse(code: ServiceErrorCode): Response {
  return Response.json({ error: code }, { status: statusByCode[code] });
}

export function fromUnknownError(error: unknown): Response {
  if (error instanceof ServiceError) {
    return errorResponse(error.code);
  }

  return Response.json({ error: "request_failed" }, { status: 500 });
}
