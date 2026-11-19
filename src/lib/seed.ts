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

/**
 * The seven seeds of the seed's week, Monday first. The leaderboard turns
 * over weekly: everyone still plays the day's run, and the board keeps each
 * player's best run from Monday to Sunday.
 */
export function weekOf(seed: string): string[] {
  const day = new Date(`${seed}T12:00:00Z`);
  const monday = day.getTime() - ((day.getUTCDay() + 6) % 7) * 86_400_000;
  return Array.from({ length: 7 }, (_, i) =>
    new Date(monday + i * 86_400_000).toISOString().slice(0, 10),
  );
}
