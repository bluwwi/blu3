"use client";
import { useEffect, useRef } from "react";

const NUM_LINES = 3;
const GAP = 28;
const SPEED = 0.4;

const WAVE_LINES = [
  { amp: 0.05, wlSpeed: 0.11, wlPhase: 0.0, scrollSpeed: 0.7, scrollPhase: 0.0 },
  { amp: 0.07, wlSpeed: 0.13, wlPhase: 2.6, scrollSpeed: 0.65, scrollPhase: 1.6 },
  { amp: 0.05, wlSpeed: 0.09, wlPhase: 3.9, scrollSpeed: 0.58, scrollPhase: 2.4 },
];

function ease(x: number) {
  return x < 0.5 ? 4 * x * x * x : (x - 1) * (2 * x - 2) * (2 * x - 2) + 1;
}

export function WaveformVisualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w || 1;
        canvas.height = h || 1;
      }
    };

    const loop = (ts: number) => {
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
      scrollOffsetRef.current += dt * 0.9;

      const mt = ease(1);

      ctx.clearRect(0, 0, W, H);

      const midY = H / 2;
      const baseYs = Array.from(
        { length: NUM_LINES },
        (_, i) => midY - ((NUM_LINES - 1) * GAP) / 2 + i * GAP,
      );

      WAVE_LINES.forEach((cfg, idx) => {
        const baseY = baseYs[idx];
        const scroll = scrollOffsetRef.current * cfg.scrollSpeed + cfg.scrollPhase;
        const freq = ((2 * Math.PI) / W) * 1.5;
        const breath = 1 + 0.3 * Math.sin(tRef.current * cfg.wlSpeed * 1.7 + cfg.wlPhase + 1.2);
        const amp = H * cfg.amp * mt * breath;

        ctx.strokeStyle = "rgba(106,90,205,0.12)";
        ctx.lineWidth = 11;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const y = baseY + Math.sin(freq * x - scroll) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(199,187,255,0.5)";
        ctx.lineWidth = 2.5;
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

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`w-full h-full relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
