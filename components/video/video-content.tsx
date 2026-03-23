"use client";

import { useState, useRef, useCallback } from "react";
import { VideoAnalysis, Highlight } from "@/lib/types";
import { VideoPlayer, VideoPlayerRef } from "./video-player";
import { HighlightTimeline } from "./highlight-timeline";
import { HighlightsList } from "./highlights-list";
import { TranscriptTab } from "./transcript-tab";
import { ChatTab } from "./chat-tab";
import { NotesTab } from "./notes-tab";
import { FileText, MessageSquare, StickyNote } from "lucide-react";

interface VideoContentProps {
  data: VideoAnalysis;
}

type TabType = "transcript" | "chat" | "notes";

export function VideoContent({ data }: VideoContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>("transcript");
  const [pendingNote, setPendingNote] = useState<string>("");
  const playerRef = useRef<VideoPlayerRef>(null);

  // Calculate total duration from transcript (rough estimate)
  const totalDuration =
    data.transcript.length > 0
      ? data.transcript[data.transcript.length - 1].time + 30
      : 660;

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);

  const handleAddNoteFromHighlight = useCallback((highlight: Highlight) => {
    setPendingNote(`[${formatTime(highlight.time)}] ${highlight.title}\n${highlight.summary}`);
    setActiveTab("notes");
  }, []);

  const handleNoteClear = useCallback(() => {
    setPendingNote("");
  }, []);

  // Get video ID for notes storage
  const videoId = data.video_url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/
  )?.[1] || "default";

  const tabs = [
    { id: "transcript" as const, label: "Transcript", icon: FileText },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "notes" as const, label: "Notes", icon: StickyNote },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)]">
      {/* Left Side - Video Area (60%) */}
      <div className="w-full lg:w-[60%] flex flex-col gap-4 overflow-hidden">
        {/* Video Player */}
        <VideoPlayer
          ref={playerRef}
          videoUrl={data.video_url}
          title={data.title}
        />

        {/* Highlight Timeline */}
        <HighlightTimeline
          highlights={data.highlights}
          totalDuration={totalDuration}
          onSeek={handleSeek}
        />

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <HighlightsList
            highlights={data.highlights}
            onSeek={handleSeek}
            onAddNote={handleAddNoteFromHighlight}
          />
        </div>
      </div>

      {/* Right Side - Info Area (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-hidden">
          {activeTab === "transcript" && (
            <TranscriptTab transcript={data.transcript} onSeek={handleSeek} />
          )}
          {activeTab === "chat" && <ChatTab questions={data.questions} />}
          {activeTab === "notes" && (
            <NotesTab
              videoId={videoId}
              pendingNote={pendingNote}
              onNoteClear={handleNoteClear}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
