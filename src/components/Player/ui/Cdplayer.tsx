"use client";

import { Track } from "@/utils/types";

type RepeatMode = "off" | "all" | "one";

interface Props {
  track: Track | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  progress: number;
  currentTime: number;
  duration: number;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onPlayPause?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  roomLabel?: string;
}

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? "0" : ""}${sc}`;
}

const PURPLE = "#6A5ACD";
const PURPLE_LIGHT = "#8B7CE8";

export function CDPlayer({
  track,
  playerState,
  progress,
  currentTime,
  duration,
  shuffleEnabled = false,
  repeatMode = "off",
  onPlayPause,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  roomLabel = "now playing · room sync active",
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const hasControl = !!onPlayPause;
  const hasModeControl = !!onToggleShuffle && !!onCycleRepeat;
  const canSeek = !!onSeek && duration > 0;
  const safeProgress = Math.max(0, Math.min(progress, 100));
  const title = track?.name ?? "Nothing playing yet";
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track?.album?.name ?? "";
  const albumArt = track?.image;

  const iconBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "transparent",
    cursor: "pointer",
    color: "#4A4870",
    transition: "all 0.15s",
    padding: 0,
    fontFamily: "'DM Mono', monospace",
  };

  const iconBtnActive: React.CSSProperties = {
    ...iconBtn,
    color: PURPLE_LIGHT,
    borderColor: "rgba(106,90,205,0.4)",
    background: "rgba(106,90,205,0.12)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'DM Mono', monospace",
        padding: "12px 16px 28px",
        width: "100%",
      }}
    >
      {/* Room label */}
      <p
        style={{
          fontSize: "9px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#2E2C50",
          marginBottom: "20px",
        }}
      >
        {roomLabel}
      </p>

      {/* CD Stage */}
      <div
        style={{
          position: "relative",
          width: "220px",
          height: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(106,90,205,0.28) 0%,transparent 65%)",
            opacity: isPlaying ? 1 : 0.12,
            transition: "opacity 0.7s ease",
            pointerEvents: "none",
          }}
        />

        {/* Disc */}
        <div
          style={{
            width: "204px",
            height: "204px",
            borderRadius: "50%",
            position: "relative",
            flexShrink: 0,
            animation: isPlaying ? "cdSpin 3s linear infinite" : "none",
          }}
        >
          {/* Conic base */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(#0e0c18 0deg,#161326 40deg,#1c1630 80deg,#100e1c 120deg,#181530 160deg,#0c0b18 200deg,#1a1724 240deg,#0e0c18 280deg,#14112a 320deg,#0e0c18 360deg)",
            }}
          />
          {/* Rainbow tint */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(rgba(106,90,205,0.09) 0deg,transparent 30deg,rgba(139,124,232,0.07) 60deg,transparent 90deg,rgba(106,90,205,0.06) 120deg,transparent 150deg,rgba(160,148,240,0.08) 180deg,transparent 210deg,rgba(106,90,205,0.06) 240deg,transparent 270deg,rgba(139,124,232,0.07) 300deg,transparent 330deg)",
            }}
          />
          {/* Album art */}
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
                borderRadius: "50%",
                opacity: 0.85,
              }}
            />
          )}
          {/* Sheen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(transparent 0deg,rgba(255,255,255,0.06) 45deg,transparent 90deg,rgba(255,255,255,0.03) 135deg,transparent 180deg,rgba(255,255,255,0.05) 225deg,transparent 270deg,rgba(255,255,255,0.02) 315deg,transparent 360deg)",
              pointerEvents: "none",
            }}
          />
          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              inset: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
              pointerEvents: "none",
            }}
          />
          {/* Center hole */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "#050508",
              border: "1.5px solid rgba(255,255,255,0.08)",
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* Track info */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
          width: "100%",
          maxWidth: "300px",
        }}
      >
        <p
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "#F0EFF8",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        {artist && (
          <p
            style={{
              fontSize: "11px",
              color: PURPLE_LIGHT,
              letterSpacing: "0.12em",
              marginBottom: "2px",
            }}
          >
            {artist}
          </p>
        )}
        {album && (
          <p
            style={{
              fontSize: "10px",
              color: "#2E2C50",
              letterSpacing: "0.08em",
            }}
          >
            {album}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "300px", marginBottom: "18px" }}>
        <div
          onClick={canSeek ? onSeek : undefined}
          style={{
            width: "100%",
            height: "3px",
            background: "#13131E",
            borderRadius: "2px",
            cursor: canSeek ? "pointer" : "default",
            position: "relative",
            margin: "5px 0",
          }}
          className="cd-prog-bar"
        >
          <div
            style={{
              height: "100%",
              borderRadius: "2px",
              background: PURPLE,
              width: `${safeProgress}%`,
              transition: "width 0.25s linear",
              position: "relative",
            }}
          >
            {canSeek && (
              <div
                className="cd-prog-thumb"
                style={{
                  position: "absolute",
                  right: "-5px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "11px",
                  height: "11px",
                  borderRadius: "50%",
                  background: PURPLE,
                  opacity: 0,
                  transition: "opacity 0.15s",
                  boxShadow: "0 0 8px rgba(106,90,205,0.6)",
                }}
              />
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#4A4870",
            letterSpacing: "0.08em",
          }}
        >
          <span>{fmtSec(currentTime)}</span>
          <span>{fmtSec(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {/* Shuffle */}
        <button
          type="button"
          onClick={onToggleShuffle}
          disabled={!hasModeControl}
          style={
            hasModeControl
              ? shuffleEnabled
                ? iconBtnActive
                : iconBtn
              : { ...iconBtn, cursor: "not-allowed", color: "#1A1A28" }
          }
          aria-label="Shuffle"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 3 21 3 21 8" />
            <polyline points="16 21 21 21 21 16" />
            <line x1="4" y1="4" x2="21" y2="4" />
            <path d="M4 20l5-5" />
            <path d="M9 9l12 12" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={onPlayPause}
          disabled={isLoading || !hasControl}
          style={{
            width: "52px",
            height: "52px",
            background: hasControl && !isLoading ? PURPLE : "#13131E",
            border: "none",
            borderRadius: "50%",
            cursor: isLoading ? "wait" : !hasControl ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: hasControl && !isLoading ? "#fff" : "#3D3280",
            transition: "all 0.15s",
            flexShrink: 0,
            boxShadow:
              hasControl && !isLoading
                ? "0 0 20px rgba(106,90,205,0.35)"
                : "none",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          ) : isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Repeat */}
        <button
          type="button"
          onClick={onCycleRepeat}
          disabled={!hasModeControl}
          style={
            hasModeControl
              ? repeatMode !== "off"
                ? {
                    ...iconBtnActive,
                    width: repeatMode === "one" ? "40px" : "34px",
                    borderRadius: repeatMode === "one" ? "8px" : "50%",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                  }
                : iconBtn
              : { ...iconBtn, cursor: "not-allowed", color: "#1A1A28" }
          }
          aria-label="Repeat"
        >
          {repeatMode === "one" ? (
            "1↻"
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          )}
        </button>
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: isPlaying ? PURPLE : isLoading ? "#facc15" : "#1A1A28",
            animation:
              isPlaying || isLoading
                ? "statusPulse 1.4s ease-in-out infinite"
                : "none",
          }}
        />
        <span
          style={{
            fontSize: "9px",
            color: "#2E2C50",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {isPlaying
            ? "playing · room sync active"
            : isLoading
              ? "buffering"
              : "paused"}
        </span>
      </div>

      <style>{`
        @keyframes cdSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .cd-prog-bar:hover .cd-prog-thumb { opacity: 1 !important; }
        .cd-prog-bar:hover { background: #1A1A28 !important; }
      `}</style>
    </div>
  );
}