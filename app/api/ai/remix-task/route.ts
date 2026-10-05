import { fromUnknownError } from "@/services/http";
import { GEMMA_MODEL } from "@/services/ollama/gemma-client";
import { readRemixRequest } from "@/services/ollama/remix-request";
import { createTaskUnderstandingProvider } from "@/services/ai";
import type { RemixMetadata } from "@/types/remix";

export const maxDuration = 60;

const metadata: RemixMetadata = {
  model: GEMMA_MODEL,
  provider: "ollama",
  location: "local",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "request_failed" }, { status: 400 });
  }

  const input = readRemixRequest(body);

  if (!input) {
    return Response.json({ error: "request_failed" }, { status: 400 });
  }

  try {
    const result = await createTaskUnderstandingProvider().remixTask(input);
    return Response.json({ success: true, result, metadata });
  } catch (error) {
    return fromUnknownError(error);
  }
}
