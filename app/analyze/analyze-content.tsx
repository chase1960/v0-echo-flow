"use client";

import { useSearchParams } from "next/navigation";
import { Play, Clock, BookOpen, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AnalyzeContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";

  // Extract video ID from YouTube URL (simplified)
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="size-4" />
          Back to Home
        </Button>
      </Link>

      {/* Video Info Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Video Embed */}
        {videoId ? (
          <div className="aspect-video bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center">
              <Play className="size-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Video preview</p>
            </div>
          </div>
        )}

        {/* Video Details */}
        <div className="p-6">
          <h1 className="font-serif text-2xl text-foreground mb-2">
            Video Analysis
          </h1>
          <p className="text-muted-foreground text-sm break-all mb-4">
            {url || "No URL provided"}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>Duration: Analyzing...</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4" />
              <span>Chapters: Detecting...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <BookOpen className="size-6 text-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">Key Highlights</h3>
          <p className="text-sm text-muted-foreground">
            Discover the most important moments in the video
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <MessageSquare className="size-6 text-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">Ask Questions</h3>
          <p className="text-sm text-muted-foreground">
            Chat with AI about the video content
          </p>
        </div>
      </div>

      {/* Analysis Progress */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-medium text-foreground mb-4">Analysis in Progress</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-sm text-foreground">Video loaded</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-sm text-foreground">Extracting transcript</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Identifying key moments...</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">Generating insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
