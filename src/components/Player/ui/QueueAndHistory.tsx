"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { Track } from "@/utils/types";
import { usePlaylists } from "@/hooks/usePlaylists";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";
import { Shuffle, Repeat, MoreVertical, Trash2, Plus } from "lucide-react";
import Lottie from "lottie-react";
import pandaBamboo from "@/assets/lolite/pandabamboo.json";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { PlaylistModal } from "./PlaylistModal";
import { ImportToast, type ImportStatus } from "./ImportToast";

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
  onSearchClick?: () => void;
  userName?: string;
}

export function QueueAndHistory({
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  activeVideoId,
  playerState,
  shuffleEnabled = false,
  repeatMode = "off",
  onToggleShuffle,
  onCycleRepeat,
  onSearchClick,
  clearQueue,
  userName,
}: Props) {
  const { likedTrackIds, toggleLike } = usePlaylists();

  const showRecent = useMemo(() => {
    if (queue.length > 0 || recentTracks.length === 0) return false;
    const newestPlayedAt = Math.max(...recentTracks.map((t) => t.playedAt));
    return Date.now() - newestPlayedAt > 1800000;
  }, [queue.length, recentTracks]);

  const recentToShow = useMemo(() => {
    if (!showRecent) return [];
    const filtered = recentTracks.filter((t) => t.videoId !== activeVideoId);
    return filtered.slice(0, 10);
  }, [showRecent, recentTracks, activeVideoId]);

  const [showMenu, setShowMenu] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu]);

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: "idle" });

  const handleQueuePlaylist = async (playlistId: string) => {
    const token = localStorage.getItem("blu3_token");
    if (!token) return;
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        data.tracks.forEach((t: any) => {
          addToQueue({
            id: t.id,
            source: "youtube",
            videoId: t.videoId,
            name: t.trackName,
            artists: [{ name: t.artistName }],
            album: { name: "" },
            image: t.image || "",
            duration_ms: t.durationMs || 0,
            explicit: false,
          });
        });
      }
    } catch (err) {
      console.error("Failed to queue playlist:", err);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-1">
      <div className="flex items-center gap-2 px-2">
        <span className="text-lg text-white">
          Queue {"("}
          {queue.length}
          {")"}
        </span>

        <div className="ml-auto relative flex gap-1 ">
          <button
            onClick={() => onSearchClick?.()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/30 backdrop-blur-md text-white hover:bg-white/40 cursor-pointer transition-all"
            title="Search songs"
          >
            <Icon name="search" size={20} className="text-current" />
          </button>
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/30 backdrop-blur-md text-white hover:bg-white/40 cursor-pointer transition-all"
            title="Add playlist to queue"
          >
            <Plus size={20} />
          </button>

          <button
            onClick={() => {
              setManageMode(!manageMode);
              if (manageMode) setSelectedIds(new Set());
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-md text-white cursor-pointer transition-all ${
              manageMode
                ? "bg-[#C0392B]/80 text-white"
                : "bg-white/30 hover:bg-white/40"
            }`}
            title={
              manageMode ? "Exit selection mode" : "Select tracks to remove"
            }
          >
            <Trash2
              size={20}
              className={manageMode ? "text-white" : "text-current"}
            />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/30  backdrop-blur-md text-white hover:bg-white/40 cursor-pointer transition-all ${
                showMenu
                  ? "bg-white/40 text-black"
                  : "bg-white/10 text-black hover:bg-white/40"
              }`}
              title="More options"
            >
              <Icon name="menu" size={20} className="text-current" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl backdrop-blur-2xl border overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] z-50 py-1.5"
                style={{
                  background: "var(--room-surface, #0D0D14)",
                  borderColor: "var(--room-border, rgba(255,255,255,0.08))",
                }}
              >
                <button
                  onClick={() => {
                    onToggleShuffle?.();
                  }}
                  disabled={!onToggleShuffle}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] transition-all disabled:opacity-30 ${
                    shuffleEnabled
                      ? "text-violet-300"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      shuffleEnabled
                        ? "bg-violet-400 border-violet-400"
                        : "border-white/30"
                    }`}
                  >
                    {shuffleEnabled && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <Shuffle size={14} />
                  <span className="flex-1 text-left">Shuffle</span>
                </button>

                <button
                  onClick={() => {
                    onCycleRepeat?.();
                  }}
                  disabled={!onCycleRepeat}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] transition-all disabled:opacity-30 ${
                    repeatMode !== "off"
                      ? "text-violet-300"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      repeatMode !== "off"
                        ? "bg-violet-400 border-violet-400"
                        : "border-white/30"
                    }`}
                  >
                    {repeatMode !== "off" && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <Repeat size={14} />
                  <span className="flex-1 text-left">
                    Repeat{" "}
                    {repeatMode !== "off"
                      ? `(${repeatMode === "one" ? "1" : "all"})`
                      : ""}
                  </span>
                </button>

                {clearQueue && canControlPlayback && queue.length > 0 && (
                  <button
                    onClick={() => {
                      clearQueue?.();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/10 transition-all"
                  >
                    <Trash2 size={14} />
                    <span>Delete all queue</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {manageMode && queue.length > 0 && (
        <div className="flex pl-2.5 py-0 pr-3.5 md:pr-5 items-center justify-between">
          <div className="flex  items-center gap-2">
            <button
              onClick={() => {
                selectedIds.forEach((id) => removeFromQueue(id));
                setSelectedIds(new Set());
                setManageMode(false);
              }}
              style={{
                width: "clamp(3.5rem,3vw,199rem)",
              }}
              disabled={selectedIds.size === 0}
              className="flex aspect-square    items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#C0392B] text-sm text-white transition-all hover:bg-[#C0392B]/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <p
                className="truncate font-medium text-white"
                style={{
                  fontSize: "clamp(0.85rem,0.75vw,199rem)",
                }}
              >
                Delete All
              </p>
              <p className="truncate text-[11px] text-white/60">
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : "(0)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ">
            <div
              onClick={() => {
                if (selectedIds.size === queue.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(queue.map((t) => t.id)));
                }
              }}
              className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all cursor-pointer ${
                  selectedIds.size === queue.length
                    ? "bg-blue-100 border-blue-100"
                    : "border-white/40 hover:border-white/70"
                }`}
              >
                {selectedIds.size === queue.length && (
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
          </div>
        </div>
      )}

      <section className="flex min-h-0 flex-1 flex-col">
        {queue.length > 0 ? (
          <>
            <ScrollArea className="flex-1 space-y-1 pr-1">
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
                        if (manageMode) return;
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
                        width: "clamp(3.5rem,3vw,199rem)",
                      }}
                      className="relative group/img shrink-0 aspect-square cursor-pointer rounded-lg"
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
                            <span className="text-[20px] font-bold text-white">
                              ||
                            </span>
                          ) : (
                            <Icon
                              name="playmusic"
                              size={16}
                              className="text-white"
                            />
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
                      <div className="shrink-0 flex items-center">
                        <div
                          onClick={() => {
                            const newSet = new Set(selectedIds);
                            if (newSet.has(track.id)) {
                              newSet.delete(track.id);
                            } else {
                              newSet.add(track.id);
                            }
                            setSelectedIds(newSet);
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => toggleLike(track)}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                            likedTrackIds.has(track.videoId)
                              ? "text-rose-500 fill-rose-500 hover:text-rose-450"
                              : "text-white/55  hover:text-white"
                          }`}
                          title={
                            likedTrackIds.has(track.videoId)
                              ? "Unlike track"
                              : "Like track"
                          }
                        >
                          <Icon
                            name={
                              likedTrackIds.has(track.videoId)
                                ? "favorite"
                                : "heart"
                            }
                            size={25}
                            className="text-current cursor-pointer"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </>
        ) : showRecent && recentToShow.length > 0 ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-2.5 pb-2 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              Previously played
            </div>
            <ScrollArea className="flex-1 space-y-1 pr-1">
              {recentToShow.map((track, i) => {
                const historyTrack: Track = {
                  id: track.videoId,
                  source: (track as any).source ?? "youtube",
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
                      isActive ? "bg-white/15" : "hover:bg-white/6"
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
                      className="relative group/img shrink-0 aspect-square cursor-pointer rounded-lg"
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
                            <Icon
                              name="play"
                              size={12}
                              className="text-white"
                            />
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

                    {!manageMode && (
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
                          <Icon
                            name="plus"
                            size={12}
                            className="text-current"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden max-md:rounded-none md:rounded-[20px] max-md:border-0 md:border md:border-white/6 max-md:bg-transparent md:bg-white/3 max-md:backdrop-blur-none md:backdrop-blur-sm px-3 py-8 text-center text-white/55">
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="">
                <p className="text-blue-200 text-2xl md:text-4xl font-bold">
                  {userName?.split(" ")[0]}
                  {","}
                </p>
                <p className="text-white/90 text-xl md:text-3xl font-bold">
                  looks like your <br /> queue is empty
                </p>
              </div>
              <button
                onClick={onSearchClick}
                className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:bg-white/85 transition-all duration-300"
              >
                Add Songs
              </button>
              <div className="flex items-center -mb-5 gap-3">
                {[
                  { delay: 0, offset: "-mt-2" },
                  { delay: 0.4, offset: "mt-1" },
                  { delay: 0.8, offset: "-mt-3" },
                  { delay: 1.2, offset: "mt-2" },
                ].map((z) => (
                  <span
                    key={z.delay}
                    className={`text-white text-3xl font-bold dot-glow ${z.offset}`}
                    style={{ animationDelay: `${z.delay}s` }}
                  >
                    z
                  </span>
                ))}
              </div>
              <div className="w-50 h-25 lg:w-60 lg:h-30 -z-10 flex items-center justify-center overflow-hidden">
                <Lottie
                  animationData={pandaBamboo}
                  loop
                  autoplay
                  style={{ width: "clamp(30rem,30vw,199rem)", height: 500 }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <PlaylistModal
        open={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        onQueuePlaylist={handleQueuePlaylist}
        onImportStatus={setImportStatus}
      />
      <ImportToast status={importStatus} onDismiss={() => setImportStatus({ type: "idle" })} />
    </div>
  );
}
