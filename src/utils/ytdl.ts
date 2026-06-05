export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function resolveTrackSource(
  videoId: string,
  name: string,
  artists?: string,
  token?: string,
): Promise<{ source: string; audioUrl?: string; videoId: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/resolve`, {
      method: "POST",
      headers,
      body: JSON.stringify({ videoId, name, artists }),
    });
    if (!res.ok) return { source: "youtube", videoId };
    const data = await res.json();
    return {
      source: data.source ?? "youtube",
      audioUrl: data.audioUrl,
      videoId: data.videoId,
    };
  } catch {
    return { source: "youtube", videoId };
  }
}
//yt-dl is removed
