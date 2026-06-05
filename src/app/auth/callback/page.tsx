"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const returnUrl = sessionStorage.getItem("returnUrl");
    sessionStorage.removeItem("returnUrl");
    router.replace(returnUrl || "/browse");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-zinc-500 text-sm tracking-widest animate-pulse">
        signing in...
      </p>
    </div>
  );
}