"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, Calendar, Play } from "lucide-react";
import type { VideoHistoryItem } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { readVideos, readProgress, toggleFavorite } from "@/lib/storage";

function formatRelativeTime(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function VideoCard({
  video,
  onToggleFavorite,
}: {
  video: VideoHistoryItem;
  onToggleFavorite: (videoId: string) => void;
}) {
  const resumed = typeof window !== "undefined" ? readProgress(video.videoId) : 0;
  const href = `/video?url=${encodeURIComponent(video.videoUrl)}${
    resumed > 10 ? `&t=${Math.floor(resumed)}` : ""
  }`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-lg">
      <Link href={href}>
        <div className="relative aspect-video bg-muted">
          {video.thumbnailUrl && (
            <Image
              src={video.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          {video.duration > 0 && (
            <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
              {formatTime(video.duration)}
            </div>
          )}
          {resumed > 10 && video.duration > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/40">
              <div
                className="h-full bg-red-500"
                style={{ width: `${Math.min(100, (resumed / video.duration) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onToggleFavorite(video.videoId);
        }}
        className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 transition-colors hover:bg-black/60"
        aria-label={video.isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          className={video.isFavorite ? "size-4 fill-yellow-400 text-yellow-400" : "size-4 text-white"}
        />
      </button>

      <div className="space-y-1.5 p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug hover:text-foreground/80">
            {video.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatRelativeTime(video.watchedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Play className="size-3" />
            {video.highlightsCount} moments
          </span>
        </div>
      </div>
    </div>
  );
}

export function VideosPageContent() {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [videos, setVideos] = useState<VideoHistoryItem[]>([]);

  useEffect(() => {
    setVideos(readVideos());
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return videos
      .filter((video) => !favoritesOnly || video.isFavorite)
      .filter(
        (video) =>
          !needle ||
          video.title.toLowerCase().includes(needle) ||
          video.channelName.toLowerCase().includes(needle),
      );
  }, [videos, query, favoritesOnly]);

  function handleToggleFavorite(videoId: string) {
    setVideos(toggleFavorite(videoId));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">My videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Videos you have opened, with the moment you stopped at. History lives in this browser.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your videos…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setFavoritesOnly((value) => !value)}
          className={
            favoritesOnly
              ? "flex h-10 items-center gap-1.5 rounded-lg border border-yellow-400 bg-yellow-50 px-3 text-xs text-yellow-700"
              : "flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
          }
        >
          <Star className={favoritesOnly ? "size-3.5 fill-yellow-400 text-yellow-400" : "size-3.5"} />
          Favorites
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <VideoCard key={video.videoId} video={video} onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 size-7 text-muted-foreground" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {videos.length === 0
              ? "No videos yet. Analysis starts the moment you open one."
              : favoritesOnly
                ? "Nothing starred yet."
                : "No video matches that search."}
          </p>
          {videos.length === 0 && (
            <Link href="/" className="mt-3 text-sm underline underline-offset-2">
              Open a video
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
