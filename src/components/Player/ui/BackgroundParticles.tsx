"use client";
import { useEffect, useRef } from "react";

interface Props {
  isPlaying: boolean;
  image?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  hue: number;
}

const PALETTE = [190, 270, 330, 210];
const PARTICLE_COUNT = 50;
const BASE_SPEED = 0.3;

export function BackgroundParticles({ isPlaying, image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!image) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => { imgRef.current = img; };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        life: 0,
        maxLife: 0,
        hue: 0,
      }));
    }

    const spawn = (p: Particle) => {
      p.x = Math.random() * w;
      p.y = h + 20;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.vy = 0;
      p.size = 2 + Math.random() * 4;
      p.alpha = 0.15 + Math.random() * 0.25;
      p.life = 0;
      p.maxLife = 300 + Math.random() * 400;
      p.hue = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    };

    particlesRef.current.forEach(spawn);

    const speed = BASE_SPEED * (isPlaying ? 1 : 0.3);
    const targetAlpha = isPlaying ? 1 : 0.3;

    const draw = () => {
      ctx!.clearRect(0, 0, w, h);

      particlesRef.current.forEach((p) => {
        p.life++;
        if (p.life > p.maxLife) {
          spawn(p);
        }

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 4, 1);
        const fadeOut = Math.max(1 - progress, 0);

        p.vy -= speed * 0.15;
        p.x += p.vx;
        p.y += p.vy;

        const alpha = p.alpha * fadeIn * fadeOut * targetAlpha;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 70%, 60%, ${alpha})`;
        ctx!.fill();

        if (p.size > 3) {
          ctx!.beginPath();
          ctx!.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${p.hue}, 80%, 80%, ${alpha * 0.4})`;
          ctx!.fill();
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
    />
  );
}
