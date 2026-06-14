"use client";

type Listener = (visible: boolean) => void;

let listeners: Listener[] = [];
let previousVisible = typeof document !== "undefined" ? !document.hidden : true;

function handleChange() {
  const visible = !document.hidden;
  if (visible === previousVisible) return;
  previousVisible = visible;
  for (const fn of listeners) fn(visible);
}

let initialized = false;
function ensureInit() {
  if (initialized) return;
  initialized = true;
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleChange);
  }
}

export function onVisibilityChange(fn: Listener): () => void {
  ensureInit();
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
