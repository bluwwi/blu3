"use client";

import { T } from "@/utils/roomHelpers";
import Image from "next/image";

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
        <Image
          width={400}
          height={400}
          src={"/logo/blu3.svg"}
          alt={"blu3"}
          priority
          className={"w-24"}
        />
      </div>

    </div>
  );
}
