"use client";

import { Highlight } from "@/lib/types";

interface HighlightsListProps {
  highlights: Highlight[];
  onSeek: (time: number) => void;
  onAddNote?: (highlight: Highlight) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HighlightsList({
  highlights,
  onSeek,
}: HighlightsListProps) {
  return (
    <div className="space-y-1">
      {highlights.map((highlight) => (
        <button
          key={highlight.id}
          onClick={() => onSeek(highlight.time)}
          className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-accent/30 rounded-lg transition-colors group text-left"
        >
          {/* Color Dot */}
          <div
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: highlight.color }}
          />
          
          {/* Title */}
          <span className="flex-1 text-sm text-foreground group-hover:text-foreground/80 transition-colors">
            {highlight.title}
          </span>
          
          {/* Time */}
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatTime(highlight.time)}
          </span>
        </button>
      ))}
    </div>
  );
}
