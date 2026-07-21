import { ClockSync } from "./ClockSync";
import { resolveTrackSource } from "@/utils/ytdl";

const URL_CACHE_TTL = 25 * 60 * 1000;

interface TrackMeta {
  videoId: string;
  source: string;
  name: string;
  artist: string;
  durationMs: number;
}

export interface AudioLoadParams {
  track: TrackMeta;
  startSec: number;
  autoplay: boolean;
  role: "host" | "listener";
}

export class AudioEngine {
  private audioA = new Audio();
  private audioB = new Audio();
  private active: "a" | "b" = "a";

  private urlCache = new Map<string, { url: string; cachedAt: number }>();

  private _currentTime = 0;
  private _playing = false;
  private _muted = false;
  private _volume = 100;
  private _mode: "audio" | "youtube" = "audio";
  private currentVideoId: string | null = null;
  private driftInterval: ReturnType<typeof setInterval> | null = null;

  private anchorPosSec = 0;
  private anchorTime = 0;
  private trackIsPlaying = false;

  private _onTrackEnded: (() => void) | null = null;

  constructor(private clock: ClockSync, private token?: string) {
    this.setupElement(this.audioA);
    this.setupElement(this.audioB);
  }

  onTrackEnded(cb: () => void) { this._onTrackEnded = cb; }

  private setupElement(el: HTMLAudioElement) {
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.style.display = "none";
    document.body.appendChild(el);

    el.ontimeupdate = () => {
      if (el !== this.getActive()) return;
      this._currentTime = el.currentTime;
    };

    el.onended = () => {
      if (el !== this.getActive()) return;
      this._playing = false;
      this.stopDriftCheck();
      this._onTrackEnded?.();
    };

    el.onerror = () => {
      if (el !== this.getActive()) return;
      console.warn("[AudioEngine] audio error, trying YouTube fallback for", this.currentVideoId);
      this.fallbackToYouTube(this.currentVideoId);
    };
  }

  private fallbackToYouTube(videoId: string | null) {
    if (!videoId) return;
    this.stopDriftCheck();
    this.getActive().src = "";
    this.createYTPlayer(videoId);
  }

  private ytPlayer: any = null;
  private ytContainerId = `yt-${Date.now()}`;

