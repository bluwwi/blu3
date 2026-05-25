"use client";

import { useState } from "react";
import { Track } from "@/utils/types";
import { Clock3, ListMusic, Plus, Play, Trash2 } from "lucide-react";

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
  const sectionLabelClass =
    "text-[10px] uppercase tracking-[0.2em] text-white/45";
  const rowClass =
    "group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors";
  const thumbnailClass =
    "relative group/img h-9 w-9 shrink-0 cursor-pointer rounded-lg";
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const isQueueTab = activeTab === "queue";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
              isQueueTab
                ? "bg-white/20 text-white"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ListMusic size={12} />
            <span>Next up</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
              !isQueueTab
                ? "bg-white/20 text-white"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Clock3 size={12} />
            <span>History</span>
          </button>
        </div>

        <div className={sectionLabelClass}>
          {isQueueTab
            ? `${queue.length} queued`
            : `${recentTracks.length} played`}
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        {isQueueTab ? (
          queue.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-8 text-center text-white/55">
              <div>
                <ListMusic size={24} className="mx-auto mb-2.5" />
                <p className="text-[13px]">Queue is empty</p>
              </div>
            </div>
          ) : (
            <div className="room-scroll flex-1 space-y-1.5 overflow-y-auto pr-1">
              {queue.map((track, i) => {
                const isActive = i === 0;
                return (
                  <div
                    key={`${track.id}-${i}`}
                    className={`${rowClass} ${isActive ? "bg-white/15" : "hover:bg-white/10"}`}
                  >
                    <div
                      role={canControlPlayback ? "button" : undefined}
                      tabIndex={canControlPlayback ? 0 : -1}
                      onClick={() => {
                        if (!canControlPlayback) return;
                        handleAdminPlayTrack(track);
                        removeFromQueue(track.id);
                      }}
                      onKeyDown={(event) => {
                        if (!canControlPlayback) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleAdminPlayTrack(track);
                          removeFromQueue(track.id);
                        }
                      }}
                      className={`${thumbnailClass} ${isActive ? "ring-1 ring-white/40" : ""}`}
                    >
                      <img
                        src={track.image}
                        alt=""
                        className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
                      />
                      {canControlPlayback && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
                          {isActive ? (
                            <span className="text-[10px] font-semibold text-white">
                              ||
                            </span>
                          ) : (
                            <Play size={12} className="fill-white text-white" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">
                        {track.name}
                      </p>
                      <p className="truncate text-[11px] text-white/60">
                        {[track.artists?.[0]?.name, track.album?.name]
                          .filter(Boolean)
                          .join(" · ") || "Unknown artist"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(track.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Remove from queue"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : recentTracks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
            <div>
              <Clock3 size={24} className="mx-auto mb-2.5" />
              <p className="text-[13px]">No history yet</p>
            </div>
          </div>
        ) : (
          <div className="room-scroll flex-1 space-y-1.5 overflow-y-auto pr-1">
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
                  className={`${rowClass} ${isActive ? "bg-white/15" : "hover:bg-white/10"}`}
                >
                  <div
                    role={canControlPlayback ? "button" : undefined}
                    tabIndex={canControlPlayback ? 0 : -1}
                    onClick={() => {
                      if (!canControlPlayback) return;
                      handleAdminPlayTrack(historyTrack);
                    }}
                    onKeyDown={(event) => {
                      if (!canControlPlayback) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleAdminPlayTrack(historyTrack);
                      }
                    }}
                    className={`${thumbnailClass} ${isActive ? "ring-1 ring-white/40" : ""}`}
                  >
                    <img
                      src={track.image}
                      alt=""
                      className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
                    />
                    {canControlPlayback && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
                        {isActive ? (
                          <span className="text-[10px] font-semibold text-white">
                            ||
                          </span>
                        ) : (
                          <Play size={12} className="fill-white text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">
                      {track.trackName}
                    </p>
                    <p className="truncate text-[11px] text-white/60">
                      {track.artistName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToQueue(historyTrack)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Add track to queue"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
