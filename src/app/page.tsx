import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_HOME,
  SITE_IMAGE,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site";
import { Game } from "@/ui/Game";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_HOME },
  openGraph: {
    type: "website",
    url: SITE_HOME,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "fr_FR",
    images: [SITE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
  },
};

const gameId = `${SITE_HOME}#game`;
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_HOME}#website`,
      url: SITE_HOME,
      name: SITE_NAME,
      inLanguage: "fr",
      mainEntity: { "@id": gameId },
    },
    {
      "@type": ["VideoGame", "WebApplication"],
      "@id": gameId,
      url: SITE_HOME,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      image: new URL(SITE_IMAGE.url, SITE_HOME).href,
      inLanguage: ["fr", "en"],
      genre: "Simulation de gestion",
      applicationCategory: "GameApplication",
      gamePlatform: "Web browser",
      browserRequirements: "JavaScript",
      playMode: "SinglePlayer",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "EUR", url: SITE_HOME },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Game />
    </>
  );
}
