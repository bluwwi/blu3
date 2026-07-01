"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Track } from "@/utils/types";
import { resolveTrackSource } from "@/utils/ytdl";

interface PlayerEngineConfig {
  token?: string;
  nowPlaying: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  pendingStartTimeRef: React.MutableRefObject<number>;
  onPlay: () => void;
  onPause: () => void;
  onTrackEnd: () => void;
}

export interface PlayerEngineResult {
  mode: "idle" | "resolving" | "audio" | "youtube";
  currentTime: number;
  duration: number;
  progress: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  seekTo: (time: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let playerCounter = 0;
const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const YT_POLL_MS = 250;
const AUDIO_POLL_MS = 3000;

export function usePlayerEngine(config: PlayerEngineConfig): PlayerEngineResult {
  const configRef = useRef(config);
  configRef.current = config;

  const [mode, setMode] = useState<"idle" | "resolving" | "audio" | "youtube">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<any>(null);
  const apiReadyRef = useRef(false);
  const containerIdRef = useRef(`yt-player-${++playerCounter}`);

  const lastVideoIdRef = useRef<string | null>(null);
  const lastModeRef = useRef<"idle" | "resolving" | "audio" | "youtube">("idle");
  const progressIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortCountRef = useRef(0);
  const endedSentRef = useRef(false);
  const suppressCallbacksRef = useRef(false);

  const resolvedUrlsRef = useRef(new Map<string, string>());
  const resolvedTimestampsRef = useRef(new Map<string, number>());

  // ── Audio element lifecycle ──
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.onplay = () => { if (suppressCallbacksRef.current) return; configRef.current.onPlay(); };
    audio.onpause = () => { if (suppressCallbacksRef.current) return; configRef.current.onPause(); };
    audio.onended = () => {
      if (suppressCallbacksRef.current) return;
      if (!endedSentRef.current) {
        endedSentRef.current = true;
        configRef.current.onTrackEnd();
      }
    };
    audio.onerror = () => { audio.pause(); audio.src = ""; };

    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (lastModeRef.current !== "audio") return;
      try {
        const cur = audio.currentTime;
        const dur = audio.duration || 0;
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      } catch {}
    };
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, []);

