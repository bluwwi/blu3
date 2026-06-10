import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ tracks: [] });

  try {
    const res = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(q)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) return NextResponse.json(await res.json());
  } catch {}

  return NextResponse.json({ tracks: [] });
}
