"use client";

import { Track } from "@/utils/types";
import { fmtSec } from "@/utils/formatters";
import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
} from "lucide-react";
import { ProgressBar } from "./ProgressBar";

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
  const isLoading = playerState === "loading";
  const hasControl = !!onPlayPause;
  const hasModeControl = !!onToggleShuffle && !!onCycleRepeat;
  const canSeek = !!onSeek && duration > 0;
  const safeProgress = Math.max(0, Math.min(progress, 100));
  const title = track?.name ?? "Nothing playing yet";
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name ?? "";
  const albumArt =
    track?.image || `https://picsum.photos/seed/${track?.videoId || "blu3"}/600/600`;

  return (
    <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl">
      <p className="mb-3 text-center text-[10px] uppercase tracking-[0.24em] text-white/45">
        {roomLabel}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[220px]">
          <div className="absolute inset-0 scale-110 rounded-[28px] bg-white/10 blur-3xl" />
          <img
            src={albumArt}
            alt={title}
            className={`relative h-full w-full rounded-[24px] object-cover shadow-2xl transition-transform duration-500 ${
              isPlaying ? "scale-[1.02]" : "scale-100"
            }`}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="line-clamp-2 text-2xl font-bold tracking-tight text-white">
              {title}
            </h2>
            <p className="text-sm text-white/70">
              {[artist, album].filter(Boolean).join(" · ") || "Blu3 listening room"}
            </p>
          </div>

          <div className="space-y-3">
            <ProgressBar
              progress={safeProgress}
              currentTime={currentTime}
              duration={duration}
              onSeek={canSeek ? onSeek : undefined}
            />
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{fmtSec(currentTime)}</span>
              <span>{fmtSec(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleShuffle}
              disabled={!hasModeControl}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                shuffleEnabled
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              disabled={isLoading || !hasControl}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={24} className="fill-current" />
              ) : (
                <Play size={24} className="fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              disabled={!hasModeControl}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                repeatMode !== "off"
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Toggle repeat"
            >
              {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/55">
            <div
              className={`h-2 w-2 rounded-full ${
                isPlaying ? "bg-emerald-400" : isLoading ? "bg-amber-300" : "bg-white/35"
              }`}
            />
            <span>
              {isPlaying
                ? "Room sync active"
                : isLoading
                  ? "Buffering track"
                  : "Waiting for playback"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
