"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") ||
  "ws://localhost:8000";

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  text: string;
  ts: number;
}

export interface Member {
  userId: string;
  name: string;
  avatar?: string;
}

export interface PlaybackState {
  videoId: string | null;
  trackName: string;
  artistName: string;
  image: string;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
}

interface UseRoomSocketProps {
  roomCode: string | null;
  onPlaybackPlay?: (state: PlaybackState) => void;
  onPlaybackPause?: (currentTime: number) => void;
  onPlaybackSeek?: (currentTime: number) => void;
  onPlaybackSync?: (state: PlaybackState) => void;
}

export function useRoomSocket({
  roomCode,
  onPlaybackPlay,
  onPlaybackPause,
  onPlaybackSeek,
  onPlaybackSync,
}: UseRoomSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hostOnline, setHostOnline] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  // Chat is in-memory only — clears on refresh/new session
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Store callbacks in refs so the WebSocket onmessage always has fresh references
  const cbRef = useRef({ onPlaybackPlay, onPlaybackPause, onPlaybackSeek, onPlaybackSync });
  cbRef.current = { onPlaybackPlay, onPlaybackPause, onPlaybackSeek, onPlaybackSync };

  useEffect(() => {
    if (!roomCode) return;
    const token = localStorage.getItem("blu3_token");
    if (!token) return;

    const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token)}&room=${roomCode}`;
    console.log("Connecting WS:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
      setConnected(true);
    };
    ws.onclose = (e) => {
      console.log("WS closed:", e.code, e.reason);
      setConnected(false);
    };
    ws.onerror = (e) => {
      console.error("WS error:", e);
    };
    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      console.log("WS msg:", msg.type);

      switch (msg.type) {
        case "room:joined":
          setIsHost(msg.isHost);
          setHostOnline(msg.hostOnline ?? true);
          setMembers(msg.members ?? []);
          // If there's active playback, sync immediately using the data from the join message
          if (msg.playback?.videoId) {
            cbRef.current.onPlaybackSync?.(msg.playback);
          }
          break;
        case "room:member_joined":
        case "room:member_left":
          setMembers(msg.members ?? []);
          break;
        case "chat:message":
          setMessages((prev) => [...prev.slice(-199), msg.message]);
          break;
        case "playback:play":
          cbRef.current.onPlaybackPlay?.(msg);
          break;
        case "playback:pause":
          cbRef.current.onPlaybackPause?.(msg.currentTime);
          break;
        case "playback:seek":
          cbRef.current.onPlaybackSeek?.(msg.currentTime);
          break;
        case "playback:sync":
          cbRef.current.onPlaybackSync?.(msg);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [roomCode]);

  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    wsRef.current?.send(JSON.stringify({ type: "chat:send", text }));
  }, []);

  const sendPlay = useCallback(
    (track: {
      videoId: string;
      trackName: string;
      artistName: string;
      image: string;
      currentTime?: number;
    }) => {
      wsRef.current?.send(JSON.stringify({ type: "playback:play", ...track }));
    },
    [],
  );

  const sendPause = useCallback((currentTime: number) => {
    wsRef.current?.send(
      JSON.stringify({ type: "playback:pause", currentTime }),
    );
  }, []);

  const sendSeek = useCallback((currentTime: number) => {
    wsRef.current?.send(JSON.stringify({ type: "playback:seek", currentTime }));
  }, []);

  return {
    connected,
    isHost,
    hostOnline,
    members,
    messages,
    sendChat,
    sendPlay,
    sendPause,
    sendSeek,
  };
}
