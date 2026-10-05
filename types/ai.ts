import type { RemixTaskInput, RemixTaskResult } from "@/types/remix";
import type { TaskDraft } from "@/types/task";

export interface TranscriptionProvider {
  transcribe(audio: Blob): Promise<string>;
}

export interface TaskUnderstandingProvider {
  parseTask(transcript: string, now: Date): Promise<TaskDraft>;
  remixTask(input: RemixTaskInput): Promise<RemixTaskResult>;
}
