"use client";
import { type RefObject } from "react";
import { Shuffle, Repeat } from "lucide-react";
import { Icon } from "@/hooks/useIcon";

interface Props {
  showMenu: boolean;
  shuffleEnabled: boolean;
  repeatMode: "off" | "all" | "one";
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onToggle: () => void;
  onClose: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

export function QueueMenu({
  showMenu,
  shuffleEnabled,
  repeatMode,
  onToggleShuffle,
  onCycleRepeat,
  onToggle,
  onClose,
  menuRef,
}: Props) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className={`flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-md transition-all cursor-pointer ${
          showMenu
            ? "bg-white/40 text-white"
            : "bg-white/30 text-white hover:bg-white/40"
        }`}
        title="More options"
      >
        <Icon name="menu" size={20} />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-52 origin-top-right scale-100 opacity-100 transition-all duration-200 rounded-2xl border overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] z-50 py-1.5"
          style={{
            background: "var(--room-surface, #0D0D14)",
            borderColor: "var(--room-border, rgba(255,255,255,0.08))",
          }}
        >
          <button
            onClick={() => {
              onToggleShuffle?.();
              onClose();
            }}
            disabled={!onToggleShuffle}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all disabled:opacity-30 ${
              shuffleEnabled
                ? "text-violet-300 bg-violet-500/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                shuffleEnabled
                  ? "bg-violet-500 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "border-white/30"
              }`}
            >
              <Shuffle
                size={12}
                className={
                  shuffleEnabled ? "text-white" : "text-white/50"
                }
              />
            </div>
            <span className="flex-1 text-left font-medium">Shuffle</span>
            {shuffleEnabled && (
              <span className="text-[10px] text-violet-400 font-semibold">
                ON
              </span>
            )}
          </button>

          <div
            className="h-px mx-3"
            style={{
              background: "var(--room-border, rgba(255,255,255,0.06))",
            }}
          />

          <button
            onClick={() => {
              onCycleRepeat?.();
              onClose();
            }}
            disabled={!onCycleRepeat}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all disabled:opacity-30 ${
              repeatMode !== "off"
                ? "text-violet-300 bg-violet-500/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 relative ${
                repeatMode !== "off"
                  ? "bg-violet-500 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "border-white/30"
              }`}
            >
              <Repeat
                size={12}
                className={
                  repeatMode !== "off" ? "text-white" : "text-white/50"
                }
              />
              {repeatMode === "one" && (
                <span className="absolute -top-1 -right-1 text-[7px] font-bold text-white">
                  1
                </span>
              )}
            </div>
            <span className="flex-1 text-left font-medium">Repeat</span>
            {repeatMode !== "off" && (
              <span className="text-[10px] text-violet-400 font-semibold">
                {repeatMode === "one" ? "1" : "ALL"}
              </span>
            )}
          </button>

          <div
            className="h-px mx-3"
            style={{
              background: "var(--room-border, rgba(255,255,255,0.06))",
            }}
          />
        </div>
      )}
    </div>
  );
}
