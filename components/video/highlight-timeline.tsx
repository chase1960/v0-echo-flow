"use client";

import { Highlight } from "@/lib/types";

interface HighlightTimelineProps {
  highlights: Highlight[];
  totalDuration: number; // in seconds
  onSeek: (time: number) => void;
}

// 定义彩色段的颜色
const segmentColors = [
  "#FCA5A5", // 浅红/珊瑚色
  "#93C5FD", // 浅蓝色
  "#A5B4FC", // 浅紫色
  "#F9A8D4", // 浅粉色
];

export function HighlightTimeline({
  highlights,
  totalDuration,
  onSeek,
}: HighlightTimelineProps) {
  // 根据 highlights 创建时间段
  const segments = highlights.map((highlight, index) => {
    const startPercent = (highlight.time / totalDuration) * 100;
    const nextHighlight = highlights[index + 1];
    const endTime = nextHighlight ? nextHighlight.time : highlight.time + 60;
    const endPercent = Math.min((endTime / totalDuration) * 100, 100);
    const widthPercent = endPercent - startPercent;

    return {
      id: highlight.id,
      startPercent,
      widthPercent,
      color: segmentColors[index % segmentColors.length],
      time: highlight.time,
    };
  });

  return (
    <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden flex items-center px-1">
      {/* 背景轨道 */}
      <div className="absolute inset-x-1 h-3 bg-muted/50 rounded-full" />
      
      {/* 彩色段落 */}
      {segments.map((segment) => (
        <button
          key={segment.id}
          onClick={() => onSeek(segment.time)}
          className="absolute h-3 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            left: `${segment.startPercent}%`,
            width: `${Math.max(segment.widthPercent, 3)}%`,
            backgroundColor: segment.color,
          }}
        />
      ))}
    </div>
  );
}
