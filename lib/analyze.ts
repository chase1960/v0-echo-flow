import { parseVideoId, watchUrl } from "./youtube";
import { fetchTranscript } from "./transcript";
import { segmentTranscript } from "./segment";
import { chatStructured, modelConfigured, modelName } from "./llm";
import { segmentAnchorsSchema, summarySchema } from "./schema";
import { cacheKey, readAnalysis, writeAnalysis } from "./store";
import { demoBundle } from "./demo";
import type {
  AnalysisBundle,
  Anchor,
  AnchorKind,
  AnalyzeEvent,
  AnalysisSource,
  EventSegment,
} from "./types";

/**
 * The pipeline: captions → semantic events → per-event anchors → graph.
 *
 * Two properties matter more than raw model quality:
 *  1. progressive: the generator yields anchors as they resolve, so the learner
 *     can start on the first ten minutes while the back half is still running;
 *  2. verifiable: a model anchor whose quote cannot be found in the transcript is
 *     dropped, not softened. A wrong timestamp costs more than a missing one.
 */

const COLORS = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];
const MAX_ANCHORS = 14;
const BATCH = 4;

interface AnchorDraft {
  title: string;
  why: string;
  kind: AnchorKind;
  start: number;
  end: number;
  quote: string;
  visual: string;
  confidence: number;
}

const ANALYST_SYSTEM = `You mark the moments in a lecture that a learner would want to jump back to.

Rules you must follow:
- Use only the text in the segment you are given. Never add facts from outside it.
- start and end are seconds inside that segment's range.
- quote is a contiguous verbatim run of words copied from the segment text.
- why is one sentence answering: what will the learner understand after watching these ~40 seconds?
- Mark at most 2 moments per segment, and return an empty array if nothing is worth marking. A segment of small talk deserves no anchor.
- confidence is your own calibration between 0 and 1.

Reply with JSON only: {"anchors":[{"title","why","kind","start","end","quote","visual","confidence"}]}
kind is one of claim, definition, step, example, data, counterpoint.
visual is an optional short note on what is on screen, empty string when unknown.`;

export async function* analyzeVideo(
  rawUrl: string,
  signal?: AbortSignal,
): AsyncGenerator<AnalyzeEvent> {
  const videoId = parseVideoId(rawUrl);
  if (!videoId) {
    yield { type: "error", message: "That does not look like a YouTube link." };
    return;
  }

  const key = cacheKey(videoId);
  const cached = await readAnalysis(key);
  if (cached) {
    yield { type: "meta", title: cached.title, duration: cached.duration, source: cached.source };
    yield { type: "transcript", items: cached.transcript };
    for (const anchor of cached.anchors) yield { type: "anchor", anchor };
    yield { type: "done", bundle: { ...cached, pipeline: { ...cached.pipeline, cached: true } } };
    return;
  }

  const started = Date.now();

  yield { type: "stage", stage: "transcript", status: "start" };
  const captured = await fetchTranscript(videoId, signal);
  const meta = await readMeta(videoId);
  const items = captured?.items ?? [];
  const duration = captured?.duration || (items.length ? items[items.length - 1]!.time + 20 : 0);

  if (signal?.aborted) return;

  if (!items.length) {
    const bare: AnalysisBundle = {
      videoId,
      title: meta.title,
      videoUrl: watchUrl(videoId),
      duration,
      summary: "",
      anchors: [],
      segments: [],
      transcript: [],
      source: "demo",
      pipeline: {
        transcript: "none",
        segmentation: "none",
        model: modelName(),
        segments: 0,
        ms: Date.now() - started,
        cached: false,
      },
      notice:
        "This video exposes no public captions, so no moment can be located. Analysis needs timed text; try a video with captions enabled.",
    };
    yield { type: "meta", title: bare.title, duration: bare.duration, source: bare.source };
    yield { type: "done", bundle: bare };
    return;
  }

  yield { type: "stage", stage: "transcript", status: "done", detail: `${items.length} cues` };
  yield { type: "transcript", items };

  yield { type: "stage", stage: "segments", status: "start" };
  const segments = segmentTranscript(items);
  yield {
    type: "stage",
    stage: "segments",
    status: "done",
    detail: `${segments.length} events`,
  };

  const source: AnalysisSource = modelConfigured() ? "live" : "heuristic";
  const anchors: Anchor[] = [];
  let dropped = 0;

  yield { type: "stage", stage: "anchors", status: "start" };

  if (modelConfigured()) {
    for (let index = 0; index < segments.length; index += BATCH) {
      if (signal?.aborted) return;
      const batch = segments.slice(index, index + BATCH);
      const drafts = await Promise.all(
        batch.map((segment) => draftsForSegment(segment).catch(() => [] as AnchorDraft[])),
      );
      for (let offset = 0; offset < batch.length; offset += 1) {
        const segment = batch[offset]!;
        for (const draft of drafts[offset] ?? []) {
          if (!quoteExists(draft.quote, segment.text)) {
            dropped += 1;
            continue;
          }
          const anchor = toAnchor(draft, segment, anchors.length);
          anchors.push(anchor);
          yield { type: "anchor", anchor };
        }
      }
    }
  } else {
    for (const anchor of heuristicAnchors(segments)) {
      anchors.push(anchor);
      yield { type: "anchor", anchor };
    }
  }

  yield { type: "stage", stage: "graph", status: "start" };
  const graph = consolidate(anchors);
  const summary = await buildSummary(meta.title, graph, signal);

  const bundle: AnalysisBundle = {
    videoId,
    title: meta.title,
    videoUrl: watchUrl(videoId),
    duration,
    summary,
    anchors: graph,
    segments,
    transcript: items,
    source,
    pipeline: {
      transcript: "youtube-captions",
      segmentation: "semantic-events",
      model: modelName(),
      segments: segments.length,
      ms: Date.now() - started,
      cached: false,
    },
    notice: buildNotice(source, graph.length, dropped),
  };

  yield { type: "stage", stage: "graph", status: "done", detail: `${graph.length} anchors` };
  await writeAnalysis(key, bundle);
  yield { type: "done", bundle };
}

