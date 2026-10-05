"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { liveQuery } from "dexie";

import { createTaskRepository } from "@/services/tasks/task-repository";
import type { Task, TaskDraft, TaskMemo, TaskPlan, TaskStatus } from "@/types/task";

export function useTasks() {
  const repository = useMemo(() => createTaskRepository(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTasks(await repository.list());
      setError(null);
    } catch (listError) {
      setError(listError instanceof Error ? listError : new Error("Could not read tasks."));
    }
  }, [repository]);

  useEffect(() => {
    const subscription = liveQuery(() => repository.list()).subscribe({
      next(rows) {
        setTasks(rows);
        setError(null);
      },
      error(listError) {
        setError(
          listError instanceof Error ? listError : new Error("Could not read tasks."),
        );
      },
    });

    return () => subscription.unsubscribe();
  }, [repository]);

  const save = useCallback(
    async (draft: TaskDraft, memo: TaskMemo) => {
      const task = await repository.add(draft, memo);
      await refresh();
      return task;
    },
    [refresh, repository],
  );

  const applyPlan = useCallback(
    async (id: string, plan: TaskPlan) => {
      await repository.applyPlan(id, plan);
      await refresh();
    },
    [refresh, repository],
  );

  const setStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      await repository.setStatus(id, status);
      await refresh();
    },
    [refresh, repository],
  );

  const remove = useCallback(
    async (id: string) => {
      await repository.remove(id);
      await refresh();
    },
    [refresh, repository],
  );

  return { tasks, error, refresh, save, applyPlan, setStatus, remove };
}
