import "server-only";

import type { TaskDraft } from "@/types/task";
import type { TaskUnderstandingProvider } from "@/types/ai";
import type { RemixTaskInput, RemixTaskResult } from "@/types/remix";
import { ServiceError } from "@/types/errors";
import { GemmaClient } from "@/services/ollama/gemma-client";
import { parseModelContent } from "@/services/ollama/parse-draft";
import { remixWithGemma } from "@/services/ollama/remix-task";
import { taskExtractionSchema } from "@/services/ollama/task-schema";
import {
  taskExtractionCorrection,
  taskExtractionPrompt,
} from "@/services/ollama/task-prompt";

const MAX_TRANSCRIPT_CHARS = 4_000;

const RETRYABLE = new Set<ServiceError["code"]>([
  "invalid_model_output",
  "malformed_json",
]);

export class GemmaTaskProvider implements TaskUnderstandingProvider {
  constructor(private readonly client = new GemmaClient()) {}

  async parseTask(transcript: string, now: Date): Promise<TaskDraft> {
    const trimmed = transcript.trim();

    if (!trimmed) {
      throw new ServiceError("empty_transcript", "Transcript is empty.");
    }

    if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
      throw new ServiceError("transcript_too_long", "Transcript is too long.");
    }

    try {
      return await this.requestDraft(trimmed, now);
    } catch (error) {
      if (!(error instanceof ServiceError) || !RETRYABLE.has(error.code)) {
        throw error;
      }

      return this.requestDraft(trimmed, now, error.message);
    }
  }

  private async requestDraft(
    transcript: string,
    now: Date,
    correction?: string,
  ): Promise<TaskDraft> {
    const messages = [
      { role: "system" as const, content: taskExtractionPrompt(now) },
      { role: "user" as const, content: transcript },
    ];

    if (correction) {
      messages.push({
        role: "user",
        content: taskExtractionCorrection(correction),
      });
    }

    const content = await this.client.chat(messages, taskExtractionSchema);
    return parseModelContent(content);
  }

  async remixTask(input: RemixTaskInput): Promise<RemixTaskResult> {
    return remixWithGemma(input, (messages, format, numPredict) =>
      this.client.chat(messages, format, numPredict),
    );
  }
}
