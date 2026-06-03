"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Player() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Added a micro-delay to prevent "Router action dispatched before initialization"
      // errors that can occur in Next.js 16 when redirecting immediately on mount
      const timer = setTimeout(() => {
        router.replace("/browse");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="">
        <div className="">
          <div className="">Friends Music & Fun Start Here.</div>
        </div>
      </div>
    </div>
  );
}
