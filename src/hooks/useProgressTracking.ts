"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProgressTracking(
  playerRef: React.MutableRefObject<YT.Player | null>,
  playerState: string,
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = useCallback(() => {
    if (progressInt.current) clearInterval(progressInt.current);

    progressInt.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const cur = typeof player.getCurrentTime === "function" ? (player.getCurrentTime() ?? 0) : 0;
      const tot = typeof player.getDuration === "function" ? (player.getDuration() ?? 0) : 0;

      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    }, CONFIG.PROGRESS_INTERVAL_MS);
  }, [playerRef]);

  const stopTracking = useCallback(() => {
    if (progressInt.current) {
      clearInterval(progressInt.current);
      progressInt.current = null;
    }
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      const player = playerRef.current;
      if (!player) return;
      if (typeof player.seekTo !== "function") return;
      try {
        player.seekTo(time, true);
      } catch (err) {
        console.warn("seekTo failed (stale player?):", err);
        return;
      }
      setCurrentTime(time);
      const tot = typeof player.getDuration === "function" ? (player.getDuration() ?? 0) : 0;
      if (tot > 0) {
        setProgress((time / tot) * 100);
      }
    },
    [playerRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const player = playerRef.current;
      if (!player || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const seekToTime = ((e.clientX - rect.left) / rect.width) * duration;

      seekTo(seekToTime);
    },
    [duration, seekTo],
  );

  // Auto start/stop tracking based on player state
  useEffect(() => {
    if (playerState === "playing") {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [playerState, startTracking, stopTracking]);

  // Cleanup on unmount
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
