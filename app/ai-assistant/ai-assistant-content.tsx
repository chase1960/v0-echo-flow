"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, Video, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ApiResponse {
  result?: string;
  error?: string;
  [key: string]: unknown;
}

export function AIAssistantContent() {
  const [videoUrl, setVideoUrl] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("https://psj946698b.coze.site/run", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl.trim(),
          subtitle: {},
          video_title: {},
          video_author: {},
          video_cover: {},
          user_query: userQuery.trim() || "帮我总结这个视频",
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Try to parse result if it's a JSON string
      let parsedResult = data.result || JSON.stringify(data, null, 2);
      
      if (typeof parsedResult === "string") {
        try {
          const parsed = JSON.parse(parsedResult);
          parsedResult = typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : parsed;
        } catch {
          // Not JSON, use as-is
        }
      }

      setResult(parsedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 mb-4">
          <Sparkles className="size-8 text-rose-500" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">
          AI Video Assistant
        </h1>
        <p className="text-muted-foreground">
          Enter a Bilibili video link to get AI-powered summaries and answers
        </p>
      </div>

      {/* Input Card */}
      <Card className="mb-6 shadow-lg border-0 bg-card/80 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          {/* Video URL Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Video className="size-4 text-muted-foreground" />
              Video URL
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste Bilibili video link here..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Question Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="size-4 text-muted-foreground" />
              Your Question
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask a question about the video, or leave empty for a summary..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !videoUrl.trim()}
            className="w-full py-6 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white font-medium text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="size-5 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-rose-50/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-rose-500" />
              Analysis Result
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none max-h-[500px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {result}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {!result && !error && !isLoading && (
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Tip: You can ask questions like:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {["What are the key points?", "Summarize in bullet points", "What is the main conclusion?"].map((tip) => (
              <button
                key={tip}
                onClick={() => setUserQuery(tip)}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-accent text-foreground text-xs transition-colors"
              >
                {tip}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
