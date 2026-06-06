"use client";

import { authClient } from "@/lib/auth-client";

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function DiscordLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="#000000">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.75 68.75 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
    </svg>
  );
}

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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div
        className="w-80 p-5 text-center"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        <div className="flex flex-col mb-16 gap-1">
          <p className="text-white text-3xl text-left leading-snug">
            Login Or SignUp
          </p>
          <p className="text-white/60 text-xl text-left leading-snug">
            Let's get to know <br /> each other.
          </p>
        </div>

        <button
          onClick={() => onLogin("google")}
          className="flex items-center justify-center gap-2 w-full rounded-lg py-1.5 mb-3 text-black text-sm font-semibold transition-all duration-500 cursor-pointer"
          style={{ background: "#ffffff" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#e8e8e8")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <GoogleLogo />
          continue with Google
        </button>

        <button
          onClick={() => onLogin("discord")}
          className="flex items-center justify-center gap-2 w-full rounded-lg py-1.5 text-black text-sm font-semibold transition-all duration-500 cursor-pointer"
          style={{ background: "#ffffff" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#e8e8e8")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <DiscordLogo />
          continue with Discord
        </button>
      </div>
    </div>
  );
}