export function sampleBundle(): AnalysisBundle {
  return demoBundle;
}

async function draftsForSegment(segment: EventSegment): Promise<AnchorDraft[]> {
  const payload = await chatStructured(segmentAnchorsSchema, {
    system: ANALYST_SYSTEM,
    user: `SEGMENT ${segment.id} spans ${clock(segment.start)} to ${clock(segment.end)} (${Math.round(
      segment.end - segment.start,
    )} seconds).

TEXT:
${segment.text}`,
    temperature: 0.1,
    maxTokens: 700,
  });
  // The loose zod schema (enums/lengths use .catch, arrays use .default) yields values the
  // compiler widens to unknown; normalise to AnchorDraft so downstream code stays typed.
  return (payload.anchors ?? []).map((draft) => ({
    title: draft.title,
    why: draft.why,
    kind: (draft.kind ?? "claim") as AnchorKind,
    start: Number(draft.start),
    end: Number(draft.end),
    quote: draft.quote,
    visual: typeof draft.visual === "string" ? draft.visual : "",
    confidence: typeof draft.confidence === "number" ? draft.confidence : 0.6,
  }));
}

function toAnchor(draft: AnchorDraft, segment: EventSegment, index: number): Anchor {
  const start = clamp(draft.start, segment.start, Math.max(segment.start, segment.end - 6));
  const end = clamp(draft.end, start + 8, Math.max(start + 8, segment.end));
  return {
    id: `a${index + 1}`,
    start: Math.round(start),
    end: Math.round(Math.min(end, start + 95)),
    title: draft.title,
    why: draft.why,
    kind: draft.kind,
    quote: draft.quote,
    visual: draft.visual ?? "",
    dependsOn: [],
    confidence: draft.confidence,
    color: COLORS[index % COLORS.length] as string,
  };
}

/** A quote that is not in the transcript means the model paraphrased; drop it. */
function quoteExists(quote: string, text: string): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const needle = normalize(quote);
  if (needle.length < 6) return false;
  return normalize(text).includes(needle.slice(0, Math.min(needle.length, 120)));
}

