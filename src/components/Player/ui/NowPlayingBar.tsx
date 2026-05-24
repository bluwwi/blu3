"use client";

import { Track } from "@/utils/types";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

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
  const isLive = ["loading", "playing", "paused", "ended"].includes(playerState);
  const title = track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name;
  const statusLabel = !hasTrack
    ? "idle"
    : isLive
      ? playerState
      : "last played";
  const statusTone =
    playerState === "playing"
      ? "bg-green-400"
      : playerState === "loading"
        ? "bg-yellow-400"
        : hasTrack
          ? "bg-zinc-400"
          : "bg-zinc-700";
  const subtitle = hasTrack
    ? `${statusLabel} · room sync active`
    : "search a song to start the room";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#090909]/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {track?.image ? (
            <img
              src={track.image}
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
              style={{ boxShadow: "0 4px 20px rgba(29,185,84,0.2)" }}
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900">
              <span className="text-lg text-zinc-600">♪</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-bold text-white sm:text-base"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {title}
            </p>
            {artist && (
              <p className="mt-0.5 truncate text-xs text-zinc-400 sm:text-sm">
                {artist}
              </p>
            )}
            {album && (
              <p className="truncate text-[11px] text-zinc-600">{album}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <PlayerControls
              playerState={playerState}
              onTogglePlayPause={onPlayPause}
              shuffleEnabled={shuffleEnabled}
              repeatMode={repeatMode}
              onToggleShuffle={onToggleShuffle}
              onCycleRepeat={onCycleRepeat}
            />
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={onVolume}
              onToggleMute={onMute}
              className="hidden md:flex"
            />
          </div>
        </div>

        <ProgressBar
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${statusTone} ${
                playerState === "playing" || playerState === "loading"
                  ? "animate-pulse"
                  : ""
              }`}
            />
            <span className="uppercase tracking-[0.2em] text-zinc-500">
              {subtitle}
            </span>
          </div>
          <span className="text-zinc-600">
            shuffle {shuffleEnabled ? "on" : "off"} · repeat {repeatMode}
          </span>
        </div>
      </div>
    </div>
  );
}
