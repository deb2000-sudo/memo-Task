"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTaskRemix } from "@/hooks/use-task-remix";
import { planFromRemix } from "@/lib/apply-remix";
import { taskPriorities, type Task, type TaskPlan } from "@/types/task";
import type { RemixTaskResult } from "@/types/remix";

type RemixDialogProps = {
  task: Task | null;
  onClose: () => void;
  onApply: (id: string, plan: TaskPlan) => Promise<void>;
};

export function RemixDialog({ task, onClose, onApply }: RemixDialogProps) {
  const remix = useTaskRemix();
  const [instruction, setInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RemixTaskResult | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const running = remix.phase === "running";
  const suggestion = draft ?? remix.suggestion;

  function close() {
    remix.reset();
    setInstruction("");
    setEditing(false);
    setDraft(null);
    setApplyError(null);
    onClose();
  }

  async function apply() {
    if (!task || !suggestion || running) {
      return;
    }

    setApplyError(null);

    try {
      await onApply(task.id, planFromRemix(task, suggestion, editing));
      close();
    } catch {
      setApplyError("The task could not be updated.");
    }
  }

  return (
    <Dialog
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {task ? (
          <>
            <DialogHeader>
              <DialogTitle>✨ Remix with Gemma</DialogTitle>
              <DialogDescription>
                Let Gemma break this task into actionable steps.
              </DialogDescription>
            </DialogHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Gemma 3 4B • Local AI
            </p>

            {remix.phase === "ready" && remix.suggestion && suggestion ? (
              <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto">
                <p className="text-sm">Gemma suggested the following changes</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TaskSnapshot label="Current task" task={task} />
                  {editing && draft ? (
                    <SuggestionEditor draft={draft} onChange={setDraft} />
                  ) : (
                    <SuggestionView
                      label="Gemma suggestion"
                      result={suggestion}
                      currentSubtasks={task.subtasks}
                    />
                  )}
                </div>
                {applyError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {applyError}
                  </p>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(remix.suggestion);
                      setEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" onClick={() => void apply()} disabled={!suggestion.title.trim()}>
                    Apply Changes
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!running) {
                    void remix.remix(task, instruction);
                  }
                }}
              >
                <TaskSnapshot label="Current task" task={task} />
                <label className="flex flex-col gap-1.5 text-sm">
                  Anything specific you want Gemma to consider?
                  <Textarea
                    value={instruction}
                    maxLength={500}
                    disabled={running}
                    onChange={(event) => setInstruction(event.target.value)}
                  />
                </label>
                {running ? (
                  <div className="flex flex-col gap-1 text-sm" aria-live="polite">
                    <p>Gemma 3 4B is thinking locally...</p>
                    <p className="text-muted-foreground">
                      Gemma is breaking this task into actionable steps...
                    </p>
                  </div>
                ) : null}
                {remix.error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {remix.error}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={running}>
                    Remix with Gemma
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskSnapshot({ label, task }: { label: string; task: Task }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      <p className="font-medium">{task.title}</p>
      {visibleText(task.details) ? (
        <p className="text-sm text-muted-foreground">{visibleText(task.details)}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {task.priority}
        {task.category ? ` · ${task.category}` : ""}
      </p>
      {task.subtasks.length > 0 ? <SubtaskList items={task.subtasks} /> : null}
    </section>
  );
}

function SuggestionView({
  label,
  result,
  currentSubtasks,
}: {
  label: string;
  result: RemixTaskResult;
  currentSubtasks: string[];
}) {
  const known = new Set(currentSubtasks.map((item) => item.trim()));

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      <p className="font-medium">{result.title}</p>
      <p className="text-sm text-muted-foreground">{result.description}</p>
      <p className="text-xs text-muted-foreground">
        {result.priority ?? "priority unchanged"}
        {result.category ? ` · ${result.category}` : ""}
      </p>
      {result.subtasks.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {result.subtasks.map((item) => (
            <li key={item} className="flex items-start justify-between gap-2 text-sm">
              <span>{item}</span>
              {known.has(item) ? null : <Badge variant="secondary">New</Badge>}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function SuggestionEditor({
  draft,
  onChange,
}: {
  draft: RemixTaskResult;
  onChange: (draft: RemixTaskResult) => void;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Gemma suggestion
      </h3>
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <Textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </label>
      <div className="flex gap-2">
        {taskPriorities.map((priority) => (
          <Button
            key={priority}
            type="button"
            size="sm"
            variant={draft.priority === priority ? "default" : "outline"}
            onClick={() => onChange({ ...draft, priority })}
          >
            {priority}
          </Button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <Input
          value={draft.category ?? ""}
          onChange={(event) =>
            onChange({
              ...draft,
              category: event.target.value.trim() === "" ? null : event.target.value,
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Subtasks
        <Textarea
          value={draft.subtasks.join("\n")}
          onChange={(event) =>
            onChange({
              ...draft,
              subtasks: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter((item) => item !== ""),
            })
          }
        />
      </label>
    </section>
  );
}

function visibleText(value: string | null): string | null {
  const text = value?.trim() ?? "";
  if (text === "" || text.toLowerCase() === "null" || text.toLowerCase() === "none") {
    return null;
  }

  return value;
}

function SubtaskList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-4 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
