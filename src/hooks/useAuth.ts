"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // small wait to ensure localStorage is hydrated after redirect
    const timer = setTimeout(() => {
      const token = localStorage.getItem("blu3_token");
      console.log("TOKEN FOUND:", token?.slice(0, 20));

      if (!token) {
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) setUser(data.user);
          else localStorage.removeItem("blu3_token");
        })
        .catch(() => localStorage.removeItem("blu3_token"))
        .finally(() => {
          clearTimeout(timeout);
          setLoading(false);
        });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(() => {
    sessionStorage.setItem("returnUrl", "/browse");
    window.location.href = `${API_URL}/auth/google`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("blu3_token");
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
