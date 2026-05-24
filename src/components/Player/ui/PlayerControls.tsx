"use client";

type RepeatMode = "off" | "all" | "one";

interface Props {
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onTogglePlayPause?: () => void;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  className?: string;
}

export function PlayerControls({
  playerState,
  onTogglePlayPause,
  shuffleEnabled = false,
  repeatMode = "off",
  onToggleShuffle,
  onCycleRepeat,
  className = "",
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const hasControl = !!onTogglePlayPause;
  const hasModeControl = !!onToggleShuffle && !!onCycleRepeat;
  const repeatLabel =
    repeatMode === "one" ? "Repeat One" : repeatMode === "all" ? "Repeat All" : "Repeat Off";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onToggleShuffle}
        disabled={!hasModeControl}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all ${
          shuffleEnabled
            ? "border-green-500/40 bg-green-500/15 text-green-300"
            : !hasModeControl
              ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
        }`}
        aria-label={shuffleEnabled ? "Disable Shuffle" : "Enable Shuffle"}
        title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
      >
        ⇄
      </button>
      <button
        type="button"
        onClick={onTogglePlayPause}
        disabled={isLoading || !hasControl}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
          isLoading
            ? "cursor-wait bg-zinc-700 text-zinc-500"
            : !hasControl
              ? "cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500"
              : "bg-white text-black hover:bg-zinc-200 active:scale-95"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? "⋯" : isPlaying ? "⏸" : "▶"}
      </button>
      <button
        type="button"
        onClick={onCycleRepeat}
        disabled={!hasModeControl}
        className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold transition-all ${
          repeatMode !== "off"
            ? "border-green-500/40 bg-green-500/15 text-green-300"
            : !hasModeControl
              ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
        }`}
        aria-label={repeatLabel}
        title={repeatLabel}
      >
        {repeatMode === "one" ? "1↻" : "↻"}
      </button>
    </div>
  );
}
