import { z } from "zod";

/**
 * Every model response crosses this boundary. The schema is the contract: a
 * malformed anchor is a 502, never a half-valid card rendered to the learner.
 */

export const anchorDraftSchema = z.object({
  title: z.string().trim().min(3).max(80),
  why: z.string().trim().min(8).max(240),
  kind: z
    .enum(["claim", "definition", "step", "example", "data", "counterpoint"])
    .catch("claim"),
  start: z.coerce.number().min(0).max(86400),
  end: z.coerce.number().min(0).max(86400),
  quote: z.string().trim().min(4).max(400),
  visual: z.string().trim().max(160).optional().default(""),
  confidence: z.coerce.number().min(0).max(1).catch(0.6),
});

export const segmentAnchorsSchema = z.object({
  anchors: z.array(anchorDraftSchema).max(3).default([]),
});

export const summarySchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(20).max(600),
});

export const chatRequestSchema = z.object({
  videoId: z.string().trim().min(1).max(64),
  question: z.string().trim().min(2).max(500),
  /** optional: lets the server rebuild a cold cache instead of failing */
  url: z.string().trim().max(2048).optional(),
});

export const chatAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(1200),
  /** ids of the excerpts the answer actually stands on; empty = abstained */
  usedSegmentIds: z.array(z.string()).max(6).default([]),
  grounded: z.boolean().default(true),
});

export const assistantRequestSchema = z.object({
  videoUrl: z.string().trim().min(4).max(2048),
  question: z.string().trim().max(500).optional().default(""),
});

/** 1-based line numbers per segment are what the model is allowed to cite. */
export function formatSegmentsForPrompt(
  segments: { id: string; start: number; end: number; text: string }[],
): string {
  return segments
    .map((segment) => {
      const from = clock(segment.start);
      const to = clock(segment.end);
      return `### ${segment.id} [${from}-${to}]\n${segment.text}`;
    })
    .join("\n\n");
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

export type SegmentAnchors = z.infer<typeof segmentAnchorsSchema>;
export type SummaryPayload = z.infer<typeof summarySchema>;
export type ChatAnswer = z.infer<typeof chatAnswerSchema>;
