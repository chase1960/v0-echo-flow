"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { parseVideoId } from "@/lib/youtube";

/**
 * Real YouTube IFrame API integration.
 *
 * The previous version posted a `{event:"command"}` message into the iframe
 * without ever completing the API handshake, so seeking worked on warm players
 * and silently did nothing on cold ones, which is exactly the long video case.
 * Loading the API, waiting for onReady, and polling getCurrentTime gives us a
 * seek we can trust and a playhead the timeline can follow.
 */

interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const finish = () => {
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("player api unavailable"));
    };
    window.onYouTubeIframeAPIReady = finish;

    if (!document.querySelector('script[data-yt-iframe-api="true"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.ytIframeApi = "true";
      script.onerror = () => reject(new Error("player api blocked"));
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

export interface VideoPlayerRef {
  seekTo(time: number): void;
  getTime(): number;
}

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  /** fired roughly twice a second while the player is alive */
  onTime?: (seconds: number) => void;
  onReady?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  function VideoPlayer({ videoUrl, title, onTime, onReady }, ref) {
    const mountRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const pendingSeek = useRef<number | null>(null);
    const onTimeRef = useRef(onTime);
    const onReadyRef = useRef(onReady);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    onTimeRef.current = onTime;
    onReadyRef.current = onReady;

    const videoId = parseVideoId(videoUrl);

    useEffect(() => {
      if (!videoId || !mountRef.current) return;
      let disposed = false;
      let player: YTPlayer | null = null;

      loadApi()
        .then((yt) => {
          if (disposed || !mountRef.current) return;
          player = new yt.Player(mountRef.current, {
            videoId,
            playerVars: {
              enablejsapi: 1,
              origin: window.location.origin,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
            },
            events: {
              onReady: () => {
                if (disposed) return;
                playerRef.current = player;
                setReady(true);
                onReadyRef.current?.();
                if (pendingSeek.current != null) {
                  player?.seekTo(pendingSeek.current, true);
                  pendingSeek.current = null;
                }
              },
            },
          });
        })
        .catch(() => {
          if (!disposed) setFailed(true);
        });

      return () => {
        disposed = true;
        playerRef.current = null;
        setReady(false);
        try {
          player?.destroy();
        } catch {
          // the iframe is already gone
        }
      };
    }, [videoId]);

    useEffect(() => {
      if (!ready) return;
      const handle = window.setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
          onTimeRef.current?.(player.getCurrentTime());
        } catch {
          // player torn down mid tick
        }
      }, 500);
      return () => window.clearInterval(handle);
    }, [ready]);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        const player = playerRef.current;
        if (player) {
          try {
            player.seekTo(Math.max(0, time), true);
            return;
          } catch {
            // fall through to queue
          }
        }
        pendingSeek.current = Math.max(0, time);
      },
      getTime: () => {
        const player = playerRef.current;
        if (!player) return 0;
        try {
          return player.getCurrentTime();
        } catch {
          return 0;
        }
      },
    }));

    if (!videoId) {
      return (
        <div className="aspect-video bg-muted flex items-center justify-center rounded-xl">
          <p className="text-muted-foreground text-sm">Invalid or unsupported video URL</p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
        <div ref={mountRef} className="absolute inset-0 h-full w-full" aria-label={title} />
        {!ready && !failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground">Loading player…</p>
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground px-6 text-center">
              The player could not load. An extension may be blocking youtube.com.
            </p>
          </div>
        )}
      </div>
    );
  },
);
