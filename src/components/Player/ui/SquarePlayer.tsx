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
    <div className="flex flex-col text-black  items-center rounded-[28px]  p-5 h-full overflow-hidden">
      {/* Spark icon */}
      <div className="self-end text-white/50 text-xl mb-2 flex-shrink-0">✦</div>

      {/* Album art */}
      <div className="w-full h-full flex items-center justify-center min-h-0 rounded-[18px] overflow-hidden mb-4">
        <img
          src={albumArt}
          alt={title}
          className="h-full rounded-xl aspect-square object-cover"
        />
      </div>

      {/* Track info */}
      <div className="w-full text-center flex-shrink-0 mb-4">
        <p className="text-white font-semibold text-[15px] truncate">{title}</p>
        {subtitle && (
          <p className="text-white/55 text-[12px] truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Controls row: shuffle · skip back · play · skip forward · repeat · volume · heart */}
      <div className="flex items-center w-full gap-3 justify-center  mb-3">
        <button
          onClick={onToggleShuffle}
          disabled={!onToggleShuffle}
          className={`transition-colors disabled:opacity-30 ${
            shuffleEnabled
              ? "text-violet-400 hover:text-violet-300"
              : "text-white/60 hover:text-white"
          }`}
          aria-label="Shuffle"
          title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
        >
          <Shuffle size={15} />
        </button>

        <button
          onClick={onSkipBack}
          disabled={!onSkipBack}
          className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
          aria-label="Previous"
        >
          <SkipBack size={16} fill="currentColor" />
        </button>

        <button
          onClick={onPlayPause}
          disabled={isLoading || !onPlayPause}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 hover:bg-violet-400 text-white transition-colors disabled:opacity-40 flex-shrink-0"
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

        <button
          onClick={onSkipForward}
          disabled={!onSkipForward}
          className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
          aria-label="Next"
        >
          <SkipForward size={16} fill="currentColor" />
        </button>

        <button
          onClick={onCycleRepeat}
          disabled={!onCycleRepeat}
          className={`transition-colors disabled:opacity-30 ${
            repeatActive
              ? "text-violet-400 hover:text-violet-300"
              : "text-white/60 hover:text-white"
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
          <RepeatIcon size={15} />
        </button>

        {/* Volume */}
        <button
          onClick={onMute}
          className="text-white/55 hover:text-white transition-colors ml-1"
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
          style={{ width: "80px" }}
          className="accent-violet-500 h-1 flex-shrink-0"
          aria-label="Volume"
        />

        <button
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Like"
        >
          <Heart size={15} />
        </button>
      </div>

      {/* Progress bar + timestamps */}
      <div className="w-full flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/45 tabular-nums w-7 text-right flex-shrink-0">
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
          <span className="text-[11px] text-white/45 tabular-nums w-7 flex-shrink-0">
            {fmtSec(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
