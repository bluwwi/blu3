"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    console.log("CALLBACK TOKEN:", token?.slice(0, 20));

    if (token) {
      localStorage.setItem("blu3_token", token);
      console.log(
        "SAVED. NOW IN STORAGE:",
        localStorage.getItem("blu3_token")?.slice(0, 20),
      );
    }

    // ← delay redirect so localStorage write completes first
    setTimeout(() => router.replace("/browse"), 100);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-zinc-500 text-sm  tracking-widest animate-pulse">
        signing in...
      </p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <p className="text-zinc-500 text-sm tracking-widest animate-pulse">
            loading...
          </p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
