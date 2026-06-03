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
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrlRef = useRef<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const handleEnded = () => {
      configRef.current.onNext();
    };
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", () => {
      setStreamReady(false);
    });

    return () => {
      audio.pause();
      audio.src = "";
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
      setStreamReady(false);
      audio.pause();
      audio.src = "";
      return;
    }

    const videoId = track.videoId;
    setStreamReady(false);

    const fetchStreamUrl = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/${videoId}`, {
          redirect: "follow",
        });
        if (!res.ok) throw new Error("Stream fetch failed");
        streamUrlRef.current = res.url;
        setStreamReady(true);
      } catch {
        streamUrlRef.current = null;
        setStreamReady(false);
      }
    };

    fetchStreamUrl();
  }, [config.nowPlaying?.videoId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrlRef.current || !streamReady) return;

    audio.volume = config.isMuted ? 0 : config.volume / 100;

    if (config.isPlaying) {
      if (audio.src !== streamUrlRef.current) {
        audio.src = streamUrlRef.current;
      }
      if (Math.abs(audio.currentTime - config.currentTime) > 3) {
        audio.currentTime = config.currentTime;
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [config.isPlaying, config.currentTime, config.volume, config.isMuted, streamReady]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = config.nowPlaying
        ? new MediaMetadata({
            title: config.nowPlaying.name || "Unknown",
            artist: config.nowPlaying.artists?.[0]?.name || "Unknown",
            album: config.nowPlaying.album?.name || "",
            artwork: config.nowPlaying.image
              ? [{ src: config.nowPlaying.image, sizes: "512x512", type: "image/png" }]
              : [],
          })
        : null;
    } catch {}

    try {
      navigator.mediaSession.setActionHandler("play", () => configRef.current.onPlay());
      navigator.mediaSession.setActionHandler("pause", () => configRef.current.onPause());
      navigator.mediaSession.setActionHandler("previoustrack", () => configRef.current.onPrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => configRef.current.onNext());
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (d.seekTime != null) configRef.current.onSeek(d.seekTime);
      });
    } catch {}

    navigator.mediaSession.playbackState = config.isPlaying ? "playing" : "paused";
  }, [config.nowPlaying?.videoId, config.isPlaying]);

  const seekNativeAudio = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  return { seekNativeAudio, streamReady };
}
