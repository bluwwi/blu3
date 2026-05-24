"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { RecentTrack, Track } from "@/utils/types";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  // Chat is in-memory only — clears on refresh/new session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);

  const onPlaybackPlayRef = useRef(onPlaybackPlay);
  const onPlaybackPauseRef = useRef(onPlaybackPause);
  const onPlaybackSeekRef = useRef(onPlaybackSeek);
  const onPlaybackSyncRef = useRef(onPlaybackSync);

  useEffect(() => {
    onPlaybackPlayRef.current = onPlaybackPlay;
    onPlaybackPauseRef.current = onPlaybackPause;
    onPlaybackSeekRef.current = onPlaybackSeek;
    onPlaybackSyncRef.current = onPlaybackSync;
  });

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
      console.log("WS msg:", msg.type); // debug

      switch (msg.type) {
        case "room:joined":
          setIsHost(msg.isHost);
          setMembers(msg.members ?? []);
          setPlayback(msg.playback ?? null);
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          if (!msg.isHost && msg.playback?.videoId) {
            window.setTimeout(() => {
              wsRef.current?.send(
                JSON.stringify({ type: "playback:sync_request" }),
              );
            }, 0);
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
          setPlayback({
            videoId: msg.videoId ?? null,
            trackName: msg.trackName ?? "",
            artistName: msg.artistName ?? "",
            image: msg.image ?? "",
            isPlaying: true,
            currentTime: msg.currentTime ?? 0,
            updatedAt: msg.updatedAt ?? Date.now(),
          });
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          onPlaybackPlayRef.current?.(msg);
          break;
        case "playback:pause":
          setPlayback((prev) =>
            prev
              ? {
                  ...prev,
                  isPlaying: false,
                  currentTime: msg.currentTime ?? prev.currentTime,
                  updatedAt: Date.now(),
                }
              : prev,
          );
          onPlaybackPauseRef.current?.(msg.currentTime);
          break;
        case "playback:seek":
          setPlayback((prev) =>
            prev
              ? {
                  ...prev,
                  currentTime: msg.currentTime ?? prev.currentTime,
                  updatedAt: Date.now(),
                }
              : prev,
          );
          onPlaybackSeekRef.current?.(msg.currentTime);
          break;
        case "playback:sync":
          setPlayback({
            videoId: msg.videoId ?? null,
            trackName: msg.trackName ?? "",
            artistName: msg.artistName ?? "",
            image: msg.image ?? "",
            isPlaying: Boolean(msg.isPlaying),
            currentTime: msg.currentTime ?? 0,
            updatedAt: msg.updatedAt ?? Date.now(),
          });
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          onPlaybackSyncRef.current?.(msg);
          break;
        case "room:queue_update":
          if (msg.queue) setQueue(msg.queue);
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
      id?: string;
      videoId: string;
      trackName: string;
      artistName: string;
      image: string;
      currentTime?: number;
      duration_ms?: number;
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

  const requestSync = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "playback:sync_request" }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    wsRef.current?.send(JSON.stringify({ type: "queue:add", track }));
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    wsRef.current?.send(JSON.stringify({ type: "queue:remove", trackId }));
  }, []);

  return {
    connected,
    isHost,
    members,
    playback,
    messages,
    recentTracks,
    queue,
    setQueue,
    sendChat,
    sendPlay,
    sendPause,
    sendSeek,
    requestSync,
    addToQueue,
    removeFromQueue,
  };
}
