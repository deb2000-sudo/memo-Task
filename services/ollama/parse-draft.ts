import type { TaskDraft } from "@/types/task";
import {
  parseJson,
  readDetails,
  readDueAt,
  readPriority,
  readRecord,
  readTitle,
} from "@/services/ollama/model-fields";

const TASK_FIELDS = new Set(["title", "details", "priority", "dueAt"]);

export function parseModelContent(content: string): TaskDraft {
  return parseTaskDraft(parseJson(content));
}

export function parseTaskDraft(value: unknown): TaskDraft {
  const record = readRecord(value, TASK_FIELDS);

  return {
    title: readTitle(record.title),
    details: readDetails(record.details),
    priority: readPriority(record.priority),
    dueAt: readDueAt(record.dueAt),
  };
}
