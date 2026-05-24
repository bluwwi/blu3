"use client";

import { fmt } from "@/utils/formatters";
import { Track } from "@/utils/types";
import { Heart, MoreHorizontal, Music2, Plus } from "lucide-react";

interface Props {
  track: Track;
  isActive: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  onClick?: () => void;
  onAddToQueue?: (track: Track) => void;
  index: number;
}

export function TrackItem({
  track,
  isActive,
  isLoading,
  isPlaying,
  onClick,
  onAddToQueue,
  index,
}: Props) {
  const artists = track.artists.map((artist) => artist.name).join(", ");
  const detail = [artists, track.album.name].filter(Boolean).join(" · ");

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-white transition-colors ${
        isActive ? "bg-white/15" : "hover:bg-white/10"
      }`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div
        onClick={onClick}
        className={`flex min-w-0 flex-1 items-center gap-3 ${
          onClick && !isLoading ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
          {track.image ? (
            <img
              src={track.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/55">
              <Music2 size={16} />
            </div>
          )}
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 transition-opacity ${
              isLoading || (isActive && isPlaying)
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isActive && isPlaying ? (
              <div className="flex h-3.5 items-end gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    style={{
                      height: `${6 + i * 2}px`,
                      animation: "bounce 0.8s ease-in-out infinite",
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {track.name}
            </p>
            {track.explicit && (
              <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] font-medium text-white/55">
                E
              </span>
            )}
          </div>
          <p className="truncate text-xs text-white/60">
            {detail || "Unknown artist"}
          </p>
        </div>

        <p className="shrink-0 text-xs text-white/50">{fmt(track.duration_ms)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-white/55 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="rounded-full p-1.5 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Like track"
        >
          <Heart size={14} />
        </button>
        <button
          type="button"
          className="rounded-full p-1.5 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="More options"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {onAddToQueue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(track);
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          title="Add to room queue"
        >
          <Plus size={14} />
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.6)} }
      `}</style>
    </div>
  );
}
