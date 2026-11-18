/**
 * EchoFlow data model.
 *
 * The unit of value is an *anchor*, not a summary paragraph. Every anchor is a
 * jumpable moment that carries (a) a verbatim quote so the claim is
 * verifiable, (b) a time range so the learner can go back to it, and (c) a
 * `why` line so they know what to look for before they jump. A summary without
 * a timestamp is a dead end for someone studying a two hour video.
 */

export interface TranscriptItem {
  id: string;
  /** seconds */
  time: number;
  /** seconds; caption cue duration when known */
  duration: number;
  text: string;
}

/** A semantically coherent span of the video: the unit of retrieval. */
export interface EventSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  /** keyword fingerprint, used by the lexical retriever */
  terms: string[];
}

export type AnchorKind =
  | "claim"
  | "definition"
  | "step"
  | "example"
  | "data"
  | "counterpoint";

export interface Anchor {
  id: string;
  start: number;
  end: number;
  title: string;
  /** one sentence: why this moment matters, read before jumping in */
  why: string;
  kind: AnchorKind;
  /** verbatim words from the transcript, the thing the learner verifies */
  quote: string;
  /** optional on-screen cue, e.g. "slide: 4-step comparison table" */
  visual: string;
  /** ids of anchors that should be understood first */
  dependsOn: string[];
  /** model or heuristic confidence, always surfaced, never hidden */
  confidence: number;
  color: string;
}

export interface Citation {
  anchorId: string;
  start: number;
  end: number;
  quote: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  /** false means the answer could not be tied to any moment in this video */
  grounded?: boolean;
}

export interface Note {
  id: string;
  content: string;
  /** seconds into the video: the coordinate that makes a note retrievable */
  at?: number;
  anchorId?: string;
  createdAt: number;
  type?: "custom" | "chat" | "transcript" | "takeaway";
}

export interface VideoNoteGroup {
  videoId: string;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number;
  notes: Note[];
}

export interface VideoHistoryItem {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number;
  watchedAt: number;
  highlightsCount: number;
  isFavorite: boolean;
}

/** live = model built · heuristic = real transcript, no model · demo = seed */
export type AnalysisSource = "live" | "heuristic" | "demo";

export interface PipelineInfo {
  transcript: "youtube-captions" | "none";
  segmentation: "semantic-events" | "none";
  model: string | null;
  segments: number;
  ms: number;
  cached: boolean;
}

export interface AnalysisBundle {
  videoId: string;
  title: string;
  videoUrl: string;
  /** real duration when known, 0 when unknown */
  duration: number;
  summary: string;
  anchors: Anchor[];
  segments: EventSegment[];
  transcript: TranscriptItem[];
  source: AnalysisSource;
  pipeline: PipelineInfo;
  /** set when the pipeline degraded; the UI must say so out loud */
  notice?: string;
}

export type AnalyzeEvent =
  | {
      type: "stage";
      stage: "transcript" | "segments" | "anchors" | "graph";
      status: "start" | "done";
      detail?: string;
    }
  | { type: "meta"; title: string; duration: number; source: AnalysisSource }
  | { type: "anchor"; anchor: Anchor }
  | { type: "transcript"; items: TranscriptItem[] }
  | { type: "done"; bundle: AnalysisBundle }
  | { type: "error"; message: string };
