"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import { setYouTubeOnReady } from "@/components/Player/ui/YouTubeIframe";

/* OLD: onPlayIntent/onPauseIntent were the sole playback path via audio stream.
   Now they remain only for WS sync — actual playback goes through YT player. */
interface UsePlayerStateOptions {
  onPlayIntent?: (videoId: string) => void;
  onPauseIntent?: () => void;
  onLoadIntent?: (videoId: string) => void;
}

interface UsePlayerStateReturn {
  playerRef: React.MutableRefObject<YT.Player | null>;
  playerState: PlayerStateType;
  volume: number;
  isMuted: boolean;
  nowPlaying: Track | null;
  activeVideoId: string | null;
  loadingId: string | null;
  error: string;
  playTrack: (track: Track, startTime?: number, shouldPlay?: boolean) => void;
  togglePlayPause: () => void;
  handleVolume: (val: number) => void;
  toggleMute: () => void;
  setError: (msg: string) => void;
  setLoadingId: (id: string | null) => void;
  setNowPlaying: (track: Track | null) => void;
  setPlayerState: (state: PlayerStateType) => void;
  play: () => void;
  pause: () => void;
}

const YT = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

function mapYTState(ytState: number): PlayerStateType {
  switch (ytState) {
    case 1: return "playing";
    case 2: return "paused";
    case 0: return "ended";
    default: return "loading";
  }
}

export function usePlayerState(options?: UsePlayerStateOptions): UsePlayerStateReturn {
  const [playerState, setPlayerState] = useState<PlayerStateType>("idle");
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const playerRef = useRef<YT.Player | null>(null);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;

  /* YT player ready — now unmuted with real volume */
  useEffect(() => {
    setYouTubeOnReady((player) => {
      playerRef.current = player;
      player.setVolume(CONFIG.DEFAULT_VOLUME);
    });
  }, []);

  /* Listen for YT iframe state changes */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.data === "number") {
        setPlayerState(mapYTState(detail.data));
      }
    };
    window.addEventListener("yt-state-change", handler);
    return () => window.removeEventListener("yt-state-change", handler);
  }, []);

  /* Listen for YT iframe errors */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const code = detail?.data;
      console.error("[YT] Error event:", code);
      setError(`YouTube player error (${code})`);
      /* 2 = invalid param, 100 = video not found, 101/150 = embedding not allowed */
      if (code === 100 || code === 101 || code === 150) {
        setPlayerState("error");
      }
    };
    window.addEventListener("yt-error", handler);
    return () => window.removeEventListener("yt-error", handler);
  }, []);

  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setLoadingId(track.id);
      setPlayerState("loading");
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      if (!track.videoId) {
        setPlayerState("error");
        setError("No video ID.");
        setLoadingId(null);
        return;
      }

      /* WS sync: notify server */
      if (startTime && startTime > 0) {
        callbacksRef.current?.onLoadIntent?.(track.videoId);
      } else if (shouldPlay) {
        callbacksRef.current?.onPlayIntent?.(track.videoId);
      } else {
        callbacksRef.current?.onLoadIntent?.(track.videoId);
      }

      /* OLD: player.cueVideoById — now loadVideoById + playVideo */
      const player = playerRef.current;
      if (player) {
        try {
          if (shouldPlay) {
            player.loadVideoById({ videoId: track.videoId, startSeconds: startTime || 0 });
          } else {
            player.cueVideoById({ videoId: track.videoId, startSeconds: startTime || 0 });
          }
        } catch {
          /* YT player not yet ready */
        }
      }

      setLoadingId(null);
    },
    [],
  );

  const play = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      try { player.playVideo(); } catch {}
    }
    const id = nowPlayingRef.current?.videoId;
    if (id) callbacksRef.current?.onPlayIntent?.(id);
  }, []);

  const pause = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      try { player.pauseVideo(); } catch {}
    }
    callbacksRef.current?.onPauseIntent?.();
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState ? player.getPlayerState() : -1;
    if (state === YT.PLAYING) {
      pause();
    } else {
      const id = nowPlayingRef.current?.videoId;
      if (id) {
        /* If track was already loaded (cued/ended/paused), just toggle */
        if (state === YT.PAUSED || state === YT.ENDED || state === YT.CUED) {
          play();
        } else {
          play();
        }
      }
    }
  }, [play, pause]);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      const player = playerRef.current;
      if (player) {
        try { player.setVolume(val); } catch {}
      }
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    setIsMuted((m) => {
      const next = !m;
      if (player) {
        try {
          if (next) player.mute();
          else player.unMute();
        } catch {}
      }
      return next;
    });
  }, []);

  return {
    playerRef,
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
    setError,
    setLoadingId,
    setNowPlaying,
    setPlayerState,
    play,
    pause,
  };
}
