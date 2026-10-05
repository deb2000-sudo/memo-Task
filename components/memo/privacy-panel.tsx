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

export function PrivacyPanel() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Privacy</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Privacy</DialogTitle>
          <DialogDescription>
            Voice transcription uses ElevenLabs. Task understanding runs locally
            using Gemma 3 4B.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-96 flex-col gap-5 overflow-y-auto text-sm leading-relaxed">
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Leaves the device</h3>
            <p>
              The recording does. After you stop, this browser uploads the audio
              and the server sends that file to ElevenLabs Speech-to-Text.
              ElevenLabs returns the transcript. Speech-to-text does not run on
              this device, and it is not performed by Gemma.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Stays on this device</h3>
            <p>
              Task understanding does. The transcript is read by Gemma 3 4B
              through Ollama at 127.0.0.1 on this computer. It is not sent to a
              remote language model.
            </p>
            <p>
              A confirmed task, its transcript, and its recording are stored in
              this browser. Cancel discards the draft. Nothing is written to a
              remote task database.
            </p>
            <p>
              The ElevenLabs key stays on the server. This page never receives it.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Status</h3>
            <p>
              Gemma 3 4B • Local means Ollama is reachable on this computer and
              gemma3:4b is available.
            </p>
            <p>
              Gemma 3 4B • Offline means Ollama cannot be reached, or gemma3:4b
              is not installed. Transcription still uses ElevenLabs. Task
              understanding waits until Gemma is available here.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
