import type { RemixTaskInput } from "@/types/remix";

export const REMIX_TASK_PROMPT = [
  "You are a local task planning assistant.",
  "Your job is to transform an existing task into a clearer, more actionable plan while preserving the user's original intent.",
  "Do not invent facts.",
  "Do not add unnecessary work.",
  "Only create useful actionable subtasks.",
  "Do not create deadlines.",
  "Do not claim knowledge that was not provided.",
  "Return valid JSON only.",
  "Required keys: title, description, priority, category, subtasks.",
  "priority is low, medium, high, or null.",
  "category is a short label or null.",
  "Keep a category that was already provided unless the instruction asks for a different one.",
  "subtasks is an array of short actions.",
].join(" ");

export function remixUserMessage(input: RemixTaskInput): string {
  const subtasks =
    input.subtasks.length === 0
      ? "(none)"
      : input.subtasks.map((item) => `- ${item}`).join("\n");
  const instruction = input.instruction.trim();

  return [
    "Current task:",
    `Title: ${input.title}`,
    `Description: ${input.description?.trim() || "(none)"}`,
    `Priority: ${input.priority ?? "(none)"}`,
    `Category: ${input.category?.trim() || "(none)"}`,
    "Subtasks:",
    subtasks,
    "",
    "Optional instruction:",
    instruction || "(none)",
  ].join("\n");
}

export function remixCorrection(reason: string): string {
  return `The previous JSON failed validation: ${reason}. Return one corrected JSON object and nothing else.`;
}
