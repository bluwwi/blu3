"use client";

import { useEffect, useRef } from "react";

/* @types/youtube uses export = YT which clashes with module files.
   We reference window.YT at runtime and cast for the type. */
type YTPlayer = {
  new (element: HTMLElement, options: YTPlayerOptions): YT.Player;
};
type YTPlayerOptions = {
  height: string;
  width: string;
  playerVars: Record<string, string | number | undefined>;
  events: {
    onReady: (e: { target: YT.Player }) => void;
    onStateChange: (e: { data: number }) => void;
    onError: (e: { data: number }) => void;
  };
};

let externalOnReady: ((player: YT.Player) => void) | null = null;
let playerInstance: YT.Player | null = null;

export function setYouTubeOnReady(cb: (player: YT.Player) => void) {
  externalOnReady = cb;
  if (playerInstance) cb(playerInstance);
}

function loadYTAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
}

function createPlayer(container: HTMLElement): Promise<YT.Player> {
  return new Promise((resolve) => {
    const Player = (window as any).YT.Player as YTPlayer;
    new Player(container, {
      height: "200",
      width: "200",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        playsinline: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => resolve(e.target),
        onStateChange: (e) => {
          window.dispatchEvent(
            new CustomEvent("yt-state-change", { detail: { data: e.data } }),
          );
        },
        onError: (e) => {
          console.error("[YT] Error:", e.data);
          window.dispatchEvent(
            new CustomEvent("yt-error", { detail: { data: e.data } }),
          );
        },
      },
    });
  });
}

export function YouTubeIframe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      await loadYTAPI();
      if (cancelled) return;
      const player = await createPlayer(container);
      if (cancelled) { player.destroy(); return; }
      playerInstance = player;
      externalOnReady?.(player);
    })();

    return () => {
      cancelled = true;
      externalOnReady = null;
      if (playerInstance) {
        playerInstance.destroy();
        playerInstance = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        width: "200px",
        height: "200px",
        opacity: 1,
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
}
