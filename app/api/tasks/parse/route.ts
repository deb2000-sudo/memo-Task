import { createTaskUnderstandingProvider } from "@/services/ai";
import { errorResponse, fromUnknownError } from "@/services/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("empty_transcript");
  }

  const transcript =
    body &&
    typeof body === "object" &&
    "transcript" in body &&
    typeof body.transcript === "string"
      ? body.transcript
      : "";

  if (transcript.trim() === "") {
    return errorResponse("empty_transcript");
  }

  try {
    const draft = await createTaskUnderstandingProvider().parseTask(
      transcript,
      new Date(),
    );
    return Response.json({ draft });
  } catch (error) {
    return fromUnknownError(error);
  }
}
