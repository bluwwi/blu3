/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://blu3.in",
  generateRobotsTxt: false,
  exclude: [
    "/auth/callback",
    "/api/*",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: "/api/" },
      { userAgent: "*", disallow: "/auth/" },
    ],
    additionalSitemaps: [
      "https://blu3.in/sitemap.xml",
    ],
  },
  changefreq: "weekly",
  priority: 0.7,
  autoLastmod: true,
  transform: async (config, path) => {
    const priorities = {
      "/": 1.0,
      "/browse": 0.9,
      "/login": 0.6,
      "/terms": 0.4,
      "/privacy": 0.4,
    };
    const changefreqs = {
      "/": "weekly",
      "/browse": "weekly",
      "/login": "monthly",
      "/terms": "yearly",
      "/privacy": "yearly",
    };
    return {
      loc: path,
      changefreq: changefreqs[path] || config.changefreq,
      priority: priorities[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
