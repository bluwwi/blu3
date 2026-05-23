"use client";
import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  isActive: boolean;
}

export function useRoom() {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ← NOT a separate function called at module level — inline it so it runs at call time
  const createRoom = useCallback(async (name: string) => {
    const token = localStorage.getItem("blu3_token"); // ← read here, not outside
    console.log("CREATE ROOM TOKEN:", token?.slice(0, 20));

    if (!token) {
      setError("Not logged in");
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      console.log("CREATE ROOM RESPONSE:", data);
      if (!res.ok) throw new Error(data.error);
      setRoom(data.room);
      return data.room as RoomInfo;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string) => {
    const token = localStorage.getItem("blu3_token"); // ← read here too

    if (!token) {
      setError("Not logged in");
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/rooms/${code}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoom(data.room);
      return data.room as RoomInfo;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(() => setRoom(null), []);

  return { room, loading, error, createRoom, joinRoom, leaveRoom };
}
