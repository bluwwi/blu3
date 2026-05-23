"use client";

export function YouTubeIframe() {
  return (
    <div
      style={{
        position: "fixed",
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
      }}
      aria-hidden="true"
    >
      <div id="yt-player" />
    </div>
  );
}
