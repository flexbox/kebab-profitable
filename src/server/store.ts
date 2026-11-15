import { redisConfigured, redisStore } from "./redis";
import { fileStore, type ScoreStore } from "./scores";

let store: ScoreStore | null | undefined;

/**
 * The leaderboard store for this environment:
 *  - Upstash Redis when its variables are set (production);
 *  - a JSON file under .data/ on a developer's machine;
 *  - nothing on Vercel until the database is provisioned. The game still
 *    plays; the leaderboard says it is not open yet.
 */
export function scoreStore(): ScoreStore | null {
  if (store === undefined) {
    store = redisConfigured() ? redisStore() : process.env.VERCEL ? null : fileStore();
  }
  return store;
}
