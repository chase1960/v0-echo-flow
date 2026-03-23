"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
}

// Extract video ID from YouTube URL
function getVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/
  );
  return match ? match[1] : null;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  function VideoPlayer({ videoUrl, title }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoId = getVideoId(videoUrl);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (iframeRef.current && videoId) {
          // Use YouTube's postMessage API to seek
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: "seekTo",
              args: [time, true],
            }),
            "*"
          );
        }
      },
    }));

    if (!videoId) {
      return (
        <div className="aspect-video bg-muted flex items-center justify-center rounded-xl">
          <p className="text-muted-foreground">Invalid video URL</p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-muted rounded-xl overflow-hidden shadow-lg">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }
);
