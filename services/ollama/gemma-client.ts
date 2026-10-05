import "server-only";

import { ServiceError } from "@/types/errors";
import { toOllamaServiceError } from "@/services/ollama/errors";

export const OLLAMA_ORIGIN = "http://127.0.0.1:11434";
export const GEMMA_MODEL = "gemma3:4b" as const;

const CHAT_TIMEOUT_MS = 60_000;
const HEALTH_TIMEOUT_MS = 3_000;

export type GemmaMessage = {
  role: "system" | "user";
  content: string;
};

export type GemmaHealth = {
  ollama: boolean;
  model: typeof GEMMA_MODEL;
};

export class GemmaClient {
  async chat(
    messages: GemmaMessage[],
    format: unknown,
    numPredict = 256,
  ): Promise<string> {
    let response: Response;

    try {
      response = await fetch(`${OLLAMA_ORIGIN}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
        body: JSON.stringify({
          model: GEMMA_MODEL,
          stream: false,
          format,
          options: { temperature: 0, num_predict: numPredict },
          messages,
        }),
      });
    } catch (error) {
      throw toOllamaServiceError(error);
    }

    if (!response.ok) {
      throw await toOllamaHttpError(response);
    }

    const payload = (await response.json().catch(() => null)) as {
      message?: { content?: unknown };
    } | null;
    const content = payload?.message?.content;

    if (typeof content !== "string" || content.trim() === "") {
      throw new ServiceError(
        "invalid_model_output",
        "Ollama returned an empty message.",
      );
    }

    return content;
  }

  async health(): Promise<GemmaHealth> {
    try {
      const response = await fetch(`${OLLAMA_ORIGIN}/api/tags`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });

      if (!response.ok) {
        return { ollama: false, model: GEMMA_MODEL };
      }

      const payload = (await response.json()) as {
        models?: Array<{ name?: string; model?: string }>;
      };
      const installed = (payload.models ?? []).some(
        (entry) => entry.name === GEMMA_MODEL || entry.model === GEMMA_MODEL,
      );

      return { ollama: installed, model: GEMMA_MODEL };
    } catch {
      return { ollama: false, model: GEMMA_MODEL };
    }
  }
}

async function toOllamaHttpError(response: Response): Promise<ServiceError> {
  const body = await response.text().catch(() => "");

  if (response.status === 404 || /not found/i.test(body)) {
    return new ServiceError(
      "model_not_installed",
      `${GEMMA_MODEL} is not installed in Ollama.`,
    );
  }

  return new ServiceError("upstream_failed", "Ollama rejected the request.");
}
