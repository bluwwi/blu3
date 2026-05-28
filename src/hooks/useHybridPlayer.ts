"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState } from "../utils/types";
import { usePlayerState } from "./usePlayerState";
import { useAudioElement } from "./useAudioElement";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─── Stream URL cache (module-level, persisted across hook instances) ─── */
const streamUrlCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

async function fetchStreamUrl(videoId: string): Promise<string> {
  const cached = streamUrlCache.get(videoId);
  if (cached) return cached;
  const inflight = pendingFetches.get(videoId);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/stream?videoId=${encodeURIComponent(videoId)}`,
      );
      if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data.url) throw new Error("No stream URL in response");
      streamUrlCache.set(videoId, data.url);
      return data.url;
    } finally {
      pendingFetches.delete(videoId);
    }
  })();

  pendingFetches.set(videoId, promise);
  return promise;
}

/** Pre-fetch stream URLs for upcoming tracks (fire-and-forget) */
export function preBufferStreamUrls(tracks: Track[]) {
  for (const t of tracks) {
    if (!streamUrlCache.has(t.videoId)) {
      fetchStreamUrl(t.videoId).catch(() => {});
    }
  }
}

export function clearStreamUrlCache() {
  streamUrlCache.clear();
}

/* ─── Proxy ref that delegates to whichever source is active ─── */
function createPlayerProxy(
  getMode: () => "youtube" | "audio",
  ytRef: React.MutableRefObject<YT.Player | null>,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  getState: () => PlayerState,
) {
  return {
    getCurrentTime: () => {
      if (getMode() === "audio") return audioRef.current?.currentTime ?? 0;
      return ytRef.current?.getCurrentTime?.() ?? 0;
    },
    getDuration: () => {
      if (getMode() === "audio") return audioRef.current?.duration ?? 0;
      return ytRef.current?.getDuration?.() ?? 0;
    },
    seekTo: (time: number, allowSeekAhead?: boolean) => {
      if (getMode() === "audio") {
        if (audioRef.current) audioRef.current.currentTime = time;
      } else {
        ytRef.current?.seekTo?.(time, allowSeekAhead ?? true);
      }
    },
    getPlayerState: () => {
      if (getMode() === "audio") {
        const state = getState();
        return state === "playing" ? 1 : state === "paused" ? 2 : -1;
      }
      return ytRef.current?.getPlayerState?.() ?? -1;
    },
    playVideo: () => {
      if (getMode() === "audio") {
        audioRef.current?.play().catch(() => {});
      } else {
        ytRef.current?.playVideo?.();
      }
    },
    pauseVideo: () => {
      if (getMode() === "audio") {
        audioRef.current?.pause();
      } else {
        ytRef.current?.pauseVideo?.();
      }
    },
    setVolume: (v: number) => {
      if (getMode() === "audio") {
        if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, v / 100));
      } else {
        ytRef.current?.setVolume?.(v);
      }
    },
    mute: () => {
      if (getMode() === "audio") {
        if (audioRef.current) audioRef.current.muted = true;
      } else {
        ytRef.current?.mute?.();
      }
    },
    unMute: () => {
      if (getMode() === "audio") {
        if (audioRef.current) audioRef.current.muted = false;
      } else {
        ytRef.current?.unMute?.();
      }
    },
    getIframe: () => ytRef.current?.getIframe?.() ?? null,
    destroy: () => ytRef.current?.destroy?.(),
    loadVideoById: (opts: any) => ytRef.current?.loadVideoById?.(opts),
  };
}

type ProxyPlayer = ReturnType<typeof createPlayerProxy>;

/* ─── Hook ─── */
export function useHybridPlayer() {
  const yt = usePlayerState();
  const audio = useAudioElement();

  const modeRef = useRef<"youtube" | "audio">("youtube");
  const preBufferRef = useRef<Set<string>>(new Set());

  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const nowPlayingRef = useRef<Track | null>(null);
  useEffect(() => { nowPlayingRef.current = nowPlaying; }, [nowPlaying]);

  /* Create the proxy ref once */
  const proxyRef = useRef<ProxyPlayer>(null!);
  if (!proxyRef.current) {
    proxyRef.current = createPlayerProxy(
      () => modeRef.current,
      yt.playerRef,
      audio.audioRef,
      () => playerState,
    );
  }

  /* ─── Sync YT state (when in youtube mode) ─── */
  useEffect(() => {
    if (modeRef.current !== "youtube") return;
    setPlayerState(yt.playerState);
  }, [yt.playerState]);

  /* ─── Sync Audio state (when in audio mode) ─── */
  useEffect(() => {
    if (modeRef.current !== "audio") return;
    setPlayerState(audio.playerState as PlayerState);
  }, [audio.playerState]);

  /* ─── Progress polling (via proxy → active source) ─── */
  useEffect(() => {
    if (playerState !== "playing") return;
    const interval = setInterval(() => {
      const ct = proxyRef.current.getCurrentTime();
      const dur = proxyRef.current.getDuration();
      setCurrentTime(ct);
      setDuration(dur);
      setProgress(dur > 0 ? (ct / dur) * 100 : 0);
    }, 500);
    return () => clearInterval(interval);
  }, [playerState]);

  /* ─── Visibility-based swap: only when user leaves the tab ─── */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (modeRef.current !== "youtube") return;
      const track = nowPlayingRef.current;
      if (!track?.videoId) return;

      const cachedUrl = streamUrlCache.get(track.videoId);
      if (!cachedUrl) return;

      const pos = yt.playerRef.current?.getCurrentTime?.() ?? 0;
      audio.setSource(cachedUrl);
      const el = audio.audioRef.current;
      if (!el) return;

      const onReady = () => {
        el.removeEventListener("canplay", onReady);
        el.currentTime = pos;
        el.play().catch(() => {});
        yt.playerRef.current?.pauseVideo?.();
        modeRef.current = "audio";
        el.volume = Math.max(0, Math.min(1, volume / 100));
        el.muted = isMuted;
      };
      el.addEventListener("canplay", onReady);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [audio, yt.playerRef, volume, isMuted]);

  /* ─── playTrack ─── */
  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setLoadingId(track.id);
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      const cachedUrl = streamUrlCache.get(track.videoId);

      if (cachedUrl) {
        // Cached URL → play directly via <audio> (instant, background-capable)
        audio.setSource(cachedUrl);
        audio.seekTo(startTime ?? 0);
        if (shouldPlay) audio.play();
        modeRef.current = "audio";
        setPlayerState(shouldPlay ? "playing" : "paused");
      } else {
        // No cached URL → play via YouTube iframe (instant start)
        if (modeRef.current === "audio") {
          audio.pause();
        }
        modeRef.current = "youtube";
        yt.playTrack(track, startTime, shouldPlay);

        // Background-fetch the URL for future use (swap on tab-hide or next play)
        fetchStreamUrl(track.videoId).catch(() => {});
      }

      setLoadingId(null);
    },
    [yt, audio],
  );

  /* ─── Controls ─── */
  const play = useCallback(() => {
    if (modeRef.current === "audio") { audio.play(); }
    else { yt.play(); }
    setPlayerState("playing");
  }, [audio, yt]);

  const pause = useCallback(() => {
    if (modeRef.current === "audio") { audio.pause(); }
    else { yt.pause(); }
    setPlayerState("paused");
  }, [audio, yt]);

  const togglePlayPause = useCallback(() => {
    if (playerState === "playing") pause();
    else play();
  }, [playerState, pause, play]);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      if (modeRef.current === "audio") { audio.setVolume(val); }
      else { yt.handleVolume(val); }
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    },
    [audio, yt, isMuted],
  );

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (modeRef.current === "audio") { audio.setMuted(next); }
    else { yt.toggleMute(); }
  }, [isMuted, audio, yt]);

  const seekTo = useCallback(
    (time: number) => {
      proxyRef.current.seekTo(time, true);
      setCurrentTime(time);
    },
    [],
  );

  const preBuffer = useCallback((track: Track) => {
    if (!track.videoId || preBufferRef.current.has(track.videoId)) return;
    preBufferRef.current.add(track.videoId);
    fetchStreamUrl(track.videoId).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (modeRef.current === "audio") {
        audio.pause();
        const el = audio.audioRef.current;
        if (el) { el.src = ""; el.load(); }
      }
    };
  }, [audio]);

  return {
    playerRef: proxyRef as unknown as React.MutableRefObject<YT.Player | null>,
    playerState,
    volume,
    isMuted,
    nowPlaying,
    activeVideoId,
    loadingId,
    error,

    playTrack,
    togglePlayPause,
    handleVolume,
    toggleMute,
    play,
    pause,

    currentTime,
    duration,
    progress,
    seekTo,

    preBuffer,

    setError,
    setLoadingId,
    setNowPlaying,
    setPlayerState,
  };
}
