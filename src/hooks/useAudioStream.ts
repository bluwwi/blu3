"use client";

import { useRef, useCallback, useEffect } from "react";

/*
 * OLD: useAudioStream — server-side audio proxy via <audio> element.
 * Kept for reference. Replaced by YT iframe direct playback.
 *
 * The RoomPage and usePlayerState now control the YT iframe directly.
 * This stub preserves the public API so imports don't break.
 */

export interface AudioStreamCallbacks {
  onPlaying?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onWaiting?: () => void;
  onError?: () => void;
}

export function useAudioStream(callbacks?: AudioStreamCallbacks) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Stub — all methods are no-ops; YT iframe handles playback */
  useEffect(() => {
    /* OLD: const el = new Audio(); ... */
  }, []);

  const loadStream = useCallback((_videoId: string) => {
    /* OLD: loaded via getStreamUrl(videoId) → /stream/:id endpoint */
  }, []);

  const play = useCallback(() => {
    /* OLD: audioRef.current?.play().catch(() => {}) */
  }, []);

  const pause = useCallback(() => {
    /* OLD: audioRef.current?.pause() */
  }, []);

  const seek = useCallback((_time: number) => {
    /* OLD: audioRef.current.currentTime = time */
  }, []);

  const setVolume = useCallback((_vol: number) => {
    /* OLD: audioRef.current.volume = vol */
  }, []);

  const getCurrentTime = useCallback(() => {
    return 0;
  }, []);

  const getDuration = useCallback(() => {
    return 0;
  }, []);

  return {
    audioRef,
    loadStream,
    play,
    pause,
    seek,
    setVolume,
    getCurrentTime,
    getDuration,
  };
}
