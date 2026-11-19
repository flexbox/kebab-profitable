import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_IMAGE, SITE_NAME } from "@/lib/site";
import { CARD_SIZE, cardLang, cardWords, sharedScore } from "@/server/card";
import { Game } from "@/ui/Game";

type SharedWinProps = Pick<PageProps<"/v/[lang]/[seed]/[key]/[days]">, "params">;

/**
 * The address a saved win is shared with: /v/fr/2026-11-18/flexbox/44.
 * It is the game itself, under a picture and a title made from that score.
 * The days are in the address only so that a better run gets a new address,
 * and so a new picture on X; the score shown is always the board's.
 */
export async function generateMetadata({ params }: SharedWinProps): Promise<Metadata> {
  const { lang, seed, key, days } = await params;
  const locale = cardLang(lang);
  const score = await sharedScore(seed, key);
  const words = score && cardWords(score, locale);
  const fallback =
    locale === "fr"
      ? {
          title: `Score partagé | ${SITE_NAME}`,
          description: "Score indisponible. Lance ta propre partie et vise 270 € de MRR.",
        }
      : {
          title: `Shared score | ${SITE_NAME}`,
          description: "Score unavailable. Start your own run and aim for €270 in MRR.",
        };
  const title = words?.title ?? fallback.title;
  const description = words ? `${words.rank}, ${words.withWhom}. ${words.dare}.` : fallback.description;
  const path = `/v/${[lang, seed, key, days].map(encodeURIComponent).join("/")}`;
  const image = words
    ? {
        url: `${path}/opengraph-image`,
        ...CARD_SIZE,
        type: SITE_IMAGE.type,
        alt: `${words.title} (${words.date}). ${words.rank}, ${words.withWhom}.`,
      }
    : {
        ...SITE_IMAGE,
        alt: locale === "fr" ? SITE_IMAGE.alt : "Chef and five pixel-art founders under the Kebab Profitable title.",
      };
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      siteName: SITE_NAME,
      url: path,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function SharedGame({ params }: SharedWinProps) {
  const { lang } = await params;
  return <Game initialLang={cardLang(lang)} />;
}

export default function SharedWin({ params }: SharedWinProps) {
  return (
    <Suspense>
      <SharedGame params={params} />
    </Suspense>
  );
}
