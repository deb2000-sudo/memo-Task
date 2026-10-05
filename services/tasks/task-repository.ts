import Dexie, { type EntityTable } from "dexie";

import type { Task, TaskDraft, TaskMemo, TaskPlan, TaskStatus } from "@/types/task";

export interface TaskRepository {
  list(): Promise<Task[]>;
  add(draft: TaskDraft, memo: TaskMemo): Promise<Task>;
  applyPlan(id: string, plan: TaskPlan): Promise<void>;
  setStatus(id: string, status: TaskStatus): Promise<void>;
  remove(id: string): Promise<void>;
}

class MemoTaskDatabase extends Dexie {
  tasks!: EntityTable<Task, "id">;

  constructor() {
    super("memo-task");
    this.version(1).stores({
      tasks: "id, status, createdAt",
    });
  }
}

class DexieTaskRepository implements TaskRepository {
  private database: MemoTaskDatabase | null = null;

  async list(): Promise<Task[]> {
    const rows = await this.table().orderBy("createdAt").reverse().toArray();
    return rows.map(normalizeTask);
  }

  async add(draft: TaskDraft, memo: TaskMemo): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      ...draft,
      id: crypto.randomUUID(),
      transcript: memo.transcript,
      audio: memo.audio,
      durationMs: memo.durationMs,
      category: null,
      subtasks: [],
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    await this.table().add(task);
    return task;
  }

  async applyPlan(id: string, plan: TaskPlan): Promise<void> {
    const existing = await this.table().get(id);

    if (!existing) {
      return;
    }

    await this.table().update(id, {
      title: plan.title,
      details: plan.details,
      priority: plan.priority,
      category: plan.category,
      subtasks: plan.subtasks,
      updatedAt: new Date().toISOString(),
    });
  }

  async setStatus(id: string, status: TaskStatus): Promise<void> {
    await this.table().update(id, {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  async remove(id: string): Promise<void> {
    await this.table().delete(id);
  }

  private table() {
    this.database ??= new MemoTaskDatabase();
    return this.database.tasks;
  }
}

function normalizeTask(row: Task): Task {
  return {
    ...row,
    audio: row.audio instanceof Blob ? row.audio : null,
    durationMs: typeof row.durationMs === "number" ? row.durationMs : 0,
    category: typeof row.category === "string" && row.category.trim() ? row.category : null,
    subtasks: Array.isArray(row.subtasks)
      ? row.subtasks.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      : [],
  };
}

let repository: TaskRepository | null = null;

export function createTaskRepository(): TaskRepository {
  repository ??= new DexieTaskRepository();
  return repository;
}
