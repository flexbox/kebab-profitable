/**
 * Bump when the site's picture or words change. X keeps the card of an
 * address it has seen for about a week, and it first saw the bare address
 * before there was a picture: a new query makes it read the page again.
 */
const CARD_VERSION = "2";

/**
 * X's web intent: a plain link that opens the composer with a post already
 * written, and the game's address under it. No widget script, and nothing is
 * posted until the player presses the button on X.
 */
export function postOnX(text: string, path = ""): string {
  const params = new URLSearchParams({
    text,
    url:
      typeof window === "undefined"
        ? ""
        : window.location.origin + (path || `/?card=${CARD_VERSION}`),
  });
  return `https://x.com/intent/post?${params}`;
}

/**
 * The address of a saved win, which X shows with a picture of that score.
 * The days are part of it so that a better run is a new address: X keeps the
 * picture of an address it has already seen.
 */
export function winPath(lang: string, seed: string, key: string, days: number): string {
  return `/v/${lang}/${seed}/${encodeURIComponent(key)}/${days}`;
}
