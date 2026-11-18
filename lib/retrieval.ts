import type { EventSegment } from "./types";
import { tokenize } from "./segment";

/**
 * Lexical retrieval over event segments (BM25 shape, no vector service needed).
 *
 * The point is not recall perfection, it is *grounding*: if nothing here scores
 * above the threshold the answer must be "this video does not cover that",
 * instead of a fluent paragraph the learner cannot verify.
 */

export interface ScoredSegment {
  segment: EventSegment;
  score: number;
  matched: string[];
}

export const GROUNDING_THRESHOLD = 2.4;

const K1 = 1.4;
const B = 0.72;

export function retrieve(
  query: string,
  segments: EventSegment[],
  limit = 4,
): ScoredSegment[] {
  const queryTerms = [...new Set(tokenize(query))].slice(0, 12);
  if (!queryTerms.length || !segments.length) return [];

  const docFrequency = new Map<string, number>();
  let totalLength = 0;
  for (const segment of segments) {
    totalLength += segment.terms.length;
    for (const term of new Set(segment.terms)) {
      docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
    }
  }
  const averageLength = totalLength / segments.length || 1;
  const total = segments.length;
  const normalizedQuery = query.trim().toLowerCase();

  const scored: ScoredSegment[] = segments.map((segment) => {
    const frequencies = new Map<string, number>();
    for (const term of segment.terms) {
      frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    }

    let score = 0;
    const matched: string[] = [];
    for (const term of queryTerms) {
      const tf = frequencies.get(term) ?? 0;
      if (!tf) continue;
      matched.push(term);
      const df = docFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
      const lengthNorm = 1 - B + (B * segment.terms.length) / averageLength;
      score += (idf * (tf * (K1 + 1))) / (tf + K1 * lengthNorm);
    }

    // an exact phrase the learner typed is a much stronger signal than a bag of
    // words, and it is cheap to check
    if (normalizedQuery.length >= 8 && segment.text.toLowerCase().includes(normalizedQuery)) {
      score += 3;
    }

    return { segment, score, matched };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function isGrounded(results: ScoredSegment[]): boolean {
  const top = results[0];
  if (!top) return false;
  return top.score >= GROUNDING_THRESHOLD && top.matched.length >= 1;
}
