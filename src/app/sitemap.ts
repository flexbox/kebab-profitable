import type { MetadataRoute } from "next";
import { SITE_HOME } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_HOME }];
}
