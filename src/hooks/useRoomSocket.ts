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

export type RepeatMode = "off" | "all" | "one";

export interface PlaybackMode {
  shuffle: boolean;
  repeatMode: RepeatMode;
}

interface PlayMessage {
  videoId: string;
  seekTo: number;
  serverTime: number;
  id?: string;
  trackName?: string;
  artistName?: string;
  image?: string;
  duration_ms?: number;
  recentTracks?: RecentTrack[];
}

interface SeekMessage {
  seekTo: number;
  serverTime: number;
}

type RoomSocketMessage =
  | { type: "clock_sync"; serverTime: number }
  | { type: "play"; videoId: string; seekTo: number; serverTime: number; id?: string; trackName?: string; artistName?: string; image?: string; duration_ms?: number; recentTracks?: RecentTrack[] }
  | { type: "pause"; serverTime: number }
  | { type: "seek"; seekTo: number; serverTime: number }
  | { type: "room:joined"; isHost: boolean; members?: Member[]; playback?: PlaybackState | null; playbackMode?: PlaybackMode; recentTracks?: RecentTrack[]; queue?: Track[] }
  | { type: "room:member_joined"; members?: Member[]; user?: { userId: string; name: string; avatar?: string } }
  | { type: "room:member_left"; members?: Member[]; userId?: string }
  | { type: "chat:message"; message: ChatMessage }
  | { type: "playback:sync"; videoId: string | null; trackName: string; artistName: string; image: string; isPlaying: boolean; currentTime: number; updatedAt: number; playbackMode?: PlaybackMode; recentTracks?: RecentTrack[]; queue?: Track[] }
  | { type: "room:playback_mode"; playbackMode: PlaybackMode }
  | { type: "room:queue_update"; queue?: Track[] };

interface UseRoomSocketProps {
  roomCode: string | null;
  onPlay?: (state: PlayMessage) => void;
  onPause?: (state: { serverTime: number }) => void;
  onSeek?: (state: SeekMessage) => void;
  onPlaybackSync?: (state: PlaybackState, getSyncedTime: () => number) => void;
  onMemberJoined?: (user: { name: string; avatar?: string }) => void;
  chatOpen?: boolean;
}

