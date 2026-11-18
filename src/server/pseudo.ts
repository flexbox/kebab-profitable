import { plain, pseudoKey } from "@/lib/pseudo";

export { pseudoKey };

/** Leaderboard names: 2 to 16 characters, and a basic filter. */
const BLOCKED = [
  "merde", "putain", "connard", "connasse", "salope", "encule", "pute", "batard",
  "nique", "bite", "couille", "pd", "negre", "nazi", "hitler",
  "fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "whore", "slut",
  "asshole", "dick", "cock", "rape", "retard",
];

/** Returns the cleaned name, or null if it is not acceptable. */
export function cleanPseudo(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 16) return null;
  if (!/^[\p{L}\p{N} ._\-']+$/u.test(name)) return null;
  const flat = plain(name);
  if (flat.length === 0) return null;
  if (BLOCKED.some((word) => (word.length <= 3 ? flat === word : flat.includes(word)))) {
    return null;
  }
  return name;
}
