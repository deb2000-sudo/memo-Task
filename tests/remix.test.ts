import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyRemix, dismissRemix } from "@/lib/apply-remix";
import { remixWithGemma } from "@/services/ollama/remix-task";
import { parseRemixResult } from "@/services/ollama/parse-remix";
import { REMIX_TASK_PROMPT, remixUserMessage } from "@/services/ollama/remix-prompt";
import { readRemixRequest } from "@/services/ollama/remix-request";
import { toOllamaServiceError } from "@/services/ollama/errors";
import { ServiceError } from "@/types/errors";
import type { RemixChat } from "@/services/ollama/remix-task";
import type { RemixTaskResult } from "@/types/remix";
import type { Task } from "@/types/task";

const simpleSuggestion: RemixTaskResult = {
  title: "Prepare for frontend interview",
  description: "Review the topics that usually come up in a frontend interview.",
  priority: "high",
  category: "career",
  subtasks: [
    "Revise JavaScript fundamentals",
    "Revise React fundamentals",
    "Review frontend system design",
    "Practice common interview questions",
    "Prepare project explanations",
  ],
};

const complexSuggestion: RemixTaskResult = {
  title: "Ship the billing settings page",
  description: "Finish the settings page, then check the empty, error, and saved states.",
  priority: "medium",
  category: "product",
  subtasks: [
    "List the fields the page needs",
    "Build the form",
    "Show a saving state",
    "Show an error state",
    "Check the layout on a phone",
    "Ask for a review",
  ],
};

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Prepare for my frontend interview",
    details: null,
    priority: "medium",
    dueAt: "2026-10-20T09:00:00.000Z",
    transcript: "Prepare for my frontend interview",
    audio: null,
    durationMs: 4000,
    category: null,
    subtasks: [],
    status: "open",
    createdAt: "2026-10-05T06:00:00.000Z",
    updatedAt: "2026-10-05T06:00:00.000Z",
    ...overrides,
  };
}

function chatReturning(payload: unknown, calls: string[][] = []): RemixChat {
  return async (messages) => {
    calls.push(messages.map((message) => message.content));
    return JSON.stringify(payload);
  };
}

