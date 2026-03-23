"use client";

import { Highlight } from "@/lib/types";
import { Play, Plus } from "lucide-react";

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
  onAddNote,
}: HighlightsListProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Key Insights
      </h3>
      
      <div className="space-y-3">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className="group flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            {/* Color Indicator */}
            <div
              className="size-2 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: highlight.color }}
            />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onSeek(highlight.time)}
                  className="text-left group/time"
                >
                  <span className="text-xs text-muted-foreground group-hover/time:text-foreground transition-colors">
                    {formatTime(highlight.time)}
                  </span>
                  <h4 className="text-sm font-medium text-foreground group-hover/time:text-primary transition-colors">
                    {highlight.title}
                  </h4>
                </button>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSeek(highlight.time)}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Play from here"
                  >
                    <Play className="size-3.5" />
                  </button>
                  {onAddNote && (
                    <button
                      onClick={() => onAddNote(highlight)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Add to notes"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {highlight.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
