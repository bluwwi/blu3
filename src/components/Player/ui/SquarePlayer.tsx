"use client";
import { Track } from "@/utils/types";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import {
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Shuffle,
  Repeat,
  Repeat1,
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
  onMute: () => void;
  onVolume: (val: number) => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export function SquarePlayer({
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
  onMute,
  onVolume,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onSkipBack,
  onSkipForward,
  isLiked = false,
  onToggleLike,
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const artist = track?.artists?.map((a) => a.name).join(", ") ?? "";
  const albumName = track?.album?.name ?? "";
  const subtitle = [artist, albumName].filter(Boolean).join(" · ");
  const albumArt =
    track?.image ||
    (activeVideoId
      ? `https://i.ytimg.com/vi/${activeVideoId}/maxresdefault.jpg`
      : `https://picsum.photos/seed/nowplaying/400/400`);

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatActive = repeatMode !== "off";

  return (
    <div className="flex flex-col text-white items-center rounded-[28px] p-5 h-full overflow-hidden w-full">
      {/* Spark icon */}
      <div className="self-end text-white/40 text-xl mb-1 flex-shrink-0 select-none">
        ✦
      </div>

      {/* Album art — guaranteed perfect square across all device resolutions */}
      <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-[22px] overflow-hidden mb-5 flex-shrink-0 shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 relative select-none">
        <img
          src={albumArt}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Track info + Heart button */}
      <div className="w-full flex items-center justify-between px-3 mb-4 flex-shrink-0 select-none">
        <div className="text-left min-w-0 flex-1 pr-4">
          <p className="text-white font-bold text-sm sm:text-base md:text-lg truncate tracking-wide">
            {title}
          </p>
          {subtitle && (
            <p className="text-white/55 text-[10px] sm:text-xs truncate mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {onToggleLike && (
          <button
            onClick={onToggleLike}
            className={`transition-all cursor-pointer p-2 rounded-full hover:bg-white/5 flex-shrink-0 ${
              isLiked
                ? "text-rose-500 fill-rose-500 scale-105"
                : "text-white/50 hover:text-white"
            }`}
            aria-label={isLiked ? "Unlike track" : "Like track"}
            title={isLiked ? "Unlike track" : "Like track"}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
          </button>
        )}
      </div>

      {/* Progress bar + timestamps */}
      <div className="w-full px-3 mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/40 tabular-nums w-8 text-right shrink-0">
            {fmtSec(currentTime)}
          </span>
          <div className="flex-1">
            <ProgressBar
              progress={progress}
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
            />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums w-8 shrink-0">
            {fmtSec(duration)}
          </span>
        </div>
      </div>

      {/* Main playback controls row */}
      <div className="flex items-center justify-center gap-5 sm:gap-7 mb-5 flex-shrink-0 w-full select-none">
        <button
          onClick={onToggleShuffle}
          disabled={!onToggleShuffle}
          className={`transition-all hover:scale-110 disabled:opacity-30 cursor-pointer ${
            shuffleEnabled
              ? "text-violet-400 hover:text-violet-300"
              : "text-white/50 hover:text-white"
          }`}
          aria-label="Shuffle"
          title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
        >
          <Shuffle size={16} />
        </button>

        <button
          onClick={onSkipBack}
          disabled={!onSkipBack}
          className="text-white/50 hover:text-white hover:scale-110 transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Previous"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        <button
          onClick={onPlayPause}
          disabled={isLoading || !onPlayPause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_4px_16px_rgba(255,255,255,0.15)] flex-shrink-0 cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-black" />
          ) : isPlaying ? (
            <Pause size={18} className="fill-current text-black" />
          ) : (
            <Play
              size={18}
              className="fill-current text-black translate-x-[1px]"
            />
          )}
        </button>

        <button
          onClick={onSkipForward}
          disabled={!onSkipForward}
          className="text-white/50 hover:text-white hover:scale-110 transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Next"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>

        <button
          onClick={onCycleRepeat}
          disabled={!onCycleRepeat}
          className={`transition-all hover:scale-110 disabled:opacity-30 cursor-pointer ${
            repeatActive
              ? "text-violet-400 hover:text-violet-300"
              : "text-white/50 hover:text-white"
          }`}
          aria-label="Repeat"
          title={
            repeatMode === "one"
              ? "Repeat one"
              : repeatMode === "all"
                ? "Repeat all"
                : "Repeat off"
          }
        >
          <RepeatIcon size={16} />
        </button>
      </div>

      {/* Volume control row (Separated elegantly) */}
      <div className="flex items-center justify-center gap-3 w-full max-w-[180px] flex-shrink-0 px-3 mt-1">
        <button
          onClick={onMute}
          className="text-white/40 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          className="accent-white h-1 flex-1 cursor-pointer bg-white/10 rounded-lg outline-none w-full"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
