import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseModelContent, parseTaskDraft } from "@/services/ollama/parse-draft";
import { ServiceError } from "@/types/errors";

describe("voice task draft validation", () => {
  it("accepts a valid draft", () => {
    const draft = parseModelContent(
      JSON.stringify({
        title: "Buy milk",
        details: "Tomorrow morning",
        priority: "low",
        dueAt: "2026-10-06T02:30:00.000Z",
      }),
    );

    assert.equal(draft.title, "Buy milk");
    assert.equal(draft.priority, "low");
  });

  it("rejects unexpected fields", () => {
    assert.throws(
      () => parseTaskDraft({ title: "Buy milk", details: null, priority: "low", dueAt: null, extra: 1 }),
      (error: unknown) => error instanceof ServiceError && error.code === "invalid_model_output",
    );
  });

  it("rejects malformed JSON", () => {
    assert.throws(
      () => parseModelContent("{"),
      (error: unknown) => error instanceof ServiceError && error.code === "malformed_json",
    );
  });
});
