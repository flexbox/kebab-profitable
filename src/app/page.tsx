import type { Metadata } from "next";
import { MEETUP_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { Game } from "@/ui/Game";

// The one page to index. Share links point here as the game, without competing with it.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const meetup = `${SITE_URL}/#indie-hackers-lille`;

/** What the page is, for search engines: a free browser game, by a meetup. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": meetup,
      name: "Indie Hackers Lille",
      url: MEETUP_URL,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: ["fr", "en"],
      publisher: { "@id": meetup },
    },
    {
      // Google reads a game as software: VideoGame alongside WebApplication.
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${SITE_URL}/#game`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/opengraph-image.png`,
      inLanguage: ["fr", "en"],
      genre: ["Simulation", "Management", "Parody"],
      gamePlatform: "Web browser",
      playMode: "SinglePlayer",
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
      license: "https://opensource.org/licenses/MIT",
      author: { "@id": meetup },
      publisher: { "@id": meetup },
      isPartOf: { "@id": `${SITE_URL}/#website` },
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
