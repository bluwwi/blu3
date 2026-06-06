import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "blu3";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "Inter, sans-serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "#5865F2",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "white",
            }}
          >
            B
          </div>

          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "white",
              letterSpacing: -1,
            }}
          >
            Join me on Blu3
          </span>

          <span
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Listening to music together in real-time
          </span>

          <div
            style={{
              marginTop: 20,
              padding: "12px 32px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 32,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            blu3.in/room/{code}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          blu3.in
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
