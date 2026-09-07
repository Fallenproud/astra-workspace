# TTS (Text to Speech) — z-ai Backend Skill

## Purpose

Implement text-to-speech capabilities with `z-ai-web-dev-sdk` when the user needs natural-sounding spoken audio, voice-enabled applications, narration, announcements, accessibility audio, batch speech generation, or spoken audio files.

## Trigger

Use this skill when the primary requested outcome is text → speech/audio, including:

- generate speech from text
- create WAV/MP3/PCM audio
- select among supported voices
- adjust speech speed or volume
- create a backend TTS endpoint
- batch-generate narration
- add voice output to a web application
- generate dynamic spoken responses

Do not invoke for speech-to-text, music generation, or general audio analysis.

## Runtime Boundary

`z-ai-web-dev-sdk` **must run on the backend only**. Never import or expose it directly in browser/client code.

Preferred execution modes:

1. CLI for simple one-off or batch conversions.
2. SDK for application/runtime integration.
3. Server API route for browser-facing applications.

## Canonical API Constraints

- Maximum input text per request: **1024 characters**.
- Split longer content into safe chunks, preferably on sentence boundaries.
- Speed range: **0.5–2.0**.
- Volume: **>0 and <=10**; default 1.0.
- Non-streaming formats: **wav, pcm, mp3**.
- Streaming mode: **PCM only**.
- Recommended sample rate: **24000 Hz**.
- The SDK returns a standard `Response` object.
- Read audio with `await response.arrayBuffer()` and convert with `Buffer.from(new Uint8Array(arrayBuffer))`.

## Supported Voices

Source-provided voice identifiers:

- `tongtong`
- `chuichui`
- `xiaochen`
- `jam`
- `kazi`
- `douji`
- `luodo`

Treat the provider/runtime as the authority if available voices change.

## Canonical Workflow

### 1. Validate Intent

Resolve:

- input text
- output format
- voice
- speed
- volume if requested
- streaming vs non-streaming
- output destination

### 2. Validate Constraints

Before calling the provider:

- reject empty text
- clamp or reject invalid speed/volume values
- split text longer than 1024 characters
- prevent streaming with WAV/MP3
- keep provider credentials/backend runtime private

### 3. Prepare Text

Normalize excessive whitespace and optionally expand abbreviations when pronunciation quality benefits.

For long text, split at sentence boundaries into chunks below the provider limit.

### 4. Reuse SDK Instance

For application/server workloads, create and reuse a singleton SDK instance instead of reinitializing it for every request.

### 5. Generate Audio

Canonical SDK pattern:

```js
import ZAI from 'z-ai-web-dev-sdk';

const zai = await ZAI.create();

const response = await zai.audio.tts.create({
  input: text,
  voice: 'tongtong',
  speed: 1.0,
  response_format: 'wav',
  stream: false,
});

const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(new Uint8Array(arrayBuffer));
```

### 6. Deliver or Persist

Depending on the request:

- return the audio response from an API route
- save to file
- process chunks and concatenate downstream when appropriate
- return a structured batch result

### 7. Verify

Do not claim successful audio generation until the response/body is actually available.

For saved files, verify:

- non-zero buffer/file size
- expected output path
- expected MIME/format

## CLI Pattern

For simple conversions:

```bash
z-ai tts --input "Hello, world" --output ./hello.wav
```

Optional parameters include voice, speed, format, and streaming subject to the constraints above.

## Long-Text Strategy

Prefer sentence-aware chunking below 1024 characters.

Do not silently truncate long input.

For batch/long-form generation:

1. split
2. generate each chunk
3. preserve ordering
4. collect per-chunk success/failure
5. combine only when the target workflow requires it

## Web Application Pattern

Client code should call a server endpoint such as `/api/tts`.

The server:

1. validates input
2. invokes `z-ai-web-dev-sdk`
3. reads the `Response` as an ArrayBuffer
4. returns audio bytes with the correct content type

Never expose backend provider execution directly to the browser.

## Error Handling

Handle explicitly:

- empty input
- >1024 character input without chunking
- invalid speed
- invalid volume
- unsupported streaming format
- provider/runtime errors
- empty or corrupted output

Return structured errors rather than claiming success.

## Performance Guidance

- reuse the SDK instance
- cache frequently repeated speech where appropriate
- batch work efficiently
- queue larger workloads
- clean up old generated audio artifacts when persistence is temporary

## Common Use Cases

- audiobooks and podcasts
- e-learning narration
- accessibility audio
- voice assistants
- automated announcements
- IVR prompts
- localized spoken content
- product/UI voice output

## Truth / Verification Rules

- Backend configured ≠ TTS verified.
- SDK call issued ≠ audio produced.
- File path returned ≠ valid audio artifact.
- Streaming requested ≠ WAV/MP3 streaming supported.

A successful completion requires evidence that the provider returned audio data or a valid audio artifact was produced.

## Source Provenance

This canonical Skill Hub version was derived from the user-provided `TTS` Skill specification for `z-ai-web-dev-sdk`, preserving its execution boundary, constraints, voices, API behavior, error-handling guidance, and backend integration model.