export function useRoomSocket({
  roomCode,
  onPlay,
  onPause,
  onSeek,
  onPlaybackSync,
  onMemberJoined,
  chatOpen,
}: UseRoomSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const clockOffsetRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playbackMode, setPlaybackModeState] = useState<PlaybackMode>({
    shuffle: false,
    repeatMode: "off",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const onPlaybackSyncRef = useRef(onPlaybackSync);
  const onMemberJoinedRef = useRef(onMemberJoined);
  const chatOpenRef = useRef(chatOpen);

  const getSyncedTime = useCallback(
    () => Date.now() + clockOffsetRef.current,
    [],
  );

  const safeSend = useCallback((data: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }, []);

  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onSeekRef.current = onSeek;
    onPlaybackSyncRef.current = onPlaybackSync;
    onMemberJoinedRef.current = onMemberJoined;
  }, [onPause, onPlay, onSeek, onPlaybackSync, onMemberJoined]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    if (!roomCode) return;
    const token = localStorage.getItem("blu3_token");
    if (!token) return;

    const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token)}&room=${roomCode}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };
    ws.onclose = () => {
      setConnected(false);
    };
    ws.onerror = (e) => {
      console.error("WS error:", e);
    };
    ws.onmessage = (event) => {
      let msg: RoomSocketMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "clock_sync": {
          const offset = msg.serverTime - Date.now();
          clockOffsetRef.current = offset;
          setClockOffsetMs(offset);
          break;
        }
        case "room:joined":
          setIsHost(msg.isHost);
          setMembers(msg.members ?? []);
          setPlayback(msg.playback ?? null);
          if (msg.playbackMode) setPlaybackModeState(msg.playbackMode);
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          if (msg.playback?.videoId) {
            window.setTimeout(() => {
              safeSend(JSON.stringify({ type: "playback:sync_request" }));
            }, 0);
          }
          break;
        case "room:member_joined":
          setMembers(msg.members ?? []);
          if (msg.user) onMemberJoinedRef.current?.(msg.user);
          break;
        case "room:member_left":
          setMembers(msg.members ?? []);
          break;
        case "chat:message":
          setMessages((prev) => [...prev.slice(-199), msg.message]);
          if (!chatOpenRef.current) setUnreadChatCount((c) => c + 1);
          break;
        case "play":
          setPlayback({
            videoId: msg.videoId ?? null,
            trackName: msg.trackName ?? "",
            artistName: msg.artistName ?? "",
            image: msg.image ?? "",
            isPlaying: true,
            currentTime: msg.seekTo ?? 0,
            updatedAt: msg.serverTime,
          });
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          onPlayRef.current?.(msg);
          break;
        case "pause":
          setPlayback((prev) =>
            prev ? { ...prev, isPlaying: false, updatedAt: msg.serverTime } : prev,
          );
          onPauseRef.current?.(msg);
          break;
        case "seek":
          setPlayback((prev) =>
            prev ? { ...prev, currentTime: msg.seekTo ?? prev.currentTime, updatedAt: msg.serverTime } : prev,
          );
          onSeekRef.current?.(msg);
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
          if (msg.playbackMode) setPlaybackModeState(msg.playbackMode);
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          onPlaybackSyncRef.current?.(msg, getSyncedTime);
          break;
        case "room:playback_mode":
          setPlaybackModeState(msg.playbackMode);
          break;
        case "room:queue_update":
          if (msg.queue) setQueue(msg.queue);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [getSyncedTime, roomCode, safeSend]);

  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    safeSend(JSON.stringify({ type: "chat:send", text }));
  }, [safeSend]);

  const sendPlay = useCallback((track: {
    id?: string; videoId: string; trackName: string; artistName: string; image: string; currentTime?: number; duration_ms?: number;
  }) => {
    safeSend(JSON.stringify({ type: "playback:play", ...track }));
  }, [safeSend]);

  const sendPause = useCallback((currentTime: number) => {
    safeSend(JSON.stringify({ type: "playback:pause", currentTime }));
  }, [safeSend]);

  const sendSeek = useCallback((currentTime: number) => {
    safeSend(JSON.stringify({ type: "playback:seek", currentTime }));
  }, [safeSend]);

  const requestSync = useCallback(() => {
    safeSend(JSON.stringify({ type: "playback:sync_request" }));
  }, [safeSend]);

  const sendPlaybackMode = useCallback((mode: Partial<PlaybackMode>) => {
    safeSend(JSON.stringify({ type: "playback:mode", ...mode }));
  }, [safeSend]);

  const sendProgress = useCallback((currentTime: number) => {
    safeSend(JSON.stringify({ type: "progress", currentTime }));
  }, [safeSend]);

  const sendTrackEnded = useCallback((currentTime: number) => {
    safeSend(JSON.stringify({ type: "playback:ended", currentTime }));
  }, [safeSend]);

  const addToQueue = useCallback((track: Track) => {
    safeSend(JSON.stringify({ type: "queue:add", track }));
  }, [safeSend]);

  const removeFromQueue = useCallback((trackId: string) => {
    safeSend(JSON.stringify({ type: "queue:remove", trackId }));
  }, [safeSend]);

  const cycleQueueCurrent = useCallback((trackId: string) => {
    safeSend(JSON.stringify({ type: "queue:cycle_current", trackId }));
  }, [safeSend]);

  const clearQueue = useCallback(() => {
    safeSend(JSON.stringify({ type: "queue:clear" }));
  }, [safeSend]);

  return {
    connected,
    clockOffsetMs,
    isHost,
    members,
    playback,
    playbackMode,
    messages,
    recentTracks,
    queue,
    setQueue,
    sendChat,
    sendPlay,
    sendPause,
    sendSeek,
    requestSync,
    sendPlaybackMode,
    sendProgress,
    sendTrackEnded,
    getSyncedTime,
    addToQueue,
    removeFromQueue,
    cycleQueueCurrent,
    clearQueue,
    unreadChatCount,
    resetUnreadChat: useCallback(() => setUnreadChatCount(0), []),
  };
}
