"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";

function LoginPopup() {
  const handleLogin = (provider: "google" | "discord") => {
    sessionStorage.setItem("returnUrl", window.location.pathname);
    authClient.signIn.social({ provider, callbackURL: window.location.origin });
  };

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
          onClick={() => handleLogin("google")}
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

        <button
          onClick={() => handleLogin("discord")}
          className="block w-full py-3.5 text-white text-[15px] font-semibold transition-all duration-500 relative z-10"
          style={{ background: "#5865F2", borderRadius: "12px" }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "#4752C4")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "#5865F2")
          }
        >
          sign in with discord
        </button>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowPopup(!user);
    }
  }, [user, loading]);

  useEffect(() => {
    const onError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "SCRIPT" &&
        (target.getAttribute("src")?.includes("/_next/static/chunks/") ||
          e instanceof ErrorEvent ||
          (e as any)?.message?.includes("chunk"))
      ) {
        localStorage.setItem("blu3_reload", "1");
        window.location.reload();
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (
        e.reason?.message?.includes("chunk") ||
        e.reason?.message?.includes("Loading") ||
        e.reason?.message?.includes("import()")
      ) {
        localStorage.setItem("blu3_reload", "1");
        window.location.reload();
      }
    };
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (pathname === "/home" || pathname === "/auth/callback" || pathname === "/login") return <>{children}</>;

  return (
    <>
      {children}
      {showPopup && <LoginPopup />}
    </>
  );
}
