export const taskExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "details", "priority", "dueAt"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 140 },
    details: { type: ["string", "null"], maxLength: 2000 },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    dueAt: {
      anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
    },
  },
} as const;
