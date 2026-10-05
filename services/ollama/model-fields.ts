import { taskPriorities, type TaskPriority } from "@/types/task";
import { ServiceError } from "@/types/errors";

export const MAX_TITLE_LENGTH = 140;
export const MAX_TEXT_LENGTH = 2000;

export function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new ServiceError("malformed_json", "Model output was not valid JSON.");
  }
}

export function readRecord(
  value: unknown,
  allowed: ReadonlySet<string>,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output was not an object.",
    );
  }

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new ServiceError(
        "invalid_model_output",
        "Model output included an unexpected field.",
      );
    }
  }

  return record;
}

export function readTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new ServiceError(
      "invalid_model_output",
      "Model output is missing a title.",
    );
  }

  const title = value.trim();

  if (title === "" || title.length > MAX_TITLE_LENGTH) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has an invalid title.",
    );
  }

  return title;
}

export function readDetails(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has invalid details.",
    );
  }

  const details = value.trim();

  if (details.length > MAX_TEXT_LENGTH) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output details are too long.",
    );
  }

  return details === "" ? null : details;
}

export function readDescription(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ServiceError(
      "invalid_model_output",
      "Model output is missing a description.",
    );
  }

  const description = value.trim();

  if (description.length > MAX_TEXT_LENGTH) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output details are too long.",
    );
  }

  return description;
}

export function readPriority(value: unknown): TaskPriority {
  if (
    typeof value === "string" &&
    taskPriorities.includes(value as TaskPriority)
  ) {
    return value as TaskPriority;
  }

  throw new ServiceError(
    "invalid_model_output",
    "Model output has an invalid priority.",
  );
}

export function readNullablePriority(value: unknown): TaskPriority | null {
  if (value === undefined) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output is missing a priority.",
    );
  }

  if (value === null) {
    return null;
  }

  return readPriority(value);
}

export function readDueAt(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has an invalid dueAt.",
    );
  }

  return new Date(value).toISOString();
}

const MAX_CATEGORY_LENGTH = 40;
const MAX_SUBTASKS = 12;

export function readCategory(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has an invalid category.",
    );
  }

  const category = value.trim();

  if (category === "") {
    return null;
  }

  if (category.length > MAX_CATEGORY_LENGTH) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has an invalid category.",
    );
  }

  return category;
}

export function readSubtasks(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_SUBTASKS) {
    throw new ServiceError(
      "invalid_model_output",
      "Model output has invalid subtasks.",
    );
  }

  return value.map((item) => {
    if (typeof item !== "string") {
      throw new ServiceError(
        "invalid_model_output",
        "Model output has invalid subtasks.",
      );
    }

    const subtask = item.trim();

    if (subtask === "" || subtask.length > MAX_TITLE_LENGTH) {
      throw new ServiceError(
        "invalid_model_output",
        "Model output has invalid subtasks.",
      );
    }

    return subtask;
  });
}
