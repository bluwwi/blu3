"use client";

interface Props {
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onTogglePlayPause: () => void;
  className?: string;
}

export function PlayerControls({
  playerState,
  onTogglePlayPause,
  className = "",
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";

  return (
    <button
      onClick={onTogglePlayPause}
      disabled={isLoading}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
        isLoading
          ? "bg-zinc-700 text-zinc-500 cursor-wait"
          : "bg-white text-black hover:bg-zinc-200 active:scale-95"
      } ${className}`}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isLoading ? "⋯" : isPlaying ? "⏸" : "▶"}
    </button>
  );
}
