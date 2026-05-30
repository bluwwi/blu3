"use client";
import { Track } from "@/utils/types";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";

interface Props {
  track: Track | null;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlayPause?: () => void;
  onMute: () => void;
  onVolume: (val: number) => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
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
  onPlayPause,
  onMute,
  onVolume,
  onSeek,
  onSkipBack,
  onSkipForward,
  isLiked = false,
  onToggleLike,
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const displayTitle = title.length > 30 ? title.slice(0, 30) + "..." : title;
  const artist = track?.artists?.map((a) => a.name).join(", ") ?? "";
  const albumName = track?.album?.name ?? "";
  const subtitle = [artist, albumName].filter(Boolean).join(" · ");
  const albumArt =
    track?.image ||
    (activeVideoId
      ? `https://i.ytimg.com/vi/${activeVideoId}/maxresdefault.jpg`
      : `https://picsum.photos/seed/nowplaying/400/400`);

  return (
    <div className="flex flex-col mt-5 md:mt-0 text-white items-center justify-center max-md:rounded-none md:rounded-[28px] max-md:p-0 md:p-4 sm:p-5 h-full  md:h-full overflow-hidden w-full">
      <div className="w-[90%] aspect-square md:w-auto md:h-[50%] rounded-[22px] overflow-hidden mb-3 border border-white/10 relative select-none shadow-[0_0_40px_-8px_rgba(255,255,255,0.15)] mx-auto">
        <Image
          width={400}
          height={400}
          src={albumArt}
          alt={title}
          priority
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-[90%] flex justify-center overflow-hidden items-center mb-3 shrink-0">
        <div className="text-center w-fit flex-1">
          <p className="text-white text-lg  sm:text-base truncate tracking-wide">
            {displayTitle}
          </p>
          {subtitle && (
            <p className="text-white/70 text-[10px] sm:text-xs truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-2 mb-3 flex-nowrap w-full select-none">
        <button
          onClick={onSkipBack}
          disabled={!onSkipBack}
          className=" text-white/80 hover:text-white hover:scale-110 hover:bg-white/10 rounded-full transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Previous"
        >
          <Icon name="skip-back" size={22} className="text-current" />
        </button>
        <button
          onClick={onPlayPause}
          disabled={isLoading || !onPlayPause}
          className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-black fill-black  transition-all shadow-[0_0_24px_-4px_rgba(255,255,255,0.3)] hover:shadow-[0_0_32px_-4px_rgba(255,255,255,0.5)] shrink-0 cursor-pointer"
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
            <Icon name="play" size={18} className="text-black " />
          )}
        </button>
        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          disabled={!onSkipForward}
          className=" text-white/80 hover:text-white hover:scale-110 hover:bg-white/10 rounded-full transition-all disabled:opacity-30 cursor-pointer"
          aria-label="Next"
        >
          <Icon name="skip-forward" size={22} className="text-current" />
        </button>
        <button
          onClick={onMute}
          className="s ml-2 text-white hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer shrink-0"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <Icon name="volume-x" size={20} className="text-current" />
          ) : (
            <Icon name="volume-up" size={20} className="text-current" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          className="accent-white h-1.25 w-16 sm:w-22 cursor-pointer bg-white/20 rounded-lg outline-none ring-0 border-0 shrink-0"
          aria-label="Volume"
        />

        {onToggleLike && (
          <button
            onClick={onToggleLike}
            className={`rounded-full ml-2 transition-all cursor-pointer shrink-0 ${
              isLiked
                ? "text-rose-500 "
                : "text-white/50 hover:text-white hover:bg-white/10 hover:scale-105 "
            }`}
            aria-label={isLiked ? "Unlike track" : "Like track"}
            title={isLiked ? "Unlike track" : "Like track"}
          >
            <Icon
              name={isLiked ? "favorite" : "heart"}
              size={25}
              className={isLiked ? "text-rose-500" : "text-current"}
            />
          </button>
        )}
      </div>

      <div className="w-[90%] px-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/70 tabular-nums w-7 text-right shrink-0">
            {fmtSec(currentTime)}
          </span>
          <div className="flex-1">
            <ProgressBar
              progress={progress * 100}
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
