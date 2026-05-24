"use client";

type RepeatMode = "off" | "all" | "one";

interface Props {
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onTogglePlayPause?: () => void;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  className?: string;
}

const PURPLE = "#6A5ACD";
const PURPLE_LIGHT = "#8B7CE8";

export function PlayerControls({
  playerState,
  onTogglePlayPause,
  shuffleEnabled = false,
  repeatMode = "off",
  onToggleShuffle,
  onCycleRepeat,
  className = "",
}: Props) {
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const hasControl = !!onTogglePlayPause;
  const hasModeControl = !!onToggleShuffle && !!onCycleRepeat;

  const activeStyle = {
    color: PURPLE_LIGHT,
    borderColor: "rgba(106,90,205,0.4)",
    background: "rgba(106,90,205,0.12)",
  };
  const inactiveStyle = {
    color: "#4A4870",
    borderColor: "rgba(255,255,255,0.06)",
    background: "transparent",
  };
  const disabledStyle = {
    color: "#1A1A28",
    borderColor: "rgba(255,255,255,0.04)",
    background: "transparent",
    cursor: "not-allowed" as const,
  };

  const iconBtnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "'DM Mono', monospace",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.05em",
  };

  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
    >
      {/* Shuffle */}
      <button
        type="button"
        onClick={onToggleShuffle}
        disabled={!hasModeControl}
        style={{ ...iconBtnBase, ...(hasModeControl ? (shuffleEnabled ? activeStyle : inactiveStyle) : disabledStyle) }}
        aria-label={shuffleEnabled ? "Disable shuffle" : "Enable shuffle"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        onClick={onTogglePlayPause}
        disabled={isLoading || !hasControl}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "none",
          cursor: isLoading || !hasControl ? (isLoading ? "wait" : "not-allowed") : "pointer",
          background: hasControl && !isLoading ? PURPLE : "#13131E",
          color: hasControl && !isLoading ? "#fff" : "#3D3280",
          transition: "all 0.15s ease",
          flexShrink: 0,
          boxShadow: hasControl && !isLoading ? "0 0 16px rgba(106,90,205,0.3)" : "none",
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
        ) : isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
          ...iconBtnBase,
          width: repeatMode === "one" ? "36px" : "30px",
          borderRadius: repeatMode === "one" ? "8px" : "50%",
          ...(hasModeControl ? (repeatMode !== "off" ? activeStyle : inactiveStyle) : disabledStyle),
        }}
        aria-label={repeatMode === "one" ? "Repeat one" : repeatMode === "all" ? "Repeat all" : "Repeat off"}
      >
        {repeatMode === "one" ? (
          "1↻"
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        )}
      </button>
    </div>
  );
}