"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { RecentTrack, Track } from "@/utils/types";

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") ||
  "ws://localhost:8000";
const CLOCK_SYNC_INTERVAL_MS = 10_000;
const CLOCK_SYNC_ALPHA = 0.3;
const CLOCK_SYNC_DRIFT_MS = 300;

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

export type WSMessage =
  | { type: "clock_sync"; serverTime: number }
  | { type: "ping"; clientTime: number }
  | { type: "pong"; serverTime: number; rtt: number }
  | { type: "schedule_play"; videoId: string; seekTo: number; targetTime: number }
  | { type: "schedule_pause"; targetTime: number }
  | { type: "schedule_seek"; seekTo: number; targetTime: number }
  | {
      type: "playback_state";
      state: "playing" | "paused" | "buffering";
      currentTime: number;
    };

type ScheduledPlayMessage = Extract<WSMessage, { type: "schedule_play" }> & {
  id?: string;
  trackName?: string;
  artistName?: string;
  image?: string;
  duration_ms?: number;
  recentTracks?: RecentTrack[];
  queue?: Track[];
};

type ScheduledPauseMessage = Extract<WSMessage, { type: "schedule_pause" }>;
type ScheduledSeekMessage = Extract<WSMessage, { type: "schedule_seek" }>;
type BaseWSMessage = Exclude<WSMessage, Extract<WSMessage, { type: "schedule_play" }>>;

type RoomSocketMessage =
  | BaseWSMessage
  | ScheduledPlayMessage
  | {
      type: "room:joined";
      isHost: boolean;
      members?: Member[];
      playback?: PlaybackState | null;
      playbackMode?: PlaybackMode;
      recentTracks?: RecentTrack[];
      queue?: Track[];
    }
  | { type: "room:member_joined" | "room:member_left"; members?: Member[] }
  | { type: "chat:message"; message: ChatMessage }
  | {
      type: "playback:sync";
      videoId: string | null;
      trackName: string;
      artistName: string;
      image: string;
      isPlaying: boolean;
      currentTime: number;
      updatedAt: number;
      playbackMode?: PlaybackMode;
      recentTracks?: RecentTrack[];
      queue?: Track[];
    }
  | { type: "room:playback_mode"; playbackMode: PlaybackMode }
  | { type: "room:queue_update"; queue?: Track[] };

interface UseRoomSocketProps {
  roomCode: string | null;
  onSchedulePlay?: (
    state: ScheduledPlayMessage,
    getSyncedTime: () => number,
  ) => void;
  onSchedulePause?: (
    state: ScheduledPauseMessage,
    getSyncedTime: () => number,
  ) => void;
  onScheduleSeek?: (
    state: ScheduledSeekMessage,
    getSyncedTime: () => number,
  ) => void;
  onPlaybackSync?: (
    state: PlaybackState,
    getSyncedTime: () => number,
  ) => void;
}