function heuristicAnchors(segments: EventSegment[]): Anchor[] {
  const scored = segments
    .map((segment) => ({ segment, score: salience(segment.text) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 7)
    .sort((left, right) => left.segment.start - right.segment.start);

  return scored.map(({ segment }, index) => {
    const firstSentence = segment.text.split(/(?<=[.?!])\s/)[0] ?? segment.text;
    const rest = segment.text.slice(firstSentence.length).trim();
    const title = fit(firstSentence.replace(/[.?!]+$/, ""), 76);
    return {
      id: `a${index + 1}`,
      start: Math.round(segment.start),
      end: Math.round(Math.min(segment.end, segment.start + 70)),
      title: title || `Moment at ${clock(segment.start)}`,
      why: fit(rest || segment.text, 190),
      kind: inferKind(segment.text),
      quote: fit(firstSentence, 220),
      visual: "",
      dependsOn: [],
      confidence: 0.32,
      color: COLORS[index % COLORS.length] as string,
    };
  });
}

function salience(text: string): number {
  const lower = text.toLowerCase();
  let score = Math.min(3, text.length / 500);
  if (/step (one|two|three|four|five)|\b(first|second|third|next|finally)\b/.test(lower)) {
    score += 3;
  }
  if (/for example|for instance|such as|imagine/.test(lower)) score += 2;
  if (/means|is called|refers to|defined as|the idea is/.test(lower)) score += 2;
  if (/\d/.test(text)) score += 1.2;
  if (/because|the reason|which is why/.test(lower)) score += 1.4;
  return score;
}

function inferKind(text: string): AnchorKind {
  const lower = text.toLowerCase();
  if (/step (one|two|three|four|five)|first,|second,|third,/.test(lower)) return "step";
  if (/for example|for instance|such as|imagine/.test(lower)) return "example";
  if (/means|is called|refers to|defined as/.test(lower)) return "definition";
  if (/\d+\s?(percent|%|million|billion|times)/.test(lower)) return "data";
  if (/however|but that is wrong|the problem is|contrary/.test(lower)) return "counterpoint";
  return "claim";
}

/** Dedupe, enforce span sanity, then link steps into a dependency chain. */
function consolidate(anchors: Anchor[]): Anchor[] {
  const unique: Anchor[] = [];
  for (const anchor of anchors) {
    if (anchor.end - anchor.start < 6) continue;
    const clash = unique.find(
      (candidate) =>
        titleSimilarity(candidate.title, anchor.title) > 0.7 ||
        Math.abs(candidate.start - anchor.start) < 8,
    );
    if (clash) {
      if (anchor.confidence > clash.confidence) {
        Object.assign(clash, anchor, { id: clash.id, color: clash.color });
      }
      continue;
    }
    unique.push(anchor);
  }

  const sorted = unique.sort((left, right) => left.start - right.start).slice(0, MAX_ANCHORS);
  sorted.forEach((anchor, index) => {
    anchor.id = `a${index + 1}`;
    anchor.color = COLORS[index % COLORS.length] as string;
    if (anchor.kind === "step") {
      const previousStep = sorted
        .slice(0, index)
        .reverse()
        .find((candidate) => candidate.kind === "step" || candidate.kind === "definition");
      anchor.dependsOn = previousStep ? [previousStep.id] : [];
    }
  });
  return sorted;
}

function titleSimilarity(left: string, right: string): number {
  const words = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3),
    );
  const a = words(left);
  const b = words(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

async function buildSummary(
  title: string,
  anchors: Anchor[],
  signal?: AbortSignal,
): Promise<string> {
  if (!anchors.length) return "";
  if (!modelConfigured()) {
    return `${anchors.length} jumpable moments were marked. Start with "${anchors[0]!.title}".`;
  }
  try {
    const payload = await chatStructured(summarySchema, {
      system:
        "Write a two sentence orientation for a learner, based strictly on the anchor titles and reasons given. Do not add facts. Second sentence must state what to watch first.",
      user: `Video: ${title}
Anchors:
${anchors
  .map((anchor) => `- [${clock(anchor.start)}] ${anchor.title} — ${anchor.why}`)
  .join("\n")}`,
      temperature: 0.2,
      maxTokens: 300,
      signal,
    });
    return payload.summary;
  } catch {
    return `${anchors.length} jumpable moments were marked. Start with "${anchors[0]!.title}".`;
  }
}

function buildNotice(source: AnalysisSource, count: number, dropped: number): string | undefined {
  if (source === "heuristic") {
    return "Built from captions with the local segmenter only: no model key is configured, so titles are mechanical and confidence is low.";
  }
  if (!count) {
    return "Captions were found but no moment passed verification for this video.";
  }
  if (dropped > 0) {
    return `${dropped} candidate moment${dropped > 1 ? "s" : ""} were discarded because their quote could not be verified against the transcript.`;
  }
  return undefined;
}

interface VideoMeta {
  title: string;
  channel: string;
}

async function readMeta(videoId: string): Promise<VideoMeta> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl(videoId))}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return { title: `Video ${videoId}`, channel: "" };
    const payload = (await res.json()) as { title?: string; author_name?: string };
    return {
      title: payload.title?.slice(0, 200) ?? `Video ${videoId}`,
      channel: payload.author_name ?? "",
    };
  } catch {
    return { title: `Video ${videoId}`, channel: "" };
  }
}

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function fit(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trimEnd()}…`;
}
