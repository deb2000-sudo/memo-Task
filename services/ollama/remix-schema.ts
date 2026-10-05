export const remixTaskSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "priority", "category", "subtasks"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 140 },
    description: { type: "string", minLength: 1, maxLength: 2000 },
    priority: {
      anyOf: [{ type: "string", enum: ["low", "medium", "high"] }, { type: "null" }],
    },
    category: {
      anyOf: [{ type: "string", maxLength: 40 }, { type: "null" }],
    },
    subtasks: {
      type: "array",
      maxItems: 12,
      items: { type: "string", minLength: 1, maxLength: 140 },
    },
  },
} as const;
