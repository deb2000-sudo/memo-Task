export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof taskPriorities)[number];

export const taskStatuses = ["open", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type TaskDraft = {
  title: string;
  details: string | null;
  priority: TaskPriority;
  dueAt: string | null;
};

export type TaskPlan = {
  title: string;
  details: string | null;
  priority: TaskPriority;
  category: string | null;
  subtasks: string[];
};

export type TaskMemo = {
  transcript: string;
  audio: Blob;
  durationMs: number;
};

export type Task = TaskDraft & {
  id: string;
  transcript: string;
  audio: Blob | null;
  durationMs: number;
  category: string | null;
  subtasks: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};
