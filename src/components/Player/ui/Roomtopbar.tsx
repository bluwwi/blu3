"use client";

/**
 * RoomTopBar — replaces NowPlayingBar.
 * Sits at the very top. No fixed bottom bar at all.
 */

import { Track } from "@/utils/types";

type RepeatMode = "off" | "all" | "one";

interface Props {
  roomName: string;
  roomCode: string;
  isHost: boolean;
  connected: boolean;
  track: Track | null;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onCopyInvite: () => void;
  onLeave: () => void;
}

export function RoomTopBar({
  roomName,
  roomCode,
  isHost,
  connected,
  track,
  activeVideoId,
  playerState,
  onCopyInvite,
  onLeave,
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const albumArt = track?.image;

  const PURPLE = "#6A5ACD";
  const PURPLE_LIGHT = "#8B7CE8";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "56px",
        borderBottom: "1px solid rgba(106,90,205,0.18)",
        background: "rgba(5,5,8,0.92)",
        backdropFilter: "blur(12px)",
        fontFamily: "'DM Mono', monospace",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Purple shimmer line when playing */}
      <div
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          right: 0,
          height: "1px",
          background: isPlaying
            ? `linear-gradient(90deg,transparent,rgba(106,90,205,0.6),transparent)`
            : "transparent",
          transition: "background 0.8s ease",
        }}
      />

      {/* Left: room info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: connected ? "#22c55e" : "#2E2C50",
            animation: connected ? "pulse 2s ease-in-out infinite" : "none",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#F0EFF8",
            letterSpacing: "0.02em",
          }}
        >
          {roomName}
        </span>
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            color: "#4A4870",
            border: "1px solid rgba(106,90,205,0.18)",
            borderRadius: "4px",
            padding: "2px 8px",
          }}
        >
          {roomCode}
        </span>
        {isHost && (
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: PURPLE_LIGHT,
              border: "1px solid rgba(106,90,205,0.4)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            host
          </span>
        )}
      </div>

      {/* Center: mini now-playing */}
      {(track || activeVideoId) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Tiny disc */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
              animation: isPlaying ? "cdSpin 3s linear infinite" : "none",
              border: "1px solid rgba(106,90,205,0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "conic-gradient(#0e0c18 0deg,#161326 90deg,#0e0c18 180deg,#14112a 270deg,#0e0c18 360deg)",
              }}
            />
            {albumArt && (
              <img
                src={albumArt}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.85,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#050508",
                zIndex: 2,
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#F0EFF8",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "180px",
                lineHeight: 1.2,
              }}
            >
              {title}
            </p>
            {artist && (
              <p
                style={{
                  fontSize: "10px",
                  color: PURPLE_LIGHT,
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "180px",
                }}
              >
                {artist}
              </p>
            )}
          </div>
          {/* Status dot */}
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isPlaying ? PURPLE : isLoading ? "#facc15" : "#2E2C50",
              animation:
                isPlaying || isLoading
                  ? "pulse 1.4s ease-in-out infinite"
                  : "none",
              flexShrink: 0,
            }}
          />
        </div>
      )}

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onCopyInvite}
          style={{
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "5px 14px",
            borderRadius: "6px",
            border: "1px solid rgba(106,90,205,0.18)",
            color: "#9B97B8",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            transition: "all 0.15s",
          }}
        >
          copy invite
        </button>
        <button
          onClick={onLeave}
          style={{
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "5px 14px",
            borderRadius: "6px",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            transition: "all 0.15s",
          }}
        >
          leave
        </button>
      </div>

      <style>{`
        @keyframes cdSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </div>
  );
}