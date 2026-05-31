"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import { setYouTubeOnReady } from "@/components/Player/ui/YouTubeIframe";

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

  useEffect(() => {
    setYouTubeOnReady((player) => {
      playerRef.current = player;
      player.mute();
      player.setVolume(0);
    });
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

      if (startTime && startTime > 0) {
        callbacksRef.current?.onLoadIntent?.(track.videoId);
      } else if (shouldPlay) {
        callbacksRef.current?.onPlayIntent?.(track.videoId);
      } else {
        callbacksRef.current?.onLoadIntent?.(track.videoId);
      }

      const player = playerRef.current;
      if (player) {
        try {
          player.cueVideoById({ videoId: track.videoId, startSeconds: startTime || 0 });
        } catch {
          /* YT iframe is muted and only used for background visuals */
        }
      }

      setLoadingId(null);
    },
    [],
  );

  const play = useCallback(() => {
    const id = nowPlayingRef.current?.videoId;
    if (id) callbacksRef.current?.onPlayIntent?.(id);
  }, []);

  const pause = useCallback(() => {
    callbacksRef.current?.onPauseIntent?.();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (playerState === "playing") {
      callbacksRef.current?.onPauseIntent?.();
    } else {
      const id = nowPlayingRef.current?.videoId;
      if (id) callbacksRef.current?.onPlayIntent?.(id);
    }
  }, [playerState]);

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
