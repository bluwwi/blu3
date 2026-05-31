"use client";

import { useRef, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getStreamUrl(videoId: string): string {
  return `${API_URL}/stream/${videoId}`;
}

export interface AudioStreamCallbacks {
  onPlaying?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onWaiting?: () => void;
  onError?: () => void;
  onCanPlay?: () => void;
}

export function useAudioStream(callbacks?: AudioStreamCallbacks) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const loadStream = useCallback((videoId: string) => {
    const el = audioRef.current;
    if (!el) return;
    el.src = getStreamUrl(videoId);
    el.load();
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime ?? 0;
  }, []);

  const getDuration = useCallback(() => {
    return audioRef.current?.duration ?? 0;
  }, []);

  useEffect(() => {
    const el = new Audio();
    audioRef.current = el;

    el.onplaying = () => callbacksRef.current?.onPlaying?.();
    el.onpause = () => callbacksRef.current?.onPause?.();
    el.onended = () => callbacksRef.current?.onEnded?.();
    el.onwaiting = () => callbacksRef.current?.onWaiting?.();
    el.onerror = () => callbacksRef.current?.onError?.();
    el.oncanplay = () => callbacksRef.current?.onCanPlay?.();

    el.setAttribute("playsinline", "");
    el.preload = "auto";

    return () => {
      el.pause();
      el.src = "";
      audioRef.current = null;
    };
  }, []);

  return {
    audioRef,
    loadStream,
    play,
    pause,
    seek,
    setVolume,
    getCurrentTime,
    getDuration,
  };
}
