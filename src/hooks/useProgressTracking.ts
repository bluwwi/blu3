"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

/*
 * OLD: Supported both YT playerRef + audioRef (HTMLAudioElement).
 * Now only YT playerRef is used — all audio comes from YT iframe.
 */
export function useProgressTracking(
  playerRef: React.MutableRefObject<YT.Player | null>,
  playerState: string,
  /* OLD: audioRef?: React.MutableRefObject<HTMLAudioElement | null> */
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const player = playerRef.current;
    /* OLD: checked audioRef first, fell back to playerRef */
    if (player && typeof player.getCurrentTime === "function") {
      const cur = player.getCurrentTime() ?? 0;
      const tot =
        typeof player.getDuration === "function"
          ? player.getDuration() ?? 0
          : 0;
      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    }
  }, [playerRef]);

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
      /* OLD: also handled audioRef.currentTime */
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
      }
    },
    [playerRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const player = playerRef.current;
      let dur = 0;

      /* OLD: also checked audioRef */
      if (player && typeof player.getDuration === "function") {
        dur = player.getDuration() ?? 0;
      }

      if (!dur) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const seekToTime = ((e.clientX - rect.left) / rect.width) * dur;
      seekTo(seekToTime);
    },
    [playerRef, seekTo],
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
