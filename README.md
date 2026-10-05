# MemoTask

MemoTask is a voice-first to-do. You speak a thought, ElevenLabs Scribe v2 transcribes it, and Gemma 3 4B (running locally through Ollama) turns the transcript into a task. Nothing is saved until you confirm it. Saved tasks stay in this browser’s IndexedDB.

A saved task can also be remixed: Gemma proposes a clearer title, description, priority, category, and subtasks. The original task changes only after you click **Apply Changes**.

## What you need

- [Node.js](https://nodejs.org) 20.9 or newer, with npm
- [Ollama](https://ollama.com)
- An [ElevenLabs](https://elevenlabs.io) API key (speech-to-text only)
- A microphone, and a browser that can record audio (Chrome, Edge, or Safari)

Task understanding does not use a hosted chat model. Gemma runs on your machine at `http://127.0.0.1:11434`.

## 1. Get the code

```bash
git clone https://github.com/deb2000-sudo/memo-Task.git
cd memo-Task
```

## 2. Install the app

```bash
npm install
```

## 3. Install and start Ollama

Install Ollama from [ollama.com](https://ollama.com), then start it.

On macOS, opening the Ollama app starts the local server. From a terminal:

```bash
ollama serve
```

Leave that process running. In a second terminal, download the model this app calls:

```bash
ollama pull gemma3:4b
```

Check that Ollama can see it:

```bash
ollama list
```

`gemma3:4b` should be in the list. The model name is fixed in the app. A different Ollama model will not be used.

## 4. Add the ElevenLabs key

Create `.env.local` in the project root:

```bash
ELEVENLABS_API_KEY=your_key_here
```

Get the key from the ElevenLabs dashboard. The file is gitignored. Do not prefix the variable with `NEXT_PUBLIC_`, and do not commit it. The browser never receives this key. The Next.js server uses it only to send the recording to Scribe v2.

Restart the dev server after you create or change this file.

## 5. Start MemoTask

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The header should show **Gemma 3 4B • Local**. If it says **Offline**, Ollama is not running or `gemma3:4b` is not installed. You can also check the health route:

```bash
curl http://127.0.0.1:3000/api/health
```

A working setup returns:

```json
{ "ollama": true, "model": "gemma3:4b" }
```

## 6. Try it

1. Allow the microphone when the browser asks.
2. Hold **Record a memo** and say a task, for example “buy milk tomorrow morning.”
3. Release the button. The screen transcribes with ElevenLabs, then Gemma reads the transcript on this computer.
4. Edit the draft if you want, then confirm it. Cancel discards it.
5. On a saved task, click **Remix**, add an optional note, and click **Remix with Gemma**.
6. **Apply Changes** updates that task. **Cancel** leaves it as it was.

Tasks, transcripts, and recordings stay in this browser. Clearing site data removes them. There is no separate database to install.

## Checks

```bash
npm test
npx tsc --noEmit
npm run lint
```

## If something fails

| What you see | What to do |
| --- | --- |
| Gemma 3 4B • Offline | Start Ollama (`ollama serve`) and confirm `ollama list` includes `gemma3:4b`. |
| The local model is not installed | Run `ollama pull gemma3:4b`. |
| Transcription is not configured on the server | Put `ELEVENLABS_API_KEY` in `.env.local` and restart `npm run dev`. |
| The microphone never starts | Use `localhost` (not a raw IP), and allow microphone access for the site. |
| Remix spins, then fails | Ollama must stay running. The first reply from a 4B model can take a while. |

## What leaves this computer

The recording is uploaded to the Next.js server, which sends that file to ElevenLabs for transcription. The transcript is then read by Gemma through Ollama on `127.0.0.1`. Confirmed tasks are stored in IndexedDB in the browser you confirmed them in.
