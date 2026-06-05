export type PlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface Track {
  id: string;
  source: string;
  videoId: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: { name: string }[];
  album: { name: string };
  image: string;
  downloadUrl?: string;
}

export interface RecentTrack {
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  playedAt: number;
}

export interface PlayerStateData {
  trackId: string | null;
  playing: boolean;
  currentTime: number;
}

export interface SearchResponse {
  tracks: Track[];
  error?: string;
}

export interface SuggestResponse {
  suggestions: string[];
}

export interface TimelineSnapshot {
  videoId: string | null;
  source: string;
  trackName: string;
  artistName: string;
  image: string;
  isPlaying: boolean;
  positionMs: number;
  anchorServerTime: number;
  shuffle: boolean;
  repeatMode: "off" | "all" | "one";
}

export function computePosition(
  timeline: TimelineSnapshot,
  serverTime: number,
): number {
  if (!timeline.isPlaying) return timeline.positionMs;
  const elapsed = serverTime - timeline.anchorServerTime;
  return Math.max(0, timeline.positionMs + elapsed);
}
