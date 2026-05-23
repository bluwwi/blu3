"use client";

import { fmtSec } from "@/utils/formatters";

interface Props {
  progress: number;
  currentTime: number;
  duration: number;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export function ProgressBar({
  progress,
  currentTime,
  duration,
  onSeek,
  className = "",
}: Props) {
  if (!duration) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-zinc-600 text-xs tabular-nums w-9">
        {fmtSec(currentTime)}
      </span>
      <div
        className={`flex-1 h-1 bg-zinc-800 rounded-full ${onSeek ? "cursor-pointer group" : "cursor-default"}`}
        onClick={onSeek}
        role="slider"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-green-500 rounded-full relative transition-all"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
        </div>
      </div>
      <span className="text-zinc-600 text-xs tabular-nums w-9 text-right">
        {fmtSec(duration)}
      </span>
    </div>
  );
}
