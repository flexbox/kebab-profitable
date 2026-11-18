import { CARD_SIZE, cardLang, sharedScore, siteCard, winCard } from "@/server/card";

export const size = CARD_SIZE;
export const contentType = "image/png";

/** The picture for a shared win: see src/server/card.tsx. */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; seed: string; key: string; days: string }>;
}) {
  const { lang, seed, key } = await params;
  const score = await sharedScore(seed, key);
  return score ? winCard(score, cardLang(lang)) : siteCard();
}
