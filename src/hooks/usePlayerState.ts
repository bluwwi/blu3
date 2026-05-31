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
  const desiredPlayStateRef = useRef<"playing" | "paused" | null>(null);
  const pendingTrackRef = useRef<{
    track: Track;
    startTime?: number;
    shouldPlay: boolean;
  } | null>(null);
  const readyRef = useRef(false);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;

  useEffect(() => {
    setYouTubeOnReady((player) => {
      playerRef.current = player;
      player.setVolume(volume);
      readyRef.current = true;

      const pending = pendingTrackRef.current;
      if (pending) {
        const { track, startTime, shouldPlay } = pending;
        pendingTrackRef.current = null;
        player.loadVideoById({ videoId: track.videoId, startSeconds: startTime || 0 });
        if (shouldPlay) player.playVideo();
        else player.pauseVideo();
        if (desiredPlayStateRef.current === "playing") player.playVideo();
      }
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
      setPlayerState("error");
      setError("YouTube couldn't play this. Try another.");
    };

    window.addEventListener("yt-state-change", onStateChange);
    window.addEventListener("yt-error", onError);
    return () => {
      window.removeEventListener("yt-state-change", onStateChange);
      window.removeEventListener("yt-error", onError);
    };
  }, [volume]);

  const isPlayerReady = useCallback(() => {
    const player = playerRef.current;
    if (!player) return false;
    if (typeof player.loadVideoById !== "function") return false;
    if (typeof player.seekTo !== "function") return false;
    try {
      const iframe = player.getIframe?.();
      if (!iframe || !document.contains(iframe)) return false;
    } catch {
      return false;
    }
    return true;
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

      desiredPlayStateRef.current = shouldPlay ? "playing" : "paused";

      if (shouldPlay && track.videoId && document.hidden) {
        callbacksRef.current?.onPlayIntent?.(track.videoId);
      } else if (!shouldPlay) {
        callbacksRef.current?.onPauseIntent?.();
      }

      const player = playerRef.current;
      if (player && isPlayerReady()) {
        try {
          player.loadVideoById({
            videoId: track.videoId,
            startSeconds: startTime || 0,
          });
          if (shouldPlay) player.playVideo();
          else player.pauseVideo();
          setLoadingId(null);
          return;
        } catch (e) {
          console.warn("Failed to reuse player:", e);
        }
      }

      if (!readyRef.current) {
        pendingTrackRef.current = { track, startTime, shouldPlay };
      }
      setLoadingId(null);
    },
    [isPlayerReady],
  );

  const play = useCallback(() => {
    desiredPlayStateRef.current = "playing";
    const id = nowPlayingRef.current?.videoId;
    if (id && document.hidden) callbacksRef.current?.onPlayIntent?.(id);
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    desiredPlayStateRef.current = "paused";
    callbacksRef.current?.onPauseIntent?.();
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;

    if (playerState === "playing") {
      desiredPlayStateRef.current = "paused";
      callbacksRef.current?.onPauseIntent?.();
      player?.pauseVideo();
    } else {
      desiredPlayStateRef.current = "playing";
      const id = nowPlayingRef.current?.videoId;
      if (id) callbacksRef.current?.onPlayIntent?.(id);
      player?.playVideo();
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
