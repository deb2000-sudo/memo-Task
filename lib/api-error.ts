import {
  serviceErrorCodes,
  type ServiceErrorCode,
} from "@/types/errors";

export class ApiError extends Error {
  readonly code: ServiceErrorCode | "request_failed";
  readonly status: number;

  constructor(code: ServiceErrorCode | "request_failed", status: number) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function readErrorCode(
  value: string | undefined,
): ServiceErrorCode | "request_failed" {
  if (value && serviceErrorCodes.includes(value as ServiceErrorCode)) {
    return value as ServiceErrorCode;
  }

  return "request_failed";
}
