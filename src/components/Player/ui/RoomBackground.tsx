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

interface Bubble {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  wobble: number;
  wobbleSpeed: number;
}

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
  const bubblesRef = useRef<Bubble[]>([]);
  const bubbleTimer = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const trackIdRef = useRef(trackId);
  const isLiveAudioRef = useRef(isLiveAudio);
  const totalEnergyRef = useRef(0.3);

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

  const spawnBubble = (speedFactor: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas || bubblesRef.current.length >= 35) return;
    const W = canvas.width,
      H = canvas.height;
    const r = 3 + Math.random() * 11;
    bubblesRef.current.push({
      x: Math.random() * W,
      y: H + r,
      r,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(0.4 + Math.random() * 0.65) * speedFactor,
      alpha: 0.15 + Math.random() * 0.25,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.014,
    });
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

    // ── Track speed (fixed per track, never oscillates) ──────────────
    let trackSpeed = 1;
    if (playing) {
      const seed = trackIdRef.current ? hashStr(trackIdRef.current) : 0;
      trackSpeed = getPersonality(seed).tempoFactor;
    }

    // ── WAVES ─────────────────────────────────────────────────────────────────
    const midY = H * (window.innerWidth < 768 ? 0.25 : 0.5);
    const baseYs = Array.from(
      { length: NUM_LINES },
      (_, i) => midY - ((NUM_LINES - 1) * GAP) / 2 + i * GAP,
    );

    WAVE_LINES.forEach((cfg) => {
      const baseY = baseYs[WAVE_LINES.indexOf(cfg)];
      const scroll = tRef.current * cfg.scrollSpeed * trackSpeed + cfg.scrollPhase;
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

    // ── BUBBLES ───────────────────────────────────────────────────────────────
    if (playing && morphTRef.current > 0.25) {
      bubbleTimer.current += dt;
      const interval = Math.max(
        0.05,
        0.16 - morphTRef.current * 0.07 - 0.04 * bands[0] - 0.02 * energy,
      );
      if (bubbleTimer.current > interval) {
        spawnBubble(0.5 + 0.5 * bands[0]);
        bubbleTimer.current = 0;
      }
    }

    bubblesRef.current = bubblesRef.current.filter(
      (b) => b.alpha > 0.004 && b.y + b.r > -40,
    );

    bubblesRef.current.forEach((b) => {
      b.wobble += b.wobbleSpeed;
      b.x += b.vx + Math.sin(b.wobble) * 0.35;
      b.y += b.vy;
      b.alpha -= 0.0006 + (1 - morphTRef.current) * 0.003;

      ctx.save();
      // inner shimmer
      const g = ctx.createRadialGradient(
        b.x - b.r * 0.3,
        b.y - b.r * 0.35,
        b.r * 0.05,
        b.x,
        b.y,
        b.r,
      );
      g.addColorStop(0, `rgba(255,255,255,${b.alpha * 0.55})`);
      g.addColorStop(0.45, `rgba(255,255,255,${b.alpha * 0.1})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      // rim
      ctx.strokeStyle = `rgba(255,255,255,${b.alpha * 0.6})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    });

    const needsLoop =
      playing || morphTRef.current > 0 || bubblesRef.current.length > 0;

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
    if (!isPlaying) bubblesRef.current = [];
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
            transform: "scale(1.5)",
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
