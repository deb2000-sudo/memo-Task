import type { TaskDraft } from "@/types/task";

export type VoiceMemoMetadata = {
  transcriptionProvider: "elevenlabs";
  reasoningModel: "gemma3:4b";
  reasoningLocation: "local";
};

export type VoiceMemoResult = {
  transcript: string;
  task: TaskDraft;
  metadata: VoiceMemoMetadata;
};
