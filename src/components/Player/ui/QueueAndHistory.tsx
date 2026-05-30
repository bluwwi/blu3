"use client";
import { useState } from "react";
import { Track } from "@/utils/types";
import { usePlaylists } from "@/hooks/usePlaylists";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";

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
  clearQueue?: () => void;
  activeVideoId: string | null | undefined;
  playerState?: string;
  shuffleEnabled?: boolean;
  repeatMode?: "off" | "all" | "one";
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
}

export function QueueAndHistory({
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  clearQueue,
  activeVideoId,
  playerState,
  shuffleEnabled = false,
  repeatMode = "off",
  onToggleShuffle,
  onCycleRepeat,
}: Props) {
  const { likedTrackIds, toggleLike } = usePlaylists();
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

  const isQueueTab = activeTab === "queue";

  const visibleRecentTracks = recentTracks.filter(
    (track) => track.videoId !== activeVideoId,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-1">
      <div className="flex items-center gap-1.5 px-1">
        <button
          onClick={() => setActiveTab("queue")}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            activeTab === "queue"
              ? "bg-white text-black"
              : "bg-white/20 text-white/60"
          }`}
          title="Queue"
        >
          <Icon name="list-music" size={14} className="text-current" />
          {queue.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5">
              {queue.length > 9 ? "9+" : queue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            activeTab === "history"
              ? "bg-white text-black"
              : "bg-white/20 text-white/60"
          }`}
          title="History"
        >
          <Icon name="clock-3" size={14} className="text-current" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-0.5" />
        <button
          onClick={onToggleShuffle}
          disabled={!onToggleShuffle}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-30 ${
            shuffleEnabled
              ? "bg-violet-400 text-white"
              : "bg-white text-black"
          }`}
          title={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
        >
          <Icon name="shuffle" size={14} className="text-current" />
        </button>
        <button
          onClick={onCycleRepeat}
          disabled={!onCycleRepeat}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-30 ${
            repeatMode !== "off"
              ? "bg-violet-400 text-white"
              : "bg-white text-black"
          }`}
          title={`Repeat: ${repeatMode === "off" ? "off" : repeatMode === "one" ? "one" : "all"}`}
        >
          <Icon name={repeatMode === "one" ? "repeat-1" : "repeat"} size={14} className="text-current" />
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        {isQueueTab ? (
          queue.length === 0 ? (
            <div className="flex flex-1 items-center justify-center max-md:rounded-none md:rounded-[20px] max-md:border-0 md:border md:border-white/[0.06] max-md:bg-transparent md:bg-white/[0.03] max-md:backdrop-blur-none md:backdrop-blur-sm px-3 py-8 text-center text-white/55">
              <div>
                <div className="mx-auto mb-2.5 flex justify-center">
                  <Icon name="list-music" size={24} className="text-white/55" />
                </div>
                <p className="text-[13px]">Queue is empty</p>
              </div>
            </div>
          ) : (
            <div className="room-scroll flex-1 space-y-1 overflow-y-auto pr-1">
              {queue.map((track, i) => {
                const isActive = activeVideoId
                  ? activeVideoId === track.videoId
                  : i === 0;

                return (
                  <div
                    key={`${track.id}-${i}`}
                    className={`group flex items-center cursor-default gap-2.5 rounded-xl px-2.5 py-1.5 transition-all ${
                      isActive ? "bg-white/15" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <div
                      role={canControlPlayback ? "button" : undefined}
                      tabIndex={canControlPlayback ? 0 : -1}
                      onClick={() => {
                        if (!canControlPlayback) return;
                        handleAdminPlayTrack(track);
                      }}
                      onKeyDown={(event) => {
                        if (!canControlPlayback) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleAdminPlayTrack(track);
                        }
                      }}
                      style={{
                        width: "clamp(3rem,3.5vw,199rem)",
                      }}
                      className={`relative group/img shrink-0 aspect-square  cursor-pointer rounded-lg`}
                    >
                      <Image
                        width={200}
                        height={200}
                        src={track.image}
                        alt=""
                        className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
                      />

                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
                          <div className="flex items-end gap-[2px] h-3.5">
                            {[1, 2, 3].map((b) => (
                              <div
                                key={b}
                                className={`w-[2.5px] rounded-full bg-violet-300 ${
                                  playerState === "playing"
                                    ? "animate-bounce"
                                    : ""
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
                            <span className="text-[10px] font-semibold text-white">
                              ||
                            </span>
                          ) : (
                            <Icon name="play" size={12} className="text-white" />
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

                    {/* Like & Remove Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => toggleLike(track)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                          likedTrackIds.has(track.videoId)
                            ? "text-rose-500 fill-rose-500 hover:text-rose-450"
                            : "text-white/55 hover:bg-white/10 hover:text-white"
                        }`}
                        title={
                          likedTrackIds.has(track.videoId)
                            ? "Unlike track"
                            : "Like track"
                        }
                      >
                        <Icon
                          name={likedTrackIds.has(track.videoId) ? "favorite" : "heart"}
                          size={12}
                          className="text-current"
                        />
                      </button>
                      {canControlPlayback && (
                        <button
                          type="button"
                          onClick={() => removeFromQueue(track.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Remove from queue"
                        >
                          <Icon name="trash-2" size={12} className="text-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : visibleRecentTracks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center max-md:rounded-none md:rounded-[20px] md:border border-white/[0.06] max-md:bg-transparent md:bg-white/[0.03] max-md:backdrop-blur-none md:backdrop-blur-sm px-5 py-8 text-center text-white/55">
            <div>
              <div className="mx-auto mb-2.5 flex justify-center">
                <Icon name="clock-3" size={24} className="text-white/55" />
              </div>
              <p className="text-[13px]">No history yet</p>
            </div>
          </div>
        ) : (
          <div className="room-scroll flex-1 space-y-1 overflow-y-auto pr-1">
            {visibleRecentTracks.map((track, i) => {
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
                  className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all ${
                    isActive ? "bg-white/15" : "hover:bg-white/[0.06]"
                  }`}
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
                    style={{
                      width: "clamp(3rem,3.5vw,199rem)",
                    }}
                    className={`relative group/img shrink-0 aspect-square  cursor-pointer rounded-lg`}
                  >
                    <Image
                      width={200}
                      height={200}
                      src={track.image}
                      alt=""
                      className="h-full w-full rounded-lg object-cover transition-all duration-200 group-hover/img:brightness-50"
                    />

                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
                        <div className="flex items-end gap-[2px] h-3.5">
                          {[1, 2, 3].map((b) => (
                            <div
                              key={b}
                              className={`w-[2.5px] rounded-full bg-violet-300 ${
                                playerState === "playing"
                                  ? "animate-bounce"
                                  : ""
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
                          <span className="text-[10px] font-semibold text-white">
                            ||
                          </span>
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
                    <p className="truncate text-[11px] text-white/60">
                      {track.artistName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => toggleLike(historyTrack)}
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
                          likedTrackIds.has(historyTrack.videoId)
                            ? "favorite"
                            : "heart"
                        }
                        size={12}
                        className="text-current"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => addToQueue(historyTrack)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Add track to queue"
                    >
                      <Icon name="plus" size={12} className="text-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
