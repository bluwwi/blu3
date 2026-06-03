"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LastTrack {
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  playedAt: string;
}

interface RoomInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  isActive: boolean;
  createdAt: string;
  lastTrack?: LastTrack | null;
}

function useRooms(user: any, authLoading: boolean) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("blu3_token");

    fetch(`${API_URL}/api/rooms/user/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("Rooms API response:", data);
        setRooms(data.rooms ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const removeRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  return { rooms, loading, removeRoom };
}

export default function BrowsePage() {
  const router = useRouter();
  const { user, loading: authLoading, login, logout } = useAuth();
  const { rooms, loading, removeRoom } = useRooms(user, authLoading);
  const [joinCode, setJoinCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const autoCreated = useRef(false);

  // Auto-create ROOM 1 for first-time users
  useEffect(() => {
    if (loading || !user || rooms.length > 0 || autoCreated.current) return;
    autoCreated.current = true;
    const token = localStorage.getItem("blu3_token");
    fetch(`${API_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "ROOM 1" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.room) router.replace(`/room/${data.room.code}`);
      })
      .catch(() => {
        autoCreated.current = false;
      });
  }, [loading, user, rooms, router]);

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleCreate = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      const data = await res.json();
      if (data.room) router.push(`/room/${data.room.code}`);
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewRoomName("");
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, room: RoomInfo) => {
    e.stopPropagation();
    if (!confirm(`Delete room "${room.name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/rooms/${room.code}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) removeRoom(room.id);
    } catch (err) {
      console.error("Failed to delete room:", err);
    }
  };

  const handleLeaveRoom = async (e: React.MouseEvent, room: RoomInfo) => {
    e.stopPropagation();
    if (!confirm(`Leave room "${room.name}"?`)) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/rooms/${room.code}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) removeRoom(room.id);
    } catch (err) {
      console.error("Failed to leave room:", err);
    }
  };

  const SkeletonCard = () => (
    <div className="flex flex-col gap-2 w-28 sm:w-32 md:w-36 lg:w-48">
      <div className="aspect-square rounded-md bg-white/5 animate-pulse" />
      <div className="h-2.5 w-3/4 bg-white/5 rounded animate-pulse mt-1" />
      <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="h-full min-h-screen relative overflow-hidden">
      <div className=" min-h-screen flex justify-center items-center  z-10 h-full w-full overflow-hidden">
        <div className=" flex flex-col justify-center items-center h-full min-h-screen w-full ">
          <div className="flex absolute top-5 items-center border border-white/80 mt-2 rounded-2xl justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 bg-white/5 backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none  before:to-transparent">
            <Link
              href="/browse"
              className="text-lg font-black tracking-tight text-white hover:opacity-80 transition-opacity relative z-10"
            >
              blu3
            </Link>

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center gap-4 border-l border-white/10 pl-4 h-4">
                <Link
                  href="/browse"
                  className="text-[10px] tracking-widest uppercase text-white font-medium transition-colors"
                >
                  Rooms
                </Link>
                <Link
                  href="/playlists"
                  className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-white font-medium transition-colors"
                >
                  Playlists
                </Link>
              </div>
            </div>

            <div className="relative z-10">
              {user ? (
                <div className="relative">
                  {/* ✅ Toggle button always renders for authenticated users */}
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="focus:outline-none"
                    aria-label="Open profile menu"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer"
                      />
                    ) : (
                      /* Fallback: initials or default icon */
                      <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {user.name?.[0] || "U"}
                      </div>
                    )}
                  </button>

                  {/* Popup menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-32 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase tracking-widest"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={login}
                  className="text-[11px] border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:border-zinc-500 transition-colors tracking-widest uppercase"
                >
                  sign in
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-wrap flex flex-col items-center justify-center h-full min-h-screen">
            {!user && !authLoading ? (
              <div className="text-center">
                <p className="text-4xl font-black tracking-tight mb-2 text-white">
                  blu3
                </p>
                <p className="text-[11px] text-zinc-600 tracking-widest mb-10">
                  listen together
                </p>
                <p className="text-zinc-600 text-sm mb-5 tracking-wide">
                  sign in to create or join rooms
                </p>
                <button
                  onClick={login}
                  className="px-5 py-2.5 bg-white text-black text-xs rounded-lg tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors"
                >
                  sign in with google
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-center gap-6 py-24 md:py-0 w-full h-full">
                {loading
                  ? Array.from({ length: 9 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))
                  : rooms.map((room) => {
                      const isHost = room.hostId === user?.sub;
                      return (
                        <div
                          key={room.id}
                          className="room-card flex flex-col gap-2 relative group/card w-28 sm:w-32 md:w-36 lg:w-40"
                          onClick={() => router.push(`/room/${room.code}`)}
                        >
                          <div className="relative aspect-square  overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] before:absolute before:inset-0  before:pointer-events-none  before:to-transparent">
                            {room.lastTrack?.image ? (
                              <Image
                                width={400}
                                height={400}
                                src={room.lastTrack.image}
                                alt={room.name}
                                className="room-card-img rounded-md w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl text-white/20 select-none">
                                  ♫
                                </span>
                              </div>
                            )}

                            <div className="room-play-overlay hover:border-2  border-white rounded-md  cursor-pointer absolute inset-0 flex items-center justify-center"></div>

                            <button
                              onClick={(e) =>
                                isHost
                                  ? handleDeleteRoom(e, room)
                                  : handleLeaveRoom(e, room)
                              }
                              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-400/40 cursor-pointer z-10"
                              title={isHost ? "Delete room" : "Leave room"}
                            >
                              <Trash2 className="w-3 h-3 text-white/80" />
                            </button>
                          </div>
                          <div className="px-0.5 mt-1 flex overflow-hidden relative w-full items-center">
                            <p className="text-xs md:text-[14px]   text-white truncate  leading-tight">
                              {room.hostName} • {room.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                {!loading && (
                  <div
                    className="create-card flex flex-col gap-2 w-28 sm:w-32 md:w-36 lg:w-40 cursor-pointer"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <div className="aspect-square text-neutral-700 hover:text-neutral-400  border-2 border-dashed border-white/20 hover:border-white/30 backdrop-blur-2xl flex items-center justify-center  rounded-lg transition-all shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                      <Plus
                        className="create-plus w-30 h-30  transition-all"
                        strokeWidth={2.25}
                      />
                    </div>
                    <div className="px-0.5">
                      <p className="text-xs md:text-sm text-center uppercase text-white tracking-wide">
                        Create Room
                      </p>
                    </div>
                  </div>
                )}
              </div>
              )}
            </ScrollArea>
          </div>
        </div>

      {/* Join Room Bar */}
      {(user || !authLoading) && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-8 pointer-events-none z-20">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="border border-white/[0.08] flex items-center rounded-2xl overflow-hidden pl-4 pr-1 py-1 bg-white/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="enter room code"
                maxLength={8}
                className="join-input bg-transparent text-sm text-white w-52 border-none tracking-wide"
              />
              <button
                onClick={handleJoin}
                className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-lg tracking-widest uppercase cursor-pointer hover:bg-zinc-200 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewRoomName("");
            }
          }}
        >
          <div className="modal-box w-full max-w-sm mx-4 rounded-[24px] p-6 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
            <p className="text-base font-black tracking-tight text-white mb-1 relative z-10">
              new room
            </p>
            <p className="text-[11px] text-zinc-500 tracking-widest mb-5 relative z-10 uppercase">
              give it a name
            </p>

            <input
              autoFocus
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowCreateModal(false);
                  setNewRoomName("");
                }
              }}
              placeholder="room name..."
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 tracking-wide mb-4 focus:outline-none focus:border-white/25 transition-colors relative z-10"
            />

            <div className="flex gap-2 relative z-10">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoomName("");
                }}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-500 text-[11px] tracking-widest uppercase font-bold hover:border-white/20 hover:text-zinc-300 transition-all cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newRoomName.trim() || creating}
                className="flex-1 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {creating ? "creating..." : "create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
