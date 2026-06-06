"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Profile } from "@/components/Profile";
import JoinCodeInput from "@/components/JoinCodeInput";

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
  const { user, loading: authLoading } = useAuth();
  const { rooms, loading, removeRoom } = useRooms(user, authLoading);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const autoCreated = useRef(false);

  // Auto-create a random room for first-time users
  useEffect(() => {
    if (loading || !user || rooms.length > 0 || autoCreated.current) return;
    autoCreated.current = true;
    const token = localStorage.getItem("blu3_token");
    const roomName = "Room " + Math.floor(1000 + Math.random() * 9000);
    fetch(`${API_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: roomName }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.room) router.replace(`/room/${data.room.code}`);
      })
      .catch(() => {
        autoCreated.current = false;
      });
  }, [loading, user, rooms, router]);

  const handleJoin = (code: string) => {
    if (!code.trim()) return;
    router.push(`/room/${code.trim().toUpperCase()}`);
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
    <div className="min-h-screen max-h-screen h-[100dvh] relative overflow-hidden">
      <div className="flex justify-center items-center z-10 h-full w-full overflow-hidden">
        <div className="flex flex-col justify-center items-center h-full w-full">
          <div className="flex absolute top-5 right-5 items-center  rounded-2xl overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none z-20  before:to-transparent">
            <div className="relative z-10 w-fit aspect-square">
              <Profile size="md" />
            </div>
          </div>

          <ScrollArea className="flex flex-col items-center justify-center h-full w-full">
            <div className="flex flex-wrap items-center justify-center content-center gap-4 py-16 px-6 w-full min-h-full">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : rooms.map((room) => {
                    const isHost = room.hostId === user?.id;
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
                  <div className="aspect-square text-neutral-600 hover:text-neutral-400  border-2 border-dashed border-white/20 hover:border-white/30 backdrop-blur-2xl flex items-center justify-center  rounded-lg transition-all shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
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
          </ScrollArea>
        </div>
      </div>

      <JoinCodeInput handleJoin={handleJoin} />

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
