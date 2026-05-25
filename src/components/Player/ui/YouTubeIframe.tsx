"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the container for the YouTube IFrame player.
 * 
 * IMPORTANT: The YT IFrame API replaces the `<div id="yt-player">` with an
 * `<iframe>`. We use a ref-based container so React never touches the inner
 * DOM after mount — preventing React from recreating the div and orphaning
 * the player instance.
 */
export function YouTubeIframe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Only add the target div if it doesn't already exist
    if (!container.querySelector("#yt-player")) {
      const target = document.createElement("div");
      target.id = "yt-player";
      container.appendChild(target);
    }
  }, []);

  return (
    <div
      ref={containerRef}
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
    />
  );
}
