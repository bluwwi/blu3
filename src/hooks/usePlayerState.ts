"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";

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

export function usePlayerState(): UsePlayerStateReturn {
  const [playerState, setPlayerState] = useState<PlayerStateType>("idle");
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [ytReady, setYtReady] = useState(() => typeof window !== "undefined" && !!window.YT?.Player);
  const [pendingTrack, setPendingTrack] = useState<{
    track: Track;
    startTime?: number;
    shouldPlay: boolean;
  } | null>(null);

  const playerRef = useRef<YT.Player | null>(null);
  const desiredPlayStateRef = useRef<"playing" | "paused" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) {
      setYtReady(true);
      return;
    }
    const checkYT = setInterval(() => {
      if (window.YT?.Player) {
        setYtReady(true);
        clearInterval(checkYT);
      }
    }, 100);
    return () => clearInterval(checkYT);
  }, []);

  /** Check whether the existing YT.Player is still usable */
  const isPlayerAlive = useCallback((): boolean => {
    const player = playerRef.current;
    if (!player) return false;
    // Must have the critical API methods
    if (typeof player.loadVideoById !== "function") return false;
    if (typeof player.seekTo !== "function") return false;
    // Its iframe must still be in the document
    try {
      const iframe = player.getIframe?.();
      if (!iframe || !document.contains(iframe)) return false;
    } catch {
      return false;
    }
    return true;
  }, []);

  const initPlayer = useCallback(
    (videoId: string, onReady?: (player: YT.Player) => void) => {
      if (!window.YT?.Player) return;

      if (playerRef.current) {
        if (isPlayerAlive()) {
          try {
            playerRef.current.loadVideoById({
              videoId,
              startSeconds: 0,
            });
            onReady?.(playerRef.current);
            return;
          } catch (err) {
            console.warn("Failed to reuse existing player, recreating:", err);
          }
        }
        // Player is stale or call failed — destroy and recreate
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }

      const playerVars = {
        ...CONFIG.YT_PLAYER_PARAMS,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
      };

      playerRef.current = new window.YT.Player("yt-player", {
        host: CONFIG.YT_HOST,
        videoId,
        playerVars,
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volume);
            onReady?.(e.target);
            if (desiredPlayStateRef.current === "playing") {
              e.target.playVideo();
            } else if (desiredPlayStateRef.current === "paused") {
              e.target.pauseVideo();
            }
          },
          onStateChange: (e: any) => {
            const S = window.YT.PlayerState;
            switch (e.data) {
              case S.PLAYING:
                setPlayerState("playing");
                break;
              case S.PAUSED:
                setPlayerState("paused");
                break;
              case S.ENDED:
                setPlayerState("ended");
                break;
              case S.BUFFERING:
                setPlayerState("loading");
                break;
              case S.UNSTARTED:
                setPlayerState("idle");
                break;
            }
          },
          onError: () => {
            setPlayerState("error");
            setError("YouTube couldn't play this. Try another.");
          },
        },
      });
    },
    [volume, isPlayerAlive],
  );

  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setLoadingId(track.id);
      setPlayerState("loading");
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      desiredPlayStateRef.current = shouldPlay ? "playing" : "paused";

      if (!track.videoId) {
        setPlayerState("error");
        setError("No video ID.");
        setLoadingId(null);
        return;
      }

      if (isPlayerAlive()) {
        try {
          playerRef.current!.loadVideoById({
            videoId: track.videoId,
            startSeconds: startTime || 0,
          });
          if (shouldPlay) {
            playerRef.current!.playVideo();
          } else {
            playerRef.current!.pauseVideo();
          }
          setLoadingId(null);
          return;
        } catch (e) {
          console.warn("Failed to reuse player, recreating:", e);
          try {
            playerRef.current!.destroy();
          } catch {}
          playerRef.current = null;
        }
      } else if (playerRef.current) {
        // Player ref exists but is stale — clean up
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      if (!window.YT?.Player) {
        setPendingTrack({ track, startTime, shouldPlay });
        return;
      }

      initPlayer(track.videoId, (player) => {
        if (startTime) {
          player.seekTo(startTime, true);
        }
      });
      setLoadingId(null);
    },
    [initPlayer, isPlayerAlive],
  );

  useEffect(() => {
    if (ytReady && pendingTrack) {
      const { track, startTime, shouldPlay } = pendingTrack;
      setPendingTrack(null);
      initPlayer(track.videoId, (player) => {
        if (startTime) {
          player.seekTo(startTime, true);
        }
      });
      setLoadingId(null);
    }
  }, [ytReady, pendingTrack, initPlayer]);

  const play = useCallback(() => {
    desiredPlayStateRef.current = "playing";
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    desiredPlayStateRef.current = "paused";
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (playerState === "playing") {
      desiredPlayStateRef.current = "paused";
      player.pauseVideo();
    } else {
      desiredPlayStateRef.current = "playing";
      player.playVideo();
    }
  }, [playerState]);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      playerRef.current?.setVolume(val);

      if (val === 0) {
        setIsMuted(true);
        playerRef.current?.mute();
      } else if (isMuted) {
        setIsMuted(false);
        playerRef.current?.unMute();
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isMuted) {
      player.unMute();
      player.setVolume(volume || CONFIG.DEFAULT_VOLUME);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [isMuted, volume]);

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
