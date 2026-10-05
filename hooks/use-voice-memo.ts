"use client";

import { useRef, useState } from "react";

import { requestTaskDraft } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { transcribeVoiceMemo, type TranscriptionProgress } from "@/lib/transcribe-voice-memo";
import type { ServiceErrorCode } from "@/types/errors";
import type { TaskDraft, TaskMemo } from "@/types/task";
import type { VoiceMemoResult } from "@/types/voice-memo";

export type VoiceMemoPhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "reasoning"
  | "preview";

const mimeCandidates = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function timestamp(): number {
  return Date.now();
}

const errorMessages: Record<ServiceErrorCode | "request_failed", string> = {
  missing_audio: "That recording was empty. Hold the button a little longer.",
  unsupported_audio: "That recording format is not supported. Try again.",
  audio_too_large: "That recording is larger than 8 MB.",
  empty_transcript: "No speech was detected in that recording.",
  transcript_too_long: "That transcript is too long to turn into a task.",
  invalid_model_output: "The task could not be read from that transcript.",
  malformed_json: "The task could not be read from that transcript.",
  missing_key: "Transcription is not configured on the server.",
  model_not_installed: "The local model is not installed.",
  ollama_unavailable: "The local model is not running.",
  timeout: "Preparing the task timed out. Try a shorter memo.",
  upstream_failed: "The memo could not be prepared. Try again.",
  request_failed: "The memo could not be prepared. Try again.",
};

export function useVoiceMemo() {
  const [phase, setPhase] = useState<VoiceMemoPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [upload, setUpload] = useState<number | null>(null);
  const [preview, setPreview] = useState<VoiceMemoResult | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const phaseRef = useRef<VoiceMemoPhase>("idle");
  const stopRequestedRef = useRef(false);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  function setCapturePhase(next: VoiceMemoPhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clearPreview() {
    setPreview(null);
    setDraft(null);
    setAudio(null);
    setDurationMs(0);
    setElapsedMs(0);
    setCapturePhase("idle");
  }

  async function start() {
    if (
      phaseRef.current === "recording" ||
      phaseRef.current === "transcribing" ||
      phaseRef.current === "reasoning"
    ) {
      return;
    }

    stopRequestedRef.current = false;
    setError(null);
    setConfirmed(false);
    setUpload(null);
    setPreview(null);
    setDraft(null);
    setAudio(null);
    setDurationMs(0);
    setElapsedMs(0);
    elapsedRef.current = 0;
    startedAtRef.current = timestamp();
    setCapturePhase("recording");
    timerRef.current = window.setInterval(() => {
      const next = timestamp() - startedAtRef.current;
      elapsedRef.current = next;
      setElapsedMs(next);
    }, 200);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      fail("This browser cannot record audio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (stopRequestedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        clearTimer();
        setCapturePhase("idle");
        return;
      }

      const mimeType = mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        clearTimer();
        const duration = elapsedRef.current;
        setDurationMs(duration);
        const blob = new Blob(chunks, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        setAudio(blob);
        void finish(blob, duration);
      };

      recorderRef.current = recorder;
      recorder.start(250);

      if (stopRequestedRef.current) {
        recorder.stop();
      }
    } catch {
      fail("Microphone access was blocked.");
    }
  }

  function stop() {
    if (phaseRef.current !== "recording") {
      return;
    }

    stopRequestedRef.current = true;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  }

  function fail(message: string) {
    clearTimer();
    recorderRef.current = null;
    setCapturePhase("idle");
    setError(message);
  }

  async function finish(blob: Blob, duration: number) {
    setCapturePhase("transcribing");
    setUpload(0);

    try {
      const transcript = await transcribeVoiceMemo(blob, {
        onProgress: (progress: TranscriptionProgress) => {
          setUpload(progress.phase === "uploading" ? progress.upload : null);
        },
      });
      setCapturePhase("reasoning");
      setUpload(null);
      const task = quietDetails(await requestTaskDraft(transcript));
      setPreview({
        transcript,
        task,
        metadata: {
          transcriptionProvider: "elevenlabs",
          reasoningModel: "gemma3:4b",
          reasoningLocation: "local",
        },
      });
      setDraft(task);
      setDurationMs(duration);
      setCapturePhase("preview");
    } catch (captureError) {
      setError(messageFor(captureError));
      setCapturePhase("idle");
    } finally {
      setUpload(null);
    }
  }

  async function confirm(save: (draft: TaskDraft, memo: TaskMemo) => Promise<unknown>) {
    if (!preview || !draft || !audio) {
      return;
    }

    try {
      await save(draft, {
        transcript: preview.transcript,
        audio,
        durationMs,
      });
      clearPreview();
      setConfirmed(true);
    } catch {
      setError("The task could not be saved.");
    }
  }

  return {
    phase,
    elapsedMs,
    durationMs,
    upload,
    preview,
    draft,
    audio,
    setDraft,
    error,
    confirmed,
    start,
    stop,
    confirm,
    clearPreview,
  };
}

function quietDetails(draft: TaskDraft): TaskDraft {
  const details = draft.details?.trim().toLowerCase();
  if (details === "null" || details === "none" || details === "n/a") {
    return { ...draft, details: null };
  }

  return draft;
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return errorMessages[error.code];
  }

  return errorMessages.request_failed;
}
