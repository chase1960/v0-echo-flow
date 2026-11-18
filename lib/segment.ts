import type { EventSegment, TranscriptItem } from "./types";

/**
 * Semantic event segmentation, training free.
 *
 * Frame-level or fixed-window chunking is the wrong unit for long video: a
 * three hour podcast cut every 60 seconds puts one idea across three chunks and
 * three ideas in one. Following the event-level retrieval line of work (EC-RAG
 * style chains), we cut where the *content* changes: speaker gaps, discourse
 * markers and a lexical-shift score, then keep segments inside a usable span.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this",
  "these", "those", "you", "your", "we", "our", "they", "their", "it", "its",
  "is", "are", "was", "were", "be", "been", "being", "to", "of", "in", "on",
  "for", "with", "as", "at", "by", "from", "about", "into", "so", "not",
  "can", "will", "would", "just", "have", "has", "had", "do", "does", "did",
  "what", "which", "how", "why", "when", "there", "here", "i", "me", "my",
  "he", "she", "his", "her", "them", "us", "get", "got", "like", "really",
  "actually", "know", "think", "going", "gonna", "okay", "yeah", "right",
]);

const DISCOURSE_CUE =
  /^(so|now|next|then|first|second|third|finally|step (one|two|three|four|five)|\d+\.|another thing|the (first|second|third|next|last) thing|let me|let's|here's|to summarize|in summary|on the other hand|but the problem)/i;

const MAX_SEGMENT_SECONDS = 110;
const MIN_SEGMENT_SECONDS = 30;
const SOFT_TARGET_SECONDS = 55;
const SPEAKER_GAP_SECONDS = 4.5;
const LEXICAL_SHIFT = 0.08;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

interface Statement {
  start: number;
  end: number;
  text: string;
  terms: Set<string>;
}

export function segmentTranscript(
  items: TranscriptItem[],
  options: { maxSegments?: number } = {},
): EventSegment[] {
  if (!items.length) return [];

  const statements = buildStatements(items);
  const maxSegments = options.maxSegments ?? 60;
  const segments: EventSegment[] = [];
  let window: Statement[] = [];

  const flush = (): void => {
    if (!window.length) return;
    const start = window[0]!.start;
    const end = window[window.length - 1]!.end;
    if (end - start < 4 && segments.length) {
      // a tail that is too short: attach it to the previous event instead of
      // emitting a five second "segment" that no model can say anything about
      const last = segments[segments.length - 1]!;
      last.end = end;
      last.text = `${last.text} ${window.map((s) => s.text).join(" ")}`.trim();
      const mergedTerms = new Set([...last.terms, ...window.flatMap((s) => [...s.terms])]);
      last.terms = [...mergedTerms];
      window = [];
      return;
    }
    const terms = new Set<string>();
    for (const statement of window) {
      for (const term of statement.terms) terms.add(term);
    }
    segments.push({
      id: `s${segments.length + 1}`,
      start,
      end,
      text: window.map((statement) => statement.text).join(" ").trim(),
      terms: [...terms],
    });
    window = [];
  };

  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index]!;
    const previous = window[window.length - 1];

    if (previous && window.length) {
      const windowStart = window[0]!.start;
      const gap = statement.start - previous.end;
      const span = statement.end - windowStart;
      const overlap = lexicalOverlap(window, statement);

      const hardBreak = gap > SPEAKER_GAP_SECONDS;
      const topicShift =
        span > MIN_SEGMENT_SECONDS && overlap < LEXICAL_SHIFT;
      const cueBreak =
        span > MIN_SEGMENT_SECONDS && DISCOURSE_CUE.test(statement.text);
      const tooLong = span > MAX_SEGMENT_SECONDS;
      const longEnough = span > SOFT_TARGET_SECONDS;

      if (hardBreak || tooLong || cueBreak || (topicShift && longEnough)) {
        flush();
      }
    }

    window.push(statement);
    if (segments.length >= maxSegments - 1 && index === statements.length - 1) {
      flush();
    }
  }

  flush();
  return segments;
}

function buildStatements(items: TranscriptItem[]): Statement[] {
  const statements: Statement[] = [];
  let current: { start: number; end: number; text: string } | null = null;

  const push = (): void => {
    if (!current) return;
    const text = current.text.trim();
    if (text.length > 2) {
      statements.push({
        start: current.start,
        end: current.end,
        text,
        terms: new Set(tokenize(text)),
      });
    }
    current = null;
  };

  for (const item of items) {
    const start = item.time;
    const end = item.time + Math.max(1, item.duration || 2);
    if (!current) {
      current = { start, end, text: item.text };
    } else if (end - current.end > SPEAKER_GAP_SECONDS || current.text.length > 260) {
      push();
      current = { start, end, text: item.text };
    } else {
      current.text = `${current.text} ${item.text}`.trim();
      current.end = end;
    }

    if (/[.?!]\s*$/.test(current.text) && current.text.length > 90) {
      push();
    }
  }

  push();
  return statements;
}

function lexicalOverlap(window: Statement[], next: Statement): number {
  const windowTerms = new Set<string>();
  for (const statement of window) {
    for (const term of statement.terms) windowTerms.add(term);
  }
  if (!windowTerms.size || !next.terms.size) return 0;
  let shared = 0;
  for (const term of next.terms) {
    if (windowTerms.has(term)) shared += 1;
  }
  return shared / Math.min(windowTerms.size, next.terms.size);
}
