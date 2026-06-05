// pages/sitemap.xml.tsx
// ─── SITEMAP FOR GOOGLE ──────────────────────────────────────────

import { GetServerSideProps } from "next";

const BASE = "https://planet-mall.vercel.app";

const STATIC_PAGES = [
  { url: "/",              priority: "1.0",  changefreq: "daily" },
  { url: "/explore",       priority: "0.9",  changefreq: "hourly" },
  { url: "/classifieds",   priority: "0.9",  changefreq: "hourly" },
  { url: "/food",          priority: "0.8",  changefreq: "daily" },
  { url: "/livestreams",   priority: "0.8",  changefreq: "hourly" },
  { url: "/pricing",       priority: "0.8",  changefreq: "weekly" },
  { url: "/how-it-works",  priority: "0.7",  changefreq: "monthly" },
  { url: "/trust",         priority: "0.7",  changefreq: "monthly" },
  { url: "/auth/login",    priority: "0.5",  changefreq: "monthly" },
  { url: "/auth/signup",   priority: "0.5",  changefreq: "monthly" },
];

function generateSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(page => `  <url>
    <loc>${BASE}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`).join("\n")}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(generateSitemap());
  res.end();
  return { props: {} };
};

export default function Sitemap() { return null; }
