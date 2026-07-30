"use client";

import Lottie from "lottie-react";
import Image from "next/image";
import Link from "next/link";
import { VideoBackground } from "@/components/VideoBackground";
import penguin404 from "@/assets/lolite/Penguin-404.json";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-black to-blue-950 flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/*<VideoBackground url={"/music.mp4"} />*/}
      </div>

      <div className="absolute top-0 left-0 p-5 z-10">
        <Image
          width={400}
          height={400}
          src={"/logo/tvlogo.svg"}
          alt={"logo"}
          className="w-16"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <div className="w-60 h-40 lg:w-100 lg:h-70 mb-3 flex items-center justify-center">
          <Lottie
            animationData={penguin404}
            loop
            autoplay
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <Link
          href="/browse"
          className="flex items-center z-10 justify-center gap-2 px-6 py-2 rounded-lg bg-white text-black text-sm font-semibold transition-all duration-300 cursor-pointer  hover:bg-white/85"
        >
          Back to Browse
        </Link>
      </div>
    </div>
  );
}
