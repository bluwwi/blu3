"use client";

import { CONFIG } from "@/components/Player/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProgressTracking(
  ytPlayerRef: React.MutableRefObject<any>,
  playerState: string,
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>,
) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;

  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    try {
      const player = ytPlayerRef.current;
      if (!player || !player.getCurrentTime) return;
      const cur = player.getCurrentTime() ?? 0;
      const dur = player.getDuration() ?? 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
    } catch {}
  }, [ytPlayerRef]);

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
      setCurrentTime(time);
      try {
        const player = ytPlayerRef.current;
        if (player && player.seekTo) {
          player.seekTo(time, true);
        }
      } catch {}
      try {
        if (audioRef?.current) {
          audioRef.current.currentTime = time;
        }
      } catch {}
      const tot = duration;
      if (tot > 0) setProgress((time / tot) * 100);
    },
    [ytPlayerRef, duration, audioRef],
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
  }, [audioRef]);

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
