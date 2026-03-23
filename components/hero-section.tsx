"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Sparkles, ArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setIsLoading(true);

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Navigate to analysis page with the URL
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLucky = () => {
    // Set a demo YouTube URL
    setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  };

  return (
    <div className="flex flex-col items-center justify-center px-4">
      {/* Title */}
      <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3 tracking-tight">
        LongCut
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-base md:text-lg mb-8">
        The best way to learn from long videos.
      </p>

      {/* Input Card */}
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 transition-shadow hover:shadow-md">
          {/* Input Row */}
          <div className="flex items-center gap-3">
            <Link2 className="size-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste Youtube URL link here..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
              disabled={isLoading}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              onClick={handleLucky}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {"I'm feeling lucky"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !url.trim()}
              className={cn(
                "flex items-center justify-center size-9 rounded-full transition-all",
                url.trim() && !isLoading
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <p className="text-muted-foreground text-sm mt-4 animate-pulse">
          Analyzing video...
        </p>
      )}
    </div>
  );
}
