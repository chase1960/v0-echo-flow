"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TranscriptItem } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { Search, X, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptTabProps {
  transcript: TranscriptItem[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

/**
 * The transcript is the fallback map: every line is a coordinate. Each row
 * carries its own timestamp now (the old build showed text with no way back),
 * and rows are rendered with content-visibility so a three hour video does not
 * put a thousand nodes in the layout path.
 */
export function TranscriptTab({ transcript, currentTime, onSeek }: TranscriptTabProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [auto, setAuto] = useState(true);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const activeIndex = useMemo(() => {
    if (!transcript.length) return -1;
    let index = 0;
    for (let position = 0; position < transcript.length; position += 1) {
      if (transcript[position]!.time <= currentTime + 0.5) index = position;
      else break;
    }
    return index;
  }, [transcript, currentTime]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transcript
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !needle || item.text.toLowerCase().includes(needle));
  }, [transcript, query]);

  useEffect(() => {
    if (!auto || query) return;
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex, auto, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => {
            setSearchOpen((open) => !open);
            if (searchOpen) setQuery("");
          }}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Search the transcript"
        >
          <Search className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setAuto((value) => !value)}
          aria-pressed={auto}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
            auto ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
          )}
        >
          <AlignLeft className="size-3" />
          Follow playhead
        </button>

        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
          {rows.length} / {transcript.length}
        </span>
      </div>

      {searchOpen && (
        <div className="relative mb-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a phrase in this video…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-2 pr-7 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        {!transcript.length ? (
          <p className="py-6 text-sm text-muted-foreground">
            No timed captions were found for this video.
          </p>
        ) : (
          <div className="space-y-0.5">
            {rows.map(({ item, index }) => (
              <button
                key={item.id}
                ref={index === activeIndex ? activeRef : undefined}
                type="button"
                onClick={() => onSeek(item.time)}
                className={cn(
                  "flex w-full gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors",
                  index === activeIndex ? "bg-muted" : "hover:bg-muted/40",
                )}
                style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}
              >
                <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {formatTime(item.time)}
                </span>
                <span
                  className={cn(
                    "text-[13px] leading-relaxed",
                    index === activeIndex ? "text-foreground" : "text-foreground/70",
                  )}
                >
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
