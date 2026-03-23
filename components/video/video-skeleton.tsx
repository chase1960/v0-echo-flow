"use client";

export function VideoSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-4rem)] animate-pulse">
      {/* Left Side - Video Area */}
      <div className="w-full lg:w-[60%] flex flex-col p-4 lg:p-6">
        {/* Video Player Skeleton */}
        <div className="aspect-video bg-muted rounded-xl" />

        {/* Timeline Skeleton */}
        <div className="mt-4 h-6 bg-muted/30 rounded-full" />

        {/* Highlights Skeleton */}
        <div className="mt-3 flex-1 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-1">
              <div className="size-2.5 rounded-full bg-muted" />
              <div className="flex-1 h-4 bg-muted rounded" />
              <div className="w-10 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Info Area */}
      <div className="w-full lg:w-[40%] flex flex-col border-l border-border">
        {/* Tabs Skeleton */}
        <div className="flex items-center gap-2 p-4 pb-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-full" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 w-full bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
