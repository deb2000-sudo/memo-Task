import { errorResponse, fromUnknownError } from "@/services/http";
import { processVoiceMemo } from "@/services/voice-memo/process-voice-memo";

export const maxDuration = 120;

export async function POST(request: Request) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return errorResponse("missing_audio");
  }

  const audio = form.get("audio");

  if (!(audio instanceof File)) {
    return errorResponse("missing_audio");
  }

  try {
    const result = await processVoiceMemo(audio);
    return Response.json(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}
