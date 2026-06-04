"use client";
import { useCallback, useEffect, useRef } from "react";
import type { Track } from "@/utils/types";

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
  const ytPlayerRef = useRef<any>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const ytReadyRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const ensureSilentAudio = useCallback(() => {
    try {
      const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtxRef.current) {
        const ctx = new AudioCtor();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        audioCtxRef.current = ctx;
        oscRef.current = osc;
        gainRef.current = gain;
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {}
  }, []);

  const suspendSilentAudio = useCallback(() => {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state === "running") {
        audioCtxRef.current.suspend();
      }
    } catch {}
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

  const controlYt = useCallback((videoId: string) => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    if (lastVideoIdRef.current !== videoId) {
      player.loadVideoById(videoId);
      lastVideoIdRef.current = videoId;
    }
    if (configRef.current.isPlaying) {
      player.setVolume(configRef.current.isMuted ? 0 : configRef.current.volume * 2);
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
      controlYt(track.videoId);
    }
  }, [controlYt]);

  const onYtStateChange = useCallback((state: number) => {
    if (state === 0) configRef.current.onTrackEnd();
  }, []);

  useEffect(() => {
    const track = config.nowPlaying;
    if (!track?.videoId) return;
    controlYt(track.videoId);
  }, [config.nowPlaying?.videoId, controlYt]);

  useEffect(() => {
    if (!ytPlayerRef.current || !ytReadyRef.current) return;
    const player = ytPlayerRef.current;
    if (config.isPlaying) {
      player.setVolume(config.isMuted ? 0 : config.volume * 2);
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [config.isPlaying, config.volume, config.isMuted]);

  useEffect(() => {
    if (config.isPlaying) {
      ensureSilentAudio();
      acquireWakeLock();
    } else {
      suspendSilentAudio();
      releaseWakeLock();
    }
  }, [config.isPlaying, acquireWakeLock, releaseWakeLock, ensureSilentAudio, suspendSilentAudio]);

  useEffect(() => {
    return () => {
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = config.nowPlaying
        ? new MediaMetadata({
            title: config.nowPlaying.name || "",
            artist: config.nowPlaying.artists?.[0]?.name || "",
            album: config.nowPlaying.album?.name || "",
            artwork: config.nowPlaying.image
              ? [{ src: config.nowPlaying.image, sizes: "512x512", type: "image/png" }]
              : [],
          })
        : null;
    } catch {}
    try {
      navigator.mediaSession.setActionHandler("play", () => configRef.current.onPlay());
      navigator.mediaSession.setActionHandler("pause", () => configRef.current.onPause());
      navigator.mediaSession.setActionHandler("previoustrack", () => configRef.current.onPrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => configRef.current.onNext());
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (d.seekTime != null) configRef.current.onSeek(d.seekTime);
      });
    } catch {}
    navigator.mediaSession.playbackState = config.isPlaying ? "playing" : "paused";
  }, [config.nowPlaying?.videoId, config.isPlaying]);

  return { onYtReady, onYtStateChange, ytPlayerRef };
}
