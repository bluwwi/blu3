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
  containerRef: React.RefObject<HTMLDivElement | null>;
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiReady = useRef(false);
  const playerReady = useRef(false);
  const isActiveRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedSent = useRef(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) { apiReady.current = true; return; }
    if (window.onYouTubeIframeAPIReady) return;
    window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
      if (pendingVideoId.current) {
        initPlayer(pendingVideoId.current);
        pendingVideoId.current = null;
      }
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  const pendingVideoId = useRef<string | null>(null);

  const initPlayer = useCallback((videoId: string) => {
    if (!apiReady.current) {
      pendingVideoId.current = videoId;
      return;
    }
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerReady.current = true;
      return;
    }
    if (!containerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: 1,
      width: 1,
      videoId,
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
        onReady: () => { playerReady.current = true; },
        onStateChange: (e: any) => {
          if (e.data === 0 && isActiveRef.current && !endedSent.current) {
            endedSent.current = true;
            onTrackEnd?.();
          }
        },
        onError: () => {},
      },
    });
  }, [onTrackEnd]);

  useEffect(() => {
    if (!nowPlaying?.videoId) {
      setIsActive(false);
      isActiveRef.current = false;
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        playerReady.current = false;
      }
      return;
    }

    const videoId = nowPlaying.videoId;
    let destroyed = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const checkResult = () => {
      if (destroyed) return;
      const result = resolveResultRef?.current.get(videoId);
      if (!result) return;

      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }

      if (result.audioUrl) {
        setIsActive(false);
        isActiveRef.current = false;
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
          playerReady.current = false;
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
      checkResult();
    } else {
      pollTimer = setInterval(checkResult, RESOLVE_POLL_MS);
      timeoutTimer = setTimeout(() => {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        if (!destroyed) {
          setIsActive(false);
          isActiveRef.current = false;
        }
      }, RESOLVE_TIMEOUT_MS);
    }

    return () => {
      destroyed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [nowPlaying?.videoId, initPlayer, resolveResultRef]);

  useEffect(() => {
    if (!isActive) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => {
      try {
        const p = playerRef.current;
        if (!p || !isActiveRef.current) return;
        const cur = p.getCurrentTime() ?? 0;
        const dur = p.getDuration() || 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      } catch {}
    }, POLL_INTERVAL);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !playerRef.current || !playerReady.current) return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isActive]);

  useEffect(() => {
    if (!isActive || !playerRef.current || !playerReady.current) return;
    playerRef.current.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, isActive]);

  const seekTo = useCallback((time: number) => {
    if (isActive && playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        playerReady.current = false;
      }
    };
  }, []);

  return { ytProgress, ytCurrentTime, ytDuration, isActive, seekTo, containerRef };
}
