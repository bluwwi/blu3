"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { resolveTrackSource } from "@/utils/ytdl";
import { API_URL } from "@/utils/ytdl";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const MAX_ERROR_RETRIES = 3;

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
  resolvedTimestampsRef?: React.MutableRefObject<Map<string, number>>;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fetchIdRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const errorRetryRef = useRef<Map<string, number>>(new Map());

  const setupAudioSource = useCallback((fetchId: number, videoId: string, audioUrl: string, startTime: number, shouldPlay: boolean) => {
    const audio = audioRef.current;
    if (!audio || fetchIdRef.current !== fetchId) return;
    const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
    const streamingUrl = `${API_URL}${audioUrl}${tokenParam}`;
    audio.src = streamingUrl;
    audio.currentTime = startTime;
    if (shouldPlay) audio.play().catch(() => {});
  }, [config.token]);

  const resolveAndPlay = useCallback((fetchId: number, videoId: string, name: string, artists: string | undefined, startTime: number, shouldPlay: boolean) => {
    resolveTrackSource(videoId, name, artists, config.token)
      .then((result) => {
        if (fetchIdRef.current !== fetchId) return;
        if (result.audioUrl) {
          config.resolvedUrlsRef?.current.set(videoId, result.audioUrl);
          config.resolvedTimestampsRef?.current.set(videoId, Date.now());
          setupAudioSource(fetchId, videoId, result.audioUrl, startTime, shouldPlay);
        }
      });
  }, [config.token, config.resolvedUrlsRef, config.resolvedTimestampsRef, setupAudioSource]);

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
      const cfg = configRef.current;
      const track = cfg.nowPlaying;
      if (!track?.videoId) {
        audio.pause();
        audio.src = "";
        return;
      }
      const retries = errorRetryRef.current.get(track.videoId) ?? 0;
      if (retries >= MAX_ERROR_RETRIES) {
        errorRetryRef.current.delete(track.videoId);
        audio.pause();
        audio.src = "";
        return;
      }
      errorRetryRef.current.set(track.videoId, retries + 1);
      const fetchId = ++fetchIdRef.current;
      const start = cfg.pendingStartTimeRef?.current ?? 0;
      resolveAndPlay(fetchId, track.videoId, track.name, track.artists?.[0]?.name, start, cfg.isPlaying);
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
  }, [resolveAndPlay]);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    errorRetryRef.current.delete(track.videoId);
    const fetchId = ++fetchIdRef.current;
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }

    const start = config.pendingStartTimeRef?.current ?? 0;
    const shouldPlay = configRef.current.isPlaying;

    const urls = config.resolvedUrlsRef;
    const resolved = urls?.current.get(track.videoId);

    if (resolved && urls) {
      const timestamps = config.resolvedTimestampsRef;
      const ts = timestamps?.current.get(track.videoId) ?? 0;
      const isStale = Date.now() - ts > STALE_THRESHOLD_MS;
      if (!isStale) {
        setupAudioSource(fetchId, track.videoId, resolved, start, shouldPlay);
        return;
      }
      urls.current.delete(track.videoId);
      timestamps?.current.delete(track.videoId);
    }

    resolveAndPlay(fetchId, track.videoId, track.name, track.artists?.[0]?.name, start, shouldPlay);
  }, [config.nowPlaying?.videoId, config.token, setupAudioSource, resolveAndPlay]);

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
