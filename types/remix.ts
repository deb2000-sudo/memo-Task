import type { TaskPriority } from "@/types/task";

export type RemixTaskInput = {
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  category: string | null;
  subtasks: string[];
  instruction: string;
};

export type RemixTaskResult = {
  title: string;
  description: string;
  priority: TaskPriority | null;
  category: string | null;
  subtasks: string[];
};

export type RemixMetadata = {
  model: "gemma3:4b";
  provider: "ollama";
  location: "local";
};