  // ── YouTube IFrame API script ──
  useEffect(() => {
    if (window.YT?.Player) { apiReadyRef.current = true; return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { apiReadyRef.current = true; };
  }, []);

  // ── YouTube IFrame container div ──
  useEffect(() => {
    const div = document.createElement("div");
    div.id = containerIdRef.current;
    div.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(div);
    return () => { div.remove(); };
  }, []);

  // ── Safe audio play (handles AbortError / NotAllowedError) ──
  const safePlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: DOMException) => {
      if (err.name === "AbortError") {
        abortCountRef.current++;
        if (abortCountRef.current > 5) return;
      } else if (err.name === "NotAllowedError") {
        return;
      } else {
        abortCountRef.current = 0;
      }
    });
  }, []);

  // ── Stop both engines ──
  const stopBothRef = useRef<() => void>(() => {});
  stopBothRef.current = () => {
    suppressCallbacksRef.current = true;
    if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
    lastModeRef.current = "idle";
  };

  // ── YT progress polling ──
  const startYTProgress = useCallback(() => {
    if (progressIntRef.current) clearInterval(progressIntRef.current);
    progressIntRef.current = setInterval(() => {
      if (lastModeRef.current !== "youtube" || !playerRef.current) return;
      const cur = playerRef.current.getCurrentTime?.() ?? 0;
      const dur = playerRef.current.getDuration?.() ?? 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      if (dur > 0 && cur >= dur - 1 && !endedSentRef.current) {
        endedSentRef.current = true;
        configRef.current.onTrackEnd();
      }
    }, YT_POLL_MS);
  }, []);

  // ── Start audio playback ──
  const startAudio = useCallback((url: string, startTime: number) => {
    stopBothRef.current();
    suppressCallbacksRef.current = false;
    endedSentRef.current = false;
    setMode("audio");
    lastModeRef.current = "audio";

    const audio = audioRef.current;
    if (!audio) return;
    const token = configRef.current.token;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const streamingUrl = `${base}${url}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    audio.src = streamingUrl;
    // Defer seek until metadata is loaded (fixes mobile background playback)
    const onLoaded = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      if (startTime > 0 && Math.abs(audio.currentTime - startTime) > 0.5) {
        audio.currentTime = startTime;
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    safePlay(audio);
    abortCountRef.current = 0;

    // Audio polling backup
    if (progressIntRef.current) clearInterval(progressIntRef.current);
    progressIntRef.current = setInterval(() => {
      if (lastModeRef.current !== "audio") return;
      try {
        const a = audioRef.current;
        if (!a) return;
        const cur = a.currentTime;
        const dur = a.duration || 0;
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
        if (dur > 0 && cur >= dur - 1 && !endedSentRef.current) {
          endedSentRef.current = true;
          configRef.current.onTrackEnd();
        }
      } catch {}
    }, AUDIO_POLL_MS);
  }, [safePlay]);

  // ── Start YouTube playback ──
  const startYT = useCallback((videoId: string, startTime: number) => {
    stopBothRef.current();
    suppressCallbacksRef.current = false;
    endedSentRef.current = false;
    setMode("youtube");
    lastModeRef.current = "youtube";

    const tryInit = () => {
      if (!apiReadyRef.current || !window.YT?.Player) {
        setTimeout(tryInit, 100);
        return;
      }
      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId,
        height: 1,
        width: 1,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (startTime > 0) playerRef.current?.seekTo?.(startTime, true);
          },
          onStateChange: (e: any) => {
            if (suppressCallbacksRef.current) return;
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              configRef.current.onPlay();
              startYTProgress();
            } else if (e.data === S.PAUSED || e.data === S.ENDED) {
              if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
              configRef.current.onPause();
              if (e.data === S.ENDED && !endedSentRef.current) {
                endedSentRef.current = true;
                configRef.current.onTrackEnd();
              }
            }
          },
          onError: () => { console.error("YouTube player error for videoId:", videoId); },
        },
      });
    };
    tryInit();
  }, [startYTProgress]);

  // ── Main effect: track change triggers resolve ──
  useEffect(() => {
    const track = config.nowPlaying;
    const videoId = track?.videoId ?? null;

    if (!videoId) {
      stopBothRef.current();
      setMode("idle");
      lastVideoIdRef.current = null;
      return;
    }

    if (videoId === lastVideoIdRef.current) return;
    lastVideoIdRef.current = videoId;

    setMode("resolving");
    stopBothRef.current();
    endedSentRef.current = false;
    const cfg1 = configRef.current;
    const startTime = cfg1.pendingStartTimeRef.current;

    if (track?.source === "youtube") {
      startYT(videoId, startTime);
      return;
    }

    resolveTrackSource(videoId, track?.name ?? "", track?.artists?.[0]?.name, cfg1.token, track?.duration_ms, track?.source)
      .then((result) => {
        if (videoId !== lastVideoIdRef.current) return;
        if (result.audioUrl) {
          resolvedUrlsRef.current.set(videoId, result.audioUrl);
          resolvedTimestampsRef.current.set(videoId, Date.now());
          startAudio(result.audioUrl, cfg1.pendingStartTimeRef.current);
        } else {
          startYT(videoId, cfg1.pendingStartTimeRef.current);
        }
      })
      .catch(() => {
        if (videoId !== lastVideoIdRef.current) return;
        startYT(videoId, 0);
      });
  }, [config.nowPlaying?.videoId, startAudio, startYT]);

  // ── Play/pause effect ──
  useEffect(() => {
    if (mode === "audio") {
      const audio = audioRef.current;
      if (!audio || !audio.src) return;
      if (config.isPlaying) {
        if (audio.paused) safePlay(audio);
      } else {
        if (!audio.paused) audio.pause();
      }
    } else if (mode === "youtube") {
      if (!playerRef.current) return;
      if (config.isPlaying) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    }
  }, [config.isPlaying, mode, safePlay]);

  // ── Volume effect ──
  useEffect(() => {
    if (mode === "audio") {
      const audio = audioRef.current;
      if (audio) audio.volume = config.isMuted ? 0 : config.volume / 100;
    } else if (mode === "youtube") {
      if (playerRef.current) playerRef.current.setVolume?.(config.isMuted ? 0 : config.volume);
    }
  }, [config.volume, config.isMuted, mode]);

  // ── Visibility: detect ended-in-background and resume if paused ──
  useEffect(() => {
    const onShow = () => {
      if (document.hidden) return;

      if (lastModeRef.current === "youtube" && playerRef.current) {
        const cur = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
        try {
          const state = playerRef.current.getPlayerState?.();
          if (state === window.YT.PlayerState.ENDED || (dur > 0 && cur >= dur - 1)) {
            if (!endedSentRef.current) {
              endedSentRef.current = true;
              configRef.current.onTrackEnd();
            }
            return;
          }
          if (state === window.YT.PlayerState.PAUSED && configRef.current.isPlaying) {
            playerRef.current.playVideo?.();
          }
        } catch {}
        return;
      }

      if (lastModeRef.current === "audio") {
        const a = audioRef.current;
        if (a) {
          const cur = a.currentTime;
          const dur = a.duration || 0;
          setCurrentTime(cur);
          setDuration(dur);
          setProgress(dur > 0 ? (cur / dur) * 100 : 0);
          if (a.ended || (dur > 0 && cur >= dur - 1)) {
            if (!endedSentRef.current) {
              endedSentRef.current = true;
              configRef.current.onTrackEnd();
            }
            return;
          }
          if (a.paused && configRef.current.isPlaying && (!dur || cur < dur - 1)) {
            safePlay(a);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [safePlay]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => { stopBothRef.current(); };
  }, []);

  // ── Seek ──
  const seekTo = useCallback((time: number) => {
    if (mode === "audio") {
      const audio = audioRef.current;
      if (audio) audio.currentTime = time;
    } else if (mode === "youtube") {
      if (playerRef.current) playerRef.current.seekTo?.(time, true);
    }
    setCurrentTime(time);
  }, [mode]);

  return { mode, currentTime, duration, progress, audioRef, seekTo };
}
