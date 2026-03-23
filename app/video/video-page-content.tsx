"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VideoAnalysis } from "@/lib/types";
import { VideoContent } from "@/components/video/video-content";
import { VideoSkeleton } from "@/components/video/video-skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function VideoPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";

  const [data, setData] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!url) {
        setError("No video URL provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/analyze?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error("Failed to analyze video");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalysis();
  }, [url]);

  if (isLoading) {
    return <VideoSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-destructive/10 text-destructive rounded-full p-4 mb-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No data available</p>
        <Link href="/" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return <VideoContent data={data} />;
}
