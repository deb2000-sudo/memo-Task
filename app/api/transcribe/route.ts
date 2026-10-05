import { detectAudioKind } from "@/lib/audio-format";
import { createTranscriptionProvider } from "@/services/ai";
import { errorResponse, fromUnknownError } from "@/services/http";

export const maxDuration = 60;

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return errorResponse("missing_audio");
  }

  const audio = form.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return errorResponse("missing_audio");
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse("audio_too_large");
  }

  const header = new Uint8Array(await audio.slice(0, 16).arrayBuffer());
  if (!detectAudioKind(header)) {
    return errorResponse("unsupported_audio");
  }

  try {
    const transcript = await createTranscriptionProvider().transcribe(audio);
    return Response.json({ transcript });
  } catch (error) {
    return fromUnknownError(error);
  }
}
