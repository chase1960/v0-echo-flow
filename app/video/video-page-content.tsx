"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AnalyzeEvent, AnalysisBundle, Anchor, TranscriptItem } from "@/lib/types";
import { VideoContent } from "@/components/video/video-content";
import type { StageName, StageState } from "@/components/video/pipeline-status";
import { parseVideoId } from "@/lib/youtube";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

const INITIAL_STAGES: Record<StageName, StageState> = {
  transcript: { status: "idle" },
  segments: { status: "idle" },
  anchors: { status: "idle" },
  graph: { status: "idle" },
};

/**
 * Streams the analysis instead of waiting for it.
 *
 * A two hour lecture takes tens of seconds to process. Blocking on that is the
 * whole experience; here the player mounts immediately, anchors land in the
 * graph as they pass verification, and the learner can start on minute ten while
 * the tail is still being read.
 */
export function VideoPageContent() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") ?? "";
  const videoId = parseVideoId(rawUrl);

  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [stages, setStages] = useState<Record<StageName, StageState>>(INITIAL_STAGES);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(
    rawUrl && !videoId ? "That link is not a YouTube video." : rawUrl ? null : "No video link was given.",
  );

  useEffect(() => {
    if (!rawUrl || !videoId) return;
    const controller = new AbortController();

    setBundle(null);
    setAnchors([]);
    setTranscript([]);
    setStages(INITIAL_STAGES);
    setTitle("");
    setDuration(0);
    setError(null);

    function handle(event: AnalyzeEvent) {
      if (event.type === "stage") {
        setStages((prev) => ({
          ...prev,
          [event.stage]: { status: event.status, detail: event.detail },
        }));
        return;
      }
      if (event.type === "meta") {
        setTitle(event.title);
        setDuration(event.duration);
        return;
      }
      if (event.type === "transcript") {
        setTranscript(event.items);
        return;
      }
      if (event.type === "anchor") {
        setAnchors((prev) => (prev.some((item) => item.id === event.anchor.id) ? prev : [...prev, event.anchor]));
        return;
      }
      if (event.type === "done") {
        setBundle(event.bundle);
        setAnchors(event.bundle.anchors);
        setTranscript(event.bundle.transcript);
        return;
      }
      if (event.type === "error") {
        setError(event.message);
      }
    }

    async function run() {
      const response = await fetch(`/api/analyze/stream?url=${encodeURIComponent(rawUrl)}`, {
        signal: controller.signal,
        headers: { accept: "text/event-stream" },
      });

      if (!response.ok || !response.body) {
        // no stream support (proxy, older gateway): fall back to the blocking call
        const plain = await fetch(`/api/analyze?url=${encodeURIComponent(rawUrl)}`, {
          signal: controller.signal,
        });
        if (!plain.ok) {
          const body = (await plain.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `analysis failed: ${plain.status}`);
        }
        const data = (await plain.json()) as AnalysisBundle;
        setBundle(data);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((row) => row.startsWith("data:"));
          if (!line) continue;
          try {
            handle(JSON.parse(line.slice(5).trim()) as AnalyzeEvent);
          } catch {
            // a truncated frame is not fatal: the next one carries the data
          }
        }
      }
    }

    run().catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "analysis failed");
    });

    return () => controller.abort();
  }, [rawUrl, videoId]);

  const provisional = useMemo<AnalysisBundle | null>(() => {
    if (!videoId || bundle) return null;
    if (!transcript.length && !anchors.length && !title) return null;
    return {
      videoId,
      title: title || "Reading this video…",
      videoUrl: rawUrl,
      duration,
      summary: anchors.length
        ? `${anchors.length} verified moments so far. The rest are still being read.`
        : "Reading captions and splitting them into events…",
      anchors,
      segments: [],
      transcript,
      source: "live",
      pipeline: {
        transcript: transcript.length ? "youtube-captions" : "none",
        segmentation: "semantic-events",
        model: null,
        segments: 0,
        ms: 0,
        cached: false,
      },
    };
  }, [videoId, bundle, transcript, anchors, title, duration, rawUrl]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <AlertCircle className="mx-auto size-6 text-muted-foreground" />
        <h1 className="text-lg font-medium">Could not analyse this video</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{error}</p>
        <div className="flex justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-1.5 size-4" /> Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (bundle) return <VideoContent bundle={bundle} stages={stages} />;
  if (provisional) return <VideoContent bundle={provisional} stages={stages} streaming />;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner className="size-5" />
      <p className="text-sm text-muted-foreground">Opening the video…</p>
    </div>
  );
}
