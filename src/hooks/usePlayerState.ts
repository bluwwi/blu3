"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import ReactPlayer from "react-player";

interface UsePlayerStateReturn {
  reactPlayerRef: React.MutableRefObject<ReactPlayer | null>;
  playerState: PlayerStateType;
  volume: number;
  isMuted: boolean;
  nowPlaying: Track | null;
  activeVideoId: string | null;
  error: string;
  src: string | null;
  playing: boolean;
  playTrack: (track: Track, startTime?: number, shouldPlay?: boolean) => void;
  togglePlayPause: () => void;
  handleVolume: (val: number) => void;
  toggleMute: () => void;
  setError: (msg: string) => void;
  setNowPlaying: (track: Track | null) => void;
  setPlayerState: (state: PlayerStateType) => void;
  play: () => void;
  pause: () => void;
  handleReady: () => void;
  handlePlayEvent: () => void;
  handlePauseEvent: () => void;
  handleEnded: () => void;
  handleError: (e: any) => void;
}

export function usePlayerState(): UsePlayerStateReturn {
  const [playerState, setPlayerState] = useState<PlayerStateType>("idle");
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const reactPlayerRef = useRef<ReactPlayer | null>(null);
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;
  const activeVideoIdRef = useRef(activeVideoId);
  activeVideoIdRef.current = activeVideoId;

  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      if (!track.videoId) {
        setPlayerState("error");
        setError("No video ID.");
        return;
      }

      setPlayerState("loading");
      if (track.videoId === activeVideoIdRef.current) {
        reactPlayerRef.current?.seekTo(startTime ?? 0, "seconds");
        setPlaying(shouldPlay);
      } else {
        const videoSrc = `https://www.youtube.com/watch?v=${track.videoId}&start=${Math.floor(startTime ?? 0)}`;
        setSrc(videoSrc);
        setPlaying(shouldPlay);
      }
    },
    [],
  );

  const play = useCallback(() => {
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
  }, []);

  /* Web Audio API Oscillator Keep-Alive setup */
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const startSilentOscillator = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch {}
        oscillatorRef.current = null;
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime); // Silent gain

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
    } catch (e) {
      console.warn("[PlayerState] Failed to start silent oscillator:", e);
    }
  }, []);

  const stopSilentOscillator = useCallback(() => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.suspend();
      }
    } catch (e) {
      console.warn("[PlayerState] Failed to stop silent oscillator:", e);
    }
  }, []);

  useEffect(() => {
    if (playing) {
      startSilentOscillator();
    } else {
      stopSilentOscillator();
    }
    return () => {
      stopSilentOscillator();
    };
  }, [playing, startSilentOscillator, stopSilentOscillator]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  /* Sync volume/mute to ReactPlayer */
  useEffect(() => {
    const player = reactPlayerRef.current;
    if (!player) return;
  }, []);

  const togglePlayPause = useCallback(() => {
    const id = nowPlayingRef.current?.videoId;
    if (!id) return;
    if (playerStateRef.current === "playing") {
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  }, []);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const handleReady = useCallback(() => {
    /* ReactPlayer is ready — no special action needed */
  }, []);

  const handlePlayEvent = useCallback(() => {
    setPlayerState("playing");
  }, []);

  const handlePauseEvent = useCallback(() => {
    setPlayerState("paused");
  }, []);

  const handleEnded = useCallback(() => {
    setPlayerState("ended");
  }, []);

  const handleError = useCallback((e: any) => {
    console.error("[ReactPlayer] Error:", e);
    setError(`Player error`);
    setPlayerState("error");
  }, []);

  return {
    reactPlayerRef,
    playerState,
    volume,
    isMuted,
    nowPlaying,
    activeVideoId,
    error,
    src,
    playing,
    playTrack,
    togglePlayPause,
    handleVolume,
    toggleMute,
    setError,
    setNowPlaying,
    setPlayerState,
    play,
    pause,
    handleReady,
    handlePlayEvent,
    handlePauseEvent,
    handleEnded,
    handleError,
  };
}
