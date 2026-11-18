"use client";

import { useMemo, useState } from "react";
import { Sparkles, Send, Loader2, Video, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AssistantResponse {
  result?: string;
  via?: string;
  error?: string;
}

/**
 * Server-proxied assistant.
 *
 * The previous version called a third party agent from the browser with a
 * NEXT_PUBLIC_ token, which any visitor could read out of the JS bundle. The
 * credential now lives only on the server, so this page can be shipped publicly.
 */
export function AIAssistantContent() {
  const [videoUrl, setVideoUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [via, setVia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!videoUrl.trim()) {
      setError("Paste a video link first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setVia(null);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoUrl: videoUrl.trim(), question: question.trim() }),
      });
      const data = (await response.json()) as AssistantResponse;
      if (!response.ok) {
        setError(data.error ?? `Request failed: ${response.status}`);
        return;
      }
      setResult(data.result ?? "(empty response)");
      setVia(data.via ?? null);
    } catch {
      setError("Network request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Video brief</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Ask for a summary of a YouTube lecture. The brief is assembled from verified moments,
          so every line still points at a timestamp you can watch.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Video className="size-3.5 text-muted-foreground" />
              Video link
            </label>
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              What do you want from it?
              <span className="text-[11px] text-muted-foreground">optional</span>
            </label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={2}
              placeholder="e.g. only the parts about pricing, or a list of claims I should check"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>

          <Button onClick={() => void submit()} disabled={loading || !videoUrl.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" /> Reading the video…
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-4" /> Get the brief
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <p className="text-sm leading-relaxed text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              <span>{via === "coze" ? "External agent" : "Anchors"}</span>
            </div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{result}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
