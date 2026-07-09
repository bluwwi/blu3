export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CONCURRENCY_LIMIT = 2;
let activeCount = 0;
const queuedTasks: Array<() => void> = [];

function dequeue() {
  while (activeCount < CONCURRENCY_LIMIT && queuedTasks.length > 0) {
    const task = queuedTasks.shift();
    if (task) {
      activeCount++;
      task();
    }
  }
}

function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queuedTasks.push(() => {
      Promise.resolve(fn()).then(resolve, reject).finally(() => {
        activeCount--;
        dequeue();
      });
    });
    dequeue();
  });
}

export async function resolveTrackSource(
  videoId: string,
  name: string,
  artists?: string,
  token?: string,
  duration?: number,
  source?: string,
  signal?: AbortSignal,
): Promise<{ source: string; audioUrl?: string; videoId: string; image?: string }> {
  return withLimit(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${API_URL}/api/resolve`, {
          method: "POST",
          headers,
          body: JSON.stringify({ videoId, name, artists, duration, source }),
          signal,
        });
        if (res.status === 429 && attempt < 3) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (!res.ok) {
          return { source: "youtube", videoId };
        }
        const data = await res.json();
        return {
          source: data.source ?? "youtube",
          audioUrl: data.audioUrl,
          videoId: data.videoId,
          image: data.image,
        };
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          return { source: "youtube", videoId };
        }
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        return { source: "youtube", videoId };
      }
    }
    return { source: "youtube", videoId };
  });
}

export async function resolveLink(
  url: string,
  token?: string,
): Promise<{ videoId: string; name: string; artist: string; image: string; source: string } | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}/api/resolve-link`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
