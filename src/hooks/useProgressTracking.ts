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

      const cur = player.getCurrentTime?.() ?? 0;
      const tot = player.getDuration?.() ?? 0;

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

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const player = playerRef.current;
      if (!player || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const seekTo = ((e.clientX - rect.left) / rect.width) * duration;

      player.seekTo(seekTo, true);
      setCurrentTime(seekTo);
      setProgress((seekTo / duration) * 100);
    },
    [playerRef, duration],
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
  };
}
