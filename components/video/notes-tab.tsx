"use client";

import { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface NotesTabProps {
  videoId: string;
  pendingNote?: string;
  onNoteClear?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NotesTab({ videoId, pendingNote, onNoteClear }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`notes-${videoId}`);
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, [videoId]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(`notes-${videoId}`, JSON.stringify(notes));
  }, [notes, videoId]);

  // Handle pending note from highlights
  useEffect(() => {
    if (pendingNote) {
      setInput(pendingNote);
      onNoteClear?.();
    }
  }, [pendingNote, onNoteClear]);

  const handleAddNote = () => {
    if (!input.trim()) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: input.trim(),
      createdAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setInput("");
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <div className="pb-4 border-b border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note..."
            rows={2}
            className="flex-1 bg-accent/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleAddNote}
            disabled={!input.trim()}
            className="px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No notes yet. Start taking notes about the video!
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group p-3 bg-accent/30 rounded-xl relative"
            >
              {note.timestamp && (
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(note.timestamp)}
                </span>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {note.content}
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">
                {new Date(note.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
