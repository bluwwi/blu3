"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const { user, login } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && user) {
  //     router.replace("/browse");
  //   }
  // }, [user, router]);

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-center items-center ">
      {/* 1. Background Image */}
      <img
        src="/queue/sunflower.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      <div
        className="absolute -z-10 w-full inset-0 max-w-full h-full p-8 flex flex-col justify-between items-center gap-6
                      bg-black backdrop-blur-md border border-white/30 shadow-2xl"
      />
      <div className="w-full h-full flex items-center flex-col pt-30">
        <div className="text-center w-[90%]">
          <h1 className="text-9xl font-bold text-white drop-shadow-md">blu3</h1>
          <img
            src="/hero.png"
            alt="Background"
            className="w-full h-full rounded-2xl object-cover -z-10"
          />
        </div>

        {/* Bottom Content / Button */}
        <div className="w-full">
          <button className="w-full py-3 px-6 bg-white/30 hover:bg-white/40 text-white font-semibold rounded-xl border border-white/40 transition-all duration-300 backdrop-blur-sm">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
