"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisBundle } from "@/lib/types";
import { VideoPlayer, type VideoPlayerRef } from "./video-player";
import { AnchorGraph } from "./anchor-graph";
import { AnchorList } from "./anchor-list";
import { PipelineStatus, type StageName, type StageState } from "./pipeline-status";
import { TranscriptTab } from "./transcript-tab";
import { ChatTab } from "./chat-tab";
import { NotesTab } from "./notes-tab";
import { readProgress, recordVideo, saveProgress } from "@/lib/storage";
import { formatTime, thumbnailUrl } from "@/lib/youtube";
import { FileText, MessageSquare, PenLine, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoContentProps {
  bundle: AnalysisBundle;
  stages?: Record<StageName, StageState>;
  streaming?: boolean;
}

type TabKey = "transcript" | "chat" | "notes";

const SOURCE_COPY: Record<AnalysisBundle["source"], string> = {
  live: "Model analysis",
  heuristic: "Captions only · no model key",
  demo: "Sample data",
};

/**
 * The working surface. Three things happen here that the previous build did not
 * do: the playhead is real, so the graph and the transcript track the player;
 * j / k move between anchors without touching the mouse; and the tab panel is a
 * fixed height, so a long answer scrolls inside it instead of pushing the video
 * out of view on a phone.
 */
export function VideoContent({ bundle, stages, streaming = false }: VideoContentProps) {
  const playerRef = useRef<VideoPlayerRef>(null);
  const timeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tab, setTab] = useState<TabKey>("transcript");
  const [pendingNote, setPendingNote] = useState<{ at: number; text: string } | null>(null);

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    timeRef.current = seconds;
    setCurrentTime(seconds);
  }, []);

  const handleTime = useCallback((seconds: number) => {
    timeRef.current = seconds;
    setCurrentTime(seconds);
  }, []);

  const ordered = useMemo(
    () => [...bundle.anchors].sort((left, right) => left.start - right.start),
    [bundle.anchors],
  );

  const activeAnchor = useMemo(() => {
    const containing = ordered.find(
      (anchor) => currentTime >= anchor.start && currentTime <= anchor.end,
    );
    if (containing) return containing;
    return ordered.filter((anchor) => anchor.start <= currentTime).slice(-1)[0];
  }, [ordered, currentTime]);

  // reading history, once per video
  useEffect(() => {
    recordVideo({
      videoId: bundle.videoId,
      videoUrl: bundle.videoUrl,
      title: bundle.title,
      channelName: "",
      thumbnailUrl: thumbnailUrl(bundle.videoId),
      duration: bundle.duration,
      highlightsCount: bundle.anchors.length,
      isFavorite: false,
    });
  }, [bundle.videoId, bundle.videoUrl, bundle.title, bundle.duration, bundle.anchors.length]);

  // remember the playhead, but do not hammer localStorage every half second
  useEffect(() => {
    const handle = window.setInterval(() => {
      if (timeRef.current > 0) saveProgress(bundle.videoId, timeRef.current);
    }, 5000);
    return () => window.clearInterval(handle);
  }, [bundle.videoId]);

  // resume where the learner stopped, after the player is actually ready
  const handleReady = useCallback(() => {
    const saved = readProgress(bundle.videoId);
    if (saved > 10) seek(saved);
  }, [bundle.videoId, seek]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key !== "j" && event.key !== "k") return;
      const current = timeRef.current;
      const next =
        event.key === "j"
          ? ordered.find((anchor) => anchor.start > current + 1)
          : [...ordered].reverse().find((anchor) => anchor.start < current - 1);
      if (!next) return;
      event.preventDefault();
      seek(next.start);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ordered, seek]);

  const tabs: { key: TabKey; label: string; icon: typeof FileText; count?: number }[] = [
    { key: "transcript", label: "Transcript", icon: FileText, count: bundle.transcript.length },
    { key: "chat", label: "Ask", icon: MessageSquare },
    { key: "notes", label: "Notes", icon: PenLine },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="space-y-4">
        <VideoPlayer ref={playerRef} videoUrl={bundle.videoUrl} title={bundle.title} onTime={handleTime} onReady={handleReady} />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5">{SOURCE_COPY[bundle.source]}</span>
            <span className="tabular-nums">{formatTime(bundle.duration)}</span>
            <span>{bundle.pipeline.segments} events</span>
            <span>{bundle.anchors.length} moments</span>
            {bundle.pipeline.model && <span>model: {bundle.pipeline.model}</span>}
            <a
              href={`https://www.youtube.com/watch?v=${bundle.videoId}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 underline decoration-border underline-offset-2 hover:text-foreground"
            >
              Open on YouTube <ExternalLink className="size-3" />
            </a>
          </div>

          <h1 className="text-lg font-medium leading-snug">{bundle.title}</h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{bundle.summary}</p>

          {bundle.notice && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
              {bundle.notice}
            </p>
          )}

          {stages && <PipelineStatus stages={stages} />}
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Moment map
            </h2>
            <span className="text-[11px] text-muted-foreground">
              j / k to move · click to jump
            </span>
          </div>
          <AnchorGraph
            anchors={ordered}
            duration={bundle.duration}
            currentTime={currentTime}
            activeId={activeAnchor?.id}
            onSeek={seek}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Where to look
            </h2>
            {streaming && <span className="text-[11px] text-muted-foreground">streaming…</span>}
          </div>
          <AnchorList
            anchors={ordered}
            activeId={activeAnchor?.id}
            onSeek={seek}
            onNote={(anchor) => {
              setPendingNote({
                at: anchor.start,
                text: `${anchor.title}\n`,
              });
              setTab("notes");
            }}
          />
        </div>
      </div>

      <aside className="lg:sticky lg:top-4">
        <div className="flex h-[520px] flex-col rounded-xl border border-border bg-background p-3 shadow-sm">
          <div className="mb-2 flex gap-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition",
                    tab === item.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {typeof item.count === "number" && item.count > 0 && (
                    <span className="tabular-nums opacity-60">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1">
            {tab === "transcript" && (
              <TranscriptTab transcript={bundle.transcript} currentTime={currentTime} onSeek={seek} />
            )}
            {tab === "chat" && (
              <ChatTab
                videoId={bundle.videoId}
                videoUrl={bundle.videoUrl}
                anchors={ordered}
                onSeek={seek}
              />
            )}
            {tab === "notes" && (
              <NotesTab
                videoId={bundle.videoId}
                videoTitle={bundle.title}
                channelName=""
                duration={bundle.duration}
                currentTime={currentTime}
                onSeek={seek}
                pending={pendingNote}
                onPendingUsed={() => setPendingNote(null)}
              />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
