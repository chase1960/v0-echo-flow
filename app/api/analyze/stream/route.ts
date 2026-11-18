import { type NextRequest } from "next/server";
import { analyzeVideo } from "@/lib/analyze";
import { parseVideoId } from "@/lib/youtube";
import type { AnalyzeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-sent events for the analysis pipeline.
 *
 * Waiting forty seconds on a spinner is the wrong trade for a two hour video:
 * the first ten minutes are already usable. This stream emits a stage event when
 * each phase starts and finishes, and one `anchor` event per moment as soon as it
 * is verified, so the graph fills in while the tail is still processing.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  if (!url) {
    return new Response(JSON.stringify({ error: "url is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!parseVideoId(url)) {
    return new Response(JSON.stringify({ error: "unsupported video url" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(emit) {
      const send = (event: AnalyzeEvent) => {
        emit.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        for await (const event of analyzeVideo(url, controller.signal)) {
          if (controller.signal.aborted) break;
          send(event);
        }
      } catch {
        send({ type: "error", message: "analysis failed" });
      } finally {
        try {
          emit.close();
        } catch {
          // already closed by the client
        }
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
