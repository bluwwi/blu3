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
  cacheResolvedUrl: (videoId: string, url: string) => void;
  preloadAudioData: (url: string) => void;
  prefetchNextTrack: (track: Track) => void;
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
  const audio2Ref = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<"a" | "b">("a");
  const playerRef = useRef<any>(null);
  const apiReadyRef = useRef(false);
  const containerIdRef = useRef(`yt-player-${++playerCounter}`);

  const lastVideoIdRef = useRef<string | null>(null);
  const lastModeRef = useRef<"idle" | "resolving" | "audio" | "youtube">("idle");
  const progressIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortCountRef = useRef(0);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const stopCountRef = useRef(0);
  const endedSentRef = useRef(false);
  const youtubeErrorRef = useRef(false);
  const suppressCallbacksRef = useRef(false);
  const trackStartWallRef = useRef(0);
  const trackDurationMsRef = useRef(0);
  const currentTimeRef = useRef(0);
  const pauseStartRef = useRef(0);
  const totalPausedRef = useRef(0);

  const resolvedUrlsRef = useRef(new Map<string, string>());
  const resolvedTimestampsRef = useRef(new Map<string, number>());
  const resolvedYoutubeRef = useRef(new Set<string>());

  function getActiveAudio(): HTMLAudioElement | null {
    return activeAudioRef.current === "a" ? audioRef.current : audio2Ref.current;
  }

  function getInactiveAudio(): HTMLAudioElement | null {
    return activeAudioRef.current === "a" ? audio2Ref.current : audioRef.current;
  }

  // ── Audio elements lifecycle ──
  useEffect(() => {
    const makeAudio = () => {
      const el = new Audio();
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      el.style.display = "none";
      document.body.appendChild(el);

      const guard = (fn: () => void) => () => {
        const expected = el === audioRef.current ? "a" : "b";
        if (activeAudioRef.current !== expected) return;
        if (suppressCallbacksRef.current) return;
        if (lastModeRef.current !== "audio") return;
        fn();
      };

      el.onplay = guard(() => configRef.current.onPlay());
      el.onpause = guard(() => configRef.current.onPause());
      el.onended = guard(() => {
        console.log(`[Audio] onended guard passed, endedSent=${endedSentRef.current} ytErr=${youtubeErrorRef.current} activeVideoId=${lastVideoIdRef.current}`);
        if (!endedSentRef.current && !youtubeErrorRef.current) {
          console.log(`[Advance] audio onended -> onTrackEnd (videoId=${lastVideoIdRef.current})`);
          endedSentRef.current = true;
          configRef.current.onTrackEnd();
        }
      });
      el.onerror = guard(() => {
        el.pause();
        console.log(`[Audio] onerror guard passed, endedSent=${endedSentRef.current} ytErr=${youtubeErrorRef.current}`);
        if (!endedSentRef.current && !youtubeErrorRef.current) {
          console.log(`[Advance] audio onerror -> onTrackEnd (videoId=${lastVideoIdRef.current})`);
          endedSentRef.current = true;
          configRef.current.onTrackEnd();
        }
      });

      return el;
    };

    const elA = makeAudio();
    const elB = makeAudio();

    audioRef.current = elA;
    audio2Ref.current = elB;
    activeAudioRef.current = "a";

    const onTimeUpdateA = () => {
      if (activeAudioRef.current !== "a") return;
      if (lastModeRef.current !== "audio") return;
      try {
        const cur = elA.currentTime;
        const dur = elA.duration || 0;
        setCurrentTime(cur);
        currentTimeRef.current = cur;
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      } catch {}
    };
    elA.addEventListener("timeupdate", onTimeUpdateA);

    const onTimeUpdateB = () => {
      if (activeAudioRef.current !== "b") return;
      if (lastModeRef.current !== "audio") return;
      try {
        const cur = elB.currentTime;
        const dur = elB.duration || 0;
        setCurrentTime(cur);
        currentTimeRef.current = cur;
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      } catch {}
    };
    elB.addEventListener("timeupdate", onTimeUpdateB);

    return () => {
      elA.removeEventListener("timeupdate", onTimeUpdateA);
      elA.onplay = null;
      elA.onpause = null;
      elA.onended = null;
      elA.onerror = null;
      elA.pause();
      elA.src = "";
      document.body.removeChild(elA);

      elB.removeEventListener("timeupdate", onTimeUpdateB);
      elB.onplay = null;
      elB.onpause = null;
      elB.onended = null;
      elB.onerror = null;
      elB.pause();
      elB.src = "";
      document.body.removeChild(elB);

      audioRef.current = null;
      audio2Ref.current = null;
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
    if (!audio.src || audio.src === "") { console.log(`[Audio] safePlay skipped — empty src`); return Promise.resolve(); }
    console.log(`[Audio] safePlay playing src=${audio.src?.substring(0, 80)}`);
    return audio.play().catch((err: DOMException) => {
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

  // ── Cleanup current audio (keep element alive for overlap) ──
  const cleanupCurrentAudio = useCallback(() => {
    console.log(`[Engine] cleanupCurrentAudio — clearing progress + destroying YT player`);
    if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
    if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
    lastModeRef.current = "idle";
  }, []);

  // ── Stop both engines (full teardown) ──
  const stopBothRef = useRef<() => void>(() => {});
  stopBothRef.current = () => {
    console.log(`[Engine] stopBothRef — aborting resolve, clearing audio elements`);
    resolveAbortRef.current?.abort();
    resolveAbortRef.current = new AbortController();
    suppressCallbacksRef.current = true;
    cleanupCurrentAudio();
    const a1 = audioRef.current;
    if (a1) { a1.pause(); a1.src = ""; a1.load(); }
    const a2 = audio2Ref.current;
    if (a2) { a2.pause(); a2.src = ""; a2.load(); }
  };

  // ── YT progress polling ──
  const startYTProgress = useCallback(() => {
    console.log(`[YT] startYTProgress — starting poll for videoId=${lastVideoIdRef.current}`);
    if (progressIntRef.current) clearInterval(progressIntRef.current);
    progressIntRef.current = setInterval(() => {
      if (lastModeRef.current !== "youtube" || !playerRef.current) return;
      const cur = playerRef.current.getCurrentTime?.() ?? 0;
      const dur = playerRef.current.getDuration?.() ?? 0;
      setCurrentTime(cur);
      currentTimeRef.current = cur;
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      if (dur > 0 && configRef.current.isPlaying) {
        const state = playerRef.current.getPlayerState?.();
        if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.UNSTARTED) {
          playerRef.current.playVideo?.();
        }
      }
      if (dur > 0 && cur >= dur - 1 && !endedSentRef.current && !youtubeErrorRef.current) {
        console.log(`[Advance] YT progress dur check -> onTrackEnd (videoId=${lastVideoIdRef.current})`);
        endedSentRef.current = true;
        configRef.current.onTrackEnd();
        return;
      }
      if (!configRef.current.isPlaying) return;
      const currentPause = pauseStartRef.current > 0 ? Date.now() - pauseStartRef.current : 0;
      const wallElapsed = Date.now() - trackStartWallRef.current - totalPausedRef.current - currentPause;
      const wallDur = trackDurationMsRef.current;
      if (wallDur > 0 && wallElapsed >= wallDur - 1000 && !endedSentRef.current && !youtubeErrorRef.current) {
        console.log(`[Advance] YT wall-clock check -> onTrackEnd (videoId=${lastVideoIdRef.current}, wallElapsed=${wallElapsed}, wallDur=${wallDur})`);
        endedSentRef.current = true;
        configRef.current.onTrackEnd();
      }
    }, YT_POLL_MS);
  }, []);

  // ── Start audio playback (dual-element overlap, instant swap if preloaded) ──
  const startAudio = useCallback((url: string, startTime: number) => {
    console.log(`[Audio] startAudio — url=${url?.substring(0, 80)} startTime=${startTime} videoId=${lastVideoIdRef.current}`);
    cleanupCurrentAudio();

    suppressCallbacksRef.current = false;
    endedSentRef.current = false;
    setMode("audio");
    lastModeRef.current = "audio";

    const token = configRef.current.token;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const streamingUrl = `${base}${url}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    // Check if inactive element already has this URL buffered (Layer 2: preload)
    const inactive = getInactiveAudio();
    const localStopCount = stopCountRef.current;
    if (inactive && inactive.src === streamingUrl && (inactive.readyState ?? 0) >= 3 && localStopCount === stopCountRef.current) {
      console.log(`[Audio] instant swap — already buffered, readyState=${inactive.readyState}`);
      const old = getActiveAudio();
      if (old) { old.pause(); old.src = ""; old.load(); }
      activeAudioRef.current = activeAudioRef.current === "a" ? "b" : "a";
      const target = getActiveAudio();
      if (target) {
        target.volume = configRef.current.isMuted ? 0 : configRef.current.volume / 100;
        if (startTime > 0 && Math.abs(target.currentTime - startTime) > 0.5) target.currentTime = startTime;
        safePlay(target)?.then(() => startAudioProgress(lastVideoIdRef.current ?? ""));
      }
      return;
    }

    console.log(`[Audio] normal load — streamingUrl=${streamingUrl?.substring(0, 80)}`);
    // Swap immediately so old element's onended is ignored by A/B guard
    activeAudioRef.current = activeAudioRef.current === "a" ? "b" : "a";

    const target = getActiveAudio();
    if (!target) { console.log(`[Audio] no target element — aborting`); return; }
    target.src = streamingUrl;

    const onLoaded = () => {
      console.log(`[Audio] loadedmetadata fired for videoId=${lastVideoIdRef.current}`);
      target.removeEventListener("loadedmetadata", onLoaded);
      if (startTime > 0 && Math.abs(target.currentTime - startTime) > 0.5) {
        target.currentTime = startTime;
      }
      const old = getInactiveAudio();
      if (old && old !== target) {
        old.pause();
      }
    };
    target.addEventListener("loadedmetadata", onLoaded);

    safePlay(target)?.then(() => startAudioProgress(lastVideoIdRef.current ?? ""));
    abortCountRef.current = 0;
  }, [safePlay]);

  // ── Audio progress polling ──
  const startAudioProgress = useCallback((expectedVideoId: string) => {
    console.log(`[Audio] startAudioProgress — expectedVideoId=${expectedVideoId}`);
    if (progressIntRef.current) clearInterval(progressIntRef.current);
    progressIntRef.current = setInterval(() => {
      if (lastVideoIdRef.current !== expectedVideoId) {
        console.log(`[Audio] startAudioProgress self-terminate — lastVideoId changed to ${lastVideoIdRef.current} (expected ${expectedVideoId})`);
        clearInterval(progressIntRef.current!);
        progressIntRef.current = null;
        return;
      }
      try {
        const a = getActiveAudio();
        if (!a || !a.src || a.src === "" || a.paused || a.readyState < 2 || isNaN(a.duration)) {
          return;
        }
        const cur = a.currentTime;
        const dur = a.duration || 0;
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
        if (dur > 0 && cur >= dur - 1 && !endedSentRef.current && !youtubeErrorRef.current) {
          console.log(`[Advance] audio progress cur>=dur-1 -> onTrackEnd (videoId=${lastVideoIdRef.current})`);
          endedSentRef.current = true;
          configRef.current.onTrackEnd();
          return;
        }
        if (!configRef.current.isPlaying) return;
        const currentPause = pauseStartRef.current > 0 ? Date.now() - pauseStartRef.current : 0;
        const wallElapsed = Date.now() - trackStartWallRef.current - totalPausedRef.current - currentPause;
        const wallDur = trackDurationMsRef.current;
        if (wallDur > 0 && wallElapsed >= wallDur - 1000 && !endedSentRef.current && !youtubeErrorRef.current) {
          console.log(`[Advance] audio wall-clock -> onTrackEnd (videoId=${lastVideoIdRef.current}, wallElapsed=${wallElapsed}, wallDur=${wallDur})`);
          endedSentRef.current = true;
          configRef.current.onTrackEnd();
        }
      } catch {}
    }, AUDIO_POLL_MS);
  }, []);

  // ── Start YouTube playback ──
  const startYT = useCallback((videoId: string, startTime: number) => {
    console.log(`[YT] startYT — videoId=${videoId} startTime=${startTime}`);
    stopBothRef.current();
    setMode("youtube");
    lastModeRef.current = "youtube";
    const ytVideoId = videoId;
    youtubeErrorRef.current = false;

    const tryInit = () => {
      if (!apiReadyRef.current || !window.YT?.Player) {
        setTimeout(tryInit, 100);
        return;
      }
      suppressCallbacksRef.current = false;
      endedSentRef.current = false;
      youtubeErrorRef.current = false;
      console.log(`[YT] creating IFrame player for videoId=${videoId}`);
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
            console.log(`[YT] onReady — videoId=${videoId} expected=${ytVideoId} lastVideoId=${lastVideoIdRef.current}`);
            if (lastVideoIdRef.current !== ytVideoId) {
              console.log(`[YT] onReady stale — destroying player`);
              playerRef.current?.destroy();
              return;
            }
            if (startTime > 0) playerRef.current?.seekTo?.(startTime, true);
            startYTProgress();
          },
          onStateChange: (e: any) => {
            if (lastVideoIdRef.current !== ytVideoId) { console.log(`[YT] onStateChange stale lastVideoId — ignoring`); return; }
            if (suppressCallbacksRef.current) { console.log(`[YT] onStateChange suppressed — ignoring`); return; }
            const S = window.YT.PlayerState;
            const stateNames: Record<number, string> = { [-1]: "UNSTARTED", [0]: "ENDED", [1]: "PLAYING", [2]: "PAUSED", [3]: "BUFFERING", [5]: "CUED" };
            console.log(`[YT] onStateChange — state=${stateNames[e.data] ?? e.data} videoId=${videoId}`);
            if (e.data === S.PLAYING) {
              configRef.current.onPlay();
              startYTProgress();
            } else if (e.data === S.PAUSED || e.data === S.ENDED) {
              configRef.current.onPause();
                if (e.data === S.ENDED) {
                  console.log(`[Advance] YT onStateChange ENDED -> onTrackEnd (videoId=${videoId}, endedSent=${endedSentRef.current}, ytErr=${youtubeErrorRef.current})`);
                  if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
                  if (!endedSentRef.current && !youtubeErrorRef.current) {
                    endedSentRef.current = true;
                    configRef.current.onTrackEnd();
                  }
                }
            }
          },
          onError: (err: any) => {
            console.log(`[YT] onError — videoId=${videoId} err=${err?.data ?? err} expected=${ytVideoId} lastVideoId=${lastVideoIdRef.current}`);
            if (lastVideoIdRef.current !== ytVideoId) {
              console.log(`[YT] onError stale — destroying player`);
              playerRef.current?.destroy();
              playerRef.current = null;
              return;
            }
            if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
            endedSentRef.current = true;
            youtubeErrorRef.current = true;
            playerRef.current?.destroy();
            playerRef.current = null;
            setMode("idle");
            const track = configRef.current.nowPlaying;
            if (track?.videoId === videoId) {
              console.log(`[YT] onError falling back to audio for videoId=${videoId}`);
              resolveTrackSource(videoId, track.name ?? "", track.artists?.[0]?.name, configRef.current.token, track.duration_ms, "youtube", resolveAbortRef.current?.signal)
                .then((result) => {
                  if (lastVideoIdRef.current !== ytVideoId) { console.log(`[YT] onError fallback stale — ignoring`); return; }
                  if (result.audioUrl) {
                    console.log(`[YT] onError fallback got audioUrl — starting audio`);
                    youtubeErrorRef.current = false;
                    endedSentRef.current = false;
                    startAudio(result.audioUrl, startTime);
                  }
                })
                .catch(() => {});
            }
          },
        },
      });
    };
    tryInit();
  }, [startYTProgress, startAudio]);

  // ── Stop current audio immediately (Layer 1: instant skip) ──
  const stopCurrentImmediately = useCallback(() => {
    console.log(`[Engine] stopCurrentImmediately — aborting resolve+prefetch, clearing audio, stopping YT`);
    resolveAbortRef.current?.abort();
    resolveAbortRef.current = new AbortController();
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = new AbortController();
    stopCountRef.current++;

    const a1 = audioRef.current;
    const a2 = audio2Ref.current;
    const active = getActiveAudio();
    if (active) { active.pause(); active.src = ""; active.load(); }
    if (a1 && a1 !== active) { a1.pause(); a1.src = ""; a1.load(); }
    if (a2 && a2 !== active) { a2.pause(); a2.src = ""; a2.load(); }

    if (playerRef.current) { try { playerRef.current.stopVideo?.(); } catch {} }
    if (progressIntRef.current) { clearInterval(progressIntRef.current); progressIntRef.current = null; }
    lastModeRef.current = "idle";
    suppressCallbacksRef.current = true;
  }, []);

  // ── Main effect: track change triggers resolve ──
  useEffect(() => {
    const track = config.nowPlaying;
    const videoId = track?.videoId ?? null;

    console.log(`[Engine] main effect triggered — videoId=${videoId} lastVideoId=${lastVideoIdRef.current}`);
    if (!videoId) {
      console.log(`[Engine] no videoId — stopping, setting idle`);
      stopCurrentImmediately();
      setMode("idle");
      lastVideoIdRef.current = null;
      return;
    }

    if (videoId === lastVideoIdRef.current) { console.log(`[Engine] same videoId — no-op`); return; }
    lastVideoIdRef.current = videoId;

    // Layer 1: stop audio NOW, clear everything
    stopCurrentImmediately();
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    currentTimeRef.current = 0;
    endedSentRef.current = false;
    trackStartWallRef.current = Date.now();
    trackDurationMsRef.current = track?.duration_ms ?? 0;
    pauseStartRef.current = 0;
    totalPausedRef.current = 0;
    const cfg1 = configRef.current;
    const startTime = cfg1.pendingStartTimeRef.current;

    // Use cached resolution if available (avoids re-resolution switching source)
    const cachedUrl = resolvedUrlsRef.current.get(videoId);
    const cachedTs = resolvedTimestampsRef.current.get(videoId);
    if (cachedUrl && cachedTs && Date.now() - cachedTs < STALE_THRESHOLD_MS) {
      console.log(`[Engine] cached audio URL found — startAudio (videoId=${videoId})`);
      startAudio(cachedUrl, startTime);
      return;
    }
    if (resolvedYoutubeRef.current.has(videoId)) {
      console.log(`[Engine] cached YT resolution found — startYT (videoId=${videoId})`);
      startYT(videoId, startTime);
      return;
    }

    setMode("resolving");
    console.log(`[Engine] resolving track source — videoId=${videoId}`);

    const signal = resolveAbortRef.current?.signal;

    resolveTrackSource(videoId, track?.name ?? "", track?.artists?.[0]?.name, cfg1.token, track?.duration_ms, track?.source, signal)
      .then((result) => {
        if (videoId !== lastVideoIdRef.current) { console.log(`[Engine] resolve stale — ignoring (videoId=${videoId}, last=${lastVideoIdRef.current})`); return; }
        if (result.audioUrl) {
          console.log(`[Engine] resolve got audioUrl — startAudio (videoId=${videoId})`);
          resolvedUrlsRef.current.set(videoId, result.audioUrl);
          resolvedTimestampsRef.current.set(videoId, Date.now());
          startAudio(result.audioUrl, cfg1.pendingStartTimeRef.current);
        } else {
          console.log(`[Engine] resolve no audioUrl — startYT (videoId=${videoId})`);
          resolvedYoutubeRef.current.add(videoId);
          startYT(videoId, cfg1.pendingStartTimeRef.current);
        }
      })
      .catch(() => {
        if (videoId !== lastVideoIdRef.current) { console.log(`[Engine] resolve catch stale — ignoring (videoId=${videoId})`); return; }
        console.log(`[Engine] resolve catch — falling back to startYT (videoId=${videoId})`);
        startYT(videoId, 0);
      });
  }, [config.nowPlaying?.videoId, startAudio, startYT, stopCurrentImmediately]);

  // ── Play/pause effect ──
  useEffect(() => {
    if (mode === "audio") {
      const audio = getActiveAudio();
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
      const audio = getActiveAudio();
      if (audio) audio.volume = config.isMuted ? 0 : config.volume / 100;
    } else if (mode === "youtube") {
      if (playerRef.current) playerRef.current.setVolume?.(config.isMuted ? 0 : config.volume);
    }
  }, [config.volume, config.isMuted, mode]);

  // ── Track pause time so the wall-clock guard doesn't fire after resume ──
  useEffect(() => {
    if (config.isPlaying) {
      if (pauseStartRef.current > 0) {
        totalPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
    } else {
      if (pauseStartRef.current === 0) {
        pauseStartRef.current = Date.now();
      }
    }
  }, [config.isPlaying]);

  // ── Visibility: detect ended-in-background and resume if paused ──
  useEffect(() => {
    const onShow = () => {
      if (document.hidden) return;

      if (!configRef.current.isPlaying) return;
      const currentPause = pauseStartRef.current > 0 ? Date.now() - pauseStartRef.current : 0;
      const wallElapsed = Date.now() - trackStartWallRef.current - totalPausedRef.current - currentPause;
      const wallDur = trackDurationMsRef.current;
      if (wallDur > 0 && wallElapsed >= wallDur - 1000 && !endedSentRef.current && !youtubeErrorRef.current) {
        endedSentRef.current = true;
        configRef.current.onTrackEnd();
        return;
      }

      if (lastModeRef.current === "youtube") {
        // Re-create iframe if it was destroyed in background
        if (!playerRef.current) {
          const track = configRef.current.nowPlaying;
          if (track?.videoId) {
            startYT(track.videoId, currentTimeRef.current);
          }
          return;
        }
        const cur = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? 0;
        setCurrentTime(cur);
        currentTimeRef.current = cur;
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
        try {
          const state = playerRef.current.getPlayerState?.();
          if (state === window.YT.PlayerState.ENDED || (dur > 0 && cur >= dur - 1)) {
            if (!endedSentRef.current && !youtubeErrorRef.current) {
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
        const a = getActiveAudio();
        if (a) {
          const cur = a.currentTime;
          const dur = a.duration || 0;
          setCurrentTime(cur);
          setDuration(dur);
          setProgress(dur > 0 ? (cur / dur) * 100 : 0);
          if (a.ended || (dur > 0 && cur >= dur - 1)) {
            if (!endedSentRef.current && !youtubeErrorRef.current) {
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
  }, [safePlay, startYT]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => { stopBothRef.current(); };
  }, []);

  // ── Seek ──
  const seekTo = useCallback((time: number) => {
    if (mode === "audio") {
      const audio = getActiveAudio();
      if (audio) audio.currentTime = time;
    } else if (mode === "youtube") {
      if (playerRef.current) playerRef.current.seekTo?.(time, true);
    }
    setCurrentTime(time);
    currentTimeRef.current = time;
  }, [mode]);

  const cacheResolvedUrl = useCallback((videoId: string, url: string) => {
    resolvedUrlsRef.current.set(videoId, url);
    resolvedTimestampsRef.current.set(videoId, Date.now());
  }, []);

  // ── Preload audio into inactive element (Layer 2: look-ahead) ──
  const preloadAudioData = useCallback((url: string) => {
    const inactive = getInactiveAudio();
    if (!inactive) return;
    if (inactive.src === url) return;
    inactive.preload = "auto";
    inactive.src = url;
    inactive.load();
    inactive.volume = 0;
  }, []);

  // ── Prefetch next track (resolve + preload into inactive element) ──
  const prefetchNextTrack = useCallback((track: Track) => {
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = new AbortController();
    const signal = prefetchAbortRef.current.signal;

    const cachedUrl = resolvedUrlsRef.current.get(track.videoId);
    const cachedTs = resolvedTimestampsRef.current.get(track.videoId);
    if (cachedUrl && cachedTs && Date.now() - cachedTs < STALE_THRESHOLD_MS) {
      preloadAudioData(cachedUrl);
      return;
    }

    resolveTrackSource(
      track.videoId,
      track.name ?? "",
      track.artists?.[0]?.name,
      configRef.current.token,
      track.duration_ms,
      track.source,
      signal,
    ).then((result) => {
      if (signal.aborted) return;
      if (result.audioUrl) {
        resolvedUrlsRef.current.set(track.videoId, result.audioUrl);
        resolvedTimestampsRef.current.set(track.videoId, Date.now());
        preloadAudioData(result.audioUrl);
      }
    }).catch(() => {});
  }, [preloadAudioData]);

  return { mode, currentTime, duration, progress, audioRef, seekTo, cacheResolvedUrl, preloadAudioData, prefetchNextTrack };
}