export function useRoomSocket({
  roomCode,
  onSchedulePlay,
  onSchedulePause,
  onScheduleSeek,
  onPlaybackSync,
}: UseRoomSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const clockOffsetRef = useRef(0);
  const pingSentAtRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playbackMode, setPlaybackModeState] = useState<PlaybackMode>({
    shuffle: false,
    repeatMode: "off",
  });
  // Chat is in-memory only — clears on refresh/new session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);

  const onSchedulePlayRef = useRef(onSchedulePlay);
  const onSchedulePauseRef = useRef(onSchedulePause);
  const onScheduleSeekRef = useRef(onScheduleSeek);
  const onPlaybackSyncRef = useRef(onPlaybackSync);

  const getSyncedTime = useCallback(
    () => Date.now() + clockOffsetRef.current,
    [],
  );

  const applyClockOffset = useCallback((sampleOffset: number) => {
    const prevOffset = clockOffsetRef.current;
    const nextOffset =
      prevOffset === 0
        ? sampleOffset
        : prevOffset + CLOCK_SYNC_ALPHA * (sampleOffset - prevOffset);
    clockOffsetRef.current = nextOffset;
    setClockOffsetMs(nextOffset);

    if (
      prevOffset !== 0 &&
      Math.abs(sampleOffset - prevOffset) > CLOCK_SYNC_DRIFT_MS
    ) {
      if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);
      resyncTimeoutRef.current = setTimeout(() => {
        const ws = wsRef.current;
        if (ws?.readyState !== WebSocket.OPEN) return;
        const clientTime = Date.now();
        pingSentAtRef.current = clientTime;
        ws.send(JSON.stringify({ type: "ping", clientTime }));
      }, 250);
    }
  }, []);

  const sendPing = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    const clientTime = Date.now();
    pingSentAtRef.current = clientTime;
    ws.send(JSON.stringify({ type: "ping", clientTime }));
  }, []);

  useEffect(() => {
    onSchedulePlayRef.current = onSchedulePlay;
    onSchedulePauseRef.current = onSchedulePause;
    onScheduleSeekRef.current = onScheduleSeek;
    onPlaybackSyncRef.current = onPlaybackSync;
  }, [onSchedulePause, onSchedulePlay, onScheduleSeek, onPlaybackSync]);

  useEffect(() => {
    if (!roomCode) return;
    const token = localStorage.getItem("blu3_token");
    if (!token) return;

    const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token)}&room=${roomCode}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      sendPing();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(sendPing, CLOCK_SYNC_INTERVAL_MS);
    };
    ws.onclose = () => {
      setConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
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
        case "clock_sync":
          if (clockOffsetRef.current === 0) {
            const roughOffset = msg.serverTime - Date.now();
            clockOffsetRef.current = roughOffset;
            setClockOffsetMs(roughOffset);
          }
          sendPing();
          break;
        case "pong": {
          const sentAt = pingSentAtRef.current;
          const measuredRtt = sentAt ? Date.now() - sentAt : msg.rtt;
          const offsetSample =
            (msg.serverTime - (sentAt ?? Date.now())) - measuredRtt / 2;
          applyClockOffset(offsetSample);
          pingSentAtRef.current = null;
          break;
        }
        case "room:joined":
          setIsHost(msg.isHost);
          setMembers(msg.members ?? []);
          setPlayback(msg.playback ?? null);
          if (msg.playbackMode) setPlaybackModeState(msg.playbackMode);
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
        case "schedule_play":
          setPlayback({
            videoId: msg.videoId ?? null,
            trackName: msg.trackName ?? "",
            artistName: msg.artistName ?? "",
            image: msg.image ?? "",
            isPlaying: true,
            currentTime: msg.seekTo ?? 0,
            updatedAt: msg.targetTime,
          });
          if (msg.recentTracks) setRecentTracks(msg.recentTracks);
          if (msg.queue) setQueue(msg.queue);
          onSchedulePlayRef.current?.(msg, getSyncedTime);
          break;
        case "schedule_pause":
          setPlayback((prev) =>
            prev
              ? {
                  ...prev,
                  isPlaying: false,
                  updatedAt: msg.targetTime,
                }
              : prev,
          );
          onSchedulePauseRef.current?.(msg, getSyncedTime);
          break;
        case "schedule_seek":
          setPlayback((prev) =>
            prev
              ? {
                  ...prev,
                  currentTime: msg.seekTo ?? prev.currentTime,
                  updatedAt: msg.targetTime,
                }
              : prev,
          );
          onScheduleSeekRef.current?.(msg, getSyncedTime);
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
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);
      resyncTimeoutRef.current = null;
      wsRef.current?.close();
    };
  }, [applyClockOffset, getSyncedTime, roomCode, sendPing]);

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

  const sendPlaybackMode = useCallback((mode: Partial<PlaybackMode>) => {
    wsRef.current?.send(JSON.stringify({ type: "playback:mode", ...mode }));
  }, []);

  const sendPlaybackState = useCallback(
    (state: "playing" | "paused" | "buffering", currentTime: number) => {
      wsRef.current?.send(
        JSON.stringify({ type: "playback_state", state, currentTime }),
      );
    },
    [],
  );

  const addToQueue = useCallback((track: Track) => {
    wsRef.current?.send(JSON.stringify({ type: "queue:add", track }));
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    wsRef.current?.send(JSON.stringify({ type: "queue:remove", trackId }));
  }, []);

  const cycleQueueCurrent = useCallback((trackId: string) => {
    wsRef.current?.send(JSON.stringify({ type: "queue:cycle_current", trackId }));
  }, []);

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
    sendPlaybackState,
    getSyncedTime,
    addToQueue,
    removeFromQueue,
    cycleQueueCurrent,
  };
}
