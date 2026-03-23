"use client";

import { TranscriptItem } from "@/lib/types";

interface TranscriptTabProps {
  transcript: TranscriptItem[];
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TranscriptTab({ transcript, onSeek }: TranscriptTabProps) {
  return (
    <div className="h-full overflow-y-auto pr-2 space-y-1">
      {transcript.map((item) => (
        <button
          key={item.id}
          onClick={() => onSeek(item.time)}
          className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors group"
        >
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-mono">
            {formatTime(item.time)}
          </span>
          <p className="text-sm text-foreground mt-1 leading-relaxed">
            {item.text}
          </p>
        </button>
      ))}
    </div>
  );
}
