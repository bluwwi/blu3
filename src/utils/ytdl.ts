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
): Promise<{ source: string; audioUrl?: string; videoId: string; image?: string }> {
  console.log(`[Resolve] ENTER videoId=${videoId} name="${name}" source=${source} duration=${duration}`);
  return withLimit(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const t0 = Date.now();
        const res = await fetch(`${API_URL}/api/resolve`, {
          method: "POST",
          headers,
          body: JSON.stringify({ videoId, name, artists, duration, source }),
        });
        const ms = Date.now() - t0;
        console.log(`[Resolve] attempt=${attempt} status=${res.status} ${ms}ms videoId=${videoId}`);
        if (res.status === 429 && attempt < 3) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.log(`[Resolve] 429 retry delay=${delay} videoId=${videoId}`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (!res.ok) {
          console.log(`[Resolve] !ok -> youtube fallback videoId=${videoId}`);
          return { source: "youtube", videoId };
        }
        const data = await res.json();
        const hasAudio = !!data.audioUrl;
        console.log(`[Resolve] SUCCESS videoId=${videoId} hasAudio=${hasAudio} source=${data.source}`);
        return {
          source: data.source ?? "youtube",
          audioUrl: data.audioUrl,
          videoId: data.videoId,
          image: data.image,
        };
      } catch (e) {
        console.log(`[Resolve] FETCH_ERROR attempt=${attempt} videoId=${videoId}`, e);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        console.log(`[Resolve] giving up -> youtube fallback videoId=${videoId}`);
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
