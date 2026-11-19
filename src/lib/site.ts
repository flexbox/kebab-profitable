/**
 * What the game says about itself to search engines, link previews and the
 * home screen. The words are French first, as the page is rendered in French.
 */
export const SITE_URL = "https://kebab-profitable.vercel.app";

export const SITE_NAME = "Kebab Profitable";

/** The title of the home page, in search results: about 55 characters. */
export const SITE_TITLE = "Kebab Profitable : le jeu de gestion de l'indie hacker";

/** About 155 characters, so a search result shows all of it. */
export const SITE_DESCRIPTION =
  "Jeu gratuit dans le navigateur : tu quittes ton CDI avec 1 500 €, tu codes, tu shippes, tu postes. Objectif : 270 € de MRR, le prix d'un kebab par jour.";

export const NAVY = "#0e2439";

/**
 * The Stripe Payment Link for a kebab, made by `pnpm stripe:link`. Empty until
 * it is set, and then the game offers nothing for sale.
 */
export const KEBAB_LINK = process.env.NEXT_PUBLIC_KEBAB_LINK ?? "";

/** The same, for a founder card of one's own. Empty: the card has no button. */
export const FOUNDER_LINK = process.env.NEXT_PUBLIC_FOUNDER_LINK ?? "";

export const MEETUP_URL = "https://luma.com/indiehackerslille";
