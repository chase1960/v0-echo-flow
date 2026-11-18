"use client";

import { useCallback, useEffect, useState } from "react";
import type { Note } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { readGroups, removeNote, upsertNote } from "@/lib/storage";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesTabProps {
  videoId: string;
  videoTitle: string;
  channelName: string;
  duration: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
  /** a note request coming from an anchor card */
  pending?: { at: number; text: string } | null;
  onPendingUsed?: () => void;
}

/**
 * Notes carry a timestamp by default, so they are actionable later rather than
 * a wall of text you cannot place. This list reads and writes the same store the
 * notes page uses, which is what makes notes taken while watching show up there.
 */
export function NotesTab({
  videoId,
  videoTitle,
  channelName,
  duration,
  currentTime,
  onSeek,
  pending,
  onPendingUsed,
}: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [at, setAt] = useState(currentTime);
  const [composing, setComposing] = useState(false);

  const refresh = useCallback(() => {
    const group = readGroups().find((item) => item.videoId === videoId);
    setNotes(group?.notes ?? []);
  }, [videoId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pending) return;
    setDraft(pending.text);
    setAt(pending.at);
    setComposing(true);
    onPendingUsed?.();
  }, [pending, onPendingUsed]);

  function save() {
    const content = draft.trim();
    if (!content) return;
    upsertNote(
      { videoId, videoTitle, channelName, duration },
      {
        id: `note-${Date.now()}`,
        content,
        at,
        createdAt: Date.now(),
        type: "custom",
      },
    );
    setDraft("");
    setComposing(false);
    refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {notes.length === 0 && !composing ? (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Nothing yet. Notes you take here are pinned to a timestamp and appear on the notes
            page too.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/25"
            >
              <div className="flex items-start gap-2">
                {typeof note.at === "number" ? (
                  <button
                    type="button"
                    onClick={() => onSeek(note.at as number)}
                    className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-foreground hover:bg-accent"
                  >
                    {formatTime(note.at)}
                  </button>
                ) : (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    general
                  </span>
                )}
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {note.content}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    removeNote(videoId, note.id);
                    refresh();
                  }}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {composing ? (
        <div className="mt-2 border-t border-border pt-2">
          <div className="mb-1.5 text-[11px] text-muted-foreground tabular-nums">
            Note at {formatTime(at)}
          </div>
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-[13px] outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder="What do you want to remember about this moment?"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setComposing(false);
                setDraft("");
              }}
              className={cn("rounded-full px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground")}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAt(currentTime);
            setComposing(true);
          }}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-border py-1.5 text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3" />
          Note at {formatTime(currentTime)}
        </button>
      )}
    </div>
  );
}
