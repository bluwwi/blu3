"use client";

import { T } from "@/utils/roomHelpers";

export function RoomLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          color: T.text3,
          fontSize: "12px",
          fontFamily: T.font,
          letterSpacing: "0.2em",
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      >
        joining room...
      </p>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}
