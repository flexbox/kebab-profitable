import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import { cardLang, cardWords, sharedScore } from "@/server/card";
import { Game } from "@/ui/Game";

/**
 * The address a saved win is shared with: /v/fr/2026-11-18/flexbox/44.
 * It is the game itself, under a picture and a title made from that score.
 * The days are in the address only so that a better run gets a new address,
 * and so a new picture on X; the score shown is always the board's.
 *
 * Every win makes a new address, each one the same game under another title,
 * so these pages are kept out of search results (noindex) while their links
 * are still followed to the game. Link previews do not read robots meta.
 */
const unlisted = { index: false, follow: true } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; seed: string; key: string; days: string }>;
}): Promise<Metadata> {
  const { lang, seed, key, days } = await params;
  const score = await sharedScore(seed, key);
  if (!score) return { robots: unlisted };
  const words = cardWords(score, cardLang(lang));
  const description = `${words.rank}, ${words.withWhom}. ${words.dare}.`;
  return {
    title: words.title,
    description,
    robots: unlisted,
    openGraph: {
      title: words.title,
      description,
      siteName: SITE_NAME,
      url: `/v/${lang}/${seed}/${key}/${days}`,
      type: "website",
      locale: cardLang(lang) === "fr" ? "fr_FR" : "en_GB",
    },
    twitter: { card: "summary_large_image", title: words.title, description },
  };
}

/** The title depends on the board, so this page is rendered on request, on purpose. */
async function OnRequest() {
  await connection();
  return null;
}

export default function SharedWin() {
  return (
    <>
      <Game />
      <Suspense>
        <OnRequest />
      </Suspense>
    </>
  );
}
