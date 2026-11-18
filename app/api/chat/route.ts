import { NextResponse, type NextRequest } from "next/server";
import { chatAnswerSchema, chatRequestSchema } from "@/lib/schema";
import { retrieve, isGrounded, type ScoredSegment } from "@/lib/retrieval";
import { readAnalysis, cacheKey } from "@/lib/store";
import { analyzeVideo } from "@/lib/analyze";
import { chatStructured, modelConfigured } from "@/lib/llm";
import { allow, clientKey } from "@/lib/limiter";
import { parseVideoId } from "@/lib/youtube";
import type { AnalysisBundle, Anchor, Citation, EventSegment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Grounded Q&A.
 *
 * Two rules make this different from a chatbot bolted onto a video:
 *  - the answer may only use retrieved excerpts from *this* video, and it has to
 *    name the excerpts it used, so every claim maps to a timestamp the learner
 *    can jump to;
 *  - when retrieval finds nothing above threshold the answer is a refusal with
 *    the nearest real topics, not a plausible paragraph. An unverifiable answer
 *    costs a learner more than no answer.
 */

const ANSWER_SYSTEM = `You answer questions about one lecture using ONLY the numbered excerpts given to you.

Rules:
- If the excerpts do not answer the question, set grounded to false, answer with one short sentence saying this video does not cover it, and return an empty usedSegmentIds array.
- If they do answer it, reply in at most 4 sentences, using no facts that are not in the excerpts.
- usedSegmentIds lists only the excerpts you actually relied on.
- Never invent a timestamp.

Reply with JSON only: {"answer": string, "usedSegmentIds": string[], "grounded": boolean}`;

export async function POST(request: NextRequest) {
  if (!allow(clientKey(request, "chat"), 30, 60_000)) {
    return NextResponse.json({ error: "too many questions, wait a minute" }, { status: 429 });
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { videoId, question, url } = parsed.data;
  let bundle = await readAnalysis(cacheKey(videoId));

  // cold serverless instance: re-derive from the source rather than trusting a
  // transcript the browser could have edited
  if (!bundle && url && parseVideoId(url)) {
    for await (const event of analyzeVideo(url)) {
      if (event.type === "done") bundle = event.bundle;
    }
  }
  if (!bundle) {
    return NextResponse.json(
      { error: "analysis expired, reopen the video to ask again" },
      { status: 409 },
    );
  }

  if (!bundle.segments.length) {
    return NextResponse.json({
      answer: "This video has no timed captions, so there is nothing to point at.",
      grounded: false,
      citations: [],
    });
  }

  const results = retrieve(question, bundle.segments, 4);

  if (!isGrounded(results)) {
    return NextResponse.json(abstain("I could not find this in the video.", bundle, results));
  }

  if (!modelConfigured()) {
    return NextResponse.json(extractive(results, bundle));
  }

  try {
    const answer = await chatStructured(chatAnswerSchema, {
      system: ANSWER_SYSTEM,
      user: excerptsForPrompt(results) + `\n\nQuestion: ${question}`,
      temperature: 0.15,
      maxTokens: 600,
      signal: request.signal,
    });

    const used = answer.usedSegmentIds
      .map((id) => bundle!.segments.find((segment) => segment.id === id))
      .filter((segment): segment is EventSegment => Boolean(segment));

    if (!answer.grounded || !used.length) {
      return NextResponse.json(abstain(answer.answer, bundle, results));
    }

    return NextResponse.json({
      answer: answer.answer,
      grounded: true,
      citations: used.map((segment) => citation(segment, bundle!.anchors)),
    });
  } catch {
    return NextResponse.json(extractive(results, bundle));
  }
}

function excerptsForPrompt(results: ScoredSegment[]): string {
  return results
    .map(
      (item) =>
        `### ${item.segment.id} [${clock(item.segment.start)}-${clock(item.segment.end)}]\n${item.segment.text}`,
    )
    .join("\n\n");
}

function abstain(
  message: string,
  bundle: AnalysisBundle,
  results: ScoredSegment[],
): { answer: string; grounded: false; citations: []; nearby: string[] } {
  const fallback = results
    .slice(0, 2)
    .map((item) => item.segment)
    .concat(bundle.segments.slice(0, 2));
  const nearby = [...new Set(bundle.anchors.map((anchor) => `[${clock(anchor.start)}] ${anchor.title}`))]
    .slice(0, 3);

  return {
    answer: fallback.length
      ? `${message} The closest material in this video is around ${clock(fallback[0]!.start)}.`
      : message,
    grounded: false,
    citations: [],
    nearby,
  };
}

/** No model key: still useful, the answer is the evidence itself. */
function extractive(results: ScoredSegment[], bundle: AnalysisBundle) {
  const top = results.slice(0, 2);
  const body = top
    .map(
      (item) =>
        `At ${clock(item.segment.start)} the video says: "${item.segment.text.slice(0, 220)}"`,
    )
    .join(" ");
  return {
    answer: `${body} (No model key is configured, so these are the raw passages rather than a written answer.)`,
    grounded: true,
    citations: top.map((item) => citation(item.segment, bundle.anchors)),
  };
}

function citation(segment: EventSegment, anchors: Anchor[]): Citation {
  const matching =
    anchors.find((anchor) => anchor.start <= segment.start && anchor.end >= segment.start) ??
    anchors.reduce<Anchor | undefined>((best, anchor) => {
      const distance = Math.abs(anchor.start - segment.start);
      if (!best || distance < Math.abs(best.start - segment.start)) return anchor;
      return best;
    }, undefined);

  return {
    anchorId: matching?.id ?? "",
    start: segment.start,
    end: segment.end,
    quote: segment.text.slice(0, 200),
  };
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
