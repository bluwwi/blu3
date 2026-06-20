"use client";
import { useEffect, useRef } from "react";

const NUM_LINES = 5;
const GAP = 38;
const SPEED = 0.45;

const WAVE_LINES = [
  { amp: 0.025, wlSpeed: 0.04, wlPhase: 0.0, scrollSpeed: 0.3, scrollPhase: 0.0 },
  { amp: 0.06, wlSpeed: 0.10, wlPhase: 1.3, scrollSpeed: 0.8, scrollPhase: 0.8 },
  { amp: 0.08, wlSpeed: 0.18, wlPhase: 2.6, scrollSpeed: 0.5, scrollPhase: 1.6 },
  { amp: 0.045, wlSpeed: 0.06, wlPhase: 3.9, scrollSpeed: 1.0, scrollPhase: 2.4 },
  { amp: 0.035, wlSpeed: 0.15, wlPhase: 5.2, scrollSpeed: 0.4, scrollPhase: 3.2 },
];

interface WaveBackgroundProps {
  overlay?: boolean;
}

export function WaveBackground({ overlay = true }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncSize = () => {
      const w = Math.floor(window.innerWidth);
      const h = Math.floor(window.innerHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w || 1;
        canvas.height = h || 1;
      }
    };

    const loop = (ts: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % 2 !== 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      syncSize();
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const W = canvas.width;
      const H = canvas.height;

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;

      tRef.current += dt * SPEED;
      scrollOffsetRef.current += dt * 0.8;

      ctx.clearRect(0, 0, W, H);

      const midY = H / 2;
      const baseYs = Array.from(
        { length: NUM_LINES },
        (_, i) => midY - ((NUM_LINES - 1) * GAP) / 2 + i * GAP,
      );

      WAVE_LINES.forEach((cfg) => {
        const idx = WAVE_LINES.indexOf(cfg);
        const baseY = baseYs[idx];
        const scroll = scrollOffsetRef.current * cfg.scrollSpeed + cfg.scrollPhase;
        const freq = ((2 * Math.PI) / W) * 1.5;
        const breath =
          1 + 0.3 * Math.sin(tRef.current * cfg.wlSpeed * 1.7 + cfg.wlPhase + 1.2);
        const amp = H * cfg.amp * breath;

        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = baseY + Math.sin(freq * x - scroll) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    syncSize();
    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("resize", syncSize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", syncSize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {overlay && <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/15 to-black/5 z-[2]" />}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[3] block"
        style={{ transform: "translateZ(0)" }}
      />
    </div>
  );
}
