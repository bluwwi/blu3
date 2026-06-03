"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/utils/types";

const STREAM_URL =
  process.env.NEXT_PUBLIC_STREAM_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:8000";

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
    const handleCanPlay = () => {
      setStreamReady(true);
    };
    const handleError = () => {
      setStreamReady(false);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = config.nowPlaying;
    if (!track?.videoId) {
      setStreamReady(false);
      audio.pause();
      audio.src = "";
      return;
    }

    const videoId = track.videoId;
    setStreamReady(false);

    const streamUrl = `${STREAM_URL}/stream/${encodeURIComponent(videoId)}`;
    if (audio.src !== streamUrl) {
      audio.src = streamUrl;
    }
  }, [config.nowPlaying?.videoId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamReady) return;

    audio.volume = config.isMuted ? 0 : config.volume / 100;

    if (config.isPlaying) {
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
