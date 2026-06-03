"use client";
import { useEffect, useRef } from "react";
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
  const isVisibleRef = useRef(true);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    isVisibleRef.current = !document.hidden;

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener("visibilitychange", handleVisibility);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = config.nowPlaying;
    if (!track?.videoId) {
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrlRef.current) return;

    if (config.isPlaying && !isVisibleRef.current) {
      if (audio.src !== streamUrlRef.current) {
        audio.src = streamUrlRef.current;
      }
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (Math.abs(audio.currentTime - config.currentTime) > 2) {
        audio.currentTime = config.currentTime;
      }
      audio.play().catch(() => {});
    } else if (!config.isPlaying || isVisibleRef.current) {
      if (!isVisibleRef.current) return;
      audio.pause();
    }
  }, [config.isPlaying, config.currentTime, config.volume, config.isMuted]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const track = config.nowPlaying;

    try {
      navigator.mediaSession.metadata = track
        ? new MediaMetadata({
            title: track.name || "Unknown",
            artist: track.artists?.[0]?.name || "Unknown",
            album: track.album?.name || "",
            artwork: track.image
              ? [{ src: track.image, sizes: "512x512", type: "image/png" }]
              : [],
          })
        : null;
    } catch {}

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        configRef.current.onPlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        configRef.current.onPause();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        configRef.current.onPrev();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        configRef.current.onNext();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) {
          configRef.current.onSeek(details.seekTime);
        }
      });
    } catch {}
  }, [config.nowPlaying?.videoId]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = config.isPlaying ? "playing" : "paused";
    } catch {}
  }, [config.isPlaying]);
}
