import { NextRequest, NextResponse } from "next/server";

const BACKENDS = [
  "https://api.blu3.in",
  process.env.API_URL,
  "https://blu3-server.onrender.com",
  "http://localhost:8000",
].filter(Boolean) as string[];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ tracks: [] });

  for (const url of BACKENDS) {
    try {
      const res = await fetch(
        `${url}/api/search?q=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {}
  }

  return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
}
