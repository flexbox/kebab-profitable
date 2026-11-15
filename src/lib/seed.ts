/**
 * Everyone plays the same run each day. The seed is the date in Lille,
 * so the deck turns over at midnight, Paris time.
 */
export function seedFor(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSeed(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
