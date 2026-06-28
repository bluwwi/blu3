"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface ProfileProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Profile({ size = "sm" }: ProfileProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!user) return null;

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 md:w-11 md:h-11 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-24 h-24 text-xl",
  };

  const containerClass = sizeClasses[size] || sizeClasses.sm;

  const close = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 200);
  };

  const handleLogout = () => {
    close();
    setTimeout(() => logout(), 200);
  };

  return (
    <div className="flex">
      <button
        onClick={() => setOpen(true)}
        className={`${containerClass} cursor-pointer`}
        aria-label="Open profile menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className={`${containerClass} rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors`}
          />
        ) : (
          <div
            className={`${containerClass} rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-white uppercase`}
          >
            {user.name?.[0] || "U"}
          </div>
        )}
      </button>

      {open &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/55 transition-opacity duration-200 ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={close}
          >
            <div
              className="w-80 p-4 text-center border border-white/30 bg-black/35 backdrop-blur-sm rounded-[24px]"
              onClick={(e) => e.stopPropagation()}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-40 h-40 rounded-full border-2 border-white/20 object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-700 border-2 border-white/20 flex items-center justify-center text-xl font-bold text-white uppercase mx-auto mb-3">
                  {user.name?.[0] || "U"}
                </div>
              )}

              <p className="text-white text-lg font-semibold leading-snug">
                {user.name}
              </p>
              <p className="text-white/60 text-sm mt-0.5 mb-6">{user.email}</p>

              <button
                onClick={handleLogout}
                className="block w-full rounded-lg py-1.5 mb-2 text-white text-[15px] font-semibold transition-all duration-500 cursor-pointer bg-[#c0392b] hover:bg-[#a93226]"
              >
                Log out
              </button>

              <button
                onClick={close}
                className="block w-full rounded-lg py-1.5 text-[#1a1a1a] text-[15px] font-medium transition-all duration-500 cursor-pointer bg-white hover:bg-[#e8e8e8]"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
