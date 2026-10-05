export const serviceErrorCodes = [
  "missing_audio",
  "unsupported_audio",
  "audio_too_large",
  "empty_transcript",
  "transcript_too_long",
  "invalid_model_output",
  "malformed_json",
  "missing_key",
  "model_not_installed",
  "ollama_unavailable",
  "timeout",
  "upstream_failed",
] as const;

export type ServiceErrorCode = (typeof serviceErrorCodes)[number];

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}
