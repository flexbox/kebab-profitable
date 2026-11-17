/**
 * X's web intent: a plain link that opens the composer with a post already
 * written, and the game's address under it. No widget script, and nothing is
 * posted until the player presses the button on X.
 */
export function postOnX(text: string): string {
  const params = new URLSearchParams({
    text,
    url: typeof window === "undefined" ? "" : window.location.origin,
  });
  return `https://x.com/intent/post?${params}`;
}
