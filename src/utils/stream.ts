const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getStreamUrl(videoId: string): string {
  return `${API_URL}/api/stream/${encodeURIComponent(videoId)}`;
}
