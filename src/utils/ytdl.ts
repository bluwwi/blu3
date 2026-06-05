export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getStreamUrl(videoId: string): string {
  return `${API_URL}/cdn/${encodeURIComponent(videoId)}`;
}

export async function getAudioStreamUrl(
  videoId: string,
  token?: string,
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(
      `${API_URL}/api/ytdl/${encodeURIComponent(videoId)}`,
      { headers },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

export function preResolveYt(
  videoId: string,
  token?: string,
): Promise<string | null> {
  return getAudioStreamUrl(videoId, token);
}

export async function resolveTrackSource(
  videoId: string,
  name: string,
  artists?: string,
  token?: string,
): Promise<{ source: string; audioUrl?: string; videoId: string }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/resolve`, {
      method: "POST",
      headers,
      body: JSON.stringify({ videoId, name, artists }),
    });
    if (!res.ok) return { source: "youtube", videoId };
    const data = await res.json();
    return { source: data.source ?? "youtube", audioUrl: data.audioUrl, videoId: data.videoId };
  } catch {
    return { source: "youtube", videoId };
  }
}
