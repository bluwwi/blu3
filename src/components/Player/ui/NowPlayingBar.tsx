"use client";

import { Track } from "@/utils/types";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import {
  List,
  Loader2,
  MessageSquare,
  MoreHorizontal,
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
  const artist = track?.artists?.map((a) => a.name).join(", ") ?? "";
  const albumName = track?.album?.name ?? "";
  const subtitle = [artist, albumName].filter(Boolean).join(" – ");
  const albumArt =
    track?.image ||
    (activeVideoId
      ? `https://i.ytimg.com/vi/${activeVideoId}/default.jpg`
      : `https://picsum.photos/seed/nowplaying/96/96`);

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/25";

  const modeBtn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
      active
        ? "border-white/25 bg-white/18 text-white"
        : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
    } disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50">
      {/* outer glass pill — same as original */}
      <div className="mx-auto max-w-4xl  border border-white/20 bg-white/10 px-4 pt-2.5 text-white shadow-2xl backdrop-blur-xl">
        {/* single row */}
        <div className="flex items-center gap-3">
          {/* ── LEFT: skip-back · play/pause · skip-forward ── */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPlayPause}
              disabled={isLoading || !onPlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} className="fill-current" />
              ) : (
                <Play size={18} className="fill-current translate-x-[1px]" />
              )}
            </button>
          </div>

          {/* ── CENTRE: darker inset pill with art + title + time + dot + more ── */}
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-sm min-w-0">
            {/* album art */}
            <img
              src={albumArt}
              alt={title}
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-lg"
            />

            {/* title + artist */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-white">
                {title}
              </p>
              {subtitle && (
                <p className="truncate text-[11px] leading-tight text-white/50 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {/* time */}
            <span className="shrink-0 text-[12px] tabular-nums text-white/55">
              {hasTrack ? fmtSec(currentTime) : "0:00"}
            </span>

            {/* dot indicator */}
            <div className="h-2 w-2 shrink-0 rounded-full bg-white/30" />

            {/* more */}
            <button
              type="button"
              className="shrink-0 text-white/50 hover:text-white transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>

          {/* ── RIGHT: chat · queue · shuffle · repeat · mute · volume ── */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onChatClick}
              className={iconBtn}
              aria-label="Chat"
            >
              <MessageSquare size={15} />
            </button>
            <button
              type="button"
              onClick={onQueueClick}
              className={iconBtn}
              aria-label="Queue"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleShuffle}
              disabled={!onToggleShuffle}
              className={modeBtn(shuffleEnabled)}
              aria-label="Shuffle"
            >
              <Shuffle size={14} />
            </button>
            <button
              type="button"
              onClick={onCycleRepeat}
              disabled={!onCycleRepeat}
              className={modeBtn(repeatMode !== "off")}
              aria-label="Repeat"
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
              className={iconBtn}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
