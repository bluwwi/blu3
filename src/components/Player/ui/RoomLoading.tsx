"use client";

import { T } from "@/utils/roomHelpers";
import Image from "next/image";

export function RoomLoading() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: T.bg }}
    >
      <div className="flex flex-col items-end">
        <Image
          width={400}
          height={400}
          src={"/logo/tvlogo.svg"}
          alt={"blu3"}
          priority
          className={"w-24"}
        />
      </div>
    </div>
  );
}
