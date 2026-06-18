"use client";
import { useMemo } from "react";

export function RoomStars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 500 }, () => ({
        size: Math.random() * 2.5 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.6 + 0.2,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 4,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[5]">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${s.size}px`,
            height: `${s.size}px`,
            left: `${s.left}%`,
            top: `${s.top}%`,
            opacity: s.opacity,
            animation: `starTwinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
