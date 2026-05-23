export const fmt = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return !s || isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtSec = (s: number): string =>
  !s || isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
