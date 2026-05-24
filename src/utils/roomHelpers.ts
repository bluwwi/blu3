import { Track } from "./types";

export function asTrackFromPlayback(
  playback: {
    videoId: string | null;
    trackName: string;
    artistName: string;
    image: string;
    currentTime?: number;
  } | null,
): Track | null {
  if (!playback?.videoId) return null;
  return {
    id: `room-${playback.videoId}`,
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
  trackName: string;
  artistName: string;
  image: string;
}): Track | null {
  if (!recentTrack) return null;
  return {
    id: recentTrack.videoId,
    videoId: recentTrack.videoId,
    name: recentTrack.trackName,
    duration_ms: 0,
    explicit: false,
    artists: [{ name: recentTrack.artistName }],
    album: { name: "" },
    image: recentTrack.image,
  };
}

export const T = {
  bg: "#050508",
  surface: "#0D0D14",
  surface2: "#13131E",
  surface3: "#1A1A28",
  border: "rgba(106,90,205,0.18)",
  border2: "rgba(255,255,255,0.06)",
  purple: "#6A5ACD",
  purpleLight: "#8B7CE8",
  purpleDim: "#3D3280",
  purpleGhost: "rgba(106,90,205,0.12)",
  text: "#F0EFF8",
  text2: "#9B97B8",
  text3: "#4A4870",
  font: "'DM Mono', monospace",
};
