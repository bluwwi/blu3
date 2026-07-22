import type { MetadataRoute } from "next";

const APP_URL = "https://blu3.in";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.blu3.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  let roomPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/rooms/sitemap`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const rooms: { code: string; name: string }[] = data.rooms ?? [];
      roomPages = rooms.map((room) => ({
        url: `${APP_URL}/room/${room.code}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // If API is unavailable, serve only static pages
  }

  return [...staticPages, ...roomPages];
}