describe("remix with Gemma", () => {
  it("turns a simple task into an actionable plan", async () => {
    const calls: string[][] = [];
    const result = await remixWithGemma(
      {
        title: "Prepare for my frontend interview",
        description: null,
        priority: "medium",
        category: null,
        subtasks: [],
        instruction: "",
      },
      chatReturning(simpleSuggestion, calls),
    );

    assert.deepEqual(result, simpleSuggestion);
    assert.match(calls[0][0], /local task planning assistant/);
    assert.equal(calls[0][0], REMIX_TASK_PROMPT);
    assert.match(calls[0][1], /Prepare for my frontend interview/);
  });

  it("accepts a complex plan", async () => {
    const result = await remixWithGemma(
      {
        title: "Billing settings",
        description: "The page is half done",
        priority: "medium",
        category: "product",
        subtasks: [],
        instruction: "Keep it to the settings page",
      },
      chatReturning(complexSuggestion),
    );

    assert.equal(result.subtasks.length, 6);
    assert.equal(result.category, "product");
  });

  it("includes subtasks the task already has", () => {
    const message = remixUserMessage({
      title: "Prepare for frontend interview",
      description: "Notes from last week",
      priority: "high",
      category: "career",
      subtasks: ["Revise JavaScript fundamentals"],
      instruction: "Add the missing steps",
    });

    assert.match(message, /Revise JavaScript fundamentals/);
    assert.match(message, /Add the missing steps/);
    const result = parseRemixResult(simpleSuggestion);
    assert.equal(result.subtasks[0], "Revise JavaScript fundamentals");
  });

  it("rejects a suggestion with no description", () => {
    assert.throws(
      () =>
        parseRemixResult({
          title: "Prepare for frontend interview",
          priority: "high",
          category: "career",
          subtasks: ["Revise JavaScript fundamentals"],
        }),
      (error: unknown) =>
        error instanceof ServiceError && error.code === "invalid_model_output",
    );
  });

  it("rejects a suggestion with no priority", () => {
    assert.throws(
      () =>
        parseRemixResult({
          title: "Prepare for frontend interview",
          description: "Review the usual topics.",
          category: "career",
          subtasks: ["Revise JavaScript fundamentals"],
        }),
      (error: unknown) =>
        error instanceof ServiceError &&
        error.code === "invalid_model_output" &&
        /priority/i.test(error.message),
    );
  });

  it("accepts a source task that has no description and no priority", () => {
    const input = readRemixRequest({
      task: { title: "Prepare for my frontend interview" },
    });

    assert.ok(input);
    assert.equal(input.description, null);
    assert.equal(input.priority, null);
    assert.match(remixUserMessage(input), /Description: \(none\)/);
    assert.match(remixUserMessage(input), /Priority: \(none\)/);
  });

  it("rejects invalid Gemma JSON and does not retry past a second attempt", async () => {
    let calls = 0;
    const chat: RemixChat = async () => {
      calls += 1;
      return "not json";
    };

    await assert.rejects(
      () =>
        remixWithGemma(
          {
            title: "Prepare for my frontend interview",
            description: null,
            priority: "medium",
            category: null,
            subtasks: [],
            instruction: "",
          },
          chat,
        ),
      (error: unknown) => error instanceof ServiceError && error.code === "malformed_json",
    );
    assert.equal(calls, 2);
  });

  it("reports Ollama as unavailable without a retry", async () => {
    let calls = 0;
    const chat: RemixChat = async () => {
      calls += 1;
      throw new TypeError("fetch failed");
    };

    await assert.rejects(
      () =>
        remixWithGemma(
          {
            title: "Prepare for my frontend interview",
            description: null,
            priority: null,
            category: null,
            subtasks: [],
            instruction: "",
          },
          chat,
        ),
      (error: unknown) => error instanceof ServiceError && error.code === "ollama_unavailable",
    );
    assert.equal(calls, 1);
    assert.equal(toOllamaServiceError(new TypeError("fetch failed")).code, "ollama_unavailable");
  });

  it("reports a timeout without a retry", async () => {
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    let calls = 0;

    await assert.rejects(
      () =>
        remixWithGemma(
          {
            title: "Prepare for my frontend interview",
            description: null,
            priority: "low",
            category: null,
            subtasks: [],
            instruction: "",
          },
          async () => {
            calls += 1;
            throw timeout;
          },
        ),
      (error: unknown) => error instanceof ServiceError && error.code === "timeout",
    );
    assert.equal(calls, 1);
  });

  it("leaves the original task untouched when the suggestion is dismissed", () => {
    const original = task();
    const snapshot = { ...original, subtasks: [...original.subtasks] };
    const kept = dismissRemix(original);

    assert.equal(kept, original);
    assert.deepEqual(original, snapshot);
    assert.equal(original.title, "Prepare for my frontend interview");
  });

  it("applies a suggestion only through applyRemix", () => {
    const original = task({ category: "career", subtasks: ["Revise JavaScript fundamentals"] });
    const snapshot = {
      ...original,
      subtasks: [...original.subtasks],
    };

    assert.equal(original.title, snapshot.title);

    const next = applyRemix(original, {
      ...simpleSuggestion,
      priority: null,
      category: null,
    });

    assert.notEqual(next, original);
    assert.equal(original.title, snapshot.title);
    assert.deepEqual(original.subtasks, snapshot.subtasks);
    assert.equal(next.title, simpleSuggestion.title);
    assert.equal(next.details, simpleSuggestion.description);
    assert.equal(next.priority, "medium");
    assert.equal(next.category, "career");
    assert.deepEqual(next.subtasks, simpleSuggestion.subtasks);
    assert.equal(next.dueAt, original.dueAt);
    assert.equal(next.transcript, original.transcript);
    assert.equal(next.status, original.status);
  });
});
