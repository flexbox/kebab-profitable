import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** One page to index: the game. Share links are left out, as they are noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 }];
}
