"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/logo/blu3.svg";

    logo.onload = () => {
      QRCodeLib.toCanvas(
        canvas,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#000000",
          },
        },
        () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const logoSize = size * 0.24;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          ctx.beginPath();
          ctx.arc(
            x + logoSize / 2,
            y + logoSize / 2,
            logoSize / 2 + 4,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = "#000000";
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(
            x + logoSize / 2,
            y + logoSize / 2,
            logoSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.clip();
          ctx.drawImage(logo, x, y, logoSize, logoSize);
          ctx.restore();
        },
      );
    };
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl border border-white/20"
    />
  );
}
