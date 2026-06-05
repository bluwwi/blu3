const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getStreamUrl(videoId: string): string {
  return `${API_URL}/cdn/${encodeURIComponent(videoId)}`;
}

export async function getAudioStreamUrl(
  videoId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/ytdl/${encodeURIComponent(videoId)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

export async function resolveTrackSource(
  videoId: string,
  name: string,
  artists?: string,
): Promise<{ source: string; url?: string; videoId: string }> {
  try {
    const res = await fetch(`${API_URL}/api/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, name, artists }),
    });
    if (!res.ok) return { source: "youtube", videoId };
    const data = await res.json();
    return { source: data.source ?? "youtube", url: data.url, videoId: data.videoId };
  } catch {
    return { source: "youtube", videoId };
  }
}
