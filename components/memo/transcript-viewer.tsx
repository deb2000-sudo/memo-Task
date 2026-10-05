"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TranscriptViewerProps = {
  title: string;
  transcript: string;
};

export function TranscriptViewer({ title, transcript }: TranscriptViewerProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Transcript</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transcript</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <p className="max-h-80 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
          {transcript}
        </p>
      </DialogContent>
    </Dialog>
  );
}
