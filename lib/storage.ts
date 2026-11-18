"use client";

import type { Note, VideoHistoryItem, VideoNoteGroup } from "./types";
import { thumbnailUrl, parseVideoId } from "./youtube";

/**
 * One store, one schema.
 *
 * The broken build wrote notes to `notes-<videoId>` and read them back from a
 * different `notes` key, so notes taken while watching never appeared on the
 * notes page and looked lost. Everything now lives under a versioned namespace,
 * and `migrate()` carries over whatever the old keys still hold.
 */

const NOTES = "ech:notes:v1";
const VIDEOS = "ech:videos:v1";
const PROGRESS = "ech:progress:v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or private mode: the page still works without persistence
  }
}

export function readGroups(): VideoNoteGroup[] {
  migrate();
  return readJson<VideoNoteGroup[]>(NOTES, []).filter(
    (group) => group && Array.isArray(group.notes),
  );
}

export function readProgress(videoId: string): number {
  const map = readJson<Record<string, number>>(PROGRESS, {});
  return map[videoId] ?? 0;
}

export function saveProgress(videoId: string, seconds: number): void {
  const map = readJson<Record<string, number>>(PROGRESS, {});
  map[videoId] = Math.max(0, Math.floor(seconds));
  writeJson(PROGRESS, map);
}

export function upsertNote(
  video: { videoId: string; videoTitle: string; channelName: string; duration: number },
  note: Note,
): VideoNoteGroup[] {
  const groups = readGroups();
  const index = groups.findIndex((group) => group.videoId === video.videoId);
  const thumbnail = thumbnailUrl(video.videoId);

  if (index >= 0) {
    const existing = groups[index]!;
    existing.notes = [note, ...existing.notes.filter((item) => item.id !== note.id)];
    existing.videoTitle = video.videoTitle || existing.videoTitle;
    existing.duration = video.duration || existing.duration;
  } else {
    groups.unshift({
      videoId: video.videoId,
      videoTitle: video.videoTitle,
      channelName: video.channelName,
      thumbnailUrl: thumbnail,
      duration: video.duration,
      notes: [note],
    });
  }
  writeJson(NOTES, groups);
  return groups;
}

export function removeNote(videoId: string, noteId: string): VideoNoteGroup[] {
  const groups = readGroups()
    .map((group) =>
      group.videoId === videoId
        ? { ...group, notes: group.notes.filter((note) => note.id !== noteId) }
        : group,
    )
    .filter((group) => group.notes.length > 0);
  writeJson(NOTES, groups);
  return groups;
}

export function readVideos(): VideoHistoryItem[] {
  return readJson<VideoHistoryItem[]>(VIDEOS, []);
}

export function recordVideo(item: Omit<VideoHistoryItem, "id" | "watchedAt">): VideoHistoryItem[] {
  const existing = readVideos();
  const previous = existing.find((video) => video.videoId === item.videoId);
  const next: VideoHistoryItem[] = [
    {
      ...item,
      id: item.videoId,
      watchedAt: Date.now(),
      // re-opening a video must not silently clear a bookmark
      isFavorite: previous?.isFavorite ?? item.isFavorite,
    },
    ...existing.filter((video) => video.videoId !== item.videoId),
  ].slice(0, 60);
  writeJson(VIDEOS, next);
  return next;
}

export function toggleFavorite(videoId: string): VideoHistoryItem[] {
  const next = readVideos().map((video) =>
    video.videoId === videoId ? { ...video, isFavorite: !video.isFavorite } : video,
  );
  writeJson(VIDEOS, next);
  return next;
}

/** Import what the old build scattered across `notes` and `notes-<videoId>`. */
function migrate(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(NOTES)) return;

  const groups: VideoNoteGroup[] = [];
  try {
    const legacyGroups = window.localStorage.getItem("notes");
    if (legacyGroups) {
      const parsed = JSON.parse(legacyGroups) as VideoNoteGroup[];
      if (Array.isArray(parsed)) {
        for (const group of parsed) {
          if (!group?.videoId || !Array.isArray(group.notes)) continue;
          groups.push({
            videoId: group.videoId,
            videoTitle: group.videoTitle ?? "Untitled video",
            channelName: group.channelName ?? "",
            thumbnailUrl: group.thumbnailUrl || thumbnailUrl(group.videoId),
            duration: group.duration ?? 0,
            notes: group.notes.map(normalizeNote),
          });
        }
      }
    }
  } catch {
    // ignore a corrupt legacy blob rather than blocking the new store
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("notes-")) continue;
    const videoId = key.slice("notes-".length);
    if (!videoId || groups.some((group) => group.videoId === videoId)) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as Note[];
      if (!Array.isArray(parsed) || !parsed.length) continue;
      groups.push({
        videoId,
        videoTitle: "Untitled video",
        channelName: "",
        thumbnailUrl: thumbnailUrl(videoId),
        duration: 0,
        notes: parsed.map(normalizeNote),
      });
    } catch {
      // skip
    }
  }

  if (groups.length) writeJson(NOTES, groups);
}

function normalizeNote(raw: Note & { timestamp?: number }): Note {
  const at = typeof raw.at === "number" ? raw.at : raw.timestamp;
  return {
    id: raw.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content: String(raw.content ?? ""),
    at: typeof at === "number" ? at : undefined,
    anchorId: raw.anchorId,
    createdAt: raw.createdAt ?? Date.now(),
    type: raw.type ?? "custom",
  };
}

export function videoIdFromUrl(url: string): string {
  return parseVideoId(url) ?? "unknown";
}
