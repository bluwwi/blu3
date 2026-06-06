"use client";

import { T } from "@/utils/roomHelpers";
import Image from "next/image";
import { Icon } from "@/hooks/useIcon";

import Lottie from "lottie-react";
import cow from "@/assets/lolite/carrot.json";
import { Heart } from "lucide-react";
import { HeartIcon } from "@phosphor-icons/react";

const COLORS = [
  "#fff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#fb923c",
  "#facc15",
  "#a3e635",
  "#34d399",
  "#2dd4bf",
  "#60a5fa",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#fff",
];

const STEP = 100 / COLORS.length;
const KEYFRAMES = COLORS.map(
  (c, i) =>
    `${(i * STEP).toFixed(1)}%,${((i + 1) * STEP).toFixed(1)}%{color:${c}}`,
).join("");

export function RoomLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="flex flex-col items-end">
        {/*<div className="flex flex-col items-center -mb-5">
          <div className="text-white py-5   rotate-25 animate-colorWave">
            <Icon name="favorite" size={50} className="" />
          </div>
        </div>*/}
        <Image
          width={400}
          height={400}
          src={"/logo/blu3.svg"}
          alt={"blu3"}
          priority
          className={"w-24"}
        />

        {/*<Lottie
        animationData={cow}
        loop
        autoplay
        style={{ width: "clamp(30rem,30vw,199rem)", height: 500 }}
      />*/}
      </div>

      <style>{`
@keyframes colorWave{${KEYFRAMES}}
.animate-colorWave{animation:colorWave 2s linear infinite}
`}</style>
    </div>
  );
}
