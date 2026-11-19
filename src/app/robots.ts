import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything may be crawled but the scores API. Share links stay open on
 * purpose: X and the others read robots.txt before they fetch a picture, and
 * the share pages say noindex themselves.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
