import type { MetadataRoute } from "next";
import { NAVY, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * So the game can sit on a home screen, in its own navy. The PNG icons and
 * apple-icon.png are icon.svg scaled up with hard pixels; redo them by hand
 * if the K changes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Kebab",
    description: SITE_DESCRIPTION,
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: NAVY,
    theme_color: NAVY,
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
