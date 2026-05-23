"use client";

import { useCallback, useRef, useState } from "react";
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

  const playerRef = useRef<YT.Player | null>(null);

  const initPlayer = useCallback(
    (videoId: string, onReady?: (player: YT.Player) => void) => {
      if (!window.YT?.Player) return;

      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      setActiveVideoId(videoId);

      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: CONFIG.YT_PLAYER_PARAMS,
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volume);
            onReady?.(e.target);
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
    [volume],
  );

  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setLoadingId(track.id);
      setPlayerState("loading");
      setNowPlaying(track);

      if (!track.videoId) {
        setPlayerState("error");
        setError("No video ID.");
        setLoadingId(null);
        return;
      }

      initPlayer(track.videoId, (player) => {
        if (startTime) {
          player.seekTo(startTime, true);
        }
        if (!shouldPlay) {
          player.pauseVideo();
        }
      });
      setLoadingId(null);
    },
    [initPlayer],
  );

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (playerState === "playing") {
      player.pauseVideo();
    } else {
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
