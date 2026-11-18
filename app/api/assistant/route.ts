import { NextResponse, type NextRequest } from "next/server";
import { assistantRequestSchema } from "@/lib/schema";
import { analyzeVideo } from "@/lib/analyze";
import { allow, clientKey } from "@/lib/limiter";
import { formatTime } from "@/lib/youtube";
import { modelConfigured } from "@/lib/llm";
import type { AnalysisBundle } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side assistant endpoint.
 *
 * The previous build called a third party agent straight from the browser with
 * a NEXT_PUBLIC_ bearer token, which meant the key was inside the JS bundle that
 * every visitor downloads. Everything secret now lives here, on the server, and
 * the browser only knows about this route.
 */
export async function POST(request: NextRequest) {
  if (!allow(clientKey(request, "assistant"), 10, 60_000)) {
    return NextResponse.json({ error: "too many requests, wait a minute" }, { status: 429 });
  }

  const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { videoUrl, question } = parsed.data;
  const endpoint = process.env.COZE_ENDPOINT;
  const token = process.env.COZE_TOKEN;

  if (endpoint && token) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl,
          subtitle: {},
          video_title: {},
          video_author: {},
          video_cover: {},
          user_query: question || "帮我总结这个视频",
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: `upstream failed: ${res.status}` }, { status: 502 });
      }
      const payload = (await res.json()) as { result?: unknown };
      return NextResponse.json({
        result: typeof payload.result === "string" ? payload.result : JSON.stringify(payload),
        via: "coze",
      });
    } catch {
      return NextResponse.json({ error: "upstream request failed" }, { status: 502 });
    }
  }

  if (!modelConfigured()) {
    return NextResponse.json(
      {
        error:
          "No assistant is configured. Set ANALYSIS_API_KEY (and optionally COZE_ENDPOINT + COZE_TOKEN) in the server environment.",
      },
      { status: 503 },
    );
  }

  try {
    let bundle: AnalysisBundle | null = null;
    for await (const event of analyzeVideo(videoUrl, request.signal)) {
      if (event.type === "error") {
        return NextResponse.json({ error: event.message }, { status: 400 });
      }
      if (event.type === "done") bundle = event.bundle;
    }
    if (!bundle) {
      return NextResponse.json({ error: "analysis produced no result" }, { status: 502 });
    }

    const lines = [
      bundle.summary,
      "",
      ...bundle.anchors
        .slice(0, 6)
        .map((anchor) => `[${formatTime(anchor.start)}] ${anchor.title} — ${anchor.why}`),
    ];

    return NextResponse.json({ result: lines.filter(Boolean).join("\n"), via: "anchors" });
  } catch {
    return NextResponse.json({ error: "analysis failed" }, { status: 502 });
  }
}
