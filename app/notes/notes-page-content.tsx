"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Note, VideoNoteGroup } from "@/lib/types";
import { formatTime, watchUrl } from "@/lib/youtube";
import { readGroups, removeNote } from "@/lib/storage";
import { Search, ArrowUpDown, FileText, Trash2 } from "lucide-react";

type FilterType = "all" | "custom" | "chat" | "transcript" | "takeaway";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Notes page, reading the same store the player writes to.
 *
 * The old page rendered demo notes and then covered each thumbnail with an
 * opaque overlay; it also read a key the player never wrote, so real notes
 * seemed to vanish. This version shows the real store, says so when it is
 * empty, and turns every timestamp into a jump back into the video.
 */
export function NotesPageContent() {
  const [groups, setGroups] = useState<VideoNoteGroup[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    setGroups(readGroups());
  }, []);

  const total = useMemo(
    () => groups.reduce((count, group) => count + group.notes.length, 0),
    [groups],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map((group) => {
        const notes = group.notes
          .filter((note) => filter === "all" || (note.type ?? "custom") === filter)
          .filter(
            (note) =>
              !needle ||
              note.content.toLowerCase().includes(needle) ||
              group.videoTitle.toLowerCase().includes(needle),
          )
          .sort((left, right) =>
            sort === "recent" ? right.createdAt - left.createdAt : left.createdAt - right.createdAt,
          );
        return { ...group, notes };
      })
      .filter((group) => group.notes.length > 0);
  }, [groups, query, filter, sort]);

  function remove(videoId: string, noteId: string) {
    setGroups(removeNote(videoId, noteId));
  }

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Notes", value: "custom" },
    { label: "From chat", value: "chat" },
    { label: "From transcript", value: "transcript" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4">
      <h1 className="text-2xl font-medium tracking-tight">Notes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} notes across {groups.length} videos
      </p>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes or videos…"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-foreground/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={
              filter === item.value
                ? "rounded-full bg-foreground px-3 py-1 text-xs text-background"
                : "rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            }
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSort((value) => (value === "recent" ? "oldest" : "recent"))}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
        >
          <ArrowUpDown className="size-3.5" />
          {sort === "recent" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No notes yet. Open a video, take one from a moment, and it will show up here."
              : "Nothing matches this filter."}
          </p>
          {total === 0 && (
            <Link href="/" className="mt-3 inline-block text-sm underline underline-offset-2">
              Find a video
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((group) => (
            <section key={group.videoId} className="overflow-hidden rounded-xl border border-border">
              <header className="flex items-center gap-3 border-b border-border/60 p-3">
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {group.thumbnailUrl && (
                    <Image
                      src={group.thumbnailUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-sm font-medium">{group.videoTitle}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {group.notes.length} notes
                    {group.duration > 0 && ` · ${formatTime(group.duration)}`}
                  </p>
                </div>
                <Link
                  href={`/video?url=${encodeURIComponent(watchUrl(group.videoId))}`}
                  className="shrink-0 text-[11px] underline decoration-border underline-offset-2 hover:text-foreground"
                >
                  Open
                </Link>
              </header>

              <ul className="divide-y divide-border/60">
                {group.notes.map((note: Note) => (
                  <li key={note.id} className="group flex gap-2 p-3 transition-colors hover:bg-muted/25">
                    {typeof note.at === "number" ? (
                      <Link
                        href={`/video?url=${encodeURIComponent(watchUrl(group.videoId))}&t=${Math.floor(note.at)}`}
                        className="h-fit shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] tabular-nums hover:bg-accent"
                      >
                        {formatTime(note.at)}
                      </Link>
                    ) : (
                      <span className="h-fit shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        general
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{note.content}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {(note.type ?? "custom") === "custom" ? "note" : note.type} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(group.videoId, note.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
