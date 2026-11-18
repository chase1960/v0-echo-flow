import { NextResponse, type NextRequest } from "next/server";
import { analyzeVideo } from "@/lib/analyze";
import type { AnalysisBundle } from "@/lib/types";
import { parseVideoId } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Whole-bundle endpoint. Prefer /api/analyze/stream for the UI: this one exists
 * for clients that would rather wait than render progressively.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!parseVideoId(url)) {
    return NextResponse.json({ error: "unsupported video url" }, { status: 400 });
  }

  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());

  let bundle: AnalysisBundle | null = null;
  try {
    for await (const event of analyzeVideo(url, controller.signal)) {
      if (event.type === "error") {
        return NextResponse.json({ error: event.message }, { status: 400 });
      }
      if (event.type === "done") bundle = event.bundle;
    }
  } catch {
    return NextResponse.json({ error: "analysis failed" }, { status: 502 });
  }

  if (!bundle) {
    return NextResponse.json({ error: "analysis produced no result" }, { status: 502 });
  }
  return NextResponse.json(bundle, { headers: { "cache-control": "no-store" } });
}
