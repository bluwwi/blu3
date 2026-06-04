"use client";
import { useEffect, useRef, useCallback } from "react";
import { getStreamUrl } from "@/utils/stream";
import { Track } from "@/utils/types";

interface BackgroundAudioConfig {
  nowPlaying: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onTrackEnd: () => void;
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFallbackRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.onerror = () => {
      audioFallbackRef.current = true;
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current) {
        const vol = configRef.current.isMuted ? 0 : configRef.current.volume * 2;
        player.setVolume(vol);
      }
    };
    audioRef.current = audio;
    return () => {
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const controlYt = useCallback((videoId: string) => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    if (lastVideoIdRef.current !== videoId) {
      player.loadVideoById(videoId);
      lastVideoIdRef.current = videoId;
    }
    player.setVolume(0);
    if (configRef.current.isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, []);

  const syncYtVolume = useCallback(() => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    if (audioFallbackRef.current) {
      const vol = configRef.current.isMuted ? 0 : configRef.current.volume * 2;
      player.setVolume(vol);
    } else {
      player.setVolume(0);
    }
  }, []);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
    player.setVolume(0);
    audioFallbackRef.current = false;
    const track = configRef.current.nowPlaying;
    if (track?.videoId) {
      player.loadVideoById(track.videoId);
      lastVideoIdRef.current = track.videoId;
      if (configRef.current.isPlaying) player.playVideo();
    }
  }, []);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0) configRef.current.onTrackEnd();
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;
    audioFallbackRef.current = false;
    controlYt(track.videoId);
    const audio = audioRef.current;
    if (audio) {
      audio.onerror = () => {
        audioFallbackRef.current = true;
        const player = ytPlayerRef.current;
        if (player && ytReadyRef.current) {
          const vol = configRef.current.isMuted ? 0 : configRef.current.volume * 2;
          player.setVolume(vol);
        }
      };
      audio.src = getStreamUrl(track.videoId);
      if (config.isPlaying) audio.play().catch(() => {});
    }
  }, [config.nowPlaying?.videoId, controlYt]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (config.isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      audio.volume = config.isMuted ? 0 : config.volume / 100;
    }
    const player = ytPlayerRef.current;
    if (player && ytReadyRef.current) {
      if (audioFallbackRef.current) {
        const vol = config.isMuted ? 0 : config.volume * 2;
        player.setVolume(vol);
      } else {
        player.setVolume(0);
      }
      if (config.isPlaying) player.playVideo();
      else player.pauseVideo();
    }
  }, [config.isPlaying, config.volume, config.isMuted]);

  return { onYtReady, onYtStateChange, ytPlayerRef, audioRef };
}
