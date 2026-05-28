"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioPlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export function useAudioElement() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playerState, setPlayerState] = useState<AudioPlayerState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    audio.muted = isMuted;

    const onLoadStart = () => setPlayerState("loading");
    const onPlaying = () => setPlayerState("playing");
    const onPause = () => {
      if (audio.currentTime < audio.duration || audio.duration === 0) {
        setPlayerState("paused");
      }
    };
    const onEnded = () => setPlayerState("ended");
    const onError = () => setPlayerState("error");
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setDuration(audio.duration);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onDurationChange = () => {
      if (audio.duration > 0) setDuration(audio.duration);
    };
    const onCanPlay = () => {
      if (audio.paused && audio.currentTime === 0) {
        setPlayerState("loading");
      }
    };

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", onCanPlay);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audio.load();
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", onCanPlay);
      audioRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
  }, [isMuted]);

  const setSource = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (url === audio.src) return;
    setSrc(url);
    setPlayerState("loading");
    audio.src = url;
    audio.load();
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    if (audio.duration > 0) {
      setProgress((time / audio.duration) * 100);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    const v = Math.max(0, Math.min(1, val / 100));
    setVolumeState(v);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  return {
    audioRef,
    playerState,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    src,
    setSource,
    play,
    pause,
    seekTo,
    setVolume,
    setMuted,
  };
}
