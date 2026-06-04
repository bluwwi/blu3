"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, login } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && user) {
  //     router.replace("/browse");
  //   }
  // }, [user, router]);

  return <div className="w-full h-full bg-black p-10 min-h-screen">hello</div>;
}
