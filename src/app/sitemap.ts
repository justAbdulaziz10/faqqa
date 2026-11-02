import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { AREAS } from "@/lib/areas";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/terms", "/privacy"].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: p ? "monthly" : "daily", priority: p ? 0.5 : 1 }) as const);
  const areas = AREAS.map((a) => ({ url: `${SITE.url}/area/${a.id}`, changeFrequency: "daily", priority: 0.8 }) as const);
  return [...pages, ...areas];
}
