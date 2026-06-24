"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProgressTracking(
  playerState: string,
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>,
  ytPlayerRef?: React.MutableRefObject<{ getCurrentTime: () => number; getDuration: () => number } | null>,
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;

  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    try {
      const yt = ytPlayerRef?.current;
      if (yt) {
        const cur = yt.getCurrentTime() ?? 0;
        const dur = yt.getDuration() || 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
        return;
      }
      const audio = audioRef?.current;
      if (!audio) return;
      const cur = audio.currentTime ?? 0;
      const dur = audio.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
    } catch {}
  }, [audioRef, ytPlayerRef]);

  const startTracking = useCallback(() => {
    if (progressInt.current) clearInterval(progressInt.current);
    progressInt.current = setInterval(tick, CONFIG.PROGRESS_INTERVAL_MS);
  }, [tick]);

  const stopTracking = useCallback(() => {
    if (progressInt.current) {
      clearInterval(progressInt.current);
      progressInt.current = null;
    }
  }, []);

  const lastSeekRef = useRef(0);
  const seekTo = useCallback(
    (time: number) => {
      const now = Date.now();
      if (now - lastSeekRef.current < 200) return;
      lastSeekRef.current = now;
      setCurrentTime(time);
      try {
        const yt = ytPlayerRef?.current;
        if (yt) {
          yt.seekTo(time);
        } else if (audioRef?.current) {
          audioRef.current.currentTime = time;
        }
      } catch {}
      const tot = duration;
      if (tot > 0) setProgress((time / tot) * 100);
    },
    [duration, audioRef, ytPlayerRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const dur = duration;
      if (!dur) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const seekToTime = ((e.clientX - rect.left) / rect.width) * dur;
      seekTo(seekToTime);
    },
    [seekTo, duration],
  );

  useEffect(() => {
    if (playerState === "playing" || playerState === "paused") {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [playerState, startTracking, stopTracking]);

  useEffect(() => {
    if (ytPlayerRef?.current) return;
    const audio = audioRef?.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      try {
        const cur = audio.currentTime;
        const dur = audio.duration || 0;
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      } catch {}
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [audioRef, ytPlayerRef]);

  return {
    progress,
    currentTime,
    duration,
    startTracking,
    stopTracking,
    handleSeek,
    seekTo,
  };
}
