import { ClockSync } from "./ClockSync";
import { RoomTransport } from "./RoomTransport";
import { AudioEngine, AudioLoadParams } from "./AudioEngine";
import {
  RoomPhase, PlaybackSnapshot, ServerMessage, Member, ChatMessage,
  PlaybackMode,
} from "./roomTypes";
import { Track, RecentTrack } from "@/utils/types";

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8000";

export interface RoomEngineState {
  phase: RoomPhase;
  playback: PlaybackSnapshot | null;
  queue: Track[];
  queueVersion: number;
  members: Member[];
  isHost: boolean;
  isHostActive: boolean;
  recentTracks: RecentTrack[];
  connected: boolean;
  chatMessages: ChatMessage[];
  playbackMode: PlaybackMode;
}

const defaultState: RoomEngineState = {
  phase: "disconnected",
  playback: null,
  queue: [],
  queueVersion: 0,
  members: [],
  isHost: false,
  isHostActive: true,
  recentTracks: [],
  connected: false,
  chatMessages: [],
  playbackMode: { shuffle: false, repeatMode: "off" },
};

type Listener = (state: RoomEngineState) => void;

export class RoomEngine {
  private clock = new ClockSync();
  private transport: RoomTransport;
  private audio: AudioEngine;
  private clockRefreshInterval: ReturnType<typeof setInterval> | null = null;
  private hostHeartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private syncOnVisible: (() => void) | null = null;

  state: RoomEngineState = { ...defaultState };
  private listeners = new Set<Listener>();

