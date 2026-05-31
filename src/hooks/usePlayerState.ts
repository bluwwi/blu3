"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import { setYouTubeOnReady } from "@/components/Player/ui/YouTubeIframe";

interface UsePlayerStateOptions {
  onPlayIntent?: (videoId: string) => void;
  onPauseIntent?: () => void;
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

    const onStateChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const S = (window as any).YT?.PlayerState;
      if (!S) return;
      switch (detail.data) {
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
    };

    const onError = () => {
      setError("YouTube couldn't play this. Try another.");
    };

    window.addEventListener("yt-state-change", onStateChange);
    window.addEventListener("yt-error", onError);
    return () => {
      window.removeEventListener("yt-state-change", onStateChange);
      window.removeEventListener("yt-error", onError);
    };
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

      if (shouldPlay) {
        callbacksRef.current?.onPlayIntent?.(track.videoId);
        if (startTime && startTime > 0) {
          setTimeout(() => callbacksRef.current?.onPauseIntent?.(), 0);
        }
      } else {
        callbacksRef.current?.onPlayIntent?.(track.videoId);
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
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    callbacksRef.current?.onPauseIntent?.();
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (playerState === "playing") {
      callbacksRef.current?.onPauseIntent?.();
      playerRef.current?.pauseVideo();
    } else {
      const id = nowPlayingRef.current?.videoId;
      if (id) callbacksRef.current?.onPlayIntent?.(id);
      playerRef.current?.playVideo();
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
