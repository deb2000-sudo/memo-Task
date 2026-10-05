export type AudioKind =
  | "webm"
  | "ogg"
  | "wav"
  | "mp3"
  | "mp4"
  | "flac"
  | "aiff"
  | "caf";

const extensions: Record<AudioKind, string> = {
  webm: "webm",
  ogg: "ogg",
  wav: "wav",
  mp3: "mp3",
  mp4: "m4a",
  flac: "flac",
  aiff: "aiff",
  caf: "caf",
};

export function detectAudioKind(bytes: Uint8Array): AudioKind | null {
  if (bytes.length < 4) {
    return null;
  }

  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "webm";
  }

  if (ascii(bytes, 0, 4) === "OggS") {
    return "ogg";
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE") {
    return "wav";
  }

  if (ascii(bytes, 0, 4) === "fLaC") {
    return "flac";
  }

  if (
    ascii(bytes, 0, 4) === "FORM" &&
    (ascii(bytes, 8, 12) === "AIFF" || ascii(bytes, 8, 12) === "AIFC")
  ) {
    return "aiff";
  }

  if (ascii(bytes, 0, 4) === "caff") {
    return "caf";
  }

  if (ascii(bytes, 0, 3) === "ID3") {
    return "mp3";
  }

  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return "mp3";
  }

  if (ascii(bytes, 4, 8) === "ftyp") {
    return "mp4";
  }

  return null;
}

export function extensionForAudio(kind: AudioKind): string {
  return extensions[kind];
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  if (bytes.length < end) {
    return "";
  }

  let text = "";
  for (let index = start; index < end; index += 1) {
    text += String.fromCharCode(bytes[index] ?? 0);
  }
  return text;
}
