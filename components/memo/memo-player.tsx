"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";

type MemoPlayerProps = {
  audio: Blob | null;
  durationMs?: number;
  label?: string;
};

export function MemoPlayer({
  audio,
  durationMs = 0,
  label = "Play memo",
}: MemoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const element = audioRef.current;

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }

      if (element) {
        element.pause();
        element.removeAttribute("src");
      }
    };
  }, [audio]);

  if (!audio) {
    return <p className="text-xs text-muted-foreground">No recording stored</p>;
  }

  const recording = audio;

  function toggle() {
    const element = audioRef.current;
    if (!element) {
      return;
    }

    if (!urlRef.current) {
      urlRef.current = URL.createObjectURL(recording);
      element.src = urlRef.current;
    }

    if (element.paused) {
      void element.play();
      return;
    }

    element.pause();
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <Button type="button" variant="outline" size="sm" onClick={toggle} aria-label={label}>
        {playing ? <Pause /> : <Play />}
        {playing ? "Pause" : "Play"}
      </Button>
      {durationMs > 0 ? (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatDuration(durationMs)}
        </span>
      ) : null}
    </div>
  );
}
