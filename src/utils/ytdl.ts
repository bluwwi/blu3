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
