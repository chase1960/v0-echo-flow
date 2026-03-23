import { Suspense } from "react";
import { Header } from "@/components/header";
import { VideosPageContent } from "./videos-page-content";

export const metadata = {
  title: "My Videos - EchoFlow",
  description: "Your analyzed videos are saved here. Click on any video to continue where you left off.",
};

function VideosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-muted rounded-lg animate-pulse" />
      <div className="h-5 w-96 bg-muted rounded animate-pulse" />
      <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video bg-muted rounded-xl animate-pulse" />
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <Suspense fallback={<VideosSkeleton />}>
          <VideosPageContent />
        </Suspense>
      </main>
    </div>
  );
}
