"use client";

import { useCallback, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.session?.token) {
      localStorage.setItem("blu3_token", session.session.token);
    } else if (!isPending) {
      localStorage.removeItem("blu3_token");
    }
  }, [session, isPending]);

  const user: AuthUser | null = session?.user ?? null;
  const loading = isPending;

  const login = useCallback((provider: "google" | "discord" = "google") => {
    sessionStorage.setItem("returnUrl", window.location.pathname);
    authClient.signIn.social({ provider });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    localStorage.removeItem("blu3_token");
  }, []);

  return { user, loading, login, logout };
}
