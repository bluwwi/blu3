"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginPopup() {
  const { login } = useAuth();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="w-[340px] p-8 text-center rounded-3xl border border-white/8 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent"
      >
        <p className="text-white text-xl font-semibold leading-snug mb-8 relative z-10">
          sign in to continue
        </p>

        <button
          onClick={login}
          className="block w-full py-3.5 mb-2.5 text-[#1a1a1a] text-[15px] font-semibold transition-all duration-500 relative z-10"
          style={{ background: "#ffffff", borderRadius: "12px" }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "#e8e8e8")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "#ffffff")
          }
        >
          sign in with google
        </button>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("blu3_token");
    setShowPopup(!token);
  }, []);

  if (pathname === "/home") return <>{children}</>;

  return (
    <>
      {children}
      {showPopup && <LoginPopup />}
    </>
  );
}
