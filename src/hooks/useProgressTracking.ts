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
    const audio = audioRef?.current;
    const player = playerRef.current;

    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      const cur = audio.currentTime;
      const tot = audio.duration;
      setCurrentTime(cur);
      setDuration(tot);
      setProgress(tot > 0 ? (cur / tot) * 100 : 0);
    } else if (player && typeof player.getCurrentTime === "function") {
      const cur = player.getCurrentTime() ?? 0;
      const tot =
        typeof player.getDuration === "function"
          ? player.getDuration() ?? 0
          : 0;
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
      const audio = audioRef?.current;
      const player = playerRef.current;

      if (audio) {
        audio.currentTime = time;
      }
      if (player && typeof player.seekTo === "function") {
        try {
          player.seekTo(time, true);
        } catch {
          return;
        }
      }
      setCurrentTime(time);
      const tot =
        audio && Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : typeof player?.getDuration === "function"
            ? player.getDuration() ?? 0
            : 0;
      if (tot > 0) setProgress((time / tot) * 100);
    },
    [playerRef, audioRef],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef?.current;
      const player = playerRef.current;
      let dur = 0;

      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        dur = audio.duration;
      } else if (player && typeof player.getDuration === "function") {
        dur = player.getDuration() ?? 0;
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
