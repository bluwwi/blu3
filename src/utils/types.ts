export type PlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface Track {
  id: string;
  videoId: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: { name: string }[];
  album: { name: string };
  image: string;
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
