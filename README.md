# EchoFlow

**Long videos do not need a shorter version. They need a map back to the second that mattered.**

EchoFlow reads a lecture's own captions, splits the video into semantic events, and marks the
moments worth returning to. Every marker carries a verbatim quote and a timestamp, so the answer
to "where was that thing?" is a click, not a re-watch.

```
paste a YouTube link
        │
        ├─ captions ────► semantic events ────► marked moments ────► dependency links
        │   (youtube)     (silence + discourse)   (model + zod)        (parent → child)
        │
        └─ the learner can start on minute ten while minute ninety is still being read
```

## Why anchors instead of a summary

A summary compresses a two hour video into text and, in doing so, destroys the only coordinate
the learner can act on: time. The compression is not the problem — the loss of a way back is.
So the unit of value here is an anchor:

| field        | why it exists                                                        |
| ------------ | -------------------------------------------------------------------- |
| `start`,`end`| the coordinate. Everything else is optional decoration               |
| `quote`      | verbatim words from the captions, so the claim is checkable          |
| `why`        | one line read *before* jumping, so the jump is not blind             |
| `confidence` | surfaced in the UI. A high-confidence summary you cannot verify is worse than a low-confidence pointer you can |
| `dependsOn`  | which earlier moment to understand first                             |

Details and the reasoning are in [docs/AI-NATIVE.md](docs/AI-NATIVE.md).

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add a model key, see below
npm run dev
```

Open `http://localhost:3000` and paste a link.

The pipeline needs **no model key** to be useful. Without one it still fetches real captions,
segments them, and marks moments heuristically; the UI labels that state as
`captions only · no model key` instead of pretending. With a key it produces marked moments from
the model and a written summary, each still anchored to a quote.

## Configuration

| variable                 | purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `ANALYSIS_API_KEY`       | any OpenAI-compatible endpoint (`OPENAI_API_KEY` also works)  |
| `ANALYSIS_BASE_URL`      | default `https://api.openai.com/v1`                           |
| `ANALYSIS_MODEL`         | default `gpt-4o-mini`                                         |
| `UPSTASH_REDIS_REST_URL` | optional shared analysis cache (REST, no SDK)                 |
| `COZE_ENDPOINT` / `COZE_TOKEN` | optional external agent, proxied by `/api/assistant`     |

All reads happen server-side. No secret is prefixed `NEXT_PUBLIC_`: anything public ends up in the
JavaScript every visitor downloads.

## Pieces

| path                          | responsibility                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| `lib/transcript.ts`           | fetch and parse YouTube captions (json3, XML fallback)            |
| `lib/segment.ts`              | silence gaps, discourse markers, lexical drift → event segments    |
| `lib/analyze.ts`              | the pipeline, as an async generator that emits events             |
| `lib/schema.ts`               | zod contracts for everything the model is allowed to return        |
| `lib/retrieval.ts`            | BM25-lite retrieval + the grounding threshold                     |
| `lib/store.ts`                | LRU plus optional Upstash, keyed by video and model version        |
| `lib/limiter.ts`              | per-IP burst limits on every route that can spend money            |
| `app/api/analyze/stream`      | SSE: stage and anchor events, delivered as they are verified       |
| `app/api/chat`                | grounded Q&A; refuses when retrieval finds nothing solid           |
| `components/video/anchor-graph` | the moment map, driven by the real playhead                      |

## Honest limits

- **English-heavy.** Segmentation relies on English discourse markers; other languages fall back
  to silence-based splitting.
- **Captions only.** A video with no captions cannot be mapped. The visual channel is not read yet;
  `visual` on an anchor is a model guess, not evidence.
- **Serverless cache.** Without Upstash, an analysis is remembered per instance and a question
  asked on a cold instance re-derives from source instead of answering from memory.
- Sampling, latency, and a proper evaluation set are still open — see the "not built" section of
  `docs/AI-NATIVE.md`.
