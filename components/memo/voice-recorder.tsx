"use client";

import { Mic, Square } from "lucide-react";

type VoiceRecorderProps = {
  recording: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function VoiceRecorder({
  recording,
  disabled = false,
  onStart,
  onStop,
}: VoiceRecorderProps) {
  return (
    <div className="relative grid size-36 place-items-center">
      {recording ? (
        <>
          <span className="memo-ring pointer-events-none absolute inset-0 rounded-full bg-record/25" />
          <span className="memo-ring memo-ring-delayed pointer-events-none absolute inset-2 rounded-full bg-record/20" />
        </>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        aria-pressed={recording}
        aria-label={recording ? "Stop recording" : "Record a memo"}
        onClick={recording ? onStop : onStart}
        className={
          recording
            ? "relative z-10 grid size-28 place-items-center rounded-full bg-record text-white shadow-lg transition-transform outline-none hover:bg-record/90 focus-visible:ring-3 focus-visible:ring-record/40 active:scale-95 disabled:opacity-50"
            : "relative z-10 grid size-28 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:opacity-50"
        }
      >
        {recording ? <Square className="size-7 fill-current" /> : <Mic className="size-9" />}
      </button>
    </div>
  );
}
