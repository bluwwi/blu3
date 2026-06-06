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

    const [inter500, inter700] = await Promise.all([
      loadGoogleFont("Inter", 500),
      loadGoogleFont("Inter", 700),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            width: 600,
            height: 315,
            background:
              "linear-gradient(180deg, #1e3a5f 0%, #0f172a 50%, #000000 100%)",
            fontFamily: "Inter",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "28px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                You,
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                invited you to
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Blu3.in
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#5865F2",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                color: "white",
              }}
            >
              B
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              blu3.in
            </span>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 315,
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
