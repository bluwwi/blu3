"use client";
import { useEffect, useRef, useState } from "react";

interface RoomBackgroundProps {
  isPlaying: boolean;
  trackImage?: string;
}

export function RoomBackground({
  isPlaying,
  trackImage,
}: RoomBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const morphTRef = useRef(1);
  const lastTsRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const currentImgRef = useRef(trackImage || "/queue/sunflower.jpg");
  const [crossfadePrev, setCrossfadePrev] = useState<string | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

    if (playing)
      morphTRef.current = Math.min(morphTRef.current + dt * 0.45 * 0.9, 1);
    else morphTRef.current = Math.max(morphTRef.current - dt * 0.45 * 1.4, 0);

    ctx.clearRect(0, 0, W, H);
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
