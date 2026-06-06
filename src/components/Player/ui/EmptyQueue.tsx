"use client";
import Lottie from "lottie-react";
import pandaBamboo from "@/assets/lolite/pandabamboo.json";

interface Props {
  userName?: string;
  onSearchClick?: () => void;
}

export function EmptyQueue({ userName, onSearchClick }: Props) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden max-md:rounded-none md:rounded-[20px] max-md:border-0 md:border md:border-white/6 max-md:bg-transparent md:bg-white/3 max-md:backdrop-blur-none md:backdrop-blur-sm px-3 py-8 text-center text-white/55">
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="">
          <p className="text-blue-200 text-2xl md:text-4xl font-bold">
            {userName?.split(" ")[0]}
            {","}
          </p>
          <p className="text-white/90 text-xl md:text-3xl font-bold">
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
        <div className="w-50 h-25 lg:w-60 lg:h-30 -z-10 flex items-center justify-center overflow-hidden">
          <Lottie
            animationData={pandaBamboo}
            loop
            autoplay
            style={{ width: "clamp(30rem,30vw,199rem)", height: 500 }}
          />
        </div>
      </div>
    </div>
  );
}
