"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ArrowUpDown, Video, FileText, Trash2 } from "lucide-react";
import { Note, VideoNoteGroup } from "@/lib/types";
import Image from "next/image";

type FilterType = "all" | "chat" | "transcript" | "takeaway" | "custom";

// Mock data for demo - in production this would come from localStorage
const mockVideoNotes: VideoNoteGroup[] = [
  {
    videoId: "abc123",
    videoTitle: "Andrew Ng: Building Faster with AI",
    channelName: "Y Combinator",
    thumbnailUrl: "https://img.youtube.com/vi/abc123/mqdefault.jpg",
    duration: 2637, // 43:57
    notes: [
      {
        id: "1",
        content: "AI can help startups move 10x faster by automating repetitive tasks",
        timestamp: undefined,
        createdAt: Date.now() - 1000 * 60 * 30,
        type: "custom",
      },
      {
        id: "2",
        content: "Focus on building MVPs quickly and iterating based on user feedback",
        timestamp: undefined,
        createdAt: Date.now() - 1000 * 60 * 25,
        type: "custom",
      },
      {
        id: "3",
        content: "The most important thing is to ship fast and learn from real users",
        timestamp: 0,
        createdAt: Date.now() - 1000 * 60 * 20,
        type: "custom",
      },
    ],
  },
  {
    videoId: "def456",
    videoTitle: "How to Build a Successful SaaS Product",
    channelName: "SaaStr",
    thumbnailUrl: "https://img.youtube.com/vi/def456/mqdefault.jpg",
    duration: 1845, // 30:45
    notes: [
      {
        id: "4",
        content: "Product-market fit is the most critical milestone for any startup",
        timestamp: 125,
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        type: "chat",
      },
      {
        id: "5",
        content: "Customer feedback should drive your product roadmap",
        timestamp: 340,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 10,
        type: "transcript",
      },
    ],
  },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function NotesPageContent() {
  const [videoNotes, setVideoNotes] = useState<VideoNoteGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    // Try to load from localStorage first
    const savedNotes = localStorage.getItem("notes");
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        // Convert to VideoNoteGroup format if needed
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVideoNotes(parsed);
        } else {
          // Use mock data for demo
          setVideoNotes(mockVideoNotes);
        }
      } catch {
        setVideoNotes(mockVideoNotes);
      }
    } else {
      setVideoNotes(mockVideoNotes);
    }
  }, []);

  const totalNotes = useMemo(() => {
    return videoNotes.reduce((acc, group) => acc + group.notes.length, 0);
  }, [videoNotes]);

  const filteredVideoNotes = useMemo(() => {
    return videoNotes
      .map((group) => {
        // Filter notes by type and search query
        const filteredNotes = group.notes.filter((note) => {
          const matchesFilter =
            activeFilter === "all" || note.type === activeFilter;
          const matchesSearch =
            searchQuery === "" ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.videoTitle.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesFilter && matchesSearch;
        });

        // Sort notes
        const sortedNotes = [...filteredNotes].sort((a, b) => {
          return sortOrder === "recent"
            ? b.createdAt - a.createdAt
            : a.createdAt - b.createdAt;
        });

        return { ...group, notes: sortedNotes };
      })
      .filter((group) => group.notes.length > 0);
  }, [videoNotes, activeFilter, searchQuery, sortOrder]);

  const handleDeleteNote = (videoId: string, noteId: string) => {
    setVideoNotes((prev) =>
      prev
        .map((group) => {
          if (group.videoId === videoId) {
            return {
              ...group,
              notes: group.notes.filter((note) => note.id !== noteId),
            };
          }
          return group;
        })
        .filter((group) => group.notes.length > 0)
    );
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Chat", value: "chat" },
    { label: "Transcript", value: "transcript" },
    { label: "Takeaways", value: "takeaway" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
        My Notes
      </h1>
      <p className="text-muted-foreground mb-8">
        {totalNotes} notes saved from your videos
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search notes or videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Filter:</span>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeFilter === filter.value
                  ? "bg-foreground text-background"
                  : "text-blue-500 hover:bg-accent"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "recent" ? "oldest" : "recent"))
          }
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowUpDown className="size-4" />
          {sortOrder === "recent" ? "Most Recent" : "Oldest First"}
        </button>
      </div>

      {/* Video Groups */}
      {filteredVideoNotes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideoNotes.map((group) => (
            <div
              key={group.videoId}
              className="border border-border rounded-xl overflow-hidden"
            >
              {/* Video Header */}
              <div className="p-4 flex items-start gap-4 border-b border-border/50">
                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={group.thumbnailUrl}
                    alt={group.videoTitle}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Video className="size-6 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-1">
                    {group.videoTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {group.channelName}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="size-3.5" />
                      {formatDuration(group.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="size-3.5" />
                      {group.notes.length} notes
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes List */}
              <div className="divide-y divide-border/50">
                {group.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 hover:bg-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-medium uppercase bg-muted rounded">
                        {note.type || "custom"}
                      </span>
                      {note.timestamp !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(note.timestamp)}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteNote(group.videoId, note.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-start">
                      <div className="w-0.5 h-full bg-muted-foreground/30 mr-3 self-stretch" />
                      <p className="text-foreground flex-1">{note.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-3.5">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
