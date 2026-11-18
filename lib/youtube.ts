/**
 * Single source of truth for anything YouTube shaped: url parsing, ids,
 * thumbnails and time formatting. Three copies of this regex used to live in
 * three components; they drifted and produced different ids for the same link.
 */

const ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

function cleanId(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const value = candidate.split("&")[0]?.split("?")[0] ?? "";
  return ID_RE.test(value) ? value : null;
}

export function parseVideoId(raw: string): string | null {
  const input = (raw ?? "").trim();
  if (!input) return null;
  if (ID_RE.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") return cleanId(url.pathname.slice(1));
  if (!host.endsWith("youtube.com") && !host.endsWith("youtube-nocookie.com")) {
    return null;
  }

  const fromQuery = cleanId(url.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const fromPath = url.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  return fromPath ? cleanId(fromPath[1]) : null;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function thumbnailUrl(videoId: string, quality: "mq" | "hq" | "max" = "hq"): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/** `74` -> `1:14`, `4715` -> `1:18:35` */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return hours > 0
    ? `${hours}:${mm}:${String(secs).padStart(2, "0")}`
    : `${mm}:${String(secs).padStart(2, "0")}`;
}
