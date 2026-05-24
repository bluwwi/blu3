"use client";

import { Track } from "@/utils/types";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { fmtSec } from "@/utils/formatters";
import { List, MessageSquare, Music2, Volume2 } from "lucide-react";

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
}: Props) {
  const hasTrack = Boolean(track || activeVideoId);
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name ?? "";
  const albumArt = track?.image || `https://picsum.photos/seed/${activeVideoId || "blu3"}/96/96`;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/20 bg-white/10 px-5 py-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={albumArt}
              alt={title}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              <p className="truncate text-xs text-white/60">
                {[artist, album].filter(Boolean).join(" · ") || "Ready to listen"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-4">
            <PlayerControls
              playerState={playerState}
              onTogglePlayPause={onPlayPause}
            />
            <span className="text-xs text-white/50">
              {hasTrack ? fmtSec(currentTime) : "0:00"}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 text-white/70">
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Open lyrics"
            >
              <MessageSquare size={16} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Open queue"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={onMute}
              className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <Volume2 size={16} />
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
        />
      </div>
      {!hasTrack && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-5 text-white/30">
          <Music2 size={14} />
        </div>
      )}
    </div>
  );
}
