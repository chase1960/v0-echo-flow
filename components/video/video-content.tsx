"use client";

import { useState, useRef, useCallback } from "react";
import { VideoAnalysis, Highlight } from "@/lib/types";
import { VideoPlayer, VideoPlayerRef } from "./video-player";
import { HighlightTimeline } from "./highlight-timeline";
import { HighlightsList } from "./highlights-list";
import { TranscriptTab } from "./transcript-tab";
import { ChatTab } from "./chat-tab";
import { NotesTab } from "./notes-tab";
import { Sparkles, MessageSquare, PenLine, ChevronDown } from "lucide-react";

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
    { id: "transcript" as const, label: "Transcript", icon: Sparkles, hasDropdown: true },
    { id: "chat" as const, label: "Chat", icon: MessageSquare, hasDropdown: false },
    { id: "notes" as const, label: "Notes", icon: PenLine, hasDropdown: false },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-4rem)]">
      {/* Left Side - Video Area (60%) */}
      <div className="w-full lg:w-[60%] flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Video Player */}
        <VideoPlayer
          ref={playerRef}
          videoUrl={data.video_url}
          title={data.title}
        />

        {/* Highlight Timeline Bar */}
        <div className="mt-4">
          <HighlightTimeline
            highlights={data.highlights}
            totalDuration={totalDuration}
            onSeek={handleSeek}
          />
        </div>

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto mt-3 min-h-0">
          <HighlightsList
            highlights={data.highlights}
            onSeek={handleSeek}
            onAddNote={handleAddNoteFromHighlight}
          />
        </div>
      </div>

      {/* Right Side - Info Area (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col border-l border-border min-h-0">
        {/* Tab Navigation - 椭圆边框样式 */}
        <div className="flex items-center gap-1 p-4 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "text-foreground border border-border rounded-full bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
              {tab.hasDropdown && activeTab === tab.id && (
                <ChevronDown className="size-3.5 ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-hidden">
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
