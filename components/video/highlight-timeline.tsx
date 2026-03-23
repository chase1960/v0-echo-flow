"use client";

import { Highlight } from "@/lib/types";

interface HighlightTimelineProps {
  highlights: Highlight[];
  totalDuration: number; // in seconds
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HighlightTimeline({
  highlights,
  totalDuration,
  onSeek,
}: HighlightTimelineProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Key Moments
      </h3>
      
      {/* Timeline Bar */}
      <div className="relative">
        {/* Background Bar */}
        <div className="h-2 bg-muted rounded-full relative">
          {/* Highlight Dots */}
          {highlights.map((highlight) => {
            const position = (highlight.time / totalDuration) * 100;
            return (
              <button
                key={highlight.id}
                onClick={() => onSeek(highlight.time)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-background shadow-md hover:scale-125 transition-transform cursor-pointer z-10"
                style={{
                  left: `${position}%`,
                  backgroundColor: highlight.color,
                }}
                title={`${formatTime(highlight.time)} - ${highlight.title}`}
              />
            );
          })}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
