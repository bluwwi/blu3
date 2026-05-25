"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

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

// Hook to fetch rooms with last played track info
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

    // Fetch rooms, then for each room fetch last track from history
    fetch(`${API_URL}/api/rooms/user/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(async (data) => {
        const roomList: RoomInfo[] = data.rooms ?? [];

        // Fetch last track for each room in parallel
        const enriched = await Promise.all(
          roomList.map(async (room) => {
            try {
              const res = await fetch(
                `${API_URL}/api/rooms/${room.code}/history?limit=1`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              const histData = await res.json();
              const lastTrack: LastTrack | null = histData.history?.[0] ?? null;
              return { ...room, lastTrack };
            } catch {
              return { ...room, lastTrack: null };
            }
          }),
        );

        setRooms(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  return { rooms, loading, setRooms };
}

export default function BrowsePage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { rooms, loading, setRooms } = useRooms(user, authLoading);
  const [joinCode, setJoinCode] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleCreate = async () => {
    const name = prompt("Room name?");
    if (!name?.trim()) return;
    const token = localStorage.getItem("blu3_token");
    const res = await fetch(`${API_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.room) router.push(`/room/${data.room.code}`);
  };

  // Skeleton placeholder cards
  const SkeletonCard = () => (
    <div className="flex flex-col gap-2">
      <div className="aspect-square rounded-xl bg-zinc-900 animate-pulse" />
      <div className="h-3 w-3/4 bg-zinc-900 rounded animate-pulse" />
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#080808] text-white flex flex-col"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        .room-card-img {
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      filter 0.35s ease;
        }
        .room-card:hover .room-card-img {
          transform: scale(1.04);
          filter: brightness(0.65);
        }
        .room-card-overlay {
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .room-card:hover .room-card-overlay {
          opacity: 1;
        }
        .room-card {
          cursor: pointer;
        }
        .create-card {
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .create-card:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
        }
        .join-input:focus {
          outline: none;
          border-color: rgba(255,255,255,0.3);
        }
        .join-btn {
          transition: background 0.15s ease;
        }
        .join-btn:hover {
          background: #e4e4e4;
        }
        .active-dot {
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Top-right nav */}
      <div className="absolute top-5 right-6 flex items-center gap-4 z-10">
        {user ? (
          <>
            {user.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
              />
            )}
            <span className="text-[11px] text-zinc-500 tracking-widest truncate max-w-[140px]">
              {user.email}
            </span>
          </>
        ) : (
          <button
            onClick={login}
            className="text-[11px] border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:border-zinc-500 transition-colors tracking-widest uppercase"
          >
            sign in
          </button>
        )}
        <Link
          href="/"
          className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors tracking-widest uppercase"
        >
          player →
        </Link>
      </div>

      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32 pt-10">
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
          <>
            {/* Grid of room cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 w-full max-w-5xl">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : rooms.map((room) => (
                    <div
                      key={room.id}
                      className="room-card flex flex-col gap-2"
                      onClick={() => router.push(`/room/${room.code}`)}
                      onMouseEnter={() => setHoveredId(room.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900">
                        {room.lastTrack?.image ? (
                          <img
                            src={room.lastTrack.image}
                            alt={room.lastTrack.trackName}
                            className="room-card-img w-full h-full object-cover"
                          />
                        ) : (
                          <div className="room-card-img w-full h-full flex items-center justify-center bg-zinc-800">
                            <span className="text-3xl opacity-20">♫</span>
                          </div>
                        )}

                        {/* Hover overlay — play arrow */}
                        <div className="room-card-overlay absolute inset-0 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <svg
                              viewBox="0 0 24 24"
                              fill="white"
                              className="w-4 h-4 ml-0.5"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Active dot */}
                        {room.isActive && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 active-dot" />
                        )}

                        {/* Host badge */}
                        {room.hostId === user?.sub && (
                          <span className="absolute bottom-2 left-2 text-[8px] bg-black/60 backdrop-blur-sm text-zinc-300 px-1.5 py-0.5 rounded tracking-widest uppercase">
                            host
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      <div className="px-0.5">
                        <p className="text-[11px] text-zinc-300 truncate leading-tight">
                          {room.lastTrack
                            ? room.lastTrack.artistName
                            : room.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate tracking-widest mt-0.5">
                          {room.name} • {room.code}
                        </p>
                      </div>
                    </div>
                  ))}

              {/* Create Room card */}
              {!loading && (
                <div
                  className="create-card flex flex-col gap-2 cursor-pointer"
                  onClick={handleCreate}
                >
                  <div className="aspect-square rounded-xl border border-dashed border-zinc-700 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1.5"
                      className="w-10 h-10"
                    >
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="px-0.5">
                    <p className="text-[11px] text-zinc-400 tracking-wide">
                      Create Room
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom join bar — fixed */}
      {(user || !authLoading) && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-8 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Star / fav icon placeholder */}
            <button className="text-zinc-600 hover:text-zinc-400 transition-colors p-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>

            <div className="flex items-center bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden pl-4 pr-1 py-1">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter room Link or id"
                maxLength={8}
                className="join-input bg-transparent text-sm text-white placeholder-zinc-600 w-52 border-none focus:outline-none tracking-wide"
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
    </div>
  );
}
