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

## Why this product exists

Every tool built for long video assumes the cost is *watching*. It is not. Anyone who has sat
through a ninety minute lecture knows where the cost actually lands:

| the real cost | what it looks like | what a summary does about it |
| --- | --- | --- |
| **relocating** | you remember "there was a counterexample in the pricing part", then scrub the timeline for six minutes and give up | nothing. the summary tells you the counterexample existed, not which second it is in |
| **verifying** | the note says "the speaker argues X is a trap" — is that a paraphrase, or their words? | nothing. prose has no handle to pull on |
| **waiting** | a two hour video takes a minute to process, and for that minute the product is a spinner | makes it worse: one long opaque job instead of useful output early |

A summary compresses two hours into text and, in doing so, destroys the only coordinate a learner
can act on: **time**. The compression is not the failure. The loss of a way back is. That is the
whole reason this product exists — not to hand you a shorter version of the video, but to hand you
a route into it. Concretely: the question "where was that thing?" should cost one click, and the
click should land on a second you can trust, with the speaker's own sentence already visible.

So the product is deliberately not a summarizer with timestamps bolted on. The summary is a
by-product. The thing being built is a **map of checkable moments**.

## What it is actually competing on

Calling a model is not a competitive advantage — anyone can do it in an afternoon, and most video
tools do exactly that: transcribe, chunk, summarise, add timestamps, ship. EchoFlow competes on the
four things that shape does structurally cannot deliver.

**1. Verifiability over fluency.** Every anchor carries a `quote` that must appear *verbatim* in the
captions. The pipeline re-checks each quote against the transcript and **drops the anchor** when it
does not match; timestamps are computed from the event's own boundaries, so the model is never
allowed to invent a time. The claim being sold is not "our summary is good" but "you can check it
yourself in two seconds".

**2. Refusal as a feature.** Questions are answered by retrieving over events with a grounding
threshold. Below it, the product says it cannot find it and shows the nearest real topics instead of
composing a plausible sentence. A tool that guesses when it does not know is unusable for study,
because you cannot tell the guesses from the facts.

**3. Time-to-first-value.** The pipeline is an async generator behind SSE: stages and anchors
stream as they verify. You can be reading minute ten while minute ninety is still being processed.
Nothing blocks behind a single long job.

**4. Deployable, boring infrastructure.** No new dependency, no lockfile churn, secrets only
server-side, optional Upstash over REST rather than an SDK. A good idea that cannot be built on a
free host, or that leaks its key into the browser bundle, is not a product.

The durable part is not the model call — it is the layer around it:

- the **anchor contract** (`start/end`, verbatim `quote`, `why`, `confidence`, `dependsOn`),
- the **verification gate** that makes the contract true rather than aspirational,
- the **event-level index** that makes refusal and citation possible,
- and the artefacts that accumulate per video: analyses, notes pinned to timestamps, dependency
  links. Cheaper to keep using than to re-derive elsewhere — that, not the prompt, is the moat.

**Who it is for:** people who study from video and need to cite it — students re-watching lectures,
engineers mining conference talks, anyone who has to point a colleague at "this part, minute 42".
**Who it is not for:** anyone who wants five bullets and will never go back to the source. For them
a summary is genuinely better, and this will feel like extra work.

## The unit of value: an anchor

If the map is the product, the anchor is its cell. Every field below exists to answer exactly one
doubt a learner has while standing in front of a two hour video:

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
