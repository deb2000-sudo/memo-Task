"use client";

import { CaptureStage } from "@/components/memo/capture-stage";
import { GemmaStatus } from "@/components/memo/gemma-status";
import { PrivacyPanel } from "@/components/memo/privacy-panel";
import { TaskList } from "@/components/memo/task-list";
import { TaskReview } from "@/components/memo/task-review";
import { useGemmaStatus } from "@/hooks/use-gemma-status";
import { useTasks } from "@/hooks/use-tasks";
import { useVoiceMemo } from "@/hooks/use-voice-memo";

export function VoiceMemo() {
  const memo = useVoiceMemo();
  const tasks = useTasks();
  const gemma = useGemmaStatus();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
              MemoTask
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Speak naturally. Gemma turns your thought into a task.
            </h1>
          </div>
          <GemmaStatus presence={gemma} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Voice transcription uses ElevenLabs. Task understanding runs locally
            using Gemma 3 4B.
          </p>
          <PrivacyPanel />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <CaptureStage
            phase={memo.phase}
            elapsedMs={memo.elapsedMs}
            durationMs={memo.durationMs}
            upload={memo.upload}
            confirmed={memo.confirmed}
            onStart={() => {
              void memo.start();
            }}
            onStop={memo.stop}
          />

          {memo.error ? (
            <p className="text-sm text-destructive" role="alert">
              {memo.error}
            </p>
          ) : null}

          {memo.preview && memo.draft && memo.audio ? (
            <TaskReview
              draft={memo.draft}
              transcript={memo.preview.transcript}
              audio={memo.audio}
              durationMs={memo.durationMs}
              onChange={memo.setDraft}
              onConfirm={() => {
                void memo.confirm(tasks.save);
              }}
              onCancel={memo.clearPreview}
            />
          ) : null}
        </div>

        <TaskList
          tasks={tasks.tasks}
          onToggle={(task) => {
            void tasks.setStatus(task.id, task.status === "done" ? "open" : "done");
          }}
          onDelete={(task) => {
            void tasks.remove(task.id);
          }}
          onApplyRemix={tasks.applyPlan}
        />
      </div>
    </main>
  );
}
