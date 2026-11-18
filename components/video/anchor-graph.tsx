"use client";

import { useMemo } from "react";
import type { Anchor } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface AnchorGraphProps {
  anchors: Anchor[];
  duration: number;
  currentTime: number;
  activeId?: string;
  onSeek: (seconds: number) => void;
}

/**
 * The map of the video: every anchor placed at its real position, the playhead
 * following the player, and dependency arcs showing which moments build on
 * which. This is the component that carries the product's promise, so it is
 * driven by real timestamps instead of an estimated length.
 */
export function AnchorGraph({ anchors, duration, currentTime, activeId, onSeek }: AnchorGraphProps) {
  const total = useMemo(() => {
    const last = anchors.reduce((max, anchor) => Math.max(max, anchor.end), 0);
    return duration > 0 ? duration : Math.max(last + 60, 120);
  }, [anchors, duration]);

  const position = (seconds: number) => Math.min(100, Math.max(0, (seconds / total) * 100));
  const playhead = position(currentTime);

  const arcs = anchors.flatMap((anchor) =>
    anchor.dependsOn
      .map((parentId) => {
        const parent = anchors.find((candidate) => candidate.id === parentId);
        if (!parent) return null;
        return {
          id: `${parent.id}-${anchor.id}`,
          from: position(parent.start + (parent.end - parent.start) / 2),
          to: position(anchor.start),
        };
      })
      .filter((arc): arc is { id: string; from: number; to: number } => Boolean(arc)),
  );

  return (
    <div className="space-y-1.5">
      {arcs.length > 0 && (
        <div className="relative h-4">
          <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {arcs.map((arc) => (
              <line
                key={arc.id}
                x1={`${arc.from}%`}
                y1="100%"
                x2={`${arc.to}%`}
                y2="0%"
                stroke="currentColor"
                strokeWidth={1}
                className="text-border"
                strokeDasharray="3 3"
              />
            ))}
          </svg>
        </div>
      )}

      <div className="relative h-9 rounded-full bg-muted/40 px-1">
        <div className="absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/60" />

        {anchors.map((anchor) => {
          const left = position(anchor.start);
          const width = Math.max(position(anchor.end) - left, 1.6);
          const active = anchor.id === activeId;
          return (
            <button
              key={anchor.id}
              type="button"
              onClick={() => onSeek(anchor.start)}
              aria-label={`Jump to ${formatTime(anchor.start)}: ${anchor.title}`}
              className={cn(
                "absolute top-1/2 h-5 -translate-y-1/2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
                active ? "h-6 opacity-100" : "opacity-75 hover:opacity-100",
              )}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: anchor.color,
                boxShadow: active ? `0 0 0 2px var(--background), 0 0 0 3px ${anchor.color}` : undefined,
              }}
              title={`${formatTime(anchor.start)} · ${anchor.title}`}
            />
          );
        })}

        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-foreground/70"
          style={{ left: `${playhead}%` }}
        >
          <div className="absolute -top-0.5 -left-1 size-2 rounded-full bg-foreground" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{formatTime(currentTime)}</span>
        <span>
          {anchors.length} moments · {formatTime(total)}
        </span>
      </div>
    </div>
  );
}
