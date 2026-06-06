import { ImageResponse } from "next/og";

export const runtime = "edge";

async function loadGoogleFont(font: string, weight = 700) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const res = await fetch(resource[1]);
    if (res.status === 200) {
      return await res.arrayBuffer();
    }
  }

  throw new Error("Failed to load font data");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") || "blu3";

    const [inter700, inter500] = await Promise.all([
      loadGoogleFont("Inter", 700),
      loadGoogleFont("Inter", 500),
    ]);

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
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            fontFamily: "Inter",
            padding: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#5865F2",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 700,
                color: "white",
              }}
            >
              B
            </div>

            <span
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "-1px",
              }}
            >
              Join me on Blu3
            </span>

            <span
              style={{
                fontSize: "24px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 500,
              }}
            >
              Listening to music together in real-time
            </span>

            <div
              style={{
                marginTop: "20px",
                padding: "12px 32px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: "32px",
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
              bottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 500,
            }}
          >
            blu3.in
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: inter700,
            weight: 700,
            style: "normal",
          },
          {
            name: "Inter",
            data: inter500,
            weight: 500,
            style: "normal",
          },
        ],
      },
    );
  } catch (e) {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
