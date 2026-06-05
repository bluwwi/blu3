"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { getAudioStreamUrl, getStreamUrl, preResolveYt, resolveTrackSource } from "@/utils/ytdl";
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
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const fallbackRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const hasAudioUrlRef = useRef(false);
  const audioUrlRef = useRef<string | null>(null);
  const fetchIdRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioReloadedRef = useRef(false);

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

  /* --- Audio element (primary for proxied audio, fallback for YouTube) --- */
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.onplay = () => {
      if (hasAudioUrlRef.current || fallbackRef.current)
        configRef.current.onPlay();
    };
    audio.onpause = () => {
      if (hasAudioUrlRef.current || fallbackRef.current)
        configRef.current.onPause();
    };
    audio.onended = () => {
      configRef.current.onTrackEnd();
    };
    audio.onerror = () => {
      if (hasAudioUrlRef.current) {
        configRef.current.onTrackEnd();
        return;
      }
      if (!fallbackRef.current) return;
      const track = configRef.current.nowPlaying;
      if (!track?.videoId) return;
      if (!audioReloadedRef.current) {
        audioReloadedRef.current = true;
        getAudioStreamUrl(track.videoId).then((url) => {
          if (!url || !audioRef.current) return;
          audioRef.current.src = url;
          if (configRef.current.isPlaying)
            audioRef.current.play().catch(() => {});
        });
      }
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

  const enableFallback = useCallback(() => {
    if (fallbackRef.current) return;
    fallbackRef.current = true;
    hasAudioUrlRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    const track = configRef.current.nowPlaying;
    if (!track?.videoId) return;
    audio.volume = configRef.current.isMuted ? 0 : configRef.current.volume / 100;
    audio.currentTime = 0;
    if (configRef.current.isPlaying) {
      audio.play().catch(() => {
        getAudioStreamUrl(track.videoId).then((url) => {
          if (!url || !audioRef.current) return;
          audioReloadedRef.current = false;
          audioRef.current.src = url;
          if (configRef.current.isPlaying)
            audioRef.current.play().catch(() => {});
        });
      });
    }
  }, []);

  /* --- YT iframe callbacks (YouTube source only) --- */
  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
    player.setVolume(configRef.current.isMuted ? 0 : configRef.current.volume);
    const track = configRef.current.nowPlaying;
    if (track?.videoId && !hasAudioUrlRef.current) {
      const start = configRef.current.pendingStartTimeRef?.current ?? 0;
      player.loadVideoById({ videoId: track.videoId, startSeconds: start });
      lastVideoIdRef.current = track.videoId;
      if (configRef.current.isPlaying) player.playVideo();
    }
  }, []);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0 && !fallbackRef.current && !hasAudioUrlRef.current) {
      configRef.current.onTrackEnd();
    }
    if (state === 1 && !fallbackRef.current && !hasAudioUrlRef.current) {
      configRef.current.onPlay();
    }
    if (state === 2 && !fallbackRef.current && !hasAudioUrlRef.current) {
      configRef.current.onPause();
    }
  }, []);

  /* --- Track change --- */
  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    hasAudioUrlRef.current = false;
    fallbackRef.current = false;
    audioReloadedRef.current = false;
    lastVideoIdRef.current = null;
    const fetchId = ++fetchIdRef.current;

    resolveTrackSource(track.videoId, track.name, track.artists?.[0]?.name, config.token)
      .then((result) => {
        if (fetchIdRef.current !== fetchId) return;
        if (result.audioUrl) {
          hasAudioUrlRef.current = true;
          const audio = audioRef.current;
          if (!audio) return;
          const start = config.pendingStartTimeRef?.current ?? 0;
          const tokenParam = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
          audio.src = `${API_URL}${result.audioUrl}${tokenParam}`;
          audio.currentTime = start;
          if (configRef.current.isPlaying)
            audio.play().catch(() => {});
        } else {
          const player = ytPlayerRef.current;
          if (player && ytReadyRef.current) {
            const start = config.pendingStartTimeRef?.current ?? 0;
            player.loadVideoById({ videoId: track.videoId, startSeconds: start });
            lastVideoIdRef.current = track.videoId;
            if (configRef.current.isPlaying) player.playVideo();
          }
          const audio = audioRef.current;
          if (audio) {
            audio.src = getStreamUrl(track.videoId);
          }
        }
      });
  }, [config.nowPlaying?.videoId, config.token]);

  /* --- Play / Pause / Volume --- */
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current && !fallbackRef.current && !hasAudioUrlRef.current) {
      player.setVolume(config.isMuted ? 0 : config.volume);
      if (config.isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }

    const audio = audioRef.current;
    if (audio) {
      if (hasAudioUrlRef.current || fallbackRef.current) {
        audio.volume = config.isMuted ? 0 : config.volume / 100;
        if (config.isPlaying) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      } else {
        audio.volume = 0;
      }
    }

    if (config.isPlaying) acquireWakeLock();
    else releaseWakeLock();
  }, [config.isPlaying, config.volume, config.isMuted, acquireWakeLock, releaseWakeLock]);

  return { onYtReady, onYtStateChange, ytPlayerRef, audioRef, enableFallback };
}
