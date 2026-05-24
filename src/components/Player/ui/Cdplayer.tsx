"use client";

import { T } from "@/utils/roomHelpers";
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
  roomLabel = "get bluee",
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
    color: T.text3,
    transition: "all 0.15s",
    padding: 0,
    fontFamily: T.font,
  };

  const iconBtnActive: React.CSSProperties = {
    ...iconBtn,
    color: T.purpleLight,
    borderColor: T.border,
    background: T.purpleGhost,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
          color: T.text3,
          marginBottom: "20px",
        }}
      >
        {roomLabel}
      </p>

      {/* Album Art */}
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
            borderRadius: "16px",
            background: `radial-gradient(circle,${T.purpleGhost} 0%,transparent 65%)`,
            opacity: isPlaying ? 1 : 0.12,
            transition: "opacity 0.7s ease",
            pointerEvents: "none",
          }}
        />

        {/* Album art */}
        <div
          style={{
            width: "204px",
            height: "204px",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            flexShrink: 0,
          }}
        >
          {albumArt ? (
            <img
              src={albumArt}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
            background: `linear-gradient(135deg, ${T.surface3}, ${T.surface})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  opacity: 0.3,
                }}
              >
                🎵
              </span>
            </div>
          )}
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
            color: T.text,
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
              color: T.purpleLight,
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
              color: T.text3,
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
            background: T.surface2,
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
              background: T.purple,
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
                  background: T.purple,
                  opacity: 0,
                  transition: "opacity 0.15s",
                  boxShadow: `0 0 8px ${T.purpleLight}`,
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
            color: T.text3,
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
              : { ...iconBtn, cursor: "not-allowed", color: T.surface3 }
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
            background: hasControl && !isLoading ? T.purple : T.surface2,
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
            color: hasControl && !isLoading ? "#fff" : "#3D3280",
            transition: "all 0.15s",
            flexShrink: 0,
            boxShadow:
              hasControl && !isLoading
                ? `0 0 20px ${T.purpleGhost}`
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
              : { ...iconBtn, cursor: "not-allowed", color: T.surface3 }
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
            background: isPlaying ? T.purple : isLoading ? "#facc15" : T.surface3,
            animation:
              isPlaying || isLoading
                ? "statusPulse 1.4s ease-in-out infinite"
                : "none",
          }}
        />
        <span
          style={{
            fontSize: "9px",
            color: T.text3,
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
        @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .cd-prog-bar:hover .cd-prog-thumb { opacity: 1 !important; }
        .cd-prog-bar:hover { background: ${T.surface3} !important; }
      `}</style>
    </div>
  );
}
