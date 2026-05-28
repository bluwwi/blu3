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
  const cutoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preBufferRef = useRef<Set<string>>(new Set());

  // Unified state that mirrors usePlayerState's interface
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Progress tracking state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // Keep a ref of nowPlaying for async callbacks
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

  /* ─── Sync YT state into unified state ─── */
  useEffect(() => {
    if (modeRef.current !== "youtube") return;
    setPlayerState(yt.playerState);
    setCurrentTime(yt.playerState === "playing" ? yt.playerRef.current?.getCurrentTime?.() ?? 0 : currentTime);
  }, [yt.playerState]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Sync Audio state into unified state (when in audio mode) ─── */
  useEffect(() => {
    if (modeRef.current !== "audio") return;
    const audioState = audio.playerState as PlayerState;
    setPlayerState(audioState);
  }, [audio.playerState]);

  // Progress polling (works regardless of mode via proxy)
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

  /* ─── swapToAudio: cut over from YT → <audio> at current position ─── */
  const swapToAudio = useCallback(
    (streamUrl: string, track: Track) => {
      if (modeRef.current === "audio") return;

      // Get current YT position
      const pos = yt.playerRef.current?.getCurrentTime?.() ?? 0;

      // Set up audio source
      audio.setSource(streamUrl);

      // When audio can play, seek + play + pause YT
      const audioEl = audio.audioRef.current;
      if (!audioEl) return;

      const onCanPlay = () => {
        audioEl.removeEventListener("canplay", onCanPlay);
        if (modeRef.current === "audio") return;

        audioEl.currentTime = pos;
        audioEl.play().catch(() => {});
        yt.playerRef.current?.pauseVideo?.();
        modeRef.current = "audio";
        setPlayerState("playing");

        // Sync volume/muted to audio element
        audioEl.volume = Math.max(0, Math.min(1, volume / 100));
        audioEl.muted = isMuted;
      };

      audioEl.addEventListener("canplay", onCanPlay);

      // Safety timeout: if audio doesn't become ready, stay on YT
      cutoverTimeoutRef.current = setTimeout(() => {
        audioEl.removeEventListener("canplay", onCanPlay);
      }, 10000);
    },
    [audio, yt.playerRef, volume, isMuted],
  );

  /* ─── playTrack ─── */
  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setLoadingId(track.id);
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      // Cancel any pending cutover
      if (cutoverTimeoutRef.current) {
        clearTimeout(cutoverTimeoutRef.current);
        cutoverTimeoutRef.current = null;
      }

      // Try to use cached stream URL → play directly via <audio>
      const cachedUrl = streamUrlCache.get(track.videoId);
      if (cachedUrl && modeRef.current === "audio") {
        audio.setSource(cachedUrl);
        audio.seekTo(startTime ?? 0);
        if (shouldPlay) audio.play();
        modeRef.current = "audio";
        setPlayerState(shouldPlay ? "playing" : "paused");
        setLoadingId(null);
        return;
      }

      // Fallback: start YT instantly for zero delay
      modeRef.current = "youtube";
      yt.playTrack(track, startTime, shouldPlay);

      // Fetch stream URL in background → swap when ready
      if (track.videoId) {
        fetchStreamUrl(track.videoId).then((url) => {
          if (nowPlayingRef.current?.videoId !== track.videoId) return;
          swapToAudio(url, track);
        }).catch(() => {
          // YT fallback works — just stay on YT
        });
      }

      setLoadingId(null);
    },
    [yt, audio, swapToAudio],
  );

  /* ─── Controls ─── */
  const play = useCallback(() => {
    if (modeRef.current === "audio") {
      audio.play();
    } else {
      yt.play();
    }
    setPlayerState("playing");
  }, [audio, yt]);

  const pause = useCallback(() => {
    if (modeRef.current === "audio") {
      audio.pause();
    } else {
      yt.pause();
    }
    setPlayerState("paused");
  }, [audio, yt]);

  const togglePlayPause = useCallback(() => {
    if (playerState === "playing") {
      pause();
    } else {
      play();
    }
  }, [playerState, pause, play]);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      if (modeRef.current === "audio") {
        audio.setVolume(val);
      } else {
        yt.handleVolume(val);
      }
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    },
    [audio, yt, isMuted],
  );

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (modeRef.current === "audio") {
      audio.setMuted(next);
    } else {
      yt.toggleMute();
    }
  }, [isMuted, audio, yt]);

  const seekTo = useCallback(
    (time: number) => {
      proxyRef.current.seekTo(time, true);
      setCurrentTime(time);
    },
    [],
  );

  /* ─── Pre-buffer helper called externally ─── */
  const preBuffer = useCallback((track: Track) => {
    if (!track.videoId || preBufferRef.current.has(track.videoId)) return;
    preBufferRef.current.add(track.videoId);
    fetchStreamUrl(track.videoId).catch(() => {});
  }, []);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (cutoverTimeoutRef.current) clearTimeout(cutoverTimeoutRef.current);
    };
  }, []);

  return {
    // Player ref (proxy that delegates to active source)
    playerRef: proxyRef as unknown as React.MutableRefObject<YT.Player | null>,

    // Unified state
    playerState,
    volume,
    isMuted,
    nowPlaying,
    activeVideoId,
    loadingId,
    error,

    // Player controls
    playTrack,
    togglePlayPause,
    handleVolume,
    toggleMute,
    play,
    pause,

    // Progress tracking
    currentTime,
    duration,
    progress,
    seekTo,

    // Pre-buffer
    preBuffer,

    // Setters (for compatibility)
    setError,
    setLoadingId,
    setNowPlaying,
    setPlayerState,
  };
}
