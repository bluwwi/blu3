"use client";

import { Track } from "@/utils/types";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import {
  List,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

type RepeatMode = "off" | "all" | "one";

interface Props {
  track: Track | null;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onPlayPause?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onMute: () => void;
  onVolume: (val: number) => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onChatClick?: () => void;
  onQueueClick?: () => void;
}

export function NowPlayingBar({
  track,
  activeVideoId,
  playerState,
  progress,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffleEnabled = false,
  repeatMode = "off",
  onPlayPause,
  onToggleShuffle,
  onCycleRepeat,
  onMute,
  onVolume,
  onSeek,
  onChatClick,
  onQueueClick,
}: Props) {
  const hasTrack = Boolean(track || activeVideoId);
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name ?? "";
  const albumArt =
    track?.image ||
    `https://picsum.photos/seed/${activeVideoId || "blu3"}/96/96`;
  const iconButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/25";
  const modeButtonClass = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
      active
        ? "border-white/25 bg-white/18 text-white"
        : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
    } disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <div className="fixed bottom-3 w-screen left-3 right-3 z-50">
      <div className="mx-auto max-w-4xl rounded-[24px] border border-white/20 bg-white/10 px-3 py-2.5 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5 lg:w-[30%]">
            <img
              src={albumArt}
              alt={title}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">
                {title}
              </p>
              <p className="truncate text-[11px] text-white/60">
                {[artist, album].filter(Boolean).join(" · ") ||
                  "Ready to listen"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-2.5">
            <button
              type="button"
              className={iconButtonClass}
              disabled
              aria-label="Skip back"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              onClick={onPlayPause}
              disabled={isLoading || !onPlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} className="fill-current" />
              ) : (
                <Play size={18} className="fill-current" />
              )}
            </button>
            <button
              type="button"
              className={iconButtonClass}
              disabled
              aria-label="Skip forward"
            >
              <SkipForward size={16} />
            </button>
            <span className="min-w-[76px] text-center text-[11px] text-white/55">
              {hasTrack
                ? `${fmtSec(currentTime)} / ${fmtSec(duration)}`
                : "0:00 / 0:00"}
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-white/70 lg:w-[30%]">
            <button
              type="button"
              onClick={onChatClick}
              className={iconButtonClass}
              aria-label="Open chat"
            >
              <MessageSquare size={14} />
            </button>
            <button
              type="button"
              onClick={onQueueClick}
              className={iconButtonClass}
              aria-label="Open queue"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={onToggleShuffle}
              disabled={!onToggleShuffle}
              className={modeButtonClass(shuffleEnabled)}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={14} />
            </button>
            <button
              type="button"
              onClick={onCycleRepeat}
              disabled={!onCycleRepeat}
              className={modeButtonClass(repeatMode !== "off")}
              aria-label="Toggle repeat"
            >
              {repeatMode === "one" ? (
                <Repeat1 size={14} />
              ) : (
                <Repeat size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={onMute}
              className={iconButtonClass}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="hidden w-20 accent-white md:block"
              aria-label="Volume"
            />
          </div>
        </div>

        <ProgressBar
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          className="mt-2"
        />
      </div>
    </div>
  );
}
