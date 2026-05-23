"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubeAPI() {
  const apiReady = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      apiReady.current = true;
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
    };

    return () => {
      // Cleanup if needed
      delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  return { apiReady };
}
