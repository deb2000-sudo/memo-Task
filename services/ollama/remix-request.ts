import { taskPriorities, type TaskPriority } from "@/types/task";
import type { RemixTaskInput } from "@/types/remix";

const MAX_INSTRUCTION_LENGTH = 500;

export function readRemixRequest(body: unknown): RemixTaskInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as { task?: unknown; instruction?: unknown };
  const task = record.task;

  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return null;
  }

  const source = task as Record<string, unknown>;
  const title = typeof source.title === "string" ? source.title.trim() : "";

  if (title === "" || title.length > 140) {
    return null;
  }

  const description = readOptionalText(source.description ?? source.details);
  const category = readOptionalText(source.category);
  const instruction =
    typeof record.instruction === "string" ? record.instruction.trim() : "";

  if (
    description === undefined ||
    category === undefined ||
    instruction.length > MAX_INSTRUCTION_LENGTH
  ) {
    return null;
  }

  const priority = readInputPriority(source.priority);
  const subtasks = readInputSubtasks(source.subtasks);

  if (priority === undefined || !subtasks) {
    return null;
  }

  return {
    title,
    description,
    priority,
    category,
    subtasks,
    instruction,
  };
}

function readOptionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();
  return text === "" ? null : text;
}

function readInputPriority(value: unknown): TaskPriority | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string" && taskPriorities.includes(value as TaskPriority)) {
    return value as TaskPriority;
  }

  return undefined;
}

function readInputSubtasks(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.length > 20) {
    return null;
  }

  const subtasks: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    const subtask = item.trim();

    if (subtask === "") {
      continue;
    }

    if (subtask.length > 140) {
      return null;
    }

    subtasks.push(subtask);
  }

  return subtasks;
}
