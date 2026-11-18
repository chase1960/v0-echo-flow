"use client";

import { useState } from "react";
import type { Anchor, ChatMessage, Citation } from "@/lib/types";
import { formatTime } from "@/lib/youtube";
import { Send, ShieldQuestion } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ChatTabProps {
  videoId: string;
  videoUrl: string;
  anchors: Anchor[];
  onSeek: (seconds: number) => void;
}

interface ChatResponse {
  answer?: string;
  grounded?: boolean;
  citations?: Citation[];
  nearby?: string[];
  error?: string;
}

/**
 * Ask about the video.
 *
 * The answer is only allowed to stand on retrieved excerpts, and every excerpt
 * it used comes back as a citation chip that jumps to the moment. When nothing
 * matches, the UI says so plainly and offers the nearest real topics instead of
 * filling the gap with plausible text.
 */
export function ChatTab({ videoId, videoUrl, anchors, onSeek }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "What are the key takeaways?",
    ...anchors
      .slice(0, 2)
      .map((anchor) => `What does the video say at ${formatTime(anchor.start)}?`),
  ];

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: question.trim() },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId, question: question.trim(), url: videoUrl }),
      });
      const data = (await response.json()) as ChatResponse;

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer ?? data.error ?? "The request failed.",
          citations: data.citations ?? [],
          grounded: data.grounded ?? false,
        },
      ]);
      const nearby = data.nearby ?? [];
      if (nearby.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            role: "assistant",
            content: `Nearest real topics: ${nearby.join(" · ")}`,
            grounded: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Network request failed.",
          grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Answers are built only from this video&apos;s own passages, and every claim comes
              back as a timestamp you can jump to. If the video does not cover it, you get a
              refusal rather than a guess.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : message.grounded === false
                        ? "border border-border bg-muted/30 text-muted-foreground"
                        : "bg-muted text-foreground",
                  )}
                >
                  {message.grounded === false && (
                    <span className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShieldQuestion className="size-3" />
                      no grounded answer
                    </span>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                      {message.citations.map((citation, index) => (
                        <button
                          key={`${citation.start}-${index}`}
                          type="button"
                          onClick={() => onSeek(citation.start)}
                          title={citation.quote}
                          className="rounded-md bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-foreground underline decoration-border underline-offset-2 hover:bg-accent"
                        >
                          {formatTime(citation.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                  <Spinner className="size-4" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(input);
        }}
        className="mt-auto border-t border-border pt-3"
      >
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3.5 py-1.5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask something the video might answer…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-full bg-foreground p-1.5 text-background transition disabled:opacity-40"
            aria-label="Send question"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
