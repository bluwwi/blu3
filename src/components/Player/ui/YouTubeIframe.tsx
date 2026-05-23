"use client";

export function YouTubeIframe() {
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
      <div id="yt-player" />
    </div>
  );
}
