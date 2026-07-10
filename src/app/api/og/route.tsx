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
  const imgUrl = isHome ? `${appUrl}/homebanner.png` : `${appUrl}/banner.png`;
  try {
    return await imageToBase64(imgUrl);
  } catch {
    return "";
  }
}

const OVERLAY_FILL = "rgba(0,0,0,0.45)";

function RoomOG({ name, avatar, room, code, bgImage }: { name: string; avatar?: string; room: string; code: string; bgImage: string }) {
  return (
    <div style={{
      width: BANNER_W,
      height: BANNER_H,
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "linear-gradient(180deg, #1e3a5f 0%, #0f172a 50%, #000000 100%)",
      fontFamily: "Inter",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "28px",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: OVERLAY_FILL,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: 42, fontWeight: 700, color: "white" }}>
            {name || "Someone"},
          </span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
            invited you to
          </span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
            Blu3
          </span>
        </div>
        {avatar && (
          <img
            src={avatar}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.7)", objectFit: "cover" }}
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -4 }}>
          <svg width={40} height={32} viewBox="0 0 383 307" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31.51 299.171H29.21C24.61 299.171 20.47 297.408 16.79 293.881C7.13 284.221 1.91667 254.474 1.15 204.641C1.15 192.988 1.99333 180.568 3.68 167.381L5.75 131.271C5.75 130.044 5.29 129.201 4.37 128.741C1.45667 125.674 0 122.454 0 119.081C0 114.174 2.37667 110.418 7.13 107.811C11.8833 105.051 17.48 103.211 23.92 102.291C30.36 101.218 36.2633 100.681 41.63 100.681C63.5567 100.681 81.3433 108.731 94.99 124.831C99.13 129.584 101.737 134.338 102.81 139.091C103.883 143.691 104.497 149.441 104.65 156.341C104.65 177.654 96.7533 196.131 80.96 211.771C77.4333 215.144 74.98 217.598 73.6 219.131C72.22 220.664 69.3833 223.271 65.09 226.951L65.78 227.871C70.9933 231.398 74.52 235.614 76.36 240.521C78.3533 245.428 79.4267 251.024 79.58 257.311C79.58 266.664 76.82 274.868 71.3 281.921C62.8667 292.348 49.6033 298.098 31.51 299.171Z" fill="white"/>
            <path d="M121.009 302.161C116.409 302.161 112.499 299.861 109.279 295.261C106.212 290.508 104.679 285.831 104.679 281.231L104.909 256.621L104.219 234.311V127.361C104.219 122.608 105.062 117.778 106.749 112.871C107.822 108.884 109.739 106.354 112.499 105.281C115.412 104.054 118.939 103.364 123.079 103.211C127.372 103.211 131.052 104.284 134.119 106.431C137.339 108.424 139.255 111.721 139.869 116.321C139.869 132.421 139.639 144.304 139.179 151.971C138.872 159.484 138.335 167.304 137.569 175.431L135.499 205.561C135.039 218.594 134.655 231.628 134.349 244.661C134.195 257.694 133.889 270.728 133.429 283.761C133.429 288.054 132.432 292.118 130.439 295.951C128.599 299.784 125.455 301.854 121.009 302.161Z" fill="white"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
          {room || `${code}.blu3.in`}
        </span>
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
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "28px",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: OVERLAY_FILL,
      }} />
      <div style={{ position: "relative", zIndex: 1 }} />

      <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: "white", textAlign: "center" }}>
          Music, Fun & Vibe.
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -4 }}>
          <svg width={40} height={32} viewBox="0 0 383 307" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31.51 299.171H29.21C24.61 299.171 20.47 297.408 16.79 293.881C7.13 284.221 1.91667 254.474 1.15 204.641C1.15 192.988 1.99333 180.568 3.68 167.381L5.75 131.271C5.75 130.044 5.29 129.201 4.37 128.741C1.45667 125.674 0 122.454 0 119.081C0 114.174 2.37667 110.418 7.13 107.811C11.8833 105.051 17.48 103.211 23.92 102.291C30.36 101.218 36.2633 100.681 41.63 100.681C63.5567 100.681 81.3433 108.731 94.99 124.831C99.13 129.584 101.737 134.338 102.81 139.091C103.883 143.691 104.497 149.441 104.65 156.341C104.65 177.654 96.7533 196.131 80.96 211.771C77.4333 215.144 74.98 217.598 73.6 219.131C72.22 220.664 69.3833 223.271 65.09 226.951L65.78 227.871C70.9933 231.398 74.52 235.614 76.36 240.521C78.3533 245.428 79.4267 251.024 79.58 257.311C79.58 266.664 76.82 274.868 71.3 281.921C62.8667 292.348 49.6033 298.098 31.51 299.171Z" fill="white"/>
            <path d="M121.009 302.161C116.409 302.161 112.499 299.861 109.279 295.261C106.212 290.508 104.679 285.831 104.679 281.231L104.909 256.621L104.219 234.311V127.361C104.219 122.608 105.062 117.778 106.749 112.871C107.822 108.884 109.739 106.354 112.499 105.281C115.412 104.054 118.939 103.364 123.079 103.211C127.372 103.211 131.052 104.284 134.119 106.431C137.339 108.424 139.255 111.721 139.869 116.321C139.869 132.421 139.639 144.304 139.179 151.971C138.872 159.484 138.335 167.304 137.569 175.431L135.499 205.561C135.039 218.594 134.655 231.628 134.349 244.661C134.195 257.694 133.889 270.728 133.429 283.761C133.429 288.054 132.432 292.118 130.439 295.951C128.599 299.784 125.455 301.854 121.009 302.161Z" fill="white"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
          blu3.in
        </span>
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

    return new ImageResponse(content, {
      width: BANNER_W,
      height: BANNER_H,
      fonts: [
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
      ],
    });
  } catch (e) {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
