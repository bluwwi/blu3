"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RoomEngine, RoomEngineState } from "@/lib/RoomEngine";

export function useRoomEngine(roomCode: string | null) {
  const engineRef = useRef<RoomEngine | null>(null);
  const [state, setState] = useState<RoomEngineState>({
    phase: "disconnected",
    playback: null,
    queue: [],
    queueVersion: 0,
    members: [],
    isHost: false,
    isHostActive: true,
    recentTracks: [],
    connected: false,
    chatMessages: [],
    playbackMode: { shuffle: false, repeatMode: "off" },
  });

  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!roomCode) return;

    const engine = new RoomEngine(roomCode);
    engineRef.current = engine;

    const unsub = engine.onUpdate((s) => setState({ ...s }));

    engine.start();

    let rafId: number;
    const tick = () => {
      setDisplayTime(engine.audioEngine.currentTime);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      unsub();
      cancelAnimationFrame(rafId);
      engine.destroy();
      engineRef.current = null;
    };
  }, [roomCode]);

  const engine = engineRef.current;

  const hostPlay = useCallback(
    (videoId: string, seekTo: number, durationMs: number, source: string,
     trackName: string, artistName: string, image: string) => {
      engine?.play(videoId, seekTo, durationMs, source, trackName, artistName, image);
    }, [engine]);

  const hostPause = useCallback(() => engine?.pause(), [engine]);
  const hostSeek = useCallback((t: number) => engine?.seek(t), [engine]);
  const listenerToggle = useCallback(() => engine?.listenerToggle(), [engine]);
  const toggleMute = useCallback(() => engine?.toggleMute(), [engine]);
  const addToQueue = useCallback((track: any) => engine?.addToQueue(track), [engine]);
  const removeFromQueue = useCallback((id: string) => engine?.removeFromQueue(id), [engine]);
  const clearQueue = useCallback(() => engine?.clearQueue(), [engine]);
  const sendChat = useCallback((text: string) => engine?.sendChat(text), [engine]);
  const requestSync = useCallback(() => engine?.requestSync(), [engine]);
  const sendPlaybackMode = useCallback((mode: any) => engine?.sendPlaybackMode(mode), [engine]);

  return {
    state,
    displayTime,
    engine,
    hostPlay, hostPause, hostSeek,
    listenerToggle, toggleMute,
    addToQueue, removeFromQueue, clearQueue,
    sendChat, requestSync, sendPlaybackMode,
    volume: engine?.volume ?? 1,
    isMuted: engine?.isMuted ?? true,
    isAudioPlaying: engine?.isAudioPlaying ?? false,
    engineCurrentTime: engine?.currentTime ?? 0,
    engineDuration: engine?.duration ?? 0,
    engineMode: engine?.audioMode ?? "audio",
  };
}
