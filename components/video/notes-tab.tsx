"use client";

import { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface NotesTabProps {
  videoId: string;
  pendingNote?: string;
  onNoteClear?: () => void;
}

export function NotesTab({ videoId, pendingNote, onNoteClear }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
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
      setIsAdding(true);
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
    setIsAdding(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && !isAdding ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px] leading-relaxed">
              Your saved notes will appear here. Highlight transcript or chat text to take a note.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus className="size-4" />
              Add a note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Add Note Input */}
            {isAdding && (
              <div className="p-3 border border-border rounded-xl bg-muted/30">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your note..."
                  rows={3}
                  autoFocus
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setInput("");
                    }}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!input.trim()}
                    className="px-3 py-1.5 text-xs bg-foreground text-background rounded-lg disabled:opacity-50 hover:bg-foreground/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Notes List */}
            {notes.map((note) => (
              <div
                key={note.id}
                className="group p-3 border border-border rounded-xl relative hover:bg-muted/30 transition-colors"
              >
                <p className="text-sm text-foreground whitespace-pre-wrap pr-8">
                  {note.content}
                </p>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            {/* Add More Button */}
            {!isAdding && notes.length > 0 && (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="size-4" />
                Add another note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
