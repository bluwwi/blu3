"use client";

import { fmt } from "@/utils/formatters";
import { T } from "@/utils/roomHelpers";
import { Track } from "@/utils/types";

interface Props {
  track: Track;
  isActive: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  onClick?: () => void;
  onAddToQueue?: (track: Track) => void;
  index: number;
}

export function TrackItem({
  track,
  isActive,
  isLoading,
  isPlaying,
  onClick,
  onAddToQueue,
  index,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
        background: isActive ? T.purpleGhost : "transparent",
        transition: "all 0.15s",
        cursor: onClick ? "pointer" : "default",
        animationDelay: `${index * 25}ms`,
        fontFamily: T.font,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = T.surface2;
          e.currentTarget.style.borderColor = T.border2;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
    >
      {/* Clickable area */}
      <div
        onClick={onClick}
        style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", minWidth: 0, cursor: onClick && !isLoading ? "pointer" : "default" }}
      >
        {/* Album art */}
        <div style={{ position: "relative", flexShrink: 0, width: "44px", height: "44px" }}>
          {track.image ? (
            <img
              src={track.image}
              alt=""
              style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{ width: "44px", height: "44px", borderRadius: "8px", background: T.surface3, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3 }}
            >
              ♪
            </div>
          )}
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isLoading || (isActive && isPlaying) ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
              opacity: isLoading || (isActive && isPlaying) ? 1 : 0,
              transition: "all 0.15s",
            }}
            className="track-overlay"
          >
            {isLoading ? (
              <div style={{ width: "14px", height: "14px", border: `2px solid ${T.purpleLight}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : isActive && isPlaying ? (
              <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "14px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "3px",
                      background: T.purpleLight,
                      borderRadius: "2px",
                      height: `${6 + i * 2}px`,
                      animation: "bounce 0.8s ease-in-out infinite",
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: isActive ? T.purpleLight : T.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track.name}
            </p>
            {track.explicit && (
              <span style={{ fontSize: "9px", fontWeight: 500, background: "rgba(255,255,255,0.08)", color: T.text3, padding: "1px 4px", borderRadius: "3px", flexShrink: 0 }}>
                E
              </span>
            )}
          </div>
          <p style={{ fontSize: "10px", color: T.text2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
            {track.artists.map((a) => a.name).join(", ")}
          </p>
          <p style={{ fontSize: "10px", color: T.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" }}>
            {track.album.name}
          </p>
        </div>

        {/* Duration */}
        <div style={{ flexShrink: 0, paddingRight: "6px" }}>
          <p style={{ fontSize: "10px", color: T.text3, fontFamily: T.font }}>
            {fmt(track.duration_ms)}
          </p>
        </div>
      </div>

      {/* Add to queue */}
      {onAddToQueue && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "7px",
            border: `1px solid ${T.border}`,
            background: T.surface3,
            color: T.text2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          title="Add to room queue"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.purple;
            e.currentTarget.style.color = T.purpleLight;
            e.currentTarget.style.background = T.purpleGhost;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.text2;
            e.currentTarget.style.background = T.surface3;
          }}
        >
          ＋
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.6)} }
        .track-row:hover .track-overlay { opacity: 1 !important; background: rgba(0,0,0,0.5) !important; }
      `}</style>
    </div>
  );
}
