"use client";
import { useEffect, useRef, useState } from "react";

interface RoomBackgroundProps {
  isPlaying: boolean;
  trackImage?: string;
}

interface Dot {
  x: number;
  y: number;
  vx: number;
  size: number;
}

const DOT_COUNT = 25;
const DOT_SPEED = 20;

function initDot(w: number, h: number): Dot {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 4,
    size: 1 + Math.random() * 1.5,
  };
}

export function RoomBackground({
  trackImage,
}: RoomBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dotsRef = useRef<Dot[]>([]);
  const lastTsRef = useRef<number | null>(null);
  const currentImgRef = useRef(trackImage || "/queue/sunflower.jpg");
  const [crossfadePrev, setCrossfadePrev] = useState<string | null>(null);

  useEffect(() => {
    const next = trackImage || "/queue/sunflower.jpg";
    if (next !== currentImgRef.current) {
      setCrossfadePrev(currentImgRef.current);
      currentImgRef.current = next;
    }
  }, [trackImage]);

  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    if (crossfadePrev) {
      setFadeOut(false);
      const raf = requestAnimationFrame(() => setFadeOut(true));
      const timer = setTimeout(() => {
        setCrossfadePrev(null);
        setFadeOut(false);
      }, 500);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [crossfadePrev]);

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

  useEffect(() => {
    syncSize();
    const ro = new ResizeObserver(() => syncSize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    syncSize();
    const canvas = canvasRef.current;
    if (!canvas) return;

    dotsRef.current = [];
    lastTsRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const loop = (ts: number) => {
      if (!canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      syncSize();

      const ctx = canvas.getContext("2d")!;
      const W = canvas.width;
      const H = canvas.height;
      if (!W || !H) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;

      if (dotsRef.current.length === 0) {
        dotsRef.current = Array.from({ length: DOT_COUNT }, () => initDot(W, H));
      }

      ctx.clearRect(0, 0, W, H);

      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.y -= DOT_SPEED * dt;
        d.x += d.vx * dt;
        if (d.y < -4) {
          d.y = H + 4;
          d.x = Math.random() * W;
          d.vx = (Math.random() - 0.5) * 4;
        }
        if (d.x < -4) d.x = W + 4;
        if (d.x > W + 4) d.x = -4;
      }

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.moveTo(d.x, d.y);
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      }
      ctx.fill();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden z-0"
    >
      {crossfadePrev && (
        <img
          src={crossfadePrev}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{
            filter: "blur(50px) brightness(0.7) saturate(2.75)",
            transform: "scale(1.35)",
            transformOrigin: "center center",
            opacity: fadeOut ? 0 : 1,
          }}
        />
      )}

      <img
        src={trackImage ? trackImage : "/queue/sunflower.jpg"}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "blur(50px) brightness(0.7) saturate(2.75)",
          transform: "scale(1.35)",
          transformOrigin: "center center",
        }}
      />

      <div className="absolute inset-0 bg-linear-to-b from-black/35 via-black/90 to-black/35" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[3] block"
      />
    </div>
  );
}
