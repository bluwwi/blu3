"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/utils/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onResume: (time: number) => void;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrlRef = useRef<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    setIsVisible(!document.hidden);

    const handleVisibility = () => {
      const hidden = document.hidden;
      setIsVisible(!hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleEnded = () => {
      configRef.current.onNext();
    };
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener("visibilitychange", handleVisibility);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = config.nowPlaying;
    if (!track?.videoId) {
      streamUrlRef.current = null;
      audio.pause();
      audio.src = "";
      return;
    }

    const videoId = track.videoId;

    const fetchStreamUrl = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/${videoId}`, {
          redirect: "follow",
        });
        if (!res.ok) return;
        streamUrlRef.current = res.url;
      } catch {
        streamUrlRef.current = null;
      }
    };

    fetchStreamUrl();
  }, [config.nowPlaying?.videoId]);

  const wasHiddenRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrlRef.current) return;

    if (!isVisible && config.isPlaying) {
      wasHiddenRef.current = true;
      if (audio.src !== streamUrlRef.current) {
        audio.src = streamUrlRef.current;
      }
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (Math.abs(audio.currentTime - config.currentTime) > 2) {
        audio.currentTime = config.currentTime;
      }
      audio.play().catch(() => {});
    } else if (isVisible) {
      if (wasHiddenRef.current && config.isPlaying) {
        wasHiddenRef.current = false;
        const t = audio.currentTime || config.currentTime;
        audio.pause();
        config.onResume(t);
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [config.isPlaying, isVisible, config.currentTime, config.volume, config.isMuted]);

  const seekNativeAudio = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);

  return { seekNativeAudio };
}
