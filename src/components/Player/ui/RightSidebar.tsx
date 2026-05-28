"use client";
import { useState, useEffect, useRef } from "react";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme } from "@/utils/roomHelpers";
import { Icon } from "@/hooks/useIcon";

type SideTab = "queue" | "history";

interface Member {
  userId: string;
  name: string;
  avatar?: string;
}
interface Message {
  id: string;
  name: string;
  text: string;
  avatar?: string;
}

interface Props {
  members: Member[];
  messages: Message[];
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
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  playerState?: string;
  onChatToggle?: () => void;
  unreadChatCount?: number;
  onSearchClick?: () => void;
  user?: { sub: string; email: string; name: string; avatar?: string } | null;
  onLogout?: () => void;
}

export function RightSidebar({
  members,
  messages,
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  clearQueue,
  activeVideoId,
  playerState,
  onChatToggle,
  unreadChatCount = 0,
  onSearchClick,
  user,
  onLogout,
}: Props) {
  const [tab, setTab] = useState<SideTab>("queue");

  // Playlist selection states for room queueing
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMembersPopup, setShowMembersPopup] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showDropdown]);

  const handlePlusClick = async () => {
    if (showDropdown) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    setLoadingPlaylists(true);
    const token = localStorage.getItem("blu3_token");
    if (!token) {
      setLoadingPlaylists(false);
      return;
    }
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.playlists) {
        setPlaylists(data.playlists);
      }
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

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
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to queue playlist:", err);
    }
  };

  const tabBtn = (t: SideTab, active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-[10px] uppercase tracking-[0.15em] border-none bg-transparent cursor-pointer relative transition-all ${
      active
        ? "text-white"
        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
      {/* Members strip (always visible) */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={() => setShowMembersPopup(true)}
            className="flex flex-wrap -space-x-2 cursor-pointer"
          >
            {members.map((m, i) => (
              <div
                key={i}
                className="flex items-center rounded-full border-2 border-white/40"
              >
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    alt=""
                    className="h-5 w-5 aspect-square rounded-full object-cover"
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-violet-400/25 flex items-center justify-center text-[8px] text-violet-300 font-semibold">
                    {m.name[0]}
                  </div>
                )}
              </div>
            ))}
          </button>

          {showMembersPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowMembersPopup(false)}>
              <div className="w-72 rounded-[24px] border border-white/[0.12] bg-neutral-900/95 p-5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-[15px]">Members ({members.length})</h2>
                  <button onClick={() => setShowMembersPopup(false)} className="text-white/40 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto room-scroll">
                  {members.map((m, i) => {
                    const isMe = user?.sub === m.userId || user?.email === m.userId;
                    return (
                      <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04]">
                        <div className="flex items-center rounded-full border-2 border-white/30 shrink-0">
                          {m.avatar ? (
                            <img src={m.avatar} alt="" className="h-7 w-7 aspect-square rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-violet-400/25 flex items-center justify-center text-[9px] text-violet-300 font-semibold">
                              {m.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] text-white/80 font-medium truncate flex-1">
                          {m.name}
                          {isMe && <span className="text-[9px] text-white/40 ml-1.5">(you)</span>}
                        </span>
                        {isMe && onLogout && (
                          <button
                            onClick={() => { setShowMembersPopup(false); onLogout(); }}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-red-400 hover:bg-white/10 transition-all shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Logout
                          </button>
                        )}
                        {isMe && !onLogout && (
                          <span className="text-[9px] text-white/30 italic">you</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-1 relative" ref={dropdownRef}>
            <button
              onClick={() => onSearchClick?.()}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-white/80 cursor-pointer"
              title="Search songs"
            >
              <Icon name="search" size={14} className="text-current" />
            </button>

            <button
              onClick={handlePlusClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-white/80 cursor-pointer"
              title="Add playlist to queue"
            >
              <Icon name="plus" size={14} className="text-current" />
            </button>

            {onChatToggle && (
              <button
                onClick={onChatToggle}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-white/80 cursor-pointer"
                title="Toggle chat"
              >
                <Icon name="message-square" size={14} className="text-current" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5">
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {clearQueue && canControlPlayback && tab === "queue" && queue.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-white/80 cursor-pointer"
                title="Clear queue"
              >
                <Icon name="trash-2" size={14} className="text-current" />
              </button>
            )}

            {showDropdown && (
              <div className="absolute right-0 mt-12 w-64 rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] z-50 py-1.5 max-h-64 overflow-y-auto room-scroll">
                <div className="px-3 py-1.5 border-b border-white/[0.06] text-[9px] uppercase tracking-wider text-white/50 font-bold">
                  Queue Playlist
                </div>
                {loadingPlaylists ? (
                  <div className="px-3 py-3 text-[10px] text-white/40">
                    Loading...
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="px-3 py-3 text-[10px] text-white/40">
                    No playlists found
                  </div>
                ) : (
                  <div>
                    {playlists.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleQueuePlaylist(p.id)}
                        className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-[11px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/10">
                          {p.coverImage ? (
                            <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <Icon name="list-music" size={12} className="text-current" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-white/90">{p.name}</p>
                          <p className="text-[9px] text-white/40">{p.trackCount ?? 0} tracks</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowClearConfirm(false)}>
          <div className="w-72 rounded-[24px] border border-white/20 bg-slate-900/90 p-6 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-semibold text-[15px]">Clear queue?</h2>
              <button onClick={() => setShowClearConfirm(false)} className="text-white/40 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <p className="text-white/50 text-[12px] mb-5">Remove all tracks from the queue?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 rounded-full border border-white/20 bg-white/8 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white">Cancel</button>
              <button onClick={() => { setShowClearConfirm(false); clearQueue?.(); }} className="flex-1 rounded-full bg-red-500/80 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-red-500">Clear</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-white/10 flex-shrink-0">
        <button
          className={tabBtn("queue", tab === "queue")}
          onClick={() => setTab("queue")}
        >
          <Icon name="list-music" size={11} className="text-current" />
          <span className="text-[9px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded-full ml-0.5">
            {queue.length}
          </span>
          {tab === "queue" && (
            <div className="absolute bottom-[-1px] left-4 right-4 h-[2px] bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" />
          )}
        </button>
        <button
          className={tabBtn("history", tab === "history")}
          onClick={() => setTab("history")}
        >
          <Icon name="clock-3" size={11} className="text-current" />
          {tab === "history" && (
            <div className="absolute bottom-[-1px] left-4 right-4 h-[2px] bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Queue and history share the same panel component */}
        {(tab === "queue" || tab === "history") && (
          <div className="flex-1 min-h-0">
            <QueueAndHistory
              queue={queue}
              recentTracks={recentTracks}
              canControlPlayback={canControlPlayback}
              handleAdminPlayTrack={handleAdminPlayTrack}
              removeFromQueue={removeFromQueue}
              addToQueue={addToQueue}
              clearQueue={clearQueue}
              activeVideoId={activeVideoId}
              defaultTab={tab}
              playerState={playerState}
            />
          </div>
        )}
      </div>
    </div>
  );
}
