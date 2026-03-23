import { Suspense } from "react";
import { Header } from "@/components/header";
import { VideoPageContent } from "./video-page-content";
import { VideoSkeleton } from "@/components/video/video-skeleton";

export default function VideoPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 px-4 lg:px-6 pb-6">
        <Suspense fallback={<VideoSkeleton />}>
          <VideoPageContent />
        </Suspense>
      </div>
    </main>
  );
}
