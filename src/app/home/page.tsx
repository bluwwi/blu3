"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOTAL = 16;

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % TOTAL;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSignedIn(!!localStorage.getItem("blu3_token"));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream: #F4EDE0;
          --black: #0C0C0C;
          --white: #FAFAF6;
        }

        html, body { height: 100%; overflow: hidden; }

        .page {
          position: relative;
          width: 100%;
          min-height: 100svh;
          max-height: 100svh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LOGO: lives on .page, perfectly centered, behind everything ── */
        .logo {
          position: absolute;
          width: 60vw;
          height: auto;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          object-fit: contain;
          user-select: none;
          pointer-events: none;
          z-index: 1;

        }

        /* ── SQUARE SLIDESHOW ── */
        .frame {
          position: relative;
          z-index: 1;
          width: clamp(240px, 40vmin, 440px);
          height: clamp(240px, 40vmin, 440px);
          flex-shrink: 0;
          overflow: hidden;j
          border-radius: 4px;
          box-shadow:
            0 24px 64px rgba(0,0,0,0.22),
            0 4px 16px rgba(0,0,0,0.10);
        }

        .slide {
          position: absolute;
          inset: 0;
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .slide-enter {
          z-index: 2;
          animation: slideInUp 0.65s cubic-bezier(0.77, 0, 0.18, 1) forwards;
        }

        .slide-exit {
          z-index: 1;
          animation: slideOutUp 0.65s cubic-bezier(0.77, 0, 0.18, 1) forwards;
        }

        @keyframes slideInUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0%); }
        }

        @keyframes slideOutUp {
          from { transform: translateY(0%); }
          to   { transform: translateY(-100%); }
        }

        /* ── JAM BUTTON ── */
        .btn {
          background: var(--black);
          color: var(--white);
          border: none;
          padding: 15px 48px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          position: relative;
          z-index: 1;
          overflow: hidden;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #1f1f1f;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.26s ease;
        }

        .btn:hover::after { transform: scaleX(1); }
        .btn span { position: relative; z-index: 1; }

        /* ── GRAIN ── */
        .grain {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.35;
          z-index: 30;
          animation: grain 7s steps(2) infinite;
        }

        @keyframes grain {
          0%   { transform: translate(0,0) }
          25%  { transform: translate(-1%,1%) }
          50%  { transform: translate(1%,-1%) }
          75%  { transform: translate(-1%,-1%) }
          100% { transform: translate(0,0) }
        }
      `}</style>

      <div className="page">
        <div className="grain" />

        {/* Logo anchored to the page, not the frame — z:0, behind everything */}
        <img src="/logo/bg.svg" alt="Blu3" className="logo" draggable={false} />

        {/* Slideshow — z:1, sits on top of logo */}
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
          onClick={() => {
            if (signedIn) {
              window.location.href = "/browse";
            } else {
              sessionStorage.setItem("returnUrl", "/browse");
              window.location.href = `${API_URL}/auth/google`;
            }
          }}
        >
          <span>{signedIn ? "Start" : "sign in"}</span>
        </button>
      </div>
    </>
  );
}
