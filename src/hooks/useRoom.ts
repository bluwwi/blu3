"use client";
import { useState, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ROOM_KEY = "blu3_room";

export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  isActive: boolean;
}

export function useRoom() {
  const [room, setRoomState] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore room from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_KEY);
    if (saved) {
      try {
        setRoomState(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const setRoom = useCallback((r: RoomInfo | null) => {
    setRoomState(r);
    if (r) localStorage.setItem(ROOM_KEY, JSON.stringify(r));
    else localStorage.removeItem(ROOM_KEY);
  }, []);

  const createRoom = useCallback(
    async (name: string) => {
      const token = localStorage.getItem("blu3_token");
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
        if (!res.ok) throw new Error(data.error);
        setRoom(data.room);
        return data.room as RoomInfo;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setRoom],
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const token = localStorage.getItem("blu3_token");
      if (!token) {
        setError("Not logged in");
        return null;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/rooms/${code}/join`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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
    },
    [setRoom],
  );

  const leaveRoom = useCallback(() => {
    setRoom(null);
  }, [setRoom]);

  return { room, loading, error, createRoom, joinRoom, leaveRoom };
}
