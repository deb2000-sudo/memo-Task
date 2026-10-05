"use client";

import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/memo/voice-recorder";
import { formatDuration } from "@/lib/format-duration";
import type { VoiceMemoPhase } from "@/hooks/use-voice-memo";

type CaptureStageProps = {
  phase: VoiceMemoPhase;
  elapsedMs: number;
  durationMs: number;
  upload: number | null;
  confirmed: boolean;
  onStart: () => void;
  onStop: () => void;
};

const statusCopy: Record<VoiceMemoPhase, string> = {
  idle: "Ready",
  recording: "Listening",
  transcribing: "Transcribing with ElevenLabs",
  reasoning: "Gemma is reading this",
  preview: "Review the draft",
};

export function CaptureStage({
  phase,
  elapsedMs,
  durationMs,
  upload,
  confirmed,
  onStart,
  onStop,
}: CaptureStageProps) {
  const recording = phase === "recording";
  const busy = phase === "transcribing" || phase === "reasoning";
  const shownMs = recording ? elapsedMs : durationMs;
  const uploadPercent = upload === null ? null : Math.round(upload * 100);

  return (
    <Card className="items-center bg-card/80 py-8 text-center">
      <CardContent className="flex w-full flex-col items-center gap-5">
        <VoiceRecorder
          recording={recording}
          disabled={busy}
          onStart={onStart}
          onStop={onStop}
        />
        <p className="font-mono text-4xl font-medium tracking-tight tabular-nums">
          {formatDuration(shownMs)}
        </p>
        <p className="text-sm font-medium" aria-live="polite">
          {statusCopy[phase]}
        </p>
        {busy ? <ProcessingRail phase={phase} uploadPercent={uploadPercent} /> : null}
        {confirmed && phase === "idle" ? (
          <p className="text-sm text-muted-foreground">Task confirmed.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProcessingRail({
  phase,
  uploadPercent,
}: {
  phase: "transcribing" | "reasoning";
  uploadPercent: number | null;
}) {
  const transcribing = phase === "transcribing";

  return (
    <div className="flex w-full max-w-xs flex-col gap-3 text-left">
      <ol className="grid grid-cols-2 gap-2 text-xs">
        <li className={transcribing ? "font-medium text-foreground" : "text-muted-foreground"}>
          <span className="mb-1 block h-1 rounded-full bg-primary" />
          ElevenLabs
        </li>
        <li className={transcribing ? "text-muted-foreground" : "font-medium text-foreground"}>
          <span
            className={
              transcribing
                ? "mb-1 block h-1 rounded-full bg-border"
                : "mb-1 block h-1 rounded-full bg-primary"
            }
          />
          Gemma
        </li>
      </ol>
      <p className="text-xs text-muted-foreground">
        {transcribing
          ? uploadPercent === null
            ? "ElevenLabs is transcribing this recording."
            : `Sending the recording to ElevenLabs, ${uploadPercent}%.`
          : "Gemma is reading the transcript on this computer."}
      </p>
      <div
        className="h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={transcribing ? (uploadPercent ?? undefined) : undefined}
        aria-label={transcribing ? "ElevenLabs transcription" : "Gemma"}
      >
        <div
          className={
            transcribing && uploadPercent !== null
              ? "h-full bg-primary transition-[width]"
              : "h-full w-1/3 animate-pulse bg-primary"
          }
          style={
            transcribing && uploadPercent !== null
              ? { width: `${uploadPercent}%` }
              : undefined
          }
        />
      </div>
    </div>
  );
}
