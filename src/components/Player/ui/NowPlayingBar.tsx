"use client";

import { Track } from "@/utils/types";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

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
  onPlayPause,
  onMute,
  onVolume,
  onSeek,
}: Props) {
  const isActive = ["loading", "playing", "paused", "ended"].includes(
    playerState,
  );
  if (!isActive) return null;

  const title = track?.name ?? (activeVideoId ? "Playing from URL" : "Unknown");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/10 px-4 py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex items-center gap-3">
          {track?.image ? (
            <img
              src={track.image}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              style={{ boxShadow: "0 4px 20px rgba(29,185,84,0.2)" }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-600 text-lg">♪</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p
              className="text-white text-sm font-bold truncate"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {title}
            </p>
            {artist && (
              <p className="text-zinc-500 text-xs truncate mt-0.5">{artist}</p>
            )}
            {album && <p className="text-zinc-700 text-xs truncate">{album}</p>}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PlayerControls
              playerState={playerState}
              onTogglePlayPause={onPlayPause}
            />
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={onVolume}
              onToggleMute={onMute}
              className="hidden sm:flex"
            />
          </div>
        </div>

        <ProgressBar
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              playerState === "playing"
                ? "bg-green-400 animate-pulse"
                : playerState === "loading"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-700 text-xs">
            {playerState} · yt music search · yt audio
          </span>
        </div>
      </div>
    </div>
  );
}
