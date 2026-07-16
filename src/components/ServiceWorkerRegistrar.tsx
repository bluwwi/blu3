"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      if (cancelled) return;
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "activated" && navigator.serviceWorker.controller) {
            newSW.postMessage({ type: "SKIP_WAITING_ACTIVATED" });
          }
        });
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return null;
}
