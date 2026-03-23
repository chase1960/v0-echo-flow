export interface Highlight {
  id: string;
  time: number; // seconds
  title: string;
  summary: string;
  color: string;
}

export interface TranscriptItem {
  id: string;
  time: number; // seconds
  text: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
}

export interface VideoAnalysis {
  title: string;
  video_url: string;
  summary: string;
  highlights: Highlight[];
  questions: Question[];
  transcript: TranscriptItem[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp?: number;
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
