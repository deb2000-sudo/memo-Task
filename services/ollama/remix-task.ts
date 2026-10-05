import { ServiceError } from "@/types/errors";
import { toOllamaServiceError } from "@/services/ollama/errors";
import { parseRemixContent } from "@/services/ollama/parse-remix";
import {
  REMIX_TASK_PROMPT,
  remixCorrection,
  remixUserMessage,
} from "@/services/ollama/remix-prompt";
import { remixTaskSchema } from "@/services/ollama/remix-schema";
import type { RemixTaskInput, RemixTaskResult } from "@/types/remix";

const RETRYABLE = new Set<ServiceError["code"]>([
  "invalid_model_output",
  "malformed_json",
]);

export const REMIX_NUM_PREDICT = 768;

export type RemixChat = (
  messages: Array<{ role: "system" | "user"; content: string }>,
  format: unknown,
  numPredict: number,
) => Promise<string>;

export async function remixWithGemma(
  input: RemixTaskInput,
  chat: RemixChat,
): Promise<RemixTaskResult> {
  try {
    return await requestRemix(input, chat);
  } catch (error) {
    if (!(error instanceof ServiceError) || !RETRYABLE.has(error.code)) {
      throw error;
    }

    return requestRemix(input, chat, error.message);
  }
}

async function requestRemix(
  input: RemixTaskInput,
  chat: RemixChat,
  correction?: string,
): Promise<RemixTaskResult> {
  const messages = [
    { role: "system" as const, content: REMIX_TASK_PROMPT },
    { role: "user" as const, content: remixUserMessage(input) },
  ];

  if (correction) {
    messages.push({ role: "user", content: remixCorrection(correction) });
  }

  let content: string;

  try {
    content = await chat(messages, remixTaskSchema, REMIX_NUM_PREDICT);
  } catch (error) {
    throw toOllamaServiceError(error);
  }

  return parseRemixContent(content);
}