  private createYTPlayer(videoId: string) {
    if (typeof window === "undefined" || !window.YT?.Player) return;
    const div = document.getElementById(this.ytContainerId) || (() => {
      const d = document.createElement("div");
      d.id = this.ytContainerId;
      d.style.cssText = "position:fixed;top:-9999px";
      document.body.appendChild(d);
      return d;
    })();

    this.ytPlayer = new window.YT.Player(this.ytContainerId, {
      videoId,
      height: 1, width: 1,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1 },
      events: {
        onReady: () => {
          if (this._playing) this.ytPlayer?.playVideo();
        },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            this._playing = false;
            this._onTrackEnded?.();
          }
          if (e.data === window.YT.PlayerState.PLAYING) {
            this._playing = true;
          }
          if (e.data === window.YT.PlayerState.PAUSED) {
            this._playing = false;
          }
        },
      },
    });
  }

  async load(params: AudioLoadParams) {
    const { track, startSec, autoplay, role } = params;

    if (track.videoId === this.currentVideoId) {
      if (autoplay) this.seekAndPlay(startSec);
      else this.seekTo(startSec);
      return;
    }

    this.currentVideoId = track.videoId;
    this.stopDriftCheck();

    const cached = this.urlCache.get(track.videoId);
    let url: string | null = null;
    if (cached && Date.now() - cached.cachedAt < URL_CACHE_TTL) {
      url = cached.url;
    } else {
      try {
        const result = await resolveTrackSource(
          track.videoId, track.name, track.artist, this.token,
          track.durationMs, track.source,
        );
        if (result.audioUrl) {
          url = result.audioUrl;
          this.urlCache.set(track.videoId, { url, cachedAt: Date.now() });
        }
      } catch {}
    }

    if (!url) {
      this._mode = "youtube";
      this.createYTPlayer(track.videoId);
      return;
    }

    this._mode = "audio";

    const old = this.getActive();
    this.toggleActive();
    const target = this.getActive();

    old.pause();
    old.src = "";

    target.src = url;
    target.volume = this._muted ? 0 : this._volume / 100;

    if (role === "listener") {
      target.volume = 0;
      this._muted = true;
    }

    target.onloadedmetadata = () => {
      if (startSec > 0 && Math.abs(target.currentTime - startSec) > 0.5) {
        target.currentTime = startSec;
      }
    };

    target.oncanplay = () => {
      if (autoplay) {
        target.play().catch(() => {});
        this._playing = true;
        this.setDriftAnchor(startSec, this.clock.serverNow());
        this.startDriftCheck();
      }
    };
  }

  seekAndPlay(positionSec: number) {
    const el = this.getActive();
    el.currentTime = positionSec;
    el.play().then(() => {
      this._playing = true;
      this._currentTime = positionSec;
      this.setDriftAnchor(positionSec, this.clock.serverNow());
      this.startDriftCheck();
    }).catch(() => {});
  }

  seekTo(positionSec: number) {
    this.getActive().currentTime = positionSec;
    this._currentTime = positionSec;
  }

  play() {
    const el = this.getActive();
    if (this.ytPlayer) {
      this.ytPlayer.playVideo();
      this._playing = true;
      return;
    }
    el.play().then(() => {
      this._playing = true;
      this.startDriftCheck();
    }).catch(() => {});
  }

  pause(atPosition?: number) {
    const el = this.getActive();
    if (this.ytPlayer) {
      this.ytPlayer.pauseVideo();
      this._playing = false;
      return;
    }
    el.pause();
    if (atPosition !== undefined) el.currentTime = atPosition;
    this._playing = false;
    this.stopDriftCheck();
  }

  unmute() {
    this._muted = false;
    this.getActive().volume = this._volume / 100;
  }

  toggleMute() {
    this._muted = !this._muted;
    this.getActive().volume = this._muted ? 0 : this._volume / 100;
  }

  setDriftAnchor(positionSec: number, anchorTime: number) {
    this.anchorPosSec = positionSec;
    this.anchorTime = anchorTime;
    this.trackIsPlaying = true;
  }

  clearDriftAnchor() { this.trackIsPlaying = false; }

  private startDriftCheck() {
    this.stopDriftCheck();
    this.driftInterval = setInterval(() => this.checkDrift(), 1000);
  }

  private stopDriftCheck() {
    if (this.driftInterval) {
      clearInterval(this.driftInterval);
      this.driftInterval = null;
    }
    try { this.getActive().playbackRate = 1.0; } catch {}
  }

  private checkDrift() {
    if (!this.trackIsPlaying || !this.clock.calibrated) return;
    const elapsed = (this.clock.serverNow() - this.anchorTime) / 1000;
    const expected = this.anchorPosSec + elapsed;
    const actual = this.getActive().currentTime;
    const drift = actual - expected;

    if (Math.abs(drift) < 0.1) {
      try { this.getActive().playbackRate = 1.0; } catch {}
    } else if (Math.abs(drift) < 0.5) {
      try { this.getActive().playbackRate = drift < 0 ? 1.05 : 0.95; } catch {}
    } else {
      console.warn(`[AudioEngine] hard seek: drift=${drift.toFixed(2)}s`);
      this.getActive().currentTime = expected;
      try { this.getActive().playbackRate = 1.0; } catch {}
    }
  }

  async prefetchNextTrack(track: TrackMeta) {
    const cached = this.urlCache.get(track.videoId);
    if (cached && Date.now() - cached.cachedAt < URL_CACHE_TTL) return;

    try {
      const result = await resolveTrackSource(
        track.videoId, track.name, track.artist, this.token,
        track.durationMs, track.source,
      );
      if (result.audioUrl) {
        this.urlCache.set(track.videoId, { url: result.audioUrl, cachedAt: Date.now() });
        const inactive = this.getInactive();
        inactive.preload = "auto";
        inactive.src = result.audioUrl;
      }
    } catch {}
  }

  cacheUrl(videoId: string, url: string) {
    this.urlCache.set(videoId, { url, cachedAt: Date.now() });
  }

  private getActive() { return this.active === "a" ? this.audioA : this.audioB; }
  private getInactive() { return this.active === "a" ? this.audioB : this.audioA; }
  private toggleActive() { this.active = this.active === "a" ? "b" : "a"; }

  get currentTime() { return this._currentTime; }
  get playing() { return this._playing; }
  get muted() { return this._muted; }
  get volume() { return this._volume; }
  get activeVideoId() { return this.currentVideoId; }
  get duration() { return this.getActive().duration || 0; }
  get mode() { return this._mode; }

  destroy() {
    this.stopDriftCheck();
    this.audioA.pause(); this.audioA.src = "";
    this.audioB.pause(); this.audioB.src = "";
    if (this.ytPlayer) { try { this.ytPlayer.destroy(); } catch {} }
    const div = document.getElementById(this.ytContainerId);
    if (div) div.remove();
  }
}
