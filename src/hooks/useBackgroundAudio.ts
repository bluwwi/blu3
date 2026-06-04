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

function createSilentWavBlob(): Blob {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 8;
  const duration = 1;
  const dataSize = sampleRate * channels * (bitsPerSample / 8) * duration;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const w = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
  view.setUint16(32, channels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}

export function useBackgroundAudio(config: BackgroundAudioConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silentUrlRef = useRef<string | null>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0;

    const blob = createSilentWavBlob();
    const url = URL.createObjectURL(blob);
    silentUrlRef.current = url;
    audio.src = url;
    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      if (silentUrlRef.current) {
        URL.revokeObjectURL(silentUrlRef.current);
        silentUrlRef.current = null;
      }
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
    if (configRef.current.isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, []);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    ytReadyRef.current = true;
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
    controlYt(track.videoId);
  }, [config.nowPlaying?.videoId, controlYt]);

  useEffect(() => {
    if (config.isPlaying) {
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current) player.playVideo();
    } else {
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current) player.pauseVideo();
    }
  }, [config.isPlaying]);

  return { onYtReady, onYtStateChange, ytPlayerRef, audioRef };
}
