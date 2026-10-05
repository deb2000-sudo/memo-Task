"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MemoPlayer } from "@/components/memo/memo-player";
import { TranscriptViewer } from "@/components/memo/transcript-viewer";
import { formatDuration } from "@/lib/format-duration";
import { taskPriorities, type TaskDraft } from "@/types/task";

type TaskReviewProps = {
  draft: TaskDraft;
  transcript: string;
  audio: Blob;
  durationMs: number;
  onChange: (draft: TaskDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function TaskReview({
  draft,
  transcript,
  audio,
  durationMs,
  onChange,
  onConfirm,
  onCancel,
}: TaskReviewProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base leading-snug font-medium">Task draft</h2>
        <p className="text-sm text-muted-foreground">
          {formatDuration(durationMs)} memo. Edit anything before you confirm.
        </p>
      </CardHeader>
      <CardContent>
        <form
          id="task-draft"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MemoPlayer audio={audio} durationMs={durationMs} label="Play this memo" />
            <TranscriptViewer title={draft.title || "Voice memo"} transcript={transcript} />
          </div>
          <div className="rounded-lg bg-muted/70 px-3 py-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Transcript
            </p>
            <p className="mt-1 max-h-28 overflow-y-auto text-sm leading-relaxed">
              {transcript}
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            Title
            <Input
              value={draft.title}
              className="h-10"
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Details
            <Textarea
              value={draft.details ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: event.target.value === "" ? null : event.target.value,
                })
              }
            />
          </label>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm">Priority</legend>
            <div className="flex gap-2">
              {taskPriorities.map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  size="sm"
                  variant={draft.priority === priority ? "default" : "outline"}
                  aria-pressed={draft.priority === priority}
                  onClick={() => onChange({ ...draft, priority })}
                >
                  {priority}
                </Button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5 text-sm">
            Due
            <Input
              type="datetime-local"
              value={toLocalInput(draft.dueAt)}
              onChange={(event) =>
                onChange({ ...draft, dueAt: fromLocalInput(event.target.value) })
              }
            />
          </label>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form="task-draft">
            Confirm
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
