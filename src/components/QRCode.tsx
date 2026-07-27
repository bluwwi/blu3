"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCodeLib.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#000000",
        },
      },
    );
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
