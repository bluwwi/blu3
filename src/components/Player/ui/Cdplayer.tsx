"use client";

import { Track } from "@/utils/types";

type RepeatMode = "off" | "all" | "one";

interface Props {
  track: Track | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  progress: number;
  currentTime: number;
  duration: number;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onPlayPause?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  roomLabel?: string;
}

export function CDPlayer({
  track,
  playerState,
  progress,
  currentTime,
  duration,
  shuffleEnabled = false,
  repeatMode = "off",
  onPlayPause,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  roomLabel = "get bluee",
}: Props) {
  const isPlaying = playerState === "playing";
  const title = track?.name ?? "Nothing playing yet";
  const albumArt =
    track?.image || `https://picsum.photos/seed/${track?.videoId || "blu3"}/600/600`;

  return (
    <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
      <p className="mb-4 text-center text-[10px] uppercase tracking-[0.24em] text-white/45">
        {roomLabel}
      </p>

      <div className="flex flex-col items-center gap-5">
        <div className="relative mx-auto aspect-square w-full max-w-[280px]">
          <div className="absolute inset-0 scale-110 rounded-[34px] bg-white/10 blur-3xl" />
          <div
            className={`absolute inset-0 rounded-[34px] border border-white/20 bg-white/5 ${
              isPlaying ? "animate-[spin_18s_linear_infinite]" : ""
            }`}
          >
            <img
              src={albumArt}
              alt={title}
              className="h-full w-full rounded-[34px] object-cover shadow-2xl"
            />
          </div>
        </div>

        <div className="space-y-1 text-center">
          <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm text-white/60">Decorative room artwork</p>
        </div>
      </div>
    </div>
  );
}
