"use client";

/**
 * CDPlayer — the large centered CD disc that sits in the main content area.
 * Drop this into RoomPage where you want the visual player to live.
 *
 * Props mirror NowPlayingBar so you can share the same values.
 */

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

  const pink = "#ff80c8";
  const iconBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.15s",
    padding: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'DM Mono', monospace",
        padding: "32px 16px 24px",
        width: "100%",
      }}
    >
      {/* Room label */}
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#444",
          marginBottom: "18px",
        }}
      >
        {roomLabel}
      </p>

      {/* ── CD Stage ── */}
      <div
        style={{
          position: "relative",
          width: "240px",
          height: "240px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "26px",
          flexShrink: 0,
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: "-16px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(255,100,200,0.22) 0%,transparent 68%)",
            opacity: isPlaying ? 1 : 0,
            transition: "opacity 0.7s ease",
            pointerEvents: "none",
          }}
        />

        {/* Disc */}
        <div
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            position: "relative",
            flexShrink: 0,
            animation: isPlaying ? "cdSpin 3s linear infinite" : "none",
          }}
        >
          {/* Conic base + rainbow tint */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(#1a1a1a 0deg,#2a2020 40deg,#3a2a2a 80deg,#1a1a2a 120deg,#2a1a1a 160deg,#1a2a1a 200deg,#2a2a1a 240deg,#1a1a1a 280deg,#2a1a2a 320deg,#1a1a1a 360deg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(rgba(255,160,200,0.07) 0deg,transparent 30deg,rgba(160,200,255,0.07) 60deg,transparent 90deg,rgba(200,255,160,0.07) 120deg,transparent 150deg,rgba(255,200,160,0.07) 180deg,transparent 210deg,rgba(160,160,255,0.07) 240deg,transparent 270deg,rgba(255,160,160,0.07) 300deg,transparent 330deg)",
              }}
            />
          </div>

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
                opacity: 0.88,
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
                "conic-gradient(transparent 0deg,rgba(255,255,255,0.08) 45deg,transparent 90deg,rgba(255,255,255,0.04) 135deg,transparent 180deg,rgba(255,255,255,0.06) 225deg,transparent 270deg,rgba(255,255,255,0.03) 315deg,transparent 360deg)",
              pointerEvents: "none",
            }}
          />

          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              inset: "48px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.7)",
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
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#080808",
              border: "1.5px solid rgba(255,255,255,0.1)",
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* Track info */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "18px",
          width: "100%",
          maxWidth: "340px",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#f0f0f0",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "3px",
          }}
        >
          {title}
        </p>
        {artist && (
          <p
            style={{
              fontSize: "11px",
              color: pink,
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
              color: "#383838",
              letterSpacing: "0.08em",
            }}
          >
            {album}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "340px", marginBottom: "18px" }}>
        <div
          onClick={canSeek ? onSeek : undefined}
          style={{
            width: "100%",
            height: "3px",
            background: "#1e1e1e",
            borderRadius: "2px",
            cursor: canSeek ? "pointer" : "default",
            position: "relative",
            margin: "5px 0",
          }}
          className="cd-progress-bar"
        >
          <div
            style={{
              height: "100%",
              borderRadius: "2px",
              background: pink,
              width: `${safeProgress}%`,
              transition: "width 0.25s linear",
              position: "relative",
            }}
          >
            {canSeek && (
              <div
                className="cd-progress-thumb"
                style={{
                  position: "absolute",
                  right: "-5px",
                  top: "-4px",
                  width: "11px",
                  height: "11px",
                  borderRadius: "50%",
                  background: pink,
                  opacity: 0,
                  transition: "opacity 0.15s",
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
            color: "#444",
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
          style={{
            ...iconBtn,
            color: shuffleEnabled ? pink : "#666",
            cursor: hasModeControl ? "pointer" : "not-allowed",
          }}
          aria-label="Shuffle"
        >
          <svg
            width="20"
            height="20"
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
            width: "50px",
            height: "50px",
            background: hasControl && !isLoading ? pink : "#222",
            border: "none",
            borderRadius: "50%",
            cursor: isLoading
              ? "wait"
              : !hasControl
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: hasControl && !isLoading ? "#1a0010" : "#555",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <svg
              width="18"
              height="18"
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Repeat */}
        <button
          type="button"
          onClick={onCycleRepeat}
          disabled={!hasModeControl}
          style={{
            ...iconBtn,
            color: repeatMode !== "off" ? pink : "#666",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.05em",
            fontFamily: "'DM Mono', monospace",
            cursor: hasModeControl ? "pointer" : "not-allowed",
            minWidth: "20px",
          }}
          aria-label="Repeat"
        >
          {repeatMode === "one" ? (
            "1↻"
          ) : (
            <svg
              width="20"
              height="20"
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
            background: isPlaying ? pink : isLoading ? "#facc15" : "#333",
            animation:
              isPlaying || isLoading
                ? "statusPulse 1.4s ease-in-out infinite"
                : "none",
          }}
        />
        <span
          style={{
            fontSize: "10px",
            color: "#3a3a3a",
            letterSpacing: "0.15em",
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
        .cd-progress-bar:hover .cd-progress-thumb { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
