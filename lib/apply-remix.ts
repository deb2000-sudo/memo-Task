import type { Task, TaskPlan } from "@/types/task";
import type { RemixTaskResult } from "@/types/remix";

export function planFromRemix(
  task: Task,
  result: RemixTaskResult,
  edited = false,
): TaskPlan {
  const category = result.category?.trim() ?? "";

  return {
    title: result.title.trim(),
    details: result.description.trim() === "" ? null : result.description.trim(),
    priority: result.priority ?? task.priority,
    category: category === "" ? (edited ? null : task.category) : category,
    subtasks: result.subtasks.map((item) => item.trim()).filter((item) => item !== ""),
  };
}

export function applyRemix(task: Task, result: RemixTaskResult): Task {
  return {
    ...task,
    ...planFromRemix(task, result),
  };
}

export function dismissRemix(task: Task): Task {
  return task;
}
