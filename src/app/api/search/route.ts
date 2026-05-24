import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ tracks: [] });

  const API_URL = process.env.API_URL || "http://localhost:8000";

  try {
    const res = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(q)}`,
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
