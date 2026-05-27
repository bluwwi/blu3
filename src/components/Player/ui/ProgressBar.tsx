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
        className={`group relative h-1 w-full bg-white/10 rounded-full overflow-hidden ${
          canSeek
            ? "cursor-pointer hover:h-[5px] transition-all duration-150"
            : "cursor-default"
        }`}
      >
        <div
          className="relative h-full bg-gradient-to-r from-white/60 to-white rounded-full transition-[width] duration-200"
          style={{ width: `${safeProgress}%` }}
        >
          {canSeek && (
            <div className="absolute right-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 scale-0 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.7)] transition-transform group-hover:scale-100" />
          )}
        </div>
      </div>
    </div>
  );
}
