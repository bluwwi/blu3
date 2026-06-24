"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Track } from "@/utils/types";

const POLL_INTERVAL = 250;

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
  audioUrl: string | null | undefined,
  isPlaying: boolean,
  volume: number,
  isMuted: boolean,
  onTrackEnd?: () => void,
  pendingStartTimeRef?: React.MutableRefObject<number>,
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
  const pendingSeekRef = useRef<number | null>(null);
  const lastVideoIdRef = useRef<string | null>(null);
  const lastAudioUrlRef = useRef<string | null | undefined>(null);

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

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    isActiveRef.current = false;
    setIsActive(false);
    stopTracking();
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    endedSent.current = false;
  }, [stopTracking]);

  const initPlayer = useCallback((videoId: string, startTime?: number) => {
    destroyPlayer();

    const tryInit = () => {
      if (!apiReady.current || !window.YT?.Player) {
        setTimeout(tryInit, 100);
        return;
      }

      pendingSeekRef.current = startTime ?? null;

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
          onReady: () => {
            if (pendingSeekRef.current != null && pendingSeekRef.current > 0) {
              playerRef.current?.seekTo?.(pendingSeekRef.current, true);
              pendingSeekRef.current = null;
            }
          },
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
            }
          },
          onError: () => {},
        },
      });
    };
    tryInit();
  }, [destroyPlayer, startTracking, stopTracking, onTrackEnd]);

  useEffect(() => {
    const videoId = nowPlaying?.videoId ?? null;

    if (!videoId) {
      if (isActiveRef.current || playerRef.current) {
        destroyPlayer();
      }
      lastVideoIdRef.current = null;
      lastAudioUrlRef.current = null;
      return;
    }

    const isResolving = audioUrl === undefined;
    const useYt = audioUrl === null;

    if (isResolving) {
      if (isActiveRef.current || playerRef.current) {
        destroyPlayer();
      }
    } else if (useYt) {
      if (videoId !== lastVideoIdRef.current || lastAudioUrlRef.current !== null) {
        isActiveRef.current = true;
        setIsActive(true);
        const startTime = pendingStartTimeRef?.current ?? 0;
        initPlayer(videoId, startTime);
      }
    } else {
      if (isActiveRef.current || playerRef.current) {
        destroyPlayer();
      }
    }

    lastVideoIdRef.current = videoId;
    lastAudioUrlRef.current = audioUrl;
  }, [nowPlaying?.videoId, audioUrl, destroyPlayer, initPlayer]);

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
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [stopTracking]);

  return { ytProgress, ytCurrentTime, ytDuration, isActive, seekTo, playerContainerId: containerId.current };
}
