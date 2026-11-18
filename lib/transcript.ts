import type { TranscriptItem } from "./types";

/**
 * Transcript acquisition without an API key: read the watch page, pull the
 * caption tracks out of `ytInitialPlayerResponse`, then fetch the timed text in
 * json3 (precise offsets) with an XML fallback. Fragile by nature, so every
 * failure returns null and the pipeline degrades instead of throwing.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
  name?: { simpleText?: string };
}

export interface TranscriptFetch {
  items: TranscriptItem[];
  /** seconds, 0 when the page did not expose it */
  duration: number;
}

export async function fetchTranscript(
  videoId: string,
  signal?: AbortSignal,
): Promise<TranscriptFetch | null> {
  try {
    const page = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999`,
      {
        headers: {
          "user-agent": UA,
          "accept-language": "en-US,en;q=0.9",
          accept: "text/html,application/xhtml+xml",
        },
        signal,
        cache: "no-store",
      },
    );
    if (!page.ok) return null;
    const html = await page.text();

    const duration = readDuration(html);
    const tracks = readCaptionTracks(html);
    if (!tracks.length) return { items: [], duration };

    const track = pickTrack(tracks);
    if (!track?.baseUrl) return { items: [], duration };

    const items = await readTimedText(track.baseUrl, signal);
    return { items, duration };
  } catch {
    return null;
  }
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const usable = tracks.filter((track) => Boolean(track.baseUrl));
  if (!usable.length) return null;
  const english = usable.filter((track) => (track.languageCode ?? "").startsWith("en"));
  const manual = english.find((track) => track.kind !== "asr");
  return manual ?? english[0] ?? usable[0] ?? null;
}

async function readTimedText(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<TranscriptItem[]> {
  const jsonUrl = `${baseUrl}${baseUrl.includes("fmt=") ? "" : "&fmt=json3"}`;
  const res = await fetch(jsonUrl, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    signal,
    cache: "no-store",
  });

  if (res.ok) {
    const body = await res.text();
    const fromJson = parseJson3(body);
    if (fromJson.length) return fromJson;
    const fromXml = parseXml(body);
    if (fromXml.length) return fromXml;
  }
  return [];
}

interface Json3Segment {
  utf8?: string;
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Json3Segment[];
}

function parseJson3(body: string): TranscriptItem[] {
  let parsed: { events?: Json3Event[] };
  try {
    parsed = JSON.parse(body) as { events?: Json3Event[] };
  } catch {
    return [];
  }
  const items: TranscriptItem[] = [];
  for (const event of parsed.events ?? []) {
    const text = (event.segs ?? [])
      .map((seg) => seg.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text === " ") continue;
    const start = Math.max(0, Math.round((event.tStartMs ?? 0) / 1000));
    items.push({
      id: `c${items.length + 1}`,
      time: start,
      duration: Math.round((event.dDurationMs ?? 0) / 1000),
      text,
    });
  }
  return items;
}

function parseXml(body: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  const pattern = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const text = decodeEntities(match[3] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    items.push({
      id: `c${items.length + 1}`,
      time: Math.max(0, Math.round(Number(match[1]))),
      duration: Math.round(Number(match[2] ?? 0)),
      text,
    });
  }
  return items;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function readDuration(html: string): number {
  const match = html.match(/"lengthSeconds":"(\d+)"/);
  return match ? Number(match[1]) : 0;
}

function readCaptionTracks(html: string): CaptionTrack[] {
  const anchor = html.indexOf('"captionTracks":');
  if (anchor < 0) return [];
  const arrayStart = html.indexOf("[", anchor);
  if (arrayStart < 0) return [];
  const json = sliceBalanced(html, arrayStart);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as CaptionTrack[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Cut out the balanced JSON array that starts at `from`, ignoring braces in strings. */
function sliceBalanced(source: string, from: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = from; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(from, i + 1);
    }
  }
  return null;
}
