const STREAM_URL =
  process.env.NEXT_PUBLIC_STREAM_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:8000";

export function getStreamUrl(videoId: string): string {
  return `${STREAM_URL}/stream/${encodeURIComponent(videoId)}`;
}
