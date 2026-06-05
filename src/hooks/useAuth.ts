"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.session?.token) {
      setToken(session.session.token);
    } else {
      setToken(null);
    }
  }, [session]);

  const user: AuthUser | null = session?.user ?? null;
  const loading = isPending;

  const login = useCallback((provider: "google" | "discord" = "google") => {
    sessionStorage.setItem("returnUrl", window.location.pathname);
    authClient.signIn.social({ provider });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setToken(null);
  }, []);

  return { user, loading, login, logout, token };
}
