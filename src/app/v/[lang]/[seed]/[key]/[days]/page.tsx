import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { cardLang, cardWords, sharedScore } from "@/server/card";
import { Game } from "@/ui/Game";

/**
 * The address a saved win is shared with: /v/fr/2026-11-18/flexbox/44.
 * It is the game itself, under a picture and a title made from that score.
 * The days are in the address only so that a better run gets a new address,
 * and so a new picture on X; the score shown is always the board's.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; seed: string; key: string; days: string }>;
}): Promise<Metadata> {
  const { lang, seed, key } = await params;
  const score = await sharedScore(seed, key);
  if (!score) return {};
  const words = cardWords(score, cardLang(lang));
  const description = `${words.rank}, ${words.withWhom}. ${words.dare}.`;
  return {
    title: words.title,
    description,
    openGraph: {
      title: words.title,
      description,
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
