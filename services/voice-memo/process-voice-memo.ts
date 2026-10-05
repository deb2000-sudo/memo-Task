import "server-only";

import { detectAudioKind } from "@/lib/audio-format";
import {
  createTaskUnderstandingProvider,
  createTranscriptionProvider,
} from "@/services/ai";
import { GEMMA_MODEL } from "@/services/ollama/gemma-client";
import { parseTaskDraft } from "@/services/ollama/parse-draft";
import { ServiceError } from "@/types/errors";
import type { VoiceMemoResult } from "@/types/voice-memo";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function processVoiceMemo(
  audio: Blob,
  now = new Date(),
): Promise<VoiceMemoResult> {
  if (audio.size === 0) {
    throw new ServiceError("missing_audio", "Audio is empty.");
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    throw new ServiceError("audio_too_large", "Audio is too large.");
  }

  const header = new Uint8Array(await audio.slice(0, 16).arrayBuffer());
  if (!detectAudioKind(header)) {
    throw new ServiceError("unsupported_audio", "Audio format is not supported.");
  }

  const transcript = await createTranscriptionProvider().transcribe(audio);
  const extracted = await createTaskUnderstandingProvider().parseTask(
    transcript,
    now,
  );
  const task = parseTaskDraft(extracted);

  return {
    transcript,
    task,
    metadata: {
      transcriptionProvider: "elevenlabs",
      reasoningModel: GEMMA_MODEL,
      reasoningLocation: "local",
    },
  };
}
