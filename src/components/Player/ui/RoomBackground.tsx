"use client";
import { useEffect, useRef, useState } from "react";

interface RoomBackgroundProps {
  isPlaying: boolean;
  trackImage?: string;
}

export function RoomBackground({
  trackImage,
}: RoomBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
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

    const loop = (ts: number) => {
      if (!canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      syncSize();
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(loop);
    };

    cancelAnimationFrame(rafRef.current);
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
          onError={(e) => { e.currentTarget.style.display = "none"; }}
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
