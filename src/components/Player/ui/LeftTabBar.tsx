"use client";

import { T } from "@/utils/roomHelpers";

interface Props {
  leftTab: "search" | "queue";
  setLeftTab: (tab: "search" | "queue") => void;
  queueLength: number;
  recentTracksLength: number;
}

export function LeftTabBar({
  leftTab,
  setLeftTab,
  queueLength,
  recentTracksLength,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        padding: "0 24px",
        borderBottom: `1px solid ${T.border}`,
        background: "rgba(13,13,20,0.6)",
        flexShrink: 0,
      }}
    >
      {(["search", "queue"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setLeftTab(tab)}
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "14px 0",
            marginRight: "24px",
            border: "none",
            background: "none",
            color: leftTab === tab ? T.text : T.text3,
            cursor: "pointer",
            position: "relative",
            fontFamily: T.font,
            transition: "color 0.15s",
          }}
        >
          {tab === "search" ? "⌕ Search & Discover" : `≡ Queue & History`}
          {tab === "queue" && (
            <span
              style={{
                fontSize: "9px",
                background: T.surface3,
                color: T.text3,
                padding: "1px 6px",
                borderRadius: "20px",
                marginLeft: "6px",
              }}
            >
              {queueLength + recentTracksLength}
            </span>
          )}
          {leftTab === tab && (
            <div
              style={{
                position: "absolute",
                bottom: -1,
                left: 0,
                right: 0,
                height: "2px",
                background: T.purple,
                borderRadius: "2px 2px 0 0",
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
