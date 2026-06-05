import { CSSProperties } from "react";
import { Track } from "./types";

export function asTrackFromPlayback(
  playback: {
    videoId: string | null;
    source?: string;
    trackName: string;
    artistName: string;
    image: string;
    currentTime?: number;
  } | null,
): Track | null {
  if (!playback?.videoId) return null;
  return {
    id: `room-${playback.videoId}`,
    source: playback.source ?? "youtube",
    videoId: playback.videoId,
    name: playback.trackName,
    duration_ms: 0,
    explicit: false,
    artists: [{ name: playback.artistName }],
    album: { name: "" },
    image: playback.image,
  };
}

export function asTrackFromRecent(recentTrack?: {
  videoId: string;
  source?: string;
  trackName: string;
  artistName: string;
  image: string;
}): Track | null {
  if (!recentTrack) return null;
  return {
    id: recentTrack.videoId,
    source: recentTrack.source ?? "youtube",
    videoId: recentTrack.videoId,
    name: recentTrack.trackName,
    duration_ms: 0,
    explicit: false,
    artists: [{ name: recentTrack.artistName }],
    album: { name: "" },
    image: recentTrack.image,
  };
}

export type RoomTheme = "purple" | "mono" | "yellow";

type RoomThemePalette = {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  border: string;
  border2: string;
  purple: string;
  purpleLight: string;
  purpleDim: string;
  purpleGhost: string;
  text: string;
  text2: string;
  text3: string;
};

export const ROOM_THEMES: Record<RoomTheme, RoomThemePalette> = {
  purple: {
    bg: "#050508",
    surface: "#0D0D14",
    surface2: "#13131E",
    surface3: "#1A1A28",
    buttonBg: "#6A5ACD",
    buttonText: "#FFFFFF",
    buttonBorder: "rgba(106,90,205,0.35)",
    border: "rgba(106,90,205,0.18)",
    border2: "rgba(255,255,255,0.06)",
    purple: "#6A5ACD",
    purpleLight: "#C7BBFF",
    purpleDim: "#3D3280",
    purpleGhost: "rgba(106,90,205,0.12)",
    text: "#F0EFF8",
    text2: "#C9C2E8",
    text3: "#7E76A8",
  },
  mono: {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    surface2: "#F5F5F5",
    surface3: "#ECECEC",
    buttonBg: "#111111",
    buttonText: "#FFFFFF",
    buttonBorder: "rgba(17,17,17,0.85)",
    border: "rgba(17,17,17,0.18)",
    border2: "rgba(17,17,17,0.10)",
    purple: "#111111",
    purpleLight: "#111111",
    purpleDim: "#333333",
    purpleGhost: "rgba(17,17,17,0.08)",
    text: "#111111",
    text2: "#111111",
    text3: "#555555",
  },
  yellow: {
    bg: "#F5D042",
    surface: "#F5D042",
    surface2: "#F9DF6E",
    surface3: "#FCEB9B",
    buttonBg: "#111111",
    buttonText: "#FFFFFF",
    buttonBorder: "rgba(17,17,17,0.85)",
    border: "rgba(17,17,17,0.22)",
    border2: "rgba(17,17,17,0.12)",
    purple: "#F5D042",
    purpleLight: "#111111",
    purpleDim: "#111111",
    purpleGhost: "rgba(17,17,17,0.08)",
    text: "#111111",
    text2: "#111111",
    text3: "#3F3200",
  },
};

export function getRoomThemeVars(theme: RoomTheme): CSSProperties {
  const palette = ROOM_THEMES[theme];
  const vars: Record<string, string> = {
    "--room-bg": palette.bg,
    "--room-surface": palette.surface,
    "--room-surface-2": palette.surface2,
    "--room-surface-3": palette.surface3,
    "--room-button-bg": palette.buttonBg,
    "--room-button-text": palette.buttonText,
    "--room-button-border": palette.buttonBorder,
    "--room-border": palette.border,
    "--room-border-2": palette.border2,
    "--room-accent": palette.purple,
    "--room-accent-light": palette.purpleLight,
    "--room-accent-dim": palette.purpleDim,
    "--room-accent-ghost": palette.purpleGhost,
    "--room-text": palette.text,
    "--room-text-2": palette.text2,
    "--room-text-3": palette.text3,
  };
  return vars as CSSProperties;
}

export const T = {
  bg: "var(--room-bg)",
  surface: "var(--room-surface)",
  surface2: "var(--room-surface-2)",
  surface3: "var(--room-surface-3)",
  buttonBg: "var(--room-button-bg)",
  buttonText: "var(--room-button-text)",
  buttonBorder: "var(--room-button-border)",
  border: "var(--room-border)",
  border2: "var(--room-border-2)",
  purple: "var(--room-accent)",
  purpleLight: "var(--room-accent-light)",
  purpleDim: "var(--room-accent-dim)",
  purpleGhost: "var(--room-accent-ghost)",
  text: "var(--room-text)",
  text2: "var(--room-text-2)",
  text3: "var(--room-text-3)",
  font: "'Manrope', sans-serif",
};
