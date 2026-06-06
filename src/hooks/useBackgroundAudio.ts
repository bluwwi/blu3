"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { resolveTrackSource } from "@/utils/ytdl";
import { API_URL } from "@/utils/ytdl";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  token?: string;
  onPlay: () => void;
  onPause: () => void;
  onTrackEnd: () => void;
  pendingStartTimeRef?: React.MutableRefObject<number>;
  manualPauseRef?: React.MutableRefObject<boolean>;
  resolvedUrlsRef?: React.MutableRefObject<Map<string, string>>;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fetchIdRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const retryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return Promise.reject(new Error("No audio source"));
    return audio.play();
  }, []);

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
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.onplay = () => configRef.current.onPlay();
    audio.onpause = () => {
      const cfg = configRef.current;
      if (cfg.manualPauseRef?.current) {
        cfg.manualPauseRef.current = false;
      }
      cfg.onPause();
    };
    audio.onended = () => configRef.current.onTrackEnd();
    audio.onerror = () => {
      audio.pause();
      audio.src = "";
    };

    audioRef.current = audio;
    return () => {
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    const fetchId = ++fetchIdRef.current;
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }

    const resolved = config.resolvedUrlsRef?.current.get(track.videoId);

    if (resolved) {
      const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
      const streamingUrl = `${API_URL}${resolved}${tokenParam}`;
      if (audio) {
        const start = config.pendingStartTimeRef?.current ?? 0;
        audio.src = streamingUrl;
        audio.currentTime = start;
        if (configRef.current.isPlaying)
          audio.play().catch(() => {});
      }
      return;
    }

    resolveTrackSource(track.videoId, track.name, track.artists?.[0]?.name, config.token)
      .then((result) => {
        if (fetchIdRef.current !== fetchId) return;
        if (result.audioUrl && audioRef.current) {
          const start = config.pendingStartTimeRef?.current ?? 0;
          const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
          const streamingUrl = `${API_URL}${result.audioUrl}${tokenParam}`;
          audioRef.current.src = streamingUrl;
          audioRef.current.currentTime = start;
          if (configRef.current.isPlaying)
            audioRef.current.play().catch(() => {});
        }
      });
  }, [config.nowPlaying?.videoId, config.token]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (config.isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }

    if (config.isPlaying) acquireWakeLock();
    else releaseWakeLock();
  }, [config.isPlaying, config.volume, config.isMuted, acquireWakeLock, releaseWakeLock]);

  return { audioRef, retryPlay };
}
