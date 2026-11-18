import type { ZodType } from "zod";

/**
 * Provider-agnostic model access. Server only: the key must never reach a
 * component, and every caller receives `null` from `modelName()` when no key is
 * configured so the pipeline can degrade out loud instead of failing silently.
 *
 * Works with any OpenAI-compatible endpoint (OpenAI, Azure-style gateways,
 * OpenRouter, local vLLM) by pointing ANALYSIS_BASE_URL at it.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/llm must never be imported from the client");
}

const API_KEY = process.env.ANALYSIS_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const BASE_URL = (process.env.ANALYSIS_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/+$/,
  "",
);
const MODEL = process.env.ANALYSIS_MODEL ?? "gpt-4o-mini";

export function modelConfigured(): boolean {
  return Boolean(API_KEY);
}

export function modelName(): string | null {
  return modelConfigured() ? MODEL : null;
}

export interface ChatParams {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export async function chat(params: ChatParams): Promise<string> {
  if (!API_KEY) throw new Error("no model key configured");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxTokens ?? 900,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      ...(params.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: params.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`model request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

export async function chatStructured<T>(
  schema: ZodType<T>,
  params: Omit<ChatParams, "json">,
): Promise<T> {
  const raw = await chat({ ...params, json: true });
  const parsed = schema.safeParse(extractJson(raw));
  if (!parsed.success) {
    throw new Error("model output failed schema validation");
  }
  return parsed.data;
}

/** Models still wrap JSON in prose or fences; find the outermost object. */
function extractJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
