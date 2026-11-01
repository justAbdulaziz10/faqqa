import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/terms", "/privacy"].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: p ? "monthly" : "daily", priority: p ? 0.5 : 1 }));
}
