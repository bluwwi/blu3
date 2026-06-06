"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { resolveTrackSource } from "@/utils/ytdl";
import { API_URL } from "@/utils/ytdl";

const CACHE_MAX = 10;

interface CacheEntry {
  blobUrl: string;
  size: number;
}

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
  const blobCacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const downloadRef = useRef<Map<string, boolean>>(new Map());

  const getCachedBlobUrl = useCallback((videoId: string): string | null => {
    const map = blobCacheRef.current;
    const entry = map.get(videoId);
    if (!entry) return null;
    map.delete(videoId);
    map.set(videoId, entry);
    return entry.blobUrl;
  }, []);

  const cacheBlob = useCallback((videoId: string, blob: Blob) => {
    const map = blobCacheRef.current;
    if (map.has(videoId)) {
      URL.revokeObjectURL(map.get(videoId)!.blobUrl);
      map.delete(videoId);
    }
    if (map.size >= CACHE_MAX) {
      const first = map.entries().next().value;
      if (first) {
        URL.revokeObjectURL(first[1].blobUrl);
        map.delete(first[0]);
      }
    }
    const blobUrl = URL.createObjectURL(blob);
    map.set(videoId, { blobUrl, size: blob.size });
  }, []);

  const startBackgroundDownload = useCallback((url: string, videoId: string) => {
    if (downloadRef.current.get(videoId)) return;
    downloadRef.current.set(videoId, true);
    fetch(url)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "audio/mpeg";
        return res.arrayBuffer().then((buf) => ({ buf, contentType }));
      })
      .then(({ buf, contentType }) => {
        const blob = new Blob([buf], { type: contentType });
        cacheBlob(videoId, blob);
      })
      .catch(() => {});
  }, [cacheBlob]);

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
      if (typeof document !== "undefined" && document.hidden) return;
      const cfg = configRef.current;
      if (cfg.manualPauseRef?.current) {
        cfg.manualPauseRef.current = false;
        cfg.onPause();
        return;
      }
      const currentId = cfg.nowPlaying?.videoId;
      if (currentId) {
        const cachedUrl = getCachedBlobUrl(currentId);
        if (cachedUrl && audioRef.current) {
          const savedTime = audioRef.current.currentTime;
          audioRef.current.src = cachedUrl;
          audioRef.current.currentTime = savedTime;
          audioRef.current.play().catch(() => cfg.onPause());
          return;
        }
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
  }, [getCachedBlobUrl]);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    const fetchId = ++fetchIdRef.current;
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }

    const cachedUrl = getCachedBlobUrl(track.videoId);
    if (cachedUrl && audio) {
      const start = config.pendingStartTimeRef?.current ?? 0;
      audio.src = cachedUrl;
      audio.currentTime = start;
      if (configRef.current.isPlaying)
        audio.play().catch(() => {});
      return;
    }

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
        startBackgroundDownload(streamingUrl, track.videoId);
      }
      return;
    }

    resolveTrackSource(track.videoId, track.name, track.artists?.[0]?.name, config.token)
      .then((result) => {
        if (fetchIdRef.current !== fetchId) return;
        if (result.audioUrl) {
          const audio = audioRef.current;
          if (!audio) return;
          const start = config.pendingStartTimeRef?.current ?? 0;
          const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
          const streamingUrl = `${API_URL}${result.audioUrl}${tokenParam}`;
          audio.src = streamingUrl;
          audio.currentTime = start;
          if (configRef.current.isPlaying)
            audio.play().catch(() => {});
          startBackgroundDownload(streamingUrl, track.videoId);
        }
      });
  }, [config.nowPlaying?.videoId, config.token, getCachedBlobUrl, startBackgroundDownload]);

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
