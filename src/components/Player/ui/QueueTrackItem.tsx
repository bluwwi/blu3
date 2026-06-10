"use client";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";
import { Track } from "@/utils/types";

interface Props {
  track: Track;
  index: number;
  isActive: boolean;
  playerState?: string;
  canControlPlayback: boolean;
  manageMode: boolean;
  selectedIds: Set<string>;
  likedTrackIds: Set<string>;
  onPlay: () => void;
  onToggleSelect: (id: string) => void;
  onToggleLike: (track: Track) => void;
}

export function QueueTrackItem({
  track,
  index: _index,
  isActive,
  playerState,
  canControlPlayback,
  manageMode,
  selectedIds,
  likedTrackIds,
  onPlay,
  onToggleSelect,
  onToggleLike,
}: Props) {
  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all ${
        isActive ? "bg-white/15" : "hover:bg-white/[0.06]"
      } ${canControlPlayback && !manageMode ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        role={canControlPlayback ? "button" : undefined}
        tabIndex={canControlPlayback ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        onKeyDown={(event) => {
          if (!canControlPlayback) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPlay();
          }
        }}
        style={{
          width: "clamp(3.5rem,3vw,199rem)",
        }}
        className="relative group/img shrink-0 aspect-square rounded-lg"
      >
        <Image
          width={300}
          height={300}
          src={track.image}
          alt=""
          className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
        />

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
            <div className="flex items-end gap-1 h-3.5">
              {[1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-[3px] rounded-full bg-white ${
                    playerState === "playing" ? "animate-bounce" : ""
                  }`}
                  style={{
                    height: `${[50, 100, 70][b - 1]}%`,
                    animationDelay: `${(b - 1) * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {canControlPlayback && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
            {isActive ? (
              <span className="text-[20px] font-bold text-white">||</span>
            ) : (
              <Icon name="playmusic" size={16} className="text-white" />
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate font-medium text-white"
          style={{
            fontSize: "clamp(0.85rem,0.75vw,199rem)",
          }}
        >
          {track.name}
        </p>
        <p className="truncate text-[11px] text-white/60">
          {[track.artists?.[0]?.name, track.album?.name]
            .filter(Boolean)
            .join(" · ") || "Unknown artist"}
        </p>
      </div>

      {manageMode && (
        <div className="shrink-0 px-2 flex items-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(track.id);
            }}
            className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all cursor-pointer ${
              selectedIds.has(track.id)
                ? "bg-blue-100 border-blue-100"
                : "border-white/40 hover:border-white/70"
            }`}
          >
            {selectedIds.has(track.id) && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      )}
      {!manageMode && (
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(track);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              likedTrackIds.has(track.videoId)
                ? "text-rose-500 fill-rose-500 hover:text-rose-450"
                : "text-white/55  hover:text-white"
            }`}
            title={
              likedTrackIds.has(track.videoId) ? "Unlike track" : "Like track"
            }
          >
            <Icon
              name={likedTrackIds.has(track.videoId) ? "favorite" : "heart"}
              size={28}
              className="text-current cursor-pointer"
            />
          </button>
        </div>
      )}
    </div>
  );
}
