import { ImageResponse } from "next/og";

export const runtime = "edge";

const BANNER_W = 600;
const BANNER_H = 315;

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

async function imageToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const type = res.headers.get("content-type") || "image/png";
  return `data:${type};base64,${base64}`;
}

async function getBackgroundImage(isHome: boolean, appUrl: string): Promise<string> {
  const imgUrl = isHome ? `${appUrl}/homebanner.png?v=2` : `${appUrl}/banner.png?v=2`;
  try {
    return await imageToBase64(imgUrl);
  } catch {
    return "";
  }
}

function RoomOG({ name, avatar, room, code, bgImage }: { name: string; avatar?: string; room: string; code: string; bgImage: string }) {
  return (
    <div style={{
      width: BANNER_W,
      height: BANNER_H,
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "linear-gradient(180deg, #1e3a5f 0%, #0f172a 50%, #000000 100%)",
      fontFamily: "Inter",
      display: "flex",
      position: "relative",
    }}>
      {avatar && (
        <div style={{
          position: "absolute",
          left: 32,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <img
            src={avatar}
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.6)", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{
        position: "absolute",
        bottom: 8,
        right: 12,
        fontSize: 11,
        fontWeight: 500,
        color: "rgba(255,255,255,0.45)",
      }}>
        {room || `${code}.blu3.in`}
      </div>
    </div>
  );
}

function HomeOG({ bgImage }: { bgImage: string }) {
  return (
    <div style={{
      width: BANNER_W,
      height: BANNER_H,
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "linear-gradient(180deg, #1e3a5f 0%, #0f172a 50%, #000000 100%)",
      fontFamily: "Inter",
      display: "flex",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        bottom: 8,
        right: 12,
        fontSize: 11,
        fontWeight: 500,
        color: "rgba(255,255,255,0.45)",
      }}>
        blu3.in
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isHome = searchParams.get("home") === "1";
    const code = searchParams.get("code") || "";
    const name = searchParams.get("name") || "";
    const avatar = searchParams.get("avatar") || "";
    const room = searchParams.get("room") || "";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blu3.in";

    const [inter500, inter700, bgImage] = await Promise.all([
      loadGoogleFont("Inter", 500),
      loadGoogleFont("Inter", 700),
      getBackgroundImage(isHome, appUrl),
    ]);

    const content = isHome
      ? <HomeOG bgImage={bgImage} />
      : <RoomOG name={name} avatar={avatar} room={room} code={code} bgImage={bgImage} />;

    const response = new ImageResponse(content, {
      width: BANNER_W,
      height: BANNER_H,
      fonts: [
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
      ],
    });

    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    response.headers.set("CDN-Cache-Control", "public, max-age=3600");
    response.headers.set("Vercel-CDN-Cache-Control", "public, max-age=3600");

    return response;
  } catch (e) {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
