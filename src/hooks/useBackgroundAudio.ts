"use client";
import { useCallback, useEffect, useRef } from "react";
import type { Track } from "@/utils/types";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  streamUrl: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onTrackEnd: () => void;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const prevVideoIdRef = useRef<string | null>(null);

  const acquireWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    const audio = audioRef.current;
    if (!track?.videoId || !audio) {
      if (audio) { audio.pause(); audio.src = ""; }
      prevVideoIdRef.current = null;
      return;
    }

    const videoId = track.videoId;
    if (prevVideoIdRef.current === videoId) return;
    prevVideoIdRef.current = videoId;

    audio.src = `${config.streamUrl}/cdn/${encodeURIComponent(videoId)}`;
    audio.currentTime = 0;
    if (config.isPlaying) {
      const p = audio.play();
      if (p) p.catch(() => {});
    }
  }, [config.nowPlaying?.videoId, config.streamUrl, config.isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !config.nowPlaying?.videoId) return;
    if (config.isPlaying) {
      acquireWakeLock();
      const p = audio.play();
      if (p) p.catch(() => {});
    } else {
      audio.pause();
      releaseWakeLock();
    }
  }, [config.isPlaying, config.nowPlaying?.videoId, acquireWakeLock, releaseWakeLock]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = config.isMuted ? 0 : config.volume / 100;
    audio.muted = config.isMuted;
  }, [config.volume, config.isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handler = () => configRef.current.onTrackEnd();
    audio.addEventListener("ended", handler);
    return () => audio.removeEventListener("ended", handler);
  }, []);

  useEffect(() => {
    if (config.isPlaying) acquireWakeLock();
    else releaseWakeLock();
  }, [config.isPlaying, acquireWakeLock, releaseWakeLock]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = config.nowPlaying
        ? new MediaMetadata({
            title: config.nowPlaying.name || "",
            artist: config.nowPlaying.artists?.[0]?.name || "",
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

  return { audioRef };
}
