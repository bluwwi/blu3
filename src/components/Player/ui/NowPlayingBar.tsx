"use client";

import { Track } from "@/utils/types";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

type RepeatMode = "off" | "all" | "one";

interface Props {
  track: Track | null;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleEnabled?: boolean;
  repeatMode?: RepeatMode;
  onPlayPause?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onMute: () => void;
  onVolume: (val: number) => void;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function NowPlayingBar({
  track,
  activeVideoId,
  playerState,
  progress,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffleEnabled = false,
  repeatMode = "off",
  onPlayPause,
  onToggleShuffle,
  onCycleRepeat,
  onMute,
  onVolume,
  onSeek,
}: Props) {
  const hasTrack = Boolean(track || activeVideoId);
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const title =
    track?.name ?? (activeVideoId ? "Playing from URL" : "Nothing playing yet");
  const artist = track?.artists.map((a) => a.name).join(", ") ?? "";
  const albumArt = track?.image;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,128,200,0.08)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* pink shimmer line when playing */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: isPlaying
            ? "linear-gradient(90deg,transparent,rgba(255,128,200,0.55),transparent)"
            : "transparent",
          transition: "background 0.8s ease",
        }}
      />

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "10px 20px 12px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* ── Mini spinning CD ── */}
        <div
          style={{
            position: "relative",
            width: "44px",
            height: "44px",
            flexShrink: 0,
          }}
        >
          {/* glow */}
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(255,128,200,0.25) 0%,transparent 70%)",
              opacity: isPlaying ? 1 : 0,
              transition: "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          />
          {/* disc */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              animation: isPlaying ? "cdSpin 3s linear infinite" : "none",
              flexShrink: 0,
            }}
          >
            {/* conic base */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(#1a1a1a 0deg,#2a2020 40deg,#3a2a2a 80deg,#1a1a2a 120deg,#2a1a1a 160deg,#1a2a1a 200deg,#2a2a1a 240deg,#1a1a1a 280deg,#2a1a2a 320deg,#1a1a1a 360deg)",
              }}
            />
            {/* album art */}
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
            {/* sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(transparent 0deg,rgba(255,255,255,0.07) 45deg,transparent 90deg,rgba(255,255,255,0.04) 135deg,transparent 180deg,rgba(255,255,255,0.06) 225deg,transparent 270deg,rgba(255,255,255,0.03) 315deg,transparent 360deg)",
                pointerEvents: "none",
              }}
            />
            {/* center hole */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.1)",
                zIndex: 2,
              }}
            />
          </div>
        </div>

        {/* ── Track info ── */}
        <div style={{ minWidth: 0, flex: "0 0 160px" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#e0e0e0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: "2px",
            }}
          >
            {title}
          </p>
          {artist && (
            <p
              style={{
                fontSize: "10px",
                color: "#ff80c8",
                letterSpacing: "0.1em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {artist}
            </p>
          )}
        </div>

        {/* ── Center: controls + progress ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <PlayerControls
            playerState={playerState}
            onTogglePlayPause={onPlayPause}
            shuffleEnabled={shuffleEnabled}
            repeatMode={repeatMode}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
          />
          <ProgressBar
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>

        {/* ── Volume ── */}
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={onVolume}
          onToggleMute={onMute}
          className="hidden md:flex"
        />

        {/* ── Status dot ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isPlaying
                ? "#ff80c8"
                : isLoading
                  ? "#facc15"
                  : hasTrack
                    ? "#444"
                    : "#2a2a2a",
              animation:
                isPlaying || isLoading
                  ? "statusPulse 1.4s ease-in-out infinite"
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: "9px",
              color: "#3a3a3a",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {isPlaying
              ? "playing"
              : isLoading
                ? "buffering"
                : hasTrack
                  ? "paused"
                  : "idle"}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cdSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </div>
  );
}
