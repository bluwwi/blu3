"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RoomInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  isActive: boolean;
  createdAt: string;
}

export default function BrowsePage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");

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
      .then((data) => setRooms(data.rooms ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

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

  return (
    <div
      className="min-h-screen bg-[#080808] text-white"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              blu3
            </h1>
            <p className="text-xs text-zinc-600 tracking-widest mt-1">
              listen together
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.avatar && (
                  <img
                    src={user.avatar}
                    className="w-7 h-7 rounded-full border border-zinc-700"
                  />
                )}
                <span className="text-xs text-zinc-400 truncate max-w-[140px]">
                  {user.email}
                </span>
              </>
            ) : (
              <button
                onClick={login}
                className="text-xs border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300 hover:border-zinc-500 transition-colors tracking-widest uppercase"
              >
                sign in
              </button>
            )}
            <Link
              href="/"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-widest uppercase"
            >
              player →
            </Link>
          </div>
        </div>

        {!user && !authLoading ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 text-sm mb-4 tracking-wide">
              sign in to create or join rooms
            </p>
            <button
              onClick={login}
              className="px-4 py-2 bg-white text-black text-xs rounded-lg tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors"
            >
              sign in with google
            </button>
          </div>
        ) : (
          <>
            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-white text-black text-xs font-medium rounded-lg tracking-widest uppercase hover:bg-zinc-200 transition-colors"
              >
                ＋ new room
              </button>
              <div className="flex gap-2 flex-1">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase tracking-widest"
                />
                <button
                  onClick={handleJoin}
                  className="px-4 py-2 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:border-zinc-400 transition-colors tracking-widest uppercase"
                >
                  join
                </button>
              </div>
            </div>

            {/* Rooms list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-zinc-900 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-700 text-sm tracking-wide">
                  no rooms yet — create one above
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 tracking-widest uppercase mb-3">
                  your rooms
                </p>
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/room/${room.code}`}
                    className="flex items-center justify-between px-4 py-3.5 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${room.isActive ? "bg-green-400" : "bg-zinc-700"}`}
                      />
                      <div>
                        <p className="text-sm text-zinc-200 group-hover:text-white transition-colors">
                          {room.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 tracking-widest mt-0.5">
                          {room.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.hostId === user?.sub && (
                        <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5 tracking-widest">
                          host
                        </span>
                      )}
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
