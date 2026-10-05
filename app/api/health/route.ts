import { GemmaClient } from "@/services/ollama/gemma-client";

export async function GET() {
  const health = await new GemmaClient().health();

  return Response.json(health, { status: health.ollama ? 200 : 503 });
}
