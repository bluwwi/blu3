"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileProps {
  size?: "sm" | "md";
}

export function Profile({ size = "sm" }: ProfileProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const avatarSize = size === "md" ? "w-9 h-9" : "w-7 h-7";

  return (
    <div className="flex">
      <button
        onClick={() => setOpen(!open)}
        className={`${avatarSize}`}
        aria-label="Open profile menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className={`${avatarSize} rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer`}
          />
        ) : (
          <div
            className={`${avatarSize} rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-white uppercase`}
          >
            {user.name?.[0] || "U"}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50">
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/10">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full border border-zinc-600 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name?.[0] || "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-white truncate">
                  {user.name}
                </p>
                <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
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
  );
}
