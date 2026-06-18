"use client";

import Image from "next/image";
import Link from "next/link";

export function RoomFooter() {
  return (
    <div className="h-full hidden sm:flex justify-between items-center px-4 sm:h-[9%] border border-white/10 w-full sm:w-full sm:w-[90%] lg:w-[75%] xl:w-[60%] 2xl:w-[60%] rounded-xl py-2 bg-white/10">
      <Image
        alt="logo"
        src={"/logo/quote.svg"}
        width={300}
        height={400}
        className="h-full w-fit"
      />

      <div className="h-full flex font-bold items-center gap-2">
        <div className="text-lg font-bold">Built by</div>
        <Link
          href={"https://www.instagram.com/realblue07/?"}
          className="h-full items-center flex"
          target="_blank"
        >
          <Image
            alt="logo"
            src={"/me.jpg"}
            width={300}
            height={400}
            className="h-[75%] border-2 cursor-pointer border-white w-fit rounded-full"
          />
        </Link>
      </div>
    </div>
  );
}
