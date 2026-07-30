"use client";

import Image from "next/image";
import { Icon } from "@/hooks/useIcon";
import { Profile } from "@/components/Profile";

interface Props {
  onSearchClick: () => void;
}

export function RoomTopSection({ onSearchClick }: Props) {
  return (
    <div className="h-[10vh] gap-3 sm:border border-white/10 flex items-center justify-between sm:h-[12%] w-full sm:w-full sm:w-[90%] lg:w-[75%] xl:w-[60%] px-4 py-3 2xl:w-[60%] rounded-xl sm:bg-white/10">
      <Image
        alt="logo"
        src={"/logo/tvlogo.svg"}
        width={300}
        height={400}
        className="h-full w-fit"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSearchClick();
        }}
        className="flex-1 cursor-text max-w-lg flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-3 sm:px-5 py-2 sm:py-4 transition-all text-left min-w-0"
      >
        <Icon name="search" className="text-white/80" />
        <span className="flex-1 text-sm text-white/80 truncate">
          <span className="hidden sm:inline">
            What do you want to play next?
          </span>
          <span className="sm:hidden">Search next...</span>
        </span>
        <Icon name="heart" className="text-white/80" />
      </button>

      <Profile size="lg" />
    </div>
  );
}
