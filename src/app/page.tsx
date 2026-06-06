"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const TOTAL = 16;

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "account_not_linked") {
      setOauthError("Sign-in failed because an account already exists with this email. Try a different sign-in method.");
    } else if (err) {
      setOauthError("Sign-in failed. Please try again.");
    }
    if (err) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        router.replace(returnUrl);
      } else {
        router.replace("/browse");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % TOTAL;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <>


      <div className="page">
        <div className="grain" />

        {oauthError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-5 py-3 rounded-xl text-sm max-w-md text-center shadow-lg backdrop-blur-sm">
            {oauthError}
          </div>
        )}

        <img src="/logo/bg.svg" alt="Blu3" className="logo" draggable={false} />

        <div className="frame">
          <div
            key={`enter-${current}`}
            className="slide slide-enter"
            onAnimationEnd={() => setPrev(null)}
          >
            <img src={`/photos/${current + 1}.jpg`} alt="" draggable={false} />
          </div>

          {prev !== null && (
            <div key={`exit-${prev}`} className="slide slide-exit">
              <img src={`/photos/${prev + 1}.jpg`} alt="" draggable={false} />
            </div>
          )}
        </div>

        <button
          className="btn"
          onClick={() => (window.location.href = "/login")}
        >
          <span>get started</span>
        </button>
      </div>
    </>
  );
}
