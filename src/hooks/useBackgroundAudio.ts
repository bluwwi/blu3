"use client";
import { useEffect, useRef, useCallback } from "react";
import { Track } from "@/utils/types";

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

  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);

  const syncVolume = useCallback(() => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    player.setVolume(configRef.current.isMuted ? 0 : configRef.current.volume);
  }, []);

  const controlYt = useCallback((videoId: string) => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    if (lastVideoIdRef.current !== videoId) {
      player.loadVideoById(videoId);
      lastVideoIdRef.current = videoId;
    }
    syncVolume();
    if (configRef.current.isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [syncVolume]);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
    const track = configRef.current.nowPlaying;
    if (track?.videoId) {
      player.loadVideoById(track.videoId);
      lastVideoIdRef.current = track.videoId;
    }
    syncVolume();
    if (configRef.current.isPlaying) player.playVideo();
  }, [syncVolume]);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0) configRef.current.onTrackEnd();
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;
    controlYt(track.videoId);
  }, [config.nowPlaying?.videoId, controlYt]);

  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    syncVolume();
    if (config.isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [config.isPlaying, config.volume, config.isMuted, syncVolume]);

  return { onYtReady, onYtStateChange, ytPlayerRef };
}
