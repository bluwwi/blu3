"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track, PlayerState as PlayerStateType } from "../utils/types";
import { CONFIG } from "@/components/Player/constants";
import ReactPlayer from "react-player";

interface UsePlayerStateReturn {
  reactPlayerRef: React.MutableRefObject<ReactPlayer | null>;
  playerState: PlayerStateType;
  volume: number;
  isMuted: boolean;
  nowPlaying: Track | null;
  activeVideoId: string | null;
  error: string;
  src: string | null;
  playing: boolean;
  playTrack: (track: Track, startTime?: number, shouldPlay?: boolean) => void;
  togglePlayPause: () => void;
  handleVolume: (val: number) => void;
  toggleMute: () => void;
  setError: (msg: string) => void;
  setNowPlaying: (track: Track | null) => void;
  setPlayerState: (state: PlayerStateType) => void;
  play: () => void;
  pause: () => void;
  handleReady: () => void;
  handlePlayEvent: () => void;
  handlePauseEvent: () => void;
  handleEnded: () => void;
  handleError: (e: any) => void;
}

export function usePlayerState(): UsePlayerStateReturn {
  const [playerState, setPlayerState] = useState<PlayerStateType>("idle");
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const reactPlayerRef = useRef<ReactPlayer | null>(null);
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;
  const activeVideoIdRef = useRef(activeVideoId);
  activeVideoIdRef.current = activeVideoId;

  const playTrack = useCallback(
    (track: Track, startTime?: number, shouldPlay: boolean = true) => {
      setError("");
      setNowPlaying(track);
      setActiveVideoId(track.videoId);

      if (!track.videoId) {
        setPlayerState("error");
        setError("No video ID.");
        return;
      }

      setPlayerState("loading");
      if (track.videoId === activeVideoIdRef.current) {
        reactPlayerRef.current?.seekTo(startTime ?? 0, "seconds");
        setPlaying(shouldPlay);
      } else {
        const videoSrc = `https://www.youtube.com/watch?v=${track.videoId}&start=${Math.floor(startTime ?? 0)}`;
        setSrc(videoSrc);
        setPlaying(shouldPlay);
      }
    },
    [],
  );

  const play = useCallback(() => {
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
  }, []);

  /* Sync volume/mute to ReactPlayer */
  useEffect(() => {
    const player = reactPlayerRef.current;
    if (!player) return;
    /* ReactPlayer handles volume via the `volume` and `muted` props — nothing else needed */
  }, []);

  /* Sync Media Session playbackState — tells Android Chrome to keep background audio alive */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState =
      playerState === "playing" ? "playing" : "paused";
  }, [playerState]);

  /* Sync Media Session metadata — shows track info on lock screen */
  useEffect(() => {
    if (!("mediaSession" in navigator) || !nowPlaying) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nowPlaying.name || "Unknown",
        artist: nowPlaying.artists?.[0]?.name || "Unknown",
        album: nowPlaying.album?.name || "",
        artwork: nowPlaying.image
          ? [{ src: nowPlaying.image, sizes: "512x512", type: "image/png" }]
          : [],
      });
    } catch {}
  }, [nowPlaying]);

  /* Set up Media Session action handlers (play, pause, next, prev, seek) */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => { setPlaying(true); });
      navigator.mediaSession.setActionHandler("pause", () => { setPlaying(false); });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        const player = reactPlayerRef.current;
        if (player) {
          const cur = player.getCurrentTime() ?? 0;
          player.seekTo(Math.max(0, cur - 10), "seconds");
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        const player = reactPlayerRef.current;
        if (player) {
          const cur = player.getCurrentTime() ?? 0;
          const dur = player.getDuration() ?? 0;
          player.seekTo(Math.min(dur, cur + 10), "seconds");
        }
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {});
      navigator.mediaSession.setActionHandler("nexttrack", () => {});
    } catch {}
  }, []);

  const togglePlayPause = useCallback(() => {
    const id = nowPlayingRef.current?.videoId;
    if (!id) return;
    if (playerStateRef.current === "playing") {
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  }, []);

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

  const handleReady = useCallback(() => {
    /* ReactPlayer is ready — no special action needed */
  }, []);

  const handlePlayEvent = useCallback(() => {
    setPlayerState("playing");
  }, []);

  const handlePauseEvent = useCallback(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    setPlayerState("paused");
  }, []);

  const handleEnded = useCallback(() => {
    setPlayerState("ended");
  }, []);

  const handleError = useCallback((e: any) => {
    console.error("[ReactPlayer] Error:", e);
    setError(`Player error`);
    setPlayerState("error");
  }, []);

  return {
    reactPlayerRef,
    playerState,
    volume,
    isMuted,
    nowPlaying,
    activeVideoId,
    error,
    src,
    playing,
    playTrack,
    togglePlayPause,
    handleVolume,
    toggleMute,
    setError,
    setNowPlaying,
    setPlayerState,
    play,
    pause,
    handleReady,
    handlePlayEvent,
    handlePauseEvent,
    handleEnded,
    handleError,
  };
}
