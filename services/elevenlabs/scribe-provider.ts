import "server-only";

import {
  ElevenLabsClient,
  ElevenLabsTimeoutError,
} from "@elevenlabs/elevenlabs-js";

import type { TranscriptionProvider } from "@/types/ai";
import { ServiceError } from "@/types/errors";

const MODEL_ID = "scribe_v2";

export class ElevenLabsScribeProvider implements TranscriptionProvider {
  constructor(private readonly apiKey = process.env.ELEVENLABS_API_KEY) {}

  async transcribe(audio: Blob): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceError(
        "missing_key",
        "ELEVENLABS_API_KEY is not configured.",
      );
    }

    const client = new ElevenLabsClient({
      apiKey: this.apiKey,
      timeoutInSeconds: 60,
    });

    try {
      const result = await client.speechToText.convert({
        file: audio,
        modelId: MODEL_ID,
      });

      if (!("text" in result) || typeof result.text !== "string") {
        throw new ServiceError(
          "upstream_failed",
          "Scribe returned no transcript.",
        );
      }

      const transcript = result.text.trim();
      if (!transcript) {
        throw new ServiceError("empty_transcript", "Scribe returned an empty transcript.");
      }

      return transcript;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      if (error instanceof ElevenLabsTimeoutError) {
        throw new ServiceError("timeout", "Scribe timed out.");
      }

      throw new ServiceError("upstream_failed", "Scribe request failed.");
    }
  }
}
