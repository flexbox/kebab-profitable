/** A name reduced to its letters and digits: no case, no accents, no spaces. */
export function plain(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** What makes two leaderboard names the same player: "Karl" and "karl" are one. */
export function pseudoKey(name: string): string {
  return plain(name) || name.toLowerCase();
}
