"use client";

import { T } from "@/utils/roomHelpers";
import Image from "next/image";

export function RoomLoading() {
  return (
    <div
      className="min-h-dvh max-h-dvh h-[100vh] bg-black w-full fixed flex items-center justify-center"
      style={{ background: T.bg }}
    >
      <div className="flex flex-col w-full justify-center items-center">
        <Image
          width={400}
          height={400}
          src={"/logo/tvlogo.svg"}
          alt={"blu3"}
          priority
          className={"w-30"}
        />
      </div>
    </div>
  );
}
