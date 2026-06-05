"use client";
import { useState } from "react";
import { Track } from "@/utils/types";
import { RoomTheme } from "@/utils/roomHelpers";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  roomName: string;
  roomCode: string;
  isHost: boolean;
  connected: boolean;
  track: Track | null;
  roomTheme: RoomTheme;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onCopyInvite: () => void;
  onLeave: () => void;
  onSearchClick: () => void;
}

export function RoomTopBar({
  roomCode,
  connected,
  onLeave,
  onSearchClick,
}: Props) {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      <div className="flex items-center border border-white/[0.08] mt-2 rounded-2xl justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 bg-white/[0.05] backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
        {/* Logo */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <img
            src="/logo/logow.svg"
            alt="Company Logo"
            width={50}
            height={50}
            className="object-contain"
          />
        </div>

        {/* Search bar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          className="flex-1 max-w-md flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.1] px-3 sm:px-5 py-2 sm:py-2.5 transition-all text-left min-w-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/60 flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-[13px] text-white/60 truncate">
            <span className="hidden sm:inline">
              What do you want to play next?
            </span>
            <span className="sm:hidden">Search next...</span>
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/[0.06] text-[10px] text-white/30">
            <kbd className="text-white/40">⌘</kbd>
            <kbd>K</kbd>
          </span>
        </button>

        {/* Right side */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowLeavePopup(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.12] hover:text-white transition-all"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-violet-400"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {roomCode}
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="focus:outline-none"
                aria-label="Open profile menu"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-white/10 object-cover hover:border-white/30 transition-colors cursor-pointer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-700 border-2 border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name?.[0] || "U"}
                  </div>
                )}
              </button>
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50">
                    <div className="px-3 py-2.5 border-b border-white/10">
                      <p className="text-[12px] font-bold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase tracking-widest"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="text-[10px] border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-all tracking-widest uppercase font-semibold"
            >
              sign in
            </button>
          )}
        </div>
      </div>

      {showLeavePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowLeavePopup(false)}
        >
          <div
            className="w-[340px] p-8 text-center"
            style={{ background: "#1a1a1a", borderRadius: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-xl font-semibold leading-snug mb-7">
              Are you sure you want to
              <br />
              leave this Room?
            </p>

            <button
              onClick={() => {
                setShowLeavePopup(false);
                onLeave();
              }}
              className="block w-full py-4 mb-2.5 text-white text-[15px] font-semibold transition-colors"
              style={{ background: "#c0392b", borderRadius: "12px" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#a93226")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#c0392b")}
            >
              Yes, leave room
            </button>

            <button
              onClick={() => setShowLeavePopup(false)}
              className="block w-full py-4 text-[#1a1a1a] text-[15px] font-medium transition-colors"
              style={{ background: "#ffffff", borderRadius: "12px" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#e8e8e8")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
