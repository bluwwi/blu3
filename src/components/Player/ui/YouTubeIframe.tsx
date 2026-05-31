"use client";

import { useEffect, useRef, useCallback } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import { CONFIG } from "@/components/Player/constants";

let externalOnReady: ((player: YouTubePlayer) => void) | null = null;

export function setYouTubeOnReady(cb: (player: YouTubePlayer) => void) {
  externalOnReady = cb;
}

export function YouTubeIframe() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const onReadyRef = useRef(externalOnReady);
  onReadyRef.current = externalOnReady;

  const onReady: YouTubeProps["onReady"] = useCallback((event) => {
    const player = event.target;
    playerRef.current = player;
    onReadyRef.current?.(player);
  }, []);

  const onStateChange: YouTubeProps["onStateChange"] = useCallback((event) => {
    const S = (window as any).YT?.PlayerState;
    if (!S) return;
    const data = event.data;
    const ytEvent = new CustomEvent("yt-state-change", {
      detail: { data },
    });
    window.dispatchEvent(ytEvent);
  }, []);

  const onError: YouTubeProps["onError"] = useCallback(() => {
    const ytEvent = new CustomEvent("yt-error", { detail: {} });
    window.dispatchEvent(ytEvent);
  }, []);

  useEffect(() => {
    return () => {
      externalOnReady = null;
    };
  }, []);

  const opts: YouTubeProps["opts"] = {
    height: "200",
    width: "200",
    playerVars: {
      ...CONFIG.YT_PLAYER_PARAMS,
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      origin: typeof window !== "undefined" ? window.location.origin : "",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "200px",
        height: "200px",
        opacity: 0.001,
        zIndex: -9999,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <YouTube
        videoId=""
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={onError}
      />
    </div>
  );
}
