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
  const safeDuration = Math.max(duration, 0);
  const safeCurrentTime = Math.min(Math.max(currentTime, 0), safeDuration || 0);
  const safeProgress = safeDuration > 0 ? Math.max(0, Math.min(progress, 100)) : 0;
  const canSeek = Boolean(onSeek && safeDuration > 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-zinc-600 text-xs tabular-nums w-9">
        {fmtSec(safeCurrentTime)}
      </span>
      <div
        className={`group flex-1 h-1.5 rounded-full transition-colors ${
          canSeek
            ? "cursor-pointer bg-zinc-800 hover:bg-zinc-700"
            : "cursor-default bg-zinc-900"
        }`}
        onClick={canSeek ? onSeek : undefined}
        role="slider"
        aria-valuenow={Math.round(safeProgress)}
        aria-valuemin={0}
        aria-valuemax={safeDuration > 0 ? 100 : 0}
      >
        <div
          className="relative h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${safeProgress}%` }}
        >
          {canSeek && (
            <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100" />
          )}
        </div>
      </div>
      <span className="text-zinc-600 text-xs tabular-nums w-9 text-right">
        {fmtSec(safeDuration)}
      </span>
    </div>
  );
}
