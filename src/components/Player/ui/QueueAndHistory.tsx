"use client";

import { Track } from "@/utils/types";
import {
  Clock3,
  ListMusic,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

interface Props {
  queue: Track[];
  recentTracks: Array<{
    videoId: string;
    trackName: string;
    artistName: string;
    image: string;
    playedAt: number;
  }>;
  canControlPlayback: boolean;
  handleAdminPlayTrack: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (track: Track) => void;
  activeVideoId: string | null | undefined;
}

export function QueueAndHistory({
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  activeVideoId,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2 text-white">
        <ListMusic size={16} className="text-white/80" />
        <h2 className="text-base font-medium">Next up</h2>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center text-white/55">
          <ListMusic size={28} className="mx-auto mb-3" />
          <p className="text-sm">Queue is empty</p>
        </div>
      ) : (
        <div className="room-scroll max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {queue.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                i === 0 ? "bg-white/12" : "hover:bg-white/10"
              }`}
            >
              <span className="w-4 shrink-0 text-right text-xs text-white/40">
                {i + 1}
              </span>
              <img
                src={track.image}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg bg-white/10 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {track.name}
                </p>
                <p className="truncate text-xs text-white/60">
                  {[track.artists?.[0]?.name, track.album?.name]
                    .filter(Boolean)
                    .join(" · ") || "Unknown artist"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFromQueue(track.id)}
                className="rounded-full p-1.5 text-white/45 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                aria-label="Remove from queue"
              >
                <Trash2 size={14} />
              </button>
              {canControlPlayback && (
                <button
                  type="button"
                  onClick={() => {
                    handleAdminPlayTrack(track);
                    removeFromQueue(track.id);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Play queued track"
                >
                  <Play size={14} className="fill-current" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-white">
        <Clock3 size={16} className="text-white/70" />
        <h3 className="text-sm font-medium">History</h3>
        <span className="text-xs text-white/45">{recentTracks.length} played</span>
      </div>

      {recentTracks.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center text-white/55">
          <Clock3 size={28} className="mx-auto mb-3" />
          <p className="text-sm">No history yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recentTracks.map((track, i) => {
            const historyTrack: Track = {
              id: track.videoId,
              videoId: track.videoId,
              name: track.trackName,
              artists: [{ name: track.artistName }],
              album: { name: "" },
              image: track.image,
              duration_ms: 0,
              explicit: false,
            };
            const isActive = activeVideoId === track.videoId;
            return (
              <div
                key={`${track.videoId}-${i}`}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isActive ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <span className="w-4 shrink-0 text-right text-xs text-white/40">
                  {i + 1}
                </span>
                <img
                  src={track.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg bg-white/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {track.trackName}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {track.artistName}
                  </p>
                </div>
                {canControlPlayback && (
                  <button
                    type="button"
                    onClick={() => handleAdminPlayTrack(historyTrack)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                    aria-label="Play from history"
                  >
                    <Play size={14} className="fill-current" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addToQueue(historyTrack)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Add track to queue"
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
