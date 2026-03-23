"use client";

import { useState } from "react";
import { TranscriptItem } from "@/lib/types";
import { Search, Eye, Download } from "lucide-react";

interface TranscriptTabProps {
  transcript: TranscriptItem[];
  onSeek: (time: number) => void;
}

export function TranscriptTab({ transcript, onSeek }: TranscriptTabProps) {
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
        {/* Active indicator dot */}
        <div className="size-2.5 rounded-full bg-red-400" />
        
        {/* Search button */}
        <button className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground">
          <Search className="size-4" />
        </button>
        
        {/* Auto toggle */}
        <button
          onClick={() => setIsAutoScroll(!isAutoScroll)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isAutoScroll
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="size-3.5" />
          Auto
        </button>
        
        {/* Export button */}
        <button className="flex items-center gap-1.5 ml-auto px-3 py-1.5 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
          <Download className="size-3.5" />
          Export
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-[10px] font-semibold">
            PRO
          </span>
        </button>
      </div>

      {/* Transcript content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {transcript.map((item) => (
          <button
            key={item.id}
            onClick={() => onSeek(item.time)}
            className="w-full text-left group"
          >
            <p className="text-sm text-foreground leading-relaxed hover:text-muted-foreground transition-colors">
              {item.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