  constructor(roomCode: string) {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("blu3_token")
      : null;
    const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token || "")}&room=${encodeURIComponent(roomCode)}`;

    this.audio = new AudioEngine(this.clock, token ?? undefined);
    this.audio.onTrackEnded(() => this.handleClientTrackEnd());

    this.transport = new RoomTransport(
      wsUrl,
      this.clock,
      (msg) => this.dispatch(msg),
      (s) => this.onTransportState(s),
    );
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  start() {
    this.phaseTransition("disconnected");
    this.transport.connect();
  }

  destroy() {
    this.transport.destroy();
    this.audio.destroy();
    this.stopPeriodicTasks();
    this.listeners.clear();
  }

  onUpdate(cb: Listener) { this.listeners.add(cb); return () => this.listeners.delete(cb); }

  private notify() { this.listeners.forEach((fn) => fn(this.state)); }

  // ─── Transport State ─────────────────────────────────────────────────────

  private onTransportState(s: "disconnected" | "connecting" | "connected") {
    if (s === "disconnected") {
      this.state.connected = false;
      this.phaseTransition("disconnected");
      this.stopPeriodicTasks();
    } else if (s === "connecting") {
      this.phaseTransition("clock_sync");
    } else if (s === "connected") {
      this.state.connected = true;
      // Don't overwrite "ready" if room state already arrived during calibration
      if (this.state.phase !== "ready") this.phaseTransition("loading");
      this.startPeriodicTasks();
    }
    this.notify();
  }

  // ─── Message Dispatch ────────────────────────────────────────────────────

  private dispatch(msg: any) {
    switch (msg.type as string) {

      // ── New protocol ──── Old protocol alias ─────────────────────────
      case "room:state":
      case "room:joined": {
        const members = msg.members ?? [];
        const isHost = msg.isHost ?? false;
        const isHostActive = msg.isHostActive ?? true;
        const recentTracks = msg.recentTracks ?? [];

        let rawPlayback = msg.playback;
        // Old protocol puts playback fields at top level
        if (!rawPlayback && msg.videoId) {
          rawPlayback = {
            videoId: msg.videoId, source: msg.source, trackName: msg.trackName,
            artistName: msg.artistName, image: msg.image, isPlaying: msg.isPlaying,
            currentTime: msg.currentTime, updatedAt: msg.updatedAt,
            durationMs: msg.durationMs,
          };
        }
        const pb = rawPlayback ? this.hydratePlayback(rawPlayback as any) : null;
        const pm = msg.playbackMode ?? {};
        Object.assign(this.state, {
          phase: "ready" as RoomPhase,
          playback: pb,
          queue: msg.queue ?? [],
          queueVersion: msg.queueVersion ?? msg.queueHash ?? 0,
          members,
          isHost,
          isHostActive,
          recentTracks,
          playbackMode: {
            shuffle: typeof pm.shuffle === "boolean" ? pm.shuffle : this.state.playbackMode.shuffle,
            repeatMode: pm.repeatMode ?? this.state.playbackMode.repeatMode,
          },
        });
        this.notify();

        if (pb?.videoId) {
          const livePos = this.livePosition(pb);
          this.audio.load({
            track: {
              videoId: pb.videoId,
              source: pb.source,
              name: pb.trackName,
              artist: pb.artistName,
              durationMs: pb.durationMs,
            },
            startSec: livePos,
            autoplay: pb.isPlaying,
            role: isHost ? "host" : "listener",
          });
          // Request fresh sync so we get the latest position
          setTimeout(() => this.send({ type: "sync:request" }), 0);
        }
        break;
      }

      // ── New protocol ──── Old protocol alias ─────────────────────────
      case "playback:play":
      case "play": {
        // Old protocol uses seekTo + serverTime; new uses seekTo + anchorTime
        const anchorTime = msg.anchorTime ?? msg.anchorServerTime ?? msg.serverTime ?? Date.now();
        const seekTo = msg.seekTo ?? 0;
        const elapsed = Math.max(0, (this.clock.serverNow() - anchorTime) / 1000);
        const adjustedSeek = seekTo + elapsed;

        const pb: PlaybackSnapshot = {
          videoId: msg.videoId ?? null,
          source: msg.source ?? "youtube",
          trackName: msg.trackName ?? "",
          artistName: msg.artistName ?? "",
          image: msg.image ?? "",
          isPlaying: true,
          positionSec: seekTo,
          anchorTime,
          durationMs: msg.duration_ms ?? msg.durationMs ?? 0,
        };
        this.state.playback = pb;
        this.notify();

        const isSame = this.audio.activeVideoId === msg.videoId;
        if (isSame) {
          this.audio.seekAndPlay(adjustedSeek);
        } else {
          this.audio.load({
            track: {
              videoId: msg.videoId, source: msg.source,
              name: msg.trackName, artist: msg.artistName,
              durationMs: msg.durationMs,
            },
            startSec: adjustedSeek,
            autoplay: true,
            role: this.state.isHost ? "host" : "listener",
          });
        }
        break;
      }

      case "playback:pause":
      case "pause": {
        const positionSec = msg.positionSec ?? msg.currentTime ?? 0;
        const anchorTime = msg.anchorTime ?? msg.anchorServerTime ?? msg.serverTime ?? Date.now();
        if (this.state.playback) {
          this.state.playback.isPlaying = false;
          this.state.playback.positionSec = positionSec;
          this.state.playback.anchorTime = anchorTime;
        }
        this.notify();
        this.audio.pause(positionSec);
        break;
      }

      case "playback:seek":
      case "seek": {
        const seekTo = msg.seekTo ?? msg.currentTime ?? 0;
        const anchorTime = msg.anchorTime ?? msg.anchorServerTime ?? msg.serverTime ?? Date.now();
        if (this.state.playback) {
          this.state.playback.positionSec = seekTo;
          this.state.playback.anchorTime = anchorTime;
        }
        this.notify();
        this.audio.seekTo(seekTo);
        break;
      }

      case "playback:sync": {
        const pb = this.state.playback;
        if (!pb) return;
        const livePos = msg.currentTime ?? pb.positionSec;
        pb.positionSec = livePos;
        pb.anchorTime = msg.updatedAt ?? Date.now();
        if (typeof msg.isPlaying === "boolean") pb.isPlaying = msg.isPlaying;
        this.notify();

        const drift = this.audio.currentTime - this.livePosition(pb);
        if (Math.abs(drift) > 0.5) {
          this.audio.seekTo(livePos);
        }
        break;
      }

      case "queue:update":
      case "room:queue_update": {
        const version = msg.version ?? (Date.now());
        if (typeof version === "number" && version > 0 && version <= this.state.queueVersion) return;
        this.state.queue = msg.queue ?? [];
        if (typeof version === "number") this.state.queueVersion = version; else this.state.queueVersion++;
        if (msg.recentTracks) this.state.recentTracks = msg.recentTracks;
        this.notify();
        break;
      }

      case "members:update": {
        this.state.members = msg.members ?? [];
        this.notify();
        break;
      }

      case "host:changed":
      case "host:active_changed": {
        this.state.isHostActive = msg.isHostActive ?? true;
        this.notify();
        break;
      }

      case "chat:message": {
        if (msg.message) this.state.chatMessages = [...this.state.chatMessages, msg.message];
        this.notify();
        break;
      }

      case "track:preresolved": {
        this.audio.cacheUrl(msg.videoId, msg.audioUrl);
        break;
      }

      case "room:member_joined":
      case "room:member_left": {
        if (msg.members) this.state.members = msg.members;
        this.notify();
        break;
      }

      case "room:playback_mode": {
        const pm = msg.playbackMode ?? msg;
        this.state.playbackMode = {
          shuffle: typeof pm.shuffle === "boolean" ? pm.shuffle : this.state.playbackMode.shuffle,
          repeatMode: pm.repeatMode ?? this.state.playbackMode.repeatMode,
        };
        this.notify();
        break;
      }
    }
  }

  // ─── Host Actions ────────────────────────────────────────────────────────

  canControl(): boolean {
    return this.state.isHost || !this.state.isHostActive;
  }

  play(videoId: string, seekTo: number, durationMs: number, source: string,
       trackName: string, artistName: string, image: string) {
    if (!this.canControl()) return;
    // Server will broadcast play to all clients, including this one.
    // Dispatch handles the actual audio loading when the broadcast arrives.
    this.send({ type: "playback:play", videoId, seekTo, durationMs, source, trackName, artistName, image });
  }

  pause() {
    if (!this.canControl()) return;
    this.send({ type: "playback:pause", currentTime: this.audio.currentTime });
  }

  seek(seekTo: number) {
    if (!this.canControl()) return;
    this.send({ type: "playback:seek", currentTime: seekTo });
  }

  addToQueue(track: Track) { this.send({ type: "queue:add", track }); }
  removeFromQueue(trackId: string) { this.send({ type: "queue:remove", trackId }); }
  clearQueue() { this.send({ type: "queue:clear" }); }
  sendChat(text: string) { this.send({ type: "chat:send", text }); }
  requestSync() { this.send({ type: "sync:request" }); }
  sendPlaybackMode(mode: Partial<PlaybackMode>) {
    this.send({ type: "playback:mode", ...mode });
  }

  // ─── Listener Actions ────────────────────────────────────────────────────

  listenerToggle() {
    if (!this.state.playback?.isPlaying) return;
    const livePos = this.livePosition(this.state.playback);

    if (this.audio.muted) {
      this.audio.unmute();
      this.audio.seekTo(livePos);
      this.audio.play();
    } else if (this.audio.playing) {
      this.audio.pause(this.audio.currentTime);
    } else {
      this.audio.seekTo(livePos);
      this.audio.play();
    }
  }

  toggleMute() { this.audio.toggleMute(); }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private livePosition(pb: PlaybackSnapshot): number {
    if (!pb.isPlaying) return pb.positionSec;
    const elapsed = (this.clock.serverNow() - pb.anchorTime) / 1000;
    return Math.max(0, pb.positionSec + elapsed);
  }

  private hydratePlayback(raw: any): PlaybackSnapshot {
    return {
      videoId: raw.videoId ?? null,
      source: raw.source ?? "youtube",
      trackName: raw.trackName ?? "",
      artistName: raw.artistName ?? "",
      image: raw.image ?? "",
      isPlaying: Boolean(raw.isPlaying),
      positionSec: raw.currentTime ?? raw.positionSec ?? 0,
      anchorTime: raw.updatedAt ?? raw.anchorTime ?? Date.now(),
      durationMs: raw.durationMs ?? 0,
    };
  }

  private phaseTransition(phase: RoomPhase) {
    this.state.phase = phase;
    this.notify();
  }

  private send(msg: object) { this.transport.send(msg); }

  // ─── Periodic Tasks ──────────────────────────────────────────────────────

  private startPeriodicTasks() {
    this.clockRefreshInterval = setInterval(() => {
      this.clock.recalibrate((msg) => this.send(msg));
    }, 30_000);

    this.syncOnVisible = () => {
      if (!document.hidden && this.state.phase === "ready") {
        this.send({ type: "sync:request" });
      }
    };
    document.addEventListener("visibilitychange", this.syncOnVisible);

    this.hostHeartbeatInterval = setInterval(() => {
      if (this.state.isHost && this.audio.playing) {
        this.send({ type: "playback:heartbeat", currentTime: this.audio.currentTime });
      }
    }, 5_000);
  }

  private stopPeriodicTasks() {
    if (this.clockRefreshInterval) clearInterval(this.clockRefreshInterval);
    if (this.hostHeartbeatInterval) clearInterval(this.hostHeartbeatInterval);
    if (this.syncOnVisible) document.removeEventListener("visibilitychange", this.syncOnVisible);
  }

  private handleClientTrackEnd() {
    this.send({ type: "playback:ended", currentTime: this.audio.currentTime });
  }

  // ─── UI State Getters (delegate to AudioEngine) ─────────────────────────

  get audioEngine() { return this.audio; }
  get volume() { return this.audio.volume; }
  get isMuted() { return this.audio.muted; }
  get isAudioPlaying() { return this.audio.playing; }
  get currentTime() { return this.audio.currentTime; }
  get duration() { return this.audio.duration; }
  get audioMode() { return this.audio.mode; }
  get progress() { return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0; }
}
