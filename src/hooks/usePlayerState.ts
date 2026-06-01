"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import { setYouTubeOnReady } from "@/components/Player/ui/YouTubeIframe";

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

export function usePlayerState(): UsePlayerStateReturn {
  const [playerState, setPlayerState] = useState<PlayerStateType>("idle");
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const playerRef = useRef<YT.Player | null>(null);
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;

  /* YT player ready — audio comes directly from YT iframe */
  useEffect(() => {
    setYouTubeOnReady((player) => {
      playerRef.current = player;
      player.setVolume(200);
      if (isMuted) player.mute();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync volume/mute to YT iframe whenever they change */
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) {
      player.mute();
    } else {
      player.unMute();
      player.setVolume(volume);
    }
  }, [volume, isMuted]);

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

      const player = playerRef.current;
      if (player) {
        try {
          if (shouldPlay) {
            player.loadVideoById({ videoId: track.videoId, startSeconds: startTime || 0 });
            player.playVideo();
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
  }, []);

  const pause = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      try { player.pauseVideo(); } catch {}
    }
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
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
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
