"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";
import { getAudioStreamUrl } from "@/utils/ytdl";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
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
  const audioReloadedRef = useRef(false);

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

  function reloadAudioSrc(videoId: string) {
    audioReloadedRef.current = true;
    getAudioStreamUrl(videoId).then((url) => {
      if (!url || !audioRef.current || fallbackRef.current) {
        if (!fallbackRef.current) enableFallback(videoId);
        return;
      }
      audioRef.current.src = url;
      if (configRef.current.isPlaying)
        audioRef.current.play().catch(() => {
          if (!fallbackRef.current) enableFallback(videoId);
        });
    });
  }

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.onplay = () => configRef.current.onPlay();
    audio.onpause = () => configRef.current.onPause();
    audio.onended = () => configRef.current.onTrackEnd();
    audio.onerror = () => {
      if (fallbackRef.current) return;
      const track = configRef.current.nowPlaying;
      if (!track?.videoId) return;
      if (!audioReloadedRef.current) {
        reloadAudioSrc(track.videoId);
      } else if (!document.hidden) {
        enableFallback(track.videoId);
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
      hasSrcRef.current = false;
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, []);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
    player.setVolume(0);
  }, []);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0) configRef.current.onTrackEnd();
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;

    fallbackRef.current = false;
    audioReloadedRef.current = false;
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
        audio.src = url;
        hasSrcRef.current = true;
        audioReloadedRef.current = false;
        if (configRef.current.isPlaying)
          audio.play().catch(() => {
            if (!document.hidden && !fallbackRef.current)
              enableFallback(track.videoId);
          });
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) enableFallback(track.videoId);
      });

    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current) {
      player.loadVideoById(track.videoId);
      lastVideoIdRef.current = track.videoId;
      player.setVolume(0);
      if (configRef.current.isPlaying) player.playVideo();
    }
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
