import { fileStore, type ScoreStore } from "./scores";

let store: ScoreStore | null = null;

/** The leaderboard store for this environment. */
export function scoreStore(): ScoreStore {
  store ??= fileStore();
  return store;
}
