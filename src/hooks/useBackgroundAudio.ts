"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { getAudioStreamUrl } from "@/utils/ytdl";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onTrackEnd: () => void;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const fallbackRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const fetchIdRef = useRef(0);
  const hasSrcRef = useRef(false);

  function enableFallback(videoId: string) {
    fallbackRef.current = true;
    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current) {
      player.loadVideoById(videoId);
      lastVideoIdRef.current = videoId;
      player.setVolume(configRef.current.isMuted ? 0 : configRef.current.volume);
      if (configRef.current.isPlaying) player.playVideo();
    }
  }

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.onended = () => configRef.current.onTrackEnd();
    audio.onerror = () => {
      if (document.hidden) return;
      if (!fallbackRef.current) {
        const track = configRef.current.nowPlaying;
        if (track?.videoId) enableFallback(track.videoId);
      }
    };

    audioRef.current = audio;
    return () => {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      hasSrcRef.current = false;
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, []);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
  }, []);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0) configRef.current.onTrackEnd();
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    fallbackRef.current = false;
    lastVideoIdRef.current = null;
    hasSrcRef.current = false;
    const fetchId = ++fetchIdRef.current;

    const audio = audioRef.current;
    if (!audio) return;

    getAudioStreamUrl(track.videoId)
      .then((url) => {
        if (fetchId !== fetchIdRef.current) return;
        if (!url || !audioRef.current || fallbackRef.current) {
          if (!fallbackRef.current) enableFallback(track.videoId);
          return;
        }
        const wasPaused = audio.paused;
        audio.src = url;
        hasSrcRef.current = true;
        if (configRef.current.isPlaying)
          audio.play().catch(() => {
            if (!document.hidden && !fallbackRef.current)
              enableFallback(track.videoId);
          });
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) enableFallback(track.videoId);
      });
  }, [config.nowPlaying?.videoId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = config.isMuted ? 0 : config.volume / 100;
      if (config.isPlaying) {
        if (hasSrcRef.current) audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
    if (fallbackRef.current) {
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current) {
        player.setVolume(config.isMuted ? 0 : config.volume);
        if (config.isPlaying) player.playVideo();
        else player.pauseVideo();
      }
    }
  }, [config.isPlaying, config.volume, config.isMuted]);

  return { onYtReady, onYtStateChange, ytPlayerRef, audioRef };
}
