import type { GemmaPresence } from "@/hooks/use-gemma-status";

const labels: Record<GemmaPresence, string> = {
  checking: "Gemma 3 4B • Checking",
  local: "Gemma 3 4B • Local",
  offline: "Gemma 3 4B • Offline",
};

export function GemmaStatus({ presence }: { presence: GemmaPresence }) {
  const live = presence === "local";

  return (
    <p
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
    >
      <span
        className={
          live
            ? "size-1.5 rounded-full bg-foreground"
            : "size-1.5 rounded-full bg-muted-foreground"
        }
        aria-hidden
      />
      <span className={live ? "text-foreground" : "text-muted-foreground"}>
        {labels[presence]}
      </span>
    </p>
  );
}
