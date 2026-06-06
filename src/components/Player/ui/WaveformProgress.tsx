"use client";
import { useEffect, useRef } from "react";

interface Props {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export function WaveformProgress({
  isPlaying,
  currentTime,
  duration,
  onSeek,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const timeRef = useRef(currentTime);
  const durRef = useRef(duration);
  timeRef.current = currentTime;
  durRef.current = duration;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = devicePixelRatio;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let playing = isPlaying;

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const p = durRef.current > 0 ? timeRef.current / durRef.current : 0;
      const fillWidth = w * p;

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.roundRect(0, h / 2 - 1.5, w, 3, 99);
      ctx.fill();

      if (playing && fillWidth > 1) {
        const grad = ctx.createLinearGradient(0, 0, fillWidth, 0);
        grad.addColorStop(0, "rgba(255,255,255,0.35)");
        grad.addColorStop(0.6, "rgba(255,255,255,0.75)");
        grad.addColorStop(1, "rgba(255,255,255,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, fillWidth, h);
        ctx.clip();
        ctx.beginPath();
        for (let x = 0; x <= fillWidth; x++) {
          const freq = (x / fillWidth) * Math.PI * 3;
          const amp = h * 0.38;
          const envelope = Math.sin((x / fillWidth) * Math.PI);
          const y = h / 2 + Math.sin(freq + offsetRef.current) * amp * envelope;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        offsetRef.current += 0.05;
      } else if (fillWidth > 0) {
        const grad = ctx.createLinearGradient(0, 0, fillWidth, 0);
        grad.addColorStop(0, "rgba(255,255,255,0.45)");
        grad.addColorStop(1, "rgba(255,255,255,1)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, h / 2 - 1.5, fillWidth, 3, 99);
        ctx.fill();
      }

      if (fillWidth > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(fillWidth, h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (playing) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    cancelAnimationFrame(rafRef.current!);
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current!);
      observer.disconnect();
    };
  }, [isPlaying]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek?.(ratio * durRef.current);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-5 cursor-pointer block"
    />
  );
}
