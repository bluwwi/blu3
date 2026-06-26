"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { API_URL } from "@/utils/ytdl";
import { onVisibilityChange } from "@/utils/visibilityCoordinator";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  audioUrl: string | null | undefined;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  token?: string;
  onPlay: () => void;
  onPause: () => void;
  onTrackEnd: () => void;
  manualPauseRef?: React.MutableRefObject<boolean>;
  pendingStartTimeRef?: React.MutableRefObject<number>;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const abortCountRef = useRef(0);
  const lastVideoIdRef = useRef<string | null>(null);
  const lastAudioUrlRef = useRef<string | null | undefined>(null);

  const safePlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: DOMException) => {
      if (err.name === "AbortError") {
        abortCountRef.current++;
        if (abortCountRef.current > 5) return;
      } else if (err.name === "NotAllowedError") {
        return;
      } else {
        abortCountRef.current = 0;
      }
    });
  }, []);

  const playUrl = useCallback((audio: HTMLAudioElement, url: string, startTime: number) => {
    const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
    const streamingUrl = `${API_URL}${url}${tokenParam}`;
    audio.src = streamingUrl;
    audio.currentTime = startTime;
    safePlay(audio);
  }, [config.token, safePlay]);

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
    const onStalled = () => {
      const cfg = configRef.current;
      if (!audio.paused || !cfg.isPlaying || !audio.src) return;
      safePlay(audio);
    };
    const onSuspend = () => {
      const cfg = configRef.current;
      if (!audio.paused || !cfg.isPlaying || !audio.src) return;
      safePlay(audio);
    };
    audio.addEventListener("stalled", onStalled);
    audio.addEventListener("suspend", onSuspend);

    audioRef.current = audio;
    return () => {
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("suspend", onSuspend);
      audio.pause();
      audio.src = "";
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, [safePlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = config.nowPlaying;
    const url = config.audioUrl;
    const videoId = track?.videoId ?? null;

    if (!videoId || !url) {
      if (lastVideoIdRef.current && videoId !== lastVideoIdRef.current) {
        audio.pause();
        audio.src = "";
      }
      lastVideoIdRef.current = videoId;
      lastAudioUrlRef.current = url;
      return;
    }

    const isNewTrack = videoId !== lastVideoIdRef.current;
    const urlChanged = url !== lastAudioUrlRef.current;

    if (isNewTrack || urlChanged) {
      audio.pause();
      audio.src = "";
      abortCountRef.current = 0;

      const start = config.pendingStartTimeRef?.current ?? 0;
      playUrl(audio, url, start);
    }

    lastVideoIdRef.current = videoId;
    lastAudioUrlRef.current = url;
  }, [config.nowPlaying?.videoId, config.audioUrl, config.isPlaying, playUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (config.isPlaying) {
        if (audio.paused && audio.src) safePlay(audio);
      } else {
        if (!audio.paused) audio.pause();
      }
    }

    if (config.isPlaying) {
      acquireWakeLock();
    }
  }, [config.isPlaying, config.volume, config.isMuted, acquireWakeLock, safePlay]);

  useEffect(() => {
    if (config.isPlaying) return;
    const timer = setTimeout(() => releaseWakeLock(), 5000);
    return () => clearTimeout(timer);
  }, [config.isPlaying, releaseWakeLock]);

  useEffect(() => {
    const unsub = onVisibilityChange((visible) => {
      if (!visible) return;
      const cfg = configRef.current;
      if (!cfg.isPlaying) return;
      const audio = audioRef.current;
      if (!audio || audio.src === "") return;
      if (audio.ended) {
        cfg.onTrackEnd();
        return;
      }
    });
    return unsub;
  }, []);

  return { audioRef };
}
