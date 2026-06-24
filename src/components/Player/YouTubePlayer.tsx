"use client";
import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerHandle {
  loadVideo: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
  isReady: () => boolean;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, Record<string, never>>(function YouTubePlayer(_, ref) {
  const playerRef = useRef<any>(null);
  const apiReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingVideoId = useRef<string | null>(null);
  const readyCallbacks = useRef<Array<() => void>>([]);
  const playerReady = useRef(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReady.current = true;
      return;
    }
    if (window.onYouTubeIframeAPIReady) return;
    window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
      readyCallbacks.current.forEach(fn => fn());
      readyCallbacks.current = [];
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  const initPlayer = useCallback((videoId: string) => {
    if (!apiReady.current) {
      pendingVideoId.current = videoId;
      readyCallbacks.current.push(() => initPlayer(videoId));
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
        onStateChange: () => {},
        onError: () => {},
      },
    });
  }, []);

  useImperativeHandle(ref, () => ({
    loadVideo: (videoId: string) => { playerReady.current = false; initPlayer(videoId); },
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seekTo: (s: number) => playerRef.current?.seekTo(s, true),
    setVolume: (v: number) => playerRef.current?.setVolume(v),
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    getDuration: () => playerRef.current?.getDuration() ?? 0,
    mute: () => playerRef.current?.mute(),
    unMute: () => playerRef.current?.unMute(),
    destroy: () => { playerRef.current?.destroy(); playerRef.current = null; playerReady.current = false; },
    isReady: () => playerReady.current,
  }), [initPlayer]);

  useEffect(() => {
    if (pendingVideoId.current && apiReady.current) {
      initPlayer(pendingVideoId.current);
      pendingVideoId.current = null;
    }
  }, [initPlayer]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    />
  );
});

export default YouTubePlayer;
