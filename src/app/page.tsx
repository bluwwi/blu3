"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/browse");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

      {/* Ambient gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-8 w-full max-w-sm rounded-[32px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl px-8 py-12 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[32px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span
                className="text-5xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                blu3
              </span>
              <span className="text-[10px] text-zinc-600 tracking-[0.25em] uppercase font-medium">
                listen together
              </span>
            </div>

            <div className="w-10 h-[1px] bg-white/10 relative z-10" />

            <p className="text-[12px] text-zinc-500 text-center leading-relaxed relative z-10">
              Create rooms, share music,
              <br />and vibe with friends in real time.
            </p>

            <button
              onClick={login}
              className="relative z-10 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-zinc-200 w-full justify-center shadow-[0_4px_16px_-4px_rgba(255,255,255,0.15)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              sign in with google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
