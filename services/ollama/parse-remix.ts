import {
  parseJson,
  readCategory,
  readDescription,
  readNullablePriority,
  readRecord,
  readSubtasks,
  readTitle,
} from "@/services/ollama/model-fields";
import type { RemixTaskResult } from "@/types/remix";

const REMIX_FIELDS = new Set([
  "title",
  "description",
  "priority",
  "category",
  "subtasks",
]);

export function parseRemixContent(content: string): RemixTaskResult {
  return parseRemixResult(parseJson(content));
}

export function parseRemixResult(value: unknown): RemixTaskResult {
  const record = readRecord(value, REMIX_FIELDS);

  return {
    title: readTitle(record.title),
    description: readDescription(record.description),
    priority: readNullablePriority(record.priority),
    category: readCategory(record.category),
    subtasks: readSubtasks(record.subtasks),
  };
}
