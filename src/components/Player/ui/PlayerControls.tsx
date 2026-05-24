"use client";

import { Loader2, Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface Props {
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onTogglePlayPause?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  className?: string;
}

export function PlayerControls({
  playerState,
  onTogglePlayPause,
  onSkipBack,
  onSkipForward,
  className = "",
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const hasControl = !!onTogglePlayPause;

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={onSkipBack}
        disabled={!onSkipBack}
        className="text-white/70 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
        aria-label="Skip back"
      >
        <SkipBack size={18} />
      </button>

      <button
        type="button"
        onClick={onTogglePlayPause}
        disabled={isLoading || !hasControl}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={22} className="fill-current" />
        ) : (
          <Play size={22} className="fill-current" />
        )}
      </button>

      <button
        type="button"
        onClick={onSkipForward}
        disabled={!onSkipForward}
        className="text-white/70 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
        aria-label="Skip forward"
      >
        <SkipForward size={18} />
      </button>
    </div>
  );
}
