"use client";

import { useCallback, useEffect, useMemo } from "react";
import { authClient } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  avatar?: string | null;
  role?: string;
}

export function useAuth() {
  const { data: session, isPending } = authClient.useSession({
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    if (session?.session?.token) {
      localStorage.setItem("blu3_token", session.session.token);
    } else if (!isPending) {
      localStorage.removeItem("blu3_token");
    }
  }, [session, isPending]);

  const sessionUser = session?.user ?? null;
  const user = useMemo(() => {
    return sessionUser
      ? { ...sessionUser, avatar: sessionUser.image }
      : null;
  }, [sessionUser]);
  const loading = isPending;

  const login = useCallback((provider: "google" | "discord" = "google") => {
    sessionStorage.setItem("returnUrl", window.location.pathname);
    authClient.signIn.social({ provider, callbackURL: window.location.origin });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    localStorage.removeItem("blu3_token");
  }, []);

  return { user, loading, login, logout };
}
