"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { Delete, Trash2 } from "lucide-react";

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
  hostName?: string;
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
    <div className="flex flex-col gap-2">
      <div className="aspect-square rounded-xl bg-zinc-900 animate-pulse" />
      <div className="h-2.5 w-3/4 bg-zinc-900 rounded animate-pulse mt-1" />
      <div className="h-2 w-1/2 bg-zinc-900/60 rounded animate-pulse" />
    </div>
  );

  return (
    <div
      className="h-screen bg-[#080808] text-white flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        .room-card-img {
          transition: transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      filter 0.38s ease;
          will-change: transform;
        }
        .room-card:hover .room-card-img {
          transform: scale(1.06);
          filter: brightness(0.55);
        }
        .room-card-overlay {
          opacity: 0;
          transition: opacity 0.22s ease;
        }
        .room-card:hover .room-card-overlay {
          opacity: 1;
        }
        .room-card { cursor: pointer; }

        .create-card {
          transition: border-color 0.2s ease, background 0.2s ease;
          cursor: pointer;
        }
        .create-card:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.03);
        }
        .create-card:hover .create-plus {
          stroke: rgba(255,255,255,0.55);
        }
        .create-plus {
          transition: stroke 0.2s ease;
        }

        .join-pill {
          background: #111111;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .join-input { caret-color: white; }
        .join-input:focus { outline: none; }
        .join-btn { transition: background 0.15s ease; }
        .join-btn:hover { background: #e4e4e4; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .active-dot { animation: pulse-dot 2s infinite; }

        /* Modal */
        .modal-backdrop {
          animation: fadeIn 0.18s ease;
        }
        .modal-box {
          animation: slideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .room-name-input {
          caret-color: white;
          transition: border-color 0.15s ease;
        }
        .room-name-input:focus {
          outline: none;
          border-color: rgba(255,255,255,0.3);
        }
      `}</style>

      <div className="absolute top-5 right-6 flex items-center gap-4 z-50">
        {user ? (
          <div className="relative">
            {user.avatar && (
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer"
                />
              </button>
            )}
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase tracking-widest"
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 pt-14 overflow-y-auto">
        {!user && !authLoading ? (
          <div className="text-center">
            <p
              className="text-4xl font-extrabold tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
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
              className="px-5 py-2.5 bg-white text-black text-xs rounded-xl tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors"
            >
              sign in with google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-4 gap-y-6 w-full max-w-5xl">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : rooms.map((room) => {
                  const isHost = room.hostId === user?.sub;
                  return (
                    <div
                      key={room.id}
                      className="room-card flex flex-col gap-2 relative group/card"
                      onClick={() => router.push(`/room/${room.code}`)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900">
                        {room.lastTrack?.image ? (
                          <Image
                            width={200}
                            height={200}
                            src={room.lastTrack.image}
                            alt={room.name}
                            className="room-card-img w-full h-full object-cover"
                          />
                        ) : (
                          <div className="room-card-img w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <span className="text-3xl opacity-20 select-none">
                              ♫
                            </span>
                          </div>
                        )}

                        <button
                          onClick={(e) =>
                            isHost
                              ? handleDeleteRoom(e, room)
                              : handleLeaveRoom(e, room)
                          }
                          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-400/40 cursor-pointer z-10"
                          title={isHost ? "Delete room" : "Leave room"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Label — room name + host badge only */}
                      <div className="px-0.5">
                        <p className="text-[11px] text-zinc-300 truncate leading-tight">
                          {room.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate tracking-widest mt-0.5">
                          {isHost ? (
                            <span className="text-zinc-500">host</span>
                          ) : (
                            <span className="text-zinc-600">joined</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}

            {!loading && (
              <div
                className="create-card flex flex-col gap-2"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="aspect-square rounded-xl border  border-zinc-600 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    className="create-plus w-16 h-16"
                    stroke="rgba(255,255,255,0.5)"
                  >
                    <path strokeLinecap="round" d="M12 4v16M4 12h16" />
                  </svg>
                </div>
                <div className="px-0.5">
                  <p className="text-[11px] text-zinc-500 tracking-wide">
                    Create Room
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(user || !authLoading) && (
        <div className="fixed bottom-0 left-0  right-0 flex justify-center pb-8 pointer-events-none">
          <div className="flex items-center gap-3  pointer-events-auto">
            <div className="border-2 border-white/30 flex items-center rounded-2xl  overflow-hidden pl-4 pr-1 py-1">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="enter room code"
                maxLength={8}
                className="join-input bg-transparent text-sm text-white placeholder-white/30 w-52 border-none tracking-wide"
              />
              <button
                onClick={handleJoin}
                className="join-btn px-4 py-1.5 bg-white text-black text-xs font-medium rounded-xl tracking-widest uppercase"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Room Modal ── */}
      {showCreateModal && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewRoomName("");
            }
          }}
        >
          <div
            className="modal-box w-full max-w-sm mx-4 rounded-2xl p-6"
            style={{
              background: "rgba(18,18,18,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
            }}
          >
            <p
              className="text-base font-bold tracking-tight mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              new room
            </p>
            <p className="text-[11px] text-zinc-600 tracking-widest mb-5">
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
              className="room-name-input w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 tracking-wide mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoomName("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-xs tracking-widest uppercase hover:border-zinc-600 hover:text-zinc-300 transition-all"
              >
                cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newRoomName.trim() || creating}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-medium tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {creating ? "creating…" : "create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
