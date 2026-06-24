"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { resolveTrackSource } from "@/utils/ytdl";
import { API_URL } from "@/utils/ytdl";
import { onVisibilityChange } from "@/utils/visibilityCoordinator";
import { YouTubePlayerHandle } from "@/components/Player/YouTubePlayer";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const MAX_ERROR_RETRIES = 3;
const LOAD_TIMEOUT_MS = 15000;

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
  retryKey?: number;
  ytPlayerRef?: React.MutableRefObject<YouTubePlayerHandle | null>;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fetchIdRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const errorRetryRef = useRef<Map<string, number>>(new Map());
  const abortCountRef = useRef(0);

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

  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupAudioSource = useCallback((fetchId: number, videoId: string, audioUrl: string, startTime: number, shouldPlay: boolean) => {
    const audio = audioRef.current;
    if (!audio || fetchIdRef.current !== fetchId) return;
    const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
    const streamingUrl = `${API_URL}${audioUrl}${tokenParam}`;
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    audio.src = streamingUrl;
    audio.currentTime = startTime;
    if (shouldPlay) safePlay(audio);
    loadTimerRef.current = setTimeout(() => {
      if (fetchIdRef.current !== fetchId) return;
      if (audio.readyState === 0 || audio.readyState === 1) {
        const cfg = configRef.current;
        const track = cfg.nowPlaying;
        if (track?.videoId) {
          const retries = errorRetryRef.current.get(track.videoId) ?? 0;
          if (retries < MAX_ERROR_RETRIES) {
            errorRetryRef.current.set(track.videoId, retries + 1);
            const newFetchId = ++fetchIdRef.current;
            const start = cfg.pendingStartTimeRef?.current ?? 0;
            resolveRef.current(newFetchId, track.videoId, track.name, track.artists?.[0]?.name, start, cfg.isPlaying);
          }
        }
      }
    }, LOAD_TIMEOUT_MS);
  }, [config.token, safePlay]);

  const resolveAndPlay = useCallback((fetchId: number, videoId: string, name: string, artists: string | undefined, startTime: number, shouldPlay: boolean) => {
    resolveTrackSource(videoId, name, artists, config.token)
      .then((result) => {
        if (fetchIdRef.current !== fetchId) return;
        if (result.audioUrl) {
          config.resolvedUrlsRef?.current.set(videoId, result.audioUrl);
          config.resolvedTimestampsRef?.current.set(videoId, Date.now());
          setupAudioSource(fetchId, videoId, result.audioUrl, startTime, shouldPlay);
        } else {
          const yt = config.ytPlayerRef?.current;
          if (yt) {
            yt.setVolume(configRef.current.isMuted ? 0 : configRef.current.volume);
            yt.loadVideo(videoId);
          }
        }
      });
  }, [config.token, config.resolvedUrlsRef, config.resolvedTimestampsRef, setupAudioSource]);

  const resolveRef = useRef(resolveAndPlay);
  resolveRef.current = resolveAndPlay;

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
      resolveRef.current(fetchId, track.videoId, track.name, track.artists?.[0]?.name, start, cfg.isPlaying);
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
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
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
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    errorRetryRef.current.delete(track.videoId);
    abortCountRef.current = 0;
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
    const yt = config.ytPlayerRef?.current;
    if (yt && yt.isReady && !audioRef.current?.src) {
      yt.setVolume(config.isMuted ? 0 : config.volume);
      if (config.isPlaying) {
        yt.play();
      } else {
        yt.pause();
      }
      if (config.isPlaying) acquireWakeLock();
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (config.isPlaying) {
        if (audio.paused) safePlay(audio);
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
      if (audio.paused) {
        safePlay(audio);
      }
    });
    return unsub;
  }, [safePlay]);

  useEffect(() => {
    if (!config.retryKey) return;
    const audio = audioRef.current;
    if (audio && !audio.paused) return;
    if (audio && audio.src && configRef.current.isPlaying) {
      safePlay(audio);
    }
  }, [config.retryKey, safePlay]);

  return { audioRef, retryPlay };
}
