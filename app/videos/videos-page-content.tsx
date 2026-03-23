"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, Calendar } from "lucide-react";
import type { VideoHistoryItem } from "@/lib/types";

// Mock data for video history
const mockVideos: VideoHistoryItem[] = [
  {
    id: "1",
    videoId: "abc123",
    videoUrl: "https://www.youtube.com/watch?v=abc123",
    title: "Pourquoi l'or a atteint un sommet historique",
    channelName: "Les Echos",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 272,
    watchedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    highlightsCount: 4,
    isFavorite: false,
  },
  {
    id: "2",
    videoId: "def456",
    videoUrl: "https://www.youtube.com/watch?v=def456",
    title: "Andrew Ng: Building Faster with AI",
    channelName: "Y Combinator",
    thumbnailUrl: "https://img.youtube.com/vi/jGwO_UgTS7I/maxresdefault.jpg",
    duration: 2637,
    watchedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    highlightsCount: 5,
    isFavorite: true,
  },
  {
    id: "3",
    videoId: "ghi789",
    videoUrl: "https://www.youtube.com/watch?v=ghi789",
    title: "Inside ChatGPT: The fastest growing product in history | Nick Turley (OpenAI)",
    channelName: "Lenny's Podcast",
    thumbnailUrl: "https://img.youtube.com/vi/L_Guz73e6fw/maxresdefault.jpg",
    duration: 5738,
    watchedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    highlightsCount: 0,
    isFavorite: false,
  },
  {
    id: "4",
    videoId: "jkl012",
    videoUrl: "https://www.youtube.com/watch?v=jkl012",
    title: "How to Start a Startup - Sam Altman",
    channelName: "Y Combinator",
    thumbnailUrl: "https://img.youtube.com/vi/CBYhVcO4WgI/maxresdefault.jpg",
    duration: 2890,
    watchedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    highlightsCount: 8,
    isFavorite: true,
  },
  {
    id: "5",
    videoId: "mno345",
    videoUrl: "https://www.youtube.com/watch?v=mno345",
    title: "The Future of AI - Fireside Chat",
    channelName: "TED",
    thumbnailUrl: "https://img.youtube.com/vi/Sqvd-9qGG7A/maxresdefault.jpg",
    duration: 1845,
    watchedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    highlightsCount: 3,
    isFavorite: false,
  },
];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

interface VideoCardProps {
  video: VideoHistoryItem;
  onToggleFavorite: (id: string) => void;
}

function VideoCard({ video, onToggleFavorite }: VideoCardProps) {
  return (
    <div className="group relative bg-background rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <Link href={`/video?url=${encodeURIComponent(video.videoUrl)}`}>
        <div className="relative aspect-video bg-muted">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>
      
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(video.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
      >
        <Star
          className={`size-4 ${
            video.isFavorite
              ? "fill-yellow-400 text-yellow-400"
              : "text-white"
          }`}
        />
      </button>

      {/* Info */}
      <div className="p-4 space-y-2">
        <Link href={`/video?url=${encodeURIComponent(video.videoUrl)}`}>
          <h3 className="font-medium text-foreground line-clamp-2 hover:text-foreground/80 transition-colors">
            {video.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground">{video.channelName}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>{formatRelativeTime(video.watchedAt)}</span>
          </div>
          <span>{video.highlightsCount} highlights</span>
        </div>
      </div>
    </div>
  );
}

export function VideosPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [videos, setVideos] = useState<VideoHistoryItem[]>(mockVideos);

  const filteredVideos = useMemo(() => {
    let result = videos;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((v) => v.isFavorite);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.channelName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [videos, searchQuery, showFavoritesOnly]);

  const handleToggleFavorite = (id: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, isFavorite: !v.isFavorite } : v
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">My Videos</h1>
        <p className="mt-2 text-muted-foreground">
          Your analyzed videos are saved here. Click on any video to continue where you left off.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 h-12 px-4 rounded-xl border transition-colors ${
            showFavoritesOnly
              ? "border-yellow-400 bg-yellow-50 text-yellow-700"
              : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20"
          }`}
        >
          <Star
            className={`size-4 ${
              showFavoritesOnly ? "fill-yellow-400 text-yellow-400" : ""
            }`}
          />
          <span className="text-sm font-medium">Favorites</span>
        </button>
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No videos found
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {showFavoritesOnly
              ? "You haven't favorited any videos yet. Click the star icon on a video to add it to your favorites."
              : "Try adjusting your search query or analyze a new video to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
