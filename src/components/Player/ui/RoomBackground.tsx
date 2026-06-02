"use client";
import { useEffect, useRef } from "react";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

interface TrackPersonality {
  baseEnergy: number;
  tempoFactor: number;
  bassWeight: number;
  dynamicRange: number;
}

function getPersonality(seed: number): TrackPersonality {
  return {
    baseEnergy: 0.3 + (((seed >> 0) & 0xff) / 255) * 0.7,
    tempoFactor: 0.6 + (((seed >> 8) & 0xff) / 255) * 1.4,
    bassWeight: 0.2 + (((seed >> 16) & 0xff) / 255) * 0.8,
    dynamicRange: 0.2 + (((seed >> 24) & 0xff) / 255) * 0.8,
  };
}

const NUM_LINES = 5;
const GAP = 28;
const SPEED = 0.45;

const WAVE_LINES = [
  {
    amp: 0.038,
    wlSpeed: 0.11,
    wlPhase: 0.0,
    scrollSpeed: 0.7,
    scrollPhase: 0.0,
  },
  {
    amp: 0.055,
    wlSpeed: 0.08,
    wlPhase: 1.3,
    scrollSpeed: 0.55,
    scrollPhase: 0.8,
  },
  {
    amp: 0.07,
    wlSpeed: 0.13,
    wlPhase: 2.6,
    scrollSpeed: 0.65,
    scrollPhase: 1.6,
  },
  {
    amp: 0.055,
    wlSpeed: 0.09,
    wlPhase: 3.9,
    scrollSpeed: 0.58,
    scrollPhase: 2.4,
  },
  {
    amp: 0.038,
    wlSpeed: 0.12,
    wlPhase: 5.2,
    scrollSpeed: 0.72,
    scrollPhase: 3.2,
  },
];

function ease(x: number) {
  return x < 0.5 ? 4 * x * x * x : (x - 1) * (2 * x - 2) * (2 * x - 2) + 1;
}

interface RoomBackgroundProps {
  isPlaying: boolean;
  trackImage?: string;
  trackId?: string;
  liveBandsRef?: { readonly current: readonly number[] };
  isLiveAudio?: boolean;
}

export function RoomBackground({
  isPlaying,
  trackImage,
  trackId,
  liveBandsRef,
  isLiveAudio,
}: RoomBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const morphTRef = useRef(1);
  const lastTsRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const trackIdRef = useRef(trackId);
  const isLiveAudioRef = useRef(isLiveAudio);
  const totalEnergyRef = useRef(0.3);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

  useEffect(() => {
    isLiveAudioRef.current = isLiveAudio;
  }, [isLiveAudio]);

  const syncSize = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const { width, height } = wrap.getBoundingClientRect();
    if (
      canvas.width !== Math.floor(width) ||
      canvas.height !== Math.floor(height)
    ) {
      canvas.width = Math.floor(width) || window.innerWidth;
      canvas.height = Math.floor(height) || window.innerHeight;
    }
  };

  const loop = (ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    syncSize();

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    if (!W || !H) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const playing = isPlayingRef.current;

    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
    lastTsRef.current = ts;

    // morph in when playing, out when stopped
    if (playing)
      morphTRef.current = Math.min(morphTRef.current + dt * SPEED * 0.9, 1);
    else morphTRef.current = Math.max(morphTRef.current - dt * SPEED * 1.4, 0);

    if (playing || morphTRef.current > 0) tRef.current += dt * SPEED;

    const mt = ease(morphTRef.current);
    ctx.clearRect(0, 0, W, H);

    // ── Audio-reactive bands ────────────────────────────────────────
    const live = isLiveAudioRef.current && liveBandsRef?.current;
    const react: [number, number, number, number, number] = [
      0.5, 0.5, 0.5, 0.5, 0.5,
    ];
    let reactAvg = 0.3;
    if (playing) {
      if (live) {
        for (let i = 0; i < 5; i++) {
          react[i] =
            0.15 + 0.85 * Math.max(0, Math.min(1, liveBandsRef.current[i]));
        }
        reactAvg = (react[0] + react[1] + react[2] + react[3] + react[4]) / 5;
      } else {
        const seed = trackIdRef.current ? hashStr(trackIdRef.current) : 0;
        const p = getPersonality(seed);
        const es = 0.35 * p.tempoFactor;
        const raw =
          p.baseEnergy *
          (0.4 +
            0.3 * Math.sin(tRef.current * es + seed * 0.03) +
            0.2 * Math.sin(tRef.current * es * 1.5 + seed * 0.05 + 1.3) +
            0.1 * Math.sin(tRef.current * es * 2.5 + seed * 0.07 + 2.7));
        for (let i = 0; i < 5; i++) {
          const weight = i < 2 ? p.bassWeight : 1 - p.bassWeight * 0.4;
          const f1 = (2.2 + i * 1.4) * p.tempoFactor;
          const f2 = (5.3 + i * 2.7) * p.tempoFactor;
          const f3 = (11.7 + i * 4.1) * p.tempoFactor;
          const combined =
            Math.sin(tRef.current * f1 + seed * 0.11 + i * 0.9) * 0.5 +
            Math.sin(tRef.current * f2 + seed * 0.07 + i * 1.7) * 0.3 +
            Math.sin(tRef.current * f3 + seed * 0.05) * 0.15 * 0.4 +
            Math.sin(tRef.current * 19.3 + seed * (0.03 + i * 0.01)) * 0.06;
          react[i] = (0.2 + 0.8 * (0.5 + 0.5 * combined)) * weight;
        }
        reactAvg = raw;
      }
    }

    // ── Wave scroll speed from audio (additive, never reverses) ─────
    if (playing) {
      const speedFactor = live
        ? 0.3 + 1.7 * reactAvg
        : getPersonality(trackIdRef.current ? hashStr(trackIdRef.current) : 0)
            .tempoFactor;
      scrollOffsetRef.current += dt * speedFactor;
    }

    // ── WAVES ─────────────────────────────────────────────────────────────────
    const midY = H * (window.innerWidth < 768 ? 0.25 : 0.5);
    const baseYs = Array.from(
      { length: NUM_LINES },
      (_, i) => midY - ((NUM_LINES - 1) * GAP) / 2 + i * GAP,
    );

    WAVE_LINES.forEach((cfg) => {
      const baseY = baseYs[WAVE_LINES.indexOf(cfg)];
      const scroll =
        scrollOffsetRef.current * cfg.scrollSpeed + cfg.scrollPhase;
      const freq = ((2 * Math.PI) / W) * 1.5;
      const breath =
        1 +
        0.3 * Math.sin(tRef.current * cfg.wlSpeed * 1.7 + cfg.wlPhase + 1.2);
      const amp = H * cfg.amp * mt * breath;

      // fat glow
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 11;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y = baseY + Math.sin(freq * x - scroll) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // crisp line
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = baseY + Math.sin(freq * x - scroll) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // ── BUBBLES (removed) ────────────────────────────────────────────────────
    const needsLoop = playing || morphTRef.current > 0;

    rafRef.current = needsLoop ? requestAnimationFrame(loop) : 0;
  };

  const startLoop = () => {
    cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    syncSize();

    const ro = new ResizeObserver(() => {
      syncSize();
      const canvas = canvasRef.current;
      if (canvas && !rafRef.current) {
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    syncSize();
    startLoop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {trackImage && (
        <img
          src={trackImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(50px) brightness(0.8) saturate(1.6)",
            transform: "scale(1.35)",
            transformOrigin: "center center",
          }}
        />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/35 via-black/90 to-black/35" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3, display: "block" }}
      />
    </div>
  );
}
