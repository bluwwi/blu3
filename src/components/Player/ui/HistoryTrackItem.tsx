"use client";
import { Icon } from "@/hooks/useIcon";
import { Track } from "@/utils/types";

interface HistoryItem {
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  playedAt: number;
}

interface Props {
  track: HistoryItem;
  historyTrack: Track;
  isActive: boolean;
  playerState?: string;
  canControlPlayback: boolean;
  manageMode: boolean;
  likedTrackIds: Set<string>;
  onPlay: () => void;
  onToggleLike: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export function HistoryTrackItem({
  track,
  historyTrack,
  isActive,
  playerState,
  canControlPlayback,
  manageMode,
  likedTrackIds,
  onPlay,
  onToggleLike,
  onAddToQueue,
}: Props) {
  return (
    <div
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all ${
        isActive ? "bg-white/15" : "hover:bg-white/6"
      }`}
    >
      <div
        role={canControlPlayback ? "button" : undefined}
        tabIndex={canControlPlayback ? 0 : -1}
        onClick={onPlay}
        onKeyDown={(event) => {
          if (!canControlPlayback) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPlay();
          }
        }}
        style={{
          width: "clamp(3.75rem,3vw,199rem)",
        }}
        className="relative group/img shrink-0 aspect-square cursor-pointer rounded-lg"
      >
        <img
          src={track.image}
          alt=""
          className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
            <div className="flex items-end gap-0.5 h-3.5">
              {[1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-[2.5px] rounded-full bg-violet-300 ${
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
              <span className="text-[10px] font-semibold text-white">||</span>
            ) : (
              <Icon name="play" size={12} className="text-white" />
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">
          {track.trackName}
        </p>
        <p className="truncate text-[11px] text-white/60">{track.artistName}</p>
      </div>

      {!manageMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(historyTrack);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              likedTrackIds.has(historyTrack.videoId)
                ? "text-rose-500 fill-rose-500 hover:text-rose-450"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
            title={
              likedTrackIds.has(historyTrack.videoId)
                ? "Unlike track"
                : "Like track"
            }
          >
            <Icon
              name={
                likedTrackIds.has(historyTrack.videoId) ? "favorite" : "heart"
              }
              size={12}
              className="text-current"
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(historyTrack);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Add track to queue"
          >
            <Icon name="plus" size={12} className="text-current" />
          </button>
        </div>
      )}
    </div>
  );
}
