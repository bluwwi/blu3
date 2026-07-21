import { Track, RecentTrack } from "@/utils/types";

// ─── Connection State ──────────────────────────────────────────────────────

export type TransportState = "disconnected" | "connecting" | "connected";
export type RoomPhase = "disconnected" | "clock_sync" | "loading" | "ready";
export type RepeatMode = "off" | "all" | "one";

export interface PlaybackMode {
  shuffle: boolean;
  repeatMode: RepeatMode;
}

// ─── Playback Snapshot ─────────────────────────────────────────────────────

export interface PlaybackSnapshot {
  videoId: string | null;
  source: string;
  trackName: string;
  artistName: string;
  image: string;
  isPlaying: boolean;
  positionSec: number;
  anchorTime: number;
  durationMs: number;
}

// ─── Client → Server Messages ──────────────────────────────────────────────

export type ClientMessage =
  | { type: "clock:ping"; t0: number }
  | { type: "playback:play"; videoId: string; seekTo: number; durationMs: number;
      source: string; trackName: string; artistName: string; image: string }
  | { type: "playback:pause"; currentTime: number }
  | { type: "playback:seek"; currentTime: number }
  | { type: "playback:heartbeat"; currentTime: number }
  | { type: "playback:track_ended"; videoId: string }
  | { type: "sync:request" }
  | { type: "queue:add"; track: Track }
  | { type: "queue:remove"; trackId: string }
  | { type: "chat:send"; text: string };

// ─── Server → Client Messages ──────────────────────────────────────────────

export type ServerMessage =
  | { type: "clock:pong"; t0: number; serverTime: number }
  | { type: "room:state"; isHost: boolean; isHostActive: boolean; members: Member[];
      playback: PlaybackRaw | null; queue: Track[]; queueVersion: number;
      recentTracks: RecentTrack[] }
  | { type: "playback:play"; videoId: string; seekTo: number; anchorTime: number;
      durationMs: number; source: string; trackName: string; artistName: string;
      image: string; recentTracks?: RecentTrack[] }
  | { type: "playback:pause"; positionSec: number; anchorTime: number }
  | { type: "playback:seek"; seekTo: number; anchorTime: number }
  | { type: "playback:sync"; videoId: string | null; source?: string; trackName: string;
      artistName: string; image: string; isPlaying: boolean; currentTime: number;
      updatedAt: number; durationMs?: number }
  | { type: "queue:update"; queue: Track[]; version: number; recentTracks?: RecentTrack[] }
  | { type: "members:update"; members: Member[] }
  | { type: "host:changed"; isHostActive: boolean }
  | { type: "chat:message"; message: ChatMessage }
  | { type: "track:preresolved"; videoId: string; audioUrl: string };

interface PlaybackRaw {
  videoId: string | null;
  source?: string;
  trackName: string;
  artistName: string;
  image: string;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
  durationMs?: number;
}

export interface Member {
  userId: string;
  name: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  text: string;
  ts: number;
}
