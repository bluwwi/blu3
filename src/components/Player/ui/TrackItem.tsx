"use client";

import { fmt } from "@/utils/formatters";
import { Track } from "@/utils/types";

interface Props {
  track: Track;
  isActive: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  onClick?: () => void;
  index: number;
}

export function TrackItem({
  track,
  isActive,
  isLoading,
  isPlaying,
  onClick,
  index,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || !onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group border ${
        isActive
          ? "bg-green-500/10 border-green-500/20"
          : onClick
            ? "border-transparent hover:bg-zinc-900 hover:border-zinc-800"
            : "border-transparent"
      } ${!onClick ? "cursor-default" : ""}`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      {/* Album Art + Overlay */}
      <div className="relative flex-shrink-0 w-12 h-12">
        {track.image ? (
          <img
            src={track.image}
            alt=""
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600">♪</span>
          </div>
        )}

        {/* Play Overlay */}
        <div
          className={`absolute inset-0 rounded-lg flex items-center justify-center transition-opacity ${
            isLoading || (isActive && isPlaying)
              ? "bg-black/60 opacity-100"
              : onClick
                ? "bg-black/50 opacity-0 group-hover:opacity-100"
                : "opacity-0"
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isActive && isPlaying ? (
            <div className="flex gap-[2px] items-end h-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-[3px] bg-green-400 rounded-full animate-bounce"
                  style={{
                    height: `${6 + i * 2}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          ) : onClick ? (
            <span className="text-white text-sm">▶</span>
          ) : null}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-bold truncate ${isActive ? "text-green-500" : "text-white"}`}
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.82rem" }}
          >
            {track.name}
          </p>
          {track.explicit && (
            <span className="text-[9px] font-bold bg-white/10 text-zinc-500 px-1 rounded flex-shrink-0">
              E
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs truncate mt-0.5">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
        <p className="text-zinc-700 text-xs truncate">{track.album.name}</p>
      </div>

      {/* Duration */}
      <div className="flex-shrink-0 text-right">
        <p className="text-zinc-600 text-xs tabular-nums">
          {fmt(track.duration_ms)}
        </p>
        {isActive && <span className="text-green-500 text-xs">♪</span>}
      </div>
    </button>
  );
}
