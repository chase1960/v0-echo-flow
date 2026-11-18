import type { AnalysisBundle } from "./types";

/**
 * Analysis cache.
 *
 * In-memory first (fast, and enough for a single warm instance). When
 * UPSTASH_REDIS_REST_URL is set the same code path uses REST, so a serverless
 * deployment stops paying to re-analyse the same video on every cold start.
 * No SDK dependency: two fetch calls.
 */

const MAX_ENTRIES = 24;
const TTL_SECONDS = 60 * 60 * 24 * 7;

interface Entry {
  bundle: AnalysisBundle;
  savedAt: number;
}

const memory = new Map<string, Entry>();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Cache identity includes the prompt/model version so a model swap invalidates. */
export function cacheKey(videoId: string): string {
  const model = process.env.ANALYSIS_MODEL ?? "none";
  return `ech:analysis:v3:${videoId}:${model}`;
}

export async function readAnalysis(key: string): Promise<AnalysisBundle | null> {
  const local = memory.get(key);
  if (local && Date.now() - local.savedAt < TTL_SECONDS * 1000) {
    return local.bundle;
  }
  if (local) memory.delete(key);

  if (!REDIS_URL || !REDIS_TOKEN) return null;

  try {
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { result?: string | null };
    if (!payload.result) return null;
    return JSON.parse(payload.result) as AnalysisBundle;
  } catch {
    return null;
  }
}

export async function writeAnalysis(key: string, bundle: AnalysisBundle): Promise<void> {
  const entry: Entry = { bundle, savedAt: Date.now() };
  memory.delete(key);
  memory.set(key, entry);
  while (memory.size > MAX_ENTRIES) {
    const oldest = memory.keys().next();
    if (oldest.done) break;
    memory.delete(oldest.value);
  }

  if (!REDIS_URL || !REDIS_TOKEN) return;

  try {
    await fetch(`${REDIS_URL}/set/${key}?EX=${TTL_SECONDS}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${REDIS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(bundle),
    });
  } catch {
    // cache misses are survivable; never fail a request over them
  }
}
