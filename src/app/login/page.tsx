"use client";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const handleLogin = (provider: "google" | "discord") => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("returnUrl");
    if (returnUrl) {
      sessionStorage.setItem("returnUrl", returnUrl);
    }
    authClient.signIn.social({ provider, callbackURL: window.location.origin });
  };

  return (
    <div className="h-screen w-full bg-[#080808] flex items-center justify-center">
      <div
        className="w-[340px] p-8 text-center rounded-3xl border border-white/8 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent"
      >
        <p className="text-white text-xl font-semibold leading-snug mb-1 relative z-10">
          blu3
        </p>
        <p className="text-zinc-500 text-[11px] tracking-widest mb-8 relative z-10">
          listen together
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
