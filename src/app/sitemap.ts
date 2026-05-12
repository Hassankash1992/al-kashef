import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://al-kashef.vercel.app";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/gdpr`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
