"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProgressTracking(
  playerRef: React.MutableRefObject<YT.Player | null>,
  playerState: string,
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>,
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const player = playerRef.current;
    const audio = audioRef?.current;

    if (player && typeof player.getCurrentTime === "function") {
      const cur = player.getCurrentTime() ?? 0;
      const tot =
        typeof player.getDuration === "function"
          ? player.getDuration() ?? 0
          : 0;
      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    } else if (audio) {
      const cur = audio.currentTime ?? 0;
      const tot = audio.duration ?? 0;
      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    }
  }, [playerRef, audioRef]);

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
      const player = playerRef.current;
      const audio = audioRef?.current;

      if (player && typeof player.seekTo === "function") {
        try {
          player.seekTo(time, true);
        } catch {
          return;
        }
        setCurrentTime(time);
        const tot =
          typeof player.getDuration === "function"
            ? player.getDuration() ?? 0
            : 0;
        if (tot > 0) setProgress((time / tot) * 100);
      } else if (audio) {
        audio.currentTime = time;
        setCurrentTime(time);
        if (audio.duration > 0) setProgress((time / audio.duration) * 100);
      }
    },
    [playerRef, audioRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const player = playerRef.current;
      const audio = audioRef?.current;
      let dur = 0;

      if (player && typeof player.getDuration === "function") {
        dur = player.getDuration() ?? 0;
      } else if (audio) {
        dur = audio.duration ?? 0;
      }

      if (!dur) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const seekToTime = ((e.clientX - rect.left) / rect.width) * dur;
      seekTo(seekToTime);
    },
    [playerRef, audioRef, seekTo],
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
