"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProgressTracking(
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  playerState: string,
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const cur = audio.currentTime ?? 0;
      const tot = audio.duration ?? 0;
      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    }
  }, [audioRef]);

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

  const seekTo = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      setCurrentTime(time);
      if (audio) {
        audio.currentTime = time;
      }
      const tot = audio?.duration ?? 0;
      if (tot > 0) setProgress((time / tot) * 100);
    },
    [audioRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const dur = audio?.duration ?? 0;
      if (!dur) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const seekToTime = ((e.clientX - rect.left) / rect.width) * dur;
      seekTo(seekToTime);
    },
    [audioRef, seekTo],
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
    return () => stopTracking();
  }, [stopTracking]);

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
