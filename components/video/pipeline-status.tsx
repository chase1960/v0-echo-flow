"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageName = "transcript" | "segments" | "anchors" | "graph";

export interface StageState {
  status: "idle" | "start" | "done";
  detail?: string;
}

const LABELS: Record<StageName, string> = {
  transcript: "Captions",
  segments: "Semantic events",
  anchors: "Marking moments",
  graph: "Linking anchors",
};

/**
 * Pipeline visibility. The learner is waiting on a model, so the interface
 * reports which phase is running instead of pretending with a spinner, and
 * anchors arrive one by one rather than all at the end.
 */
export function PipelineStatus({ stages }: { stages: Record<StageName, StageState> }) {
  const names = Object.keys(LABELS) as StageName[];

  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      {names.map((name) => {
        const state = stages[name];
        const done = state?.status === "done";
        const running = state?.status === "start";
        return (
          <li key={name} className="flex items-center gap-1.5">
            {done ? (
              <Check className="size-3 text-emerald-600" />
            ) : running ? (
              <Loader2 className="size-3 animate-spin text-foreground" />
            ) : (
              <span className="size-1.5 rounded-full bg-border" />
            )}
            <span className={cn(done && "text-foreground", running && "text-foreground")}>
              {LABELS[name]}
            </span>
            {state?.detail && <span className="tabular-nums">· {state.detail}</span>}
          </li>
        );
      })}
    </ol>
  );
}
