"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Track } from "@/utils/types";

const POLL_INTERVAL = 250;
const RESOLVE_POLL_MS = 100;
const RESOLVE_TIMEOUT_MS = 15000;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YoutubePlaybackResult {
  ytProgress: number;
  ytCurrentTime: number;
  ytDuration: number;
  isActive: boolean;
  seekTo: (time: number) => void;
  playerContainerId: string;
}

let playerCounter = 0;

export function useYoutubePlayback(
  nowPlaying: Track | null,
  isPlaying: boolean,
  volume: number,
  isMuted: boolean,
  onTrackEnd?: () => void,
  resolveResultRef?: React.MutableRefObject<Map<string, { audioUrl?: string; image?: string }>>,
): YoutubePlaybackResult {
  const [isActive, setIsActive] = useState(false);
  const [ytProgress, setProgress] = useState(0);
  const [ytCurrentTime, setCurrentTime] = useState(0);
  const [ytDuration, setDuration] = useState(0);

  const playerRef = useRef<any>(null);
  const apiReady = useRef(false);
  const isActiveRef = useRef(false);
  const progressInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedSent = useRef(false);
  const containerId = useRef(`yt-player-${++playerCounter}`);

  useEffect(() => {
    if (window.YT?.Player) {
      apiReady.current = true;
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
    };
  }, []);

  const startTracking = useCallback(() => {
    if (progressInt.current) clearInterval(progressInt.current);
    progressInt.current = setInterval(() => {
      if (!playerRef.current || !isActiveRef.current) return;
      const cur = playerRef.current.getCurrentTime?.() ?? 0;
      const dur = playerRef.current.getDuration?.() ?? 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
    }, POLL_INTERVAL);
  }, []);

  const stopTracking = useCallback(() => {
    if (progressInt.current) {
      clearInterval(progressInt.current);
      progressInt.current = null;
    }
  }, []);

  const initPlayer = useCallback((videoId: string) => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    const tryInit = () => {
      if (!apiReady.current || !window.YT?.Player) {
        setTimeout(tryInit, 100);
        return;
      }
      playerRef.current = new window.YT.Player(containerId.current, {
        videoId,
        height: 1,
        width: 1,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {},
          onStateChange: (e: any) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              startTracking();
            } else if (e.data === S.PAUSED) {
              stopTracking();
            } else if (e.data === S.ENDED) {
              stopTracking();
              if (!endedSent.current) {
                endedSent.current = true;
                onTrackEnd?.();
              }
            } else if (e.data === S.BUFFERING) {
            }
          },
          onError: () => {},
        },
      });
    };
    tryInit();
  }, [startTracking, stopTracking, onTrackEnd]);

  useEffect(() => {
    if (!nowPlaying?.videoId) {
      if (isActiveRef.current) {
        setIsActive(false);
        isActiveRef.current = false;
        stopTracking();
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      }
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      endedSent.current = false;
      return;
    }

    const videoId = nowPlaying.videoId;
    let destroyed = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const onResult = () => {
      if (destroyed) return;
      const result = resolveResultRef?.current.get(videoId);
      if (!result) return;

      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }

      if (result.audioUrl) {
        if (isActiveRef.current) {
          setIsActive(false);
          isActiveRef.current = false;
          stopTracking();
          if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
          }
        }
      } else {
        setIsActive(true);
        isActiveRef.current = true;
        endedSent.current = false;
        initPlayer(videoId);
      }
    };

    const existing = resolveResultRef?.current.get(videoId);
    if (existing) {
      onResult();
    } else {
      pollTimer = setInterval(onResult, RESOLVE_POLL_MS);
      timeoutTimer = setTimeout(() => {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      }, RESOLVE_TIMEOUT_MS);
    }

    return () => {
      destroyed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [nowPlaying?.videoId, initPlayer, resolveResultRef, stopTracking]);

  useEffect(() => {
    if (!isActive || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying, isActive]);

  useEffect(() => {
    if (!isActive || !playerRef.current) return;
    playerRef.current.setVolume?.(isMuted ? 0 : volume);
  }, [volume, isMuted, isActive]);

  const seekTo = useCallback((time: number) => {
    if (isActive && playerRef.current) {
      playerRef.current.seekTo?.(time, true);
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      stopTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [stopTracking]);

  return { ytProgress, ytCurrentTime, ytDuration, isActive, seekTo, playerContainerId: containerId.current };
}
