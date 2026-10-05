import "server-only";

import { ElevenLabsScribeProvider } from "@/services/elevenlabs/scribe-provider";
import { GemmaTaskProvider } from "@/services/ollama/gemma-provider";
import type {
  TaskUnderstandingProvider,
  TranscriptionProvider,
} from "@/types/ai";

export function createTranscriptionProvider(): TranscriptionProvider {
  return new ElevenLabsScribeProvider();
}

export function createTaskUnderstandingProvider(): TaskUnderstandingProvider {
  return new GemmaTaskProvider();
}
