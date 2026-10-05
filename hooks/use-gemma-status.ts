"use client";

import { useEffect, useState } from "react";

export type GemmaPresence = "checking" | "local" | "offline";

const POLL_MS = 15_000;

export function useGemmaStatus(): GemmaPresence {
  const [presence, setPresence] = useState<GemmaPresence>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as {
          ollama?: unknown;
        } | null;
        if (!cancelled) {
          setPresence(payload?.ollama === true ? "local" : "offline");
        }
      } catch {
        if (!cancelled) {
          setPresence("offline");
        }
      }
    }

    void check();
    const timer = window.setInterval(() => {
      void check();
    }, POLL_MS);
    window.addEventListener("focus", check);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, []);

  return presence;
}
