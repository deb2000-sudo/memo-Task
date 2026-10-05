"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MemoPlayer } from "@/components/memo/memo-player";
import { RemixDialog } from "@/components/memo/remix-dialog";
import { TranscriptViewer } from "@/components/memo/transcript-viewer";
import { cn } from "cn";
import type { Task, TaskPlan, TaskPriority } from "@/types/task";

type TaskListProps = {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onApplyRemix: (id: string, plan: TaskPlan) => Promise<void>;
};

const priorityVariant: Record<TaskPriority, "secondary" | "outline" | "destructive"> = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
};

export function TaskList({ tasks, onToggle, onDelete, onApplyRemix }: TaskListProps) {
  const openCount = tasks.filter((task) => task.status === "open").length;
  const [remixTask, setRemixTask] = useState<Task | null>(null);

  return (
    <Card className="min-h-80">
      <CardHeader>
        <h2 className="font-heading text-base leading-snug font-medium">Tasks</h2>
        <p className="text-sm text-muted-foreground">
          {tasks.length === 0
            ? "Confirmed tasks land here."
            : `${openCount} open`}
        </p>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Speak a task when you are ready.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onRemix={setRemixTask}
              />
            ))}
          </ul>
        )}
      </CardContent>
      <RemixDialog task={remixTask} onClose={() => setRemixTask(null)} onApply={onApplyRemix} />
    </Card>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  onRemix,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRemix: (task: Task) => void;
}) {
  const done = task.status === "done";

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3">
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          checked={done}
          onCheckedChange={() => onToggle(task)}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("leading-snug font-medium", done && "text-muted-foreground line-through")}>
            {task.title}
          </p>
          {readableDetails(task.details) ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {readableDetails(task.details)}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
            {task.category ? <Badge variant="outline">{task.category}</Badge> : null}
            {task.dueAt ? (
              <span className="text-xs text-muted-foreground">{formatDue(task.dueAt)}</span>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          <Trash2 />
        </Button>
      </div>
      {task.subtasks.length > 0 ? (
        <ul className="list-disc pl-11 text-sm text-muted-foreground">
          {task.subtasks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 pl-7">
        <MemoPlayer
          audio={task.audio}
          durationMs={task.durationMs}
          label={`Play memo for ${task.title}`}
        />
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onRemix(task)}>
            ✨ Remix
          </Button>
          <TranscriptViewer title={task.title} transcript={task.transcript} />
        </div>
      </div>
    </li>
  );
}

function readableDetails(details: string | null): string | null {
  const value = details?.trim() ?? "";
  if (value === "" || value.toLowerCase() === "null" || value.toLowerCase() === "none") {
    return null;
  }

  return details;
}

function formatDue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
