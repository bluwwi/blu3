"use client";
import { Track } from "@/utils/types";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";

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

  // Repeat button: single button that cycles through all modes
  const getRepeatButtonProps = () => {
    if (repeatMode === "one") {
      return {
        iconName: "repeat-1",
        label: "Repeat one",
        title: "Repeat: one",
        active: true,
      };
    }
    if (repeatMode === "all") {
      return {
        iconName: "repeat",
        label: "Repeat all",
        title: "Repeat: all",
        active: true,
      };
    }
    return {
      iconName: "repeat",
      label: "Repeat off",
      title: "Repeat: off",
      active: false,
    };
  };
  const repeatBtn = getRepeatButtonProps();

  return (
    <div className="flex flex-col mt-5 md:mt-0 text-white items-center justify-center rounded-[28px] p-4 sm:p-5 h-full overflow-hidden w-full">
      <div className="h-[60%] sm:h-[50%] aspect-square rounded-[22px] overflow-hidden mb-3 border border-white/10 relative select-none shadow-[0_0_40px_-8px_rgba(255,255,255,0.15)]">
        <Image
          width={400}
          height={400}
          src={albumArt}
          alt={title}
          priority
          className="w-full h-full object-cover"
        />
      </div>

      {/* Track Info */}
      <div className="w-[90%] flex justify-center items-center mb-3 shrink-0">
        <div className="text-center w-fit flex-1">
          <p className="text-white font-bold text-sm sm:text-base truncate tracking-wide">
            {title}
          </p>
          {subtitle && (
            <p className="text-white/70 text-[10px] sm:text-xs truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 flex-nowrap w-full select-none">
        <button
          onClick={onToggleShuffle}
          disabled={!onToggleShuffle}
          className={`p-1.5 rounded-full transition-all hover:scale-110 disabled:opacity-30 cursor-pointer ${
            shuffleEnabled
              ? "text-violet-400 hover:text-violet-300 bg-violet-400/10"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Shuffle"
          title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
        >
          <Icon name="shuffle" size={16} className="text-current" />
        </button>

        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          disabled={!onSkipBack}
          className="p-1.5 text-white/60 hover:text-white hover:scale-110 hover:bg-white/10 rounded-full transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Previous"
        >
          <Icon name="skip-back" size={18} className="text-current" />
        </button>

        {/* Play/Pause - Centerpiece */}
        <button
          onClick={onPlayPause}
          disabled={isLoading || !onPlayPause}
          className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-black fill-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_24px_-4px_rgba(255,255,255,0.3)] hover:shadow-[0_0_32px_-4px_rgba(255,255,255,0.5)] shrink-0 cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Icon
              name="refresh"
              size={18}
              className="animate-spin text-black"
            />
          ) : isPlaying ? (
            <Icon name="pause" size={18} className="text-black" />
          ) : (
            <Icon
              name="play"
              size={18}
              className="text-black translate-x-[1px]"
            />
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          disabled={!onSkipForward}
          className="p-1.5 text-white/60 hover:text-white hover:scale-110 hover:bg-white/10 rounded-full transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Next"
        >
          <Icon name="skip-forward" size={18} className="text-current" />
        </button>

        {/* Repeat - Single button, cycles modes */}
        <button
          onClick={onCycleRepeat}
          disabled={!onCycleRepeat}
          className={`p-1.5 rounded-full transition-all hover:scale-110 disabled:opacity-30 cursor-pointer ${
            repeatBtn.active
              ? "text-violet-400 hover:text-violet-300 bg-violet-400/10"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
          aria-label={repeatBtn.label}
          title={repeatBtn.title}
        >
          <Icon name={repeatBtn.iconName} size={16} className="text-current" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Volume + Mute */}
        <button
          onClick={onMute}
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <Icon name="volume-x" size={16} className="text-current" />
          ) : (
            <Icon name="volume-up" size={16} className="text-current" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          className="accent-white h-1.5 w-12 sm:w-16 cursor-pointer bg-white/10 rounded-lg outline-none flex-shrink-0"
          aria-label="Volume"
        />

        {/* Like Button */}
        {onToggleLike && (
          <button
            onClick={onToggleLike}
            className={`p-1.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
              isLiked
                ? "text-rose-500 scale-105 bg-rose-500/10"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
            aria-label={isLiked ? "Unlike track" : "Like track"}
            title={isLiked ? "Unlike track" : "Like track"}
          >
            <Icon
              name={isLiked ? "favorite" : "heart"}
              size={16}
              className={isLiked ? "text-rose-500" : "text-current"}
            />
          </button>
        )}
      </div>

      {/* Progress Bar + Timestamps */}
      <div className="w-[90%] px-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/70 tabular-nums w-7 text-right shrink-0">
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
          <span className="text-[9px] text-white/70 tabular-nums w-7 shrink-0">
            {fmtSec(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
