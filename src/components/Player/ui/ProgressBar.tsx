"use client";

import { fmtSec } from "@/utils/formatters";

interface Props {
  progress: number;
  currentTime: number;
  duration: number;
  onSeek?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export function ProgressBar({
  progress,
  currentTime,
  duration,
  onSeek,
  className = "",
}: Props) {
  const safeDuration = Math.max(duration, 0);
  const safeCurrentTime = Math.min(Math.max(currentTime, 0), safeDuration || 0);
  const safeProgress = safeDuration > 0 ? Math.max(0, Math.min(progress, 100)) : 0;
  const canSeek = Boolean(onSeek && safeDuration > 0);

  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <span
        style={{
          fontSize: "10px",
          color: "#4A4870",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.05em",
          minWidth: "32px",
          textAlign: "right",
        }}
      >
        {fmtSec(safeCurrentTime)}
      </span>

      <div
        onClick={canSeek ? onSeek : undefined}
        role="slider"
        aria-valuenow={Math.round(safeProgress)}
        aria-valuemin={0}
        aria-valuemax={safeDuration > 0 ? 100 : 0}
        style={{
          flex: 1,
          height: "3px",
          borderRadius: "2px",
          background: "#1A1A28",
          cursor: canSeek ? "pointer" : "default",
          position: "relative",
          transition: "background 0.15s",
        }}
        className="prog-group"
      >
        <div
          style={{
            height: "100%",
            borderRadius: "2px",
            background: "#6A5ACD",
            width: `${safeProgress}%`,
            transition: "width 0.25s linear",
            position: "relative",
          }}
        >
          {canSeek && (
            <div
              style={{
                position: "absolute",
                right: "-5px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background: "#6A5ACD",
                boxShadow: "0 0 8px rgba(106,90,205,0.6)",
                opacity: 0,
                transition: "opacity 0.15s",
              }}
              className="progress-thumb"
            />
          )}
        </div>
      </div>

      <span
        style={{
          fontSize: "10px",
          color: "#2E2C50",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.05em",
          minWidth: "32px",
        }}
      >
        {fmtSec(safeDuration)}
      </span>

      <style>{`
        .prog-group:hover .progress-thumb { opacity: 1 !important; }
        .prog-group:hover { background: #13131E !important; }
      `}</style>
    </div>
  );
}