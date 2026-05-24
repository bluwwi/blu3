"use client";

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
  const safeProgress =
    safeDuration > 0 ? Math.max(0, Math.min(progress, 100)) : 0;
  const canSeek = Boolean(onSeek && safeDuration > 0);

  return (
    <div className={className}>
      <div
        onClick={canSeek ? onSeek : undefined}
        role="slider"
        aria-valuenow={Math.round(safeProgress)}
        aria-valuemin={0}
        aria-valuemax={safeDuration > 0 ? 100 : 0}
        className={`group relative h-1 w-full rounded-full bg-white/20 transition-colors ${
          canSeek ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div
          className="relative h-full rounded-full bg-white transition-[width] duration-200"
          style={{ width: `${safeProgress}%` }}
        >
          {canSeek && (
            <div
              className="absolute right-[-5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-100 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
