"use client";
import Lottie from "lottie-react";
import sleepingPenguin from "@/assets/lolite/sleeping-penguin.json";

interface Props {
  userName?: string;
  onSearchClick?: () => void;
}

export function EmptyQueue({ userName, onSearchClick }: Props) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden max-sm:rounded-none sm:rounded-[20px] max-sm:border-0 sm:border sm:border-white/6 max-sm:bg-transparent sm:bg-white/3 max-sm:backdrop-blur-none sm:backdrop-blur-sm px-3 py-8 text-center text-white/55">
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="">
          <p className="text-blue-200 text-2xl sm:text-3xl font-bold">
            {userName?.split(" ")[0]}
            {","}
          </p>
          <p className="text-white/90 text-lg sm:text-xl font-bold">
            looks like your <br /> queue is empty
          </p>
        </div>
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:bg-white/85 transition-all duration-300"
        >
          Add Songs
        </button>
        <div className="flex items-center -mb-5 gap-3">
          {[
            { delay: 0, offset: "-mt-2" },
            { delay: 0.4, offset: "mt-1" },
            { delay: 0.8, offset: "-mt-3" },
            { delay: 1.2, offset: "mt-2" },
          ].map((z) => (
            <span
              key={z.delay}
              className={`text-white text-3xl font-bold dot-glow ${z.offset}`}
              style={{ animationDelay: `${z.delay}s` }}
            >
              z
            </span>
          ))}
        </div>
        <div className="w-50 h-25 lg:w-60 lg:h-25 -z-10 flex items-center justify-center ">
          <Lottie
            animationData={sleepingPenguin}
            loop
            autoplay
            style={{ width: "clamp(30rem,30vw,199rem)", height: 200 }}
          />
        </div>
      </div>
    </div>
  );
}
