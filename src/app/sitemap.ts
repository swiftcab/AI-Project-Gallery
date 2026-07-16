import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://qualifyourlead.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://qualifyourlead.com/onboarding",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://qualifyourlead.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...ARTICLES.map((a) => ({
      url: `https://qualifyourlead.com/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
