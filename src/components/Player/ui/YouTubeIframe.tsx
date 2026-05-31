"use client";

import { useEffect, useRef, useCallback } from "react";
import YouTube, { type YouTubeProps, type YouTubePlayer } from "react-youtube";
import { CONFIG } from "@/components/Player/constants";

let externalOnReady: ((player: YouTubePlayer) => void) | null = null;

export function setYouTubeOnReady(cb: (player: YouTubePlayer) => void) {
  externalOnReady = cb;
}

export function YouTubeIframe() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const onReadyRef = useRef(externalOnReady);
  onReadyRef.current = externalOnReady;

  const onReady: YouTubeProps["onReady"] = useCallback((event: { target: YouTubePlayer }) => {
    const player = event.target;
    playerRef.current = player;
    console.log("[YT] Player ready");
    onReadyRef.current?.(player);
  }, []);

  const onStateChange: YouTubeProps["onStateChange"] = useCallback((event: { data: number }) => {
    window.dispatchEvent(
      new CustomEvent("yt-state-change", { detail: { data: event.data } }),
    );
  }, []);

  const onError: YouTubeProps["onError"] = useCallback((event: { data: number }) => {
    console.error("[YT] Player error:", event.data);
    window.dispatchEvent(
      new CustomEvent("yt-error", { detail: { data: event.data } }),
    );
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
    /* Off-screen but fully rendered — Chrome needs the iframe visible for autoplay */
    <div
      style={{
        position: "fixed",
        bottom: "-200px",
        right: "-200px",
        width: "200px",
        height: "200px",
        opacity: 1,
        zIndex: 1,
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
