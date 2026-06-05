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
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const hasAudioUrlRef = useRef(false);
  const fetchIdRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

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

    audio.onplay = () => {
      if (hasAudioUrlRef.current) configRef.current.onPlay();
    };
    audio.onpause = () => {
      if (hasAudioUrlRef.current) configRef.current.onPause();
    };
    audio.onended = () => {
      configRef.current.onTrackEnd();
    };
    audio.onerror = () => {
      if (hasAudioUrlRef.current) {
        hasAudioUrlRef.current = false;
        audio.pause();
        audio.src = "";
        const track = configRef.current.nowPlaying;
        const player = ytPlayerRef.current;
        if (track?.videoId && player && ytReadyRef.current) {
          const start = configRef.current.pendingStartTimeRef?.current ?? 0;
          lastVideoIdRef.current = track.videoId;
          try {
            player.loadVideoById({ videoId: track.videoId, startSeconds: start });
            if (configRef.current.isPlaying) player.playVideo();
          } catch {}
        }
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
    if (state === 0 && !hasAudioUrlRef.current) {
      configRef.current.onTrackEnd();
    }
    if (state === 1 && !hasAudioUrlRef.current) {
      configRef.current.onPlay();
    }
    if (state === 2 && !hasAudioUrlRef.current) {
      configRef.current.onPause();
    }
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    hasAudioUrlRef.current = false;
    lastVideoIdRef.current = null;

    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current) {
      try { player.stopVideo(); } catch {}
    }
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }

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
        }
      });
  }, [config.nowPlaying?.videoId, config.token]);

  useEffect(() => {
    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current && !hasAudioUrlRef.current) {
      player.setVolume(config.isMuted ? 0 : config.volume);
      if (config.isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }

    const audio = audioRef.current;
    if (audio && hasAudioUrlRef.current) {
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

  return { onYtReady, onYtStateChange, ytPlayerRef, audioRef, hasAudioUrlRef };
}
