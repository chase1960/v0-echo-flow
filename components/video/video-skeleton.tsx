"use client";

export function VideoSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)] animate-pulse">
      {/* Left Side - Video Area */}
      <div className="w-full lg:w-[60%] flex flex-col gap-4">
        {/* Video Player Skeleton */}
        <div className="aspect-video bg-muted rounded-xl" />
        <div className="h-6 w-3/4 bg-muted rounded" />

        {/* Timeline Skeleton */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="h-4 w-24 bg-muted rounded mb-3" />
          <div className="h-2 bg-muted rounded-full" />
        </div>

        {/* Highlights Skeleton */}
        <div className="bg-card border border-border rounded-xl p-4 flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-3" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="size-2 rounded-full bg-muted mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-12 bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Info Area */}
      <div className="w-full lg:w-[40%] flex flex-col">
        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-lg" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="bg-card border border-border rounded-xl p-4 flex-1">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-12 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
