"use client";

import type { Anchor } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { CornerUpLeft, PenLine } from "lucide-react";

interface AnchorListProps {
  anchors: Anchor[];
  activeId?: string;
  onSeek: (seconds: number) => void;
  onNote: (anchor: Anchor) => void;
}

const KIND_LABEL: Record<Anchor["kind"], string> = {
  claim: "Claim",
  definition: "Definition",
  step: "Step",
  example: "Example",
  data: "Data",
  counterpoint: "Counterpoint",
};

/**
 * Anchor cards. Each one shows the quote verbatim before the takeaway, because
 * the learner's first question is "says who?" — and pinning confidence on the
 * card keeps the honest uncertainty visible instead of hiding it in a tooltip.
 */
export function AnchorList({ anchors, activeId, onSeek, onNote }: AnchorListProps) {
  if (!anchors.length) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-6">
        No moment passed verification for this video. Nothing here is invented to fill the space.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {anchors.map((anchor) => {
        const active = anchor.id === activeId;
        const lowConfidence = anchor.confidence < 0.5;
        return (
          <article
            key={anchor.id}
            className={cn(
              "group rounded-xl border p-3.5 transition-colors",
              active ? "border-foreground/25 bg-muted/40" : "border-border hover:bg-muted/25",
            )}
          >
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => onSeek(anchor.start)}
                className="shrink-0 rounded-md bg-foreground px-1.5 py-1 text-[11px] font-medium tabular-nums text-background hover:bg-foreground/90"
                aria-label={`Jump to ${formatTime(anchor.start)}`}
              >
                {formatTime(anchor.start)}
              </button>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium leading-snug text-foreground">{anchor.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {KIND_LABEL[anchor.kind]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      lowConfidence
                        ? "bg-amber-100 text-amber-800"
                        : "bg-muted text-muted-foreground",
                    )}
                    title="Confidence reported by the model. Low confidence means check the quote yourself."
                  >
                    {lowConfidence ? "low " : ""}
                    {Math.round(anchor.confidence * 100)}%
                  </span>
                  {anchor.visual && (
                    <span className="rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      On screen: {anchor.visual}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNote(anchor)}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                aria-label={`Add a note at ${formatTime(anchor.start)}`}
              >
                <PenLine className="size-3.5" />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{anchor.why}</p>

            <blockquote className="mt-2 border-l-2 pl-2.5 text-[13px] leading-relaxed text-muted-foreground italic">
              “{anchor.quote}”
            </blockquote>

            {anchor.dependsOn.length > 0 && (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CornerUpLeft className="size-3" />
                Builds on{" "}
                {anchor.dependsOn
                  .map((id) => {
                    const parent = anchors.find((candidate) => candidate.id === id);
                    return parent ? formatTime(parent.start) : id;
                  })
                  .join(", ")}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
