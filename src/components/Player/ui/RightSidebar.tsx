"use client";
import { useState, useEffect, useRef } from "react";
import { Clock3, ListMusic, MessageSquare, Search, Plus } from "lucide-react";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme, T } from "@/utils/roomHelpers";

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
}: Props) {
  const [tab, setTab] = useState<SideTab>("queue");

  // Playlist selection states for room queueing
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
    `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] uppercase tracking-[0.15em] border-none bg-transparent cursor-pointer relative transition-colors rounded-t-lg ${
      active
        ? "text-white"
        : "text-white/40 hover:text-white/70 hover:bg-white/5"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
      {/* Members strip (always visible) */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap -space-x-2">
            {members.map((m, i) => (
              <div
                key={i}
                className="flex items-center rounded-full border-2  border-white/60 "
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
          </div>
          <div className="flex gap-1 relative" ref={dropdownRef}>
            {/*FOR SEARCH*/}
            <button
              onClick={() => onSearchClick?.()}
              className="relative text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Search songs"
            >
              <div className="rounded-xl border-white/40 border p-3">
                <Search size={14} className="text-white/50" />
              </div>
            </button>
            {onChatToggle && (
              <button
                onClick={onChatToggle}
                className="relative text-white/40 hover:text-white transition-colors cursor-pointer"
                title="Toggle chat"
              >
                <div className="rounded-xl border-white/40 border p-3">
                  <MessageSquare size={14} className="text-white/50 " />
                </div>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5">
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </span>
                )}
              </button>
            )}
            
            {/* PLUS BUTTON TO QUEUE PLAYLISTS */}
            <button
              onClick={handlePlusClick}
              className="relative text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Add playlist to queue"
            >
              <div className="rounded-xl border-white/40 border p-3">
                <Plus size={14} className="text-white/50" />
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-12 w-48 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50 py-1 max-h-56 overflow-y-auto room-scroll">
                <div className="px-3 py-1.5 border-b border-white/5 text-[9px] uppercase tracking-wider text-zinc-550 font-bold">
                  Queue Playlist
                </div>
                {loadingPlaylists ? (
                  <div className="px-3 py-2 text-[10px] text-zinc-400">Loading...</div>
                ) : playlists.length === 0 ? (
                  <div className="px-3 py-2 text-[10px] text-zinc-400">No playlists found</div>
                ) : (
                  playlists.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleQueuePlaylist(p.id)}
                      className="w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white transition-colors truncate"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10 flex-shrink-0">
        <button
          className={tabBtn("queue", tab === "queue")}
          onClick={() => setTab("queue")}
        >
          <ListMusic size={11} />
          <span className="text-[9px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded-full ml-0.5">
            {queue.length}
          </span>
          {tab === "queue" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-400 rounded-t" />
          )}
        </button>
        <button
          className={tabBtn("history", tab === "history")}
          onClick={() => setTab("history")}
        >
          <Clock3 size={11} />
          {tab === "history" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-400 rounded-t" />
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
