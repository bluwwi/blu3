"use client";

import { useRef, useCallback, useEffect } from "react";
import { getStreamUrl } from "@/utils/stream";

export interface AudioStreamCallbacks {
  onPlaying?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onWaiting?: () => void;
  onError?: () => void;
}

export function useAudioStream(callbacks?: AudioStreamCallbacks) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSrcRef = useRef<string>("");

  useEffect(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = "none";
      el.volume = 1;

      el.addEventListener("playing", () => callbacksRef.current?.onPlaying?.());
      el.addEventListener("pause", () => callbacksRef.current?.onPause?.());
      el.addEventListener("ended", () => callbacksRef.current?.onEnded?.());
      el.addEventListener("waiting", () => callbacksRef.current?.onWaiting?.());
      el.addEventListener("error", () => callbacksRef.current?.onError?.());

      audioRef.current = el;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const loadStream = useCallback((videoId: string) => {
    const el = audioRef.current;
    if (!el) return;
    const url = getStreamUrl(videoId);
    if (url === currentSrcRef.current) return;
    currentSrcRef.current = url;
    el.src = url;
    el.load();
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime ?? 0;
  }, []);

  const getDuration = useCallback(() => {
    return audioRef.current?.duration ?? 0;
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
