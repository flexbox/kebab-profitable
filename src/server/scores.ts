import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CharacterId } from "@/game/types";

export interface ScoreEntry {
  /** The day's seed, YYYY-MM-DD. */
  seed: string;
  pseudo: string;
  character: CharacterId;
  /** Days to kebab profitable. Lower is better. */
  days: number;
  /** Cash in the bank on the winning day, in euros. Higher is better: it breaks ties. */
  cash: number;
  /** How many runs the player started that day, as their browser counted them. Not ranked. */
  attempts: number;
  /** When the score was saved, in milliseconds. */
  at: number;
}

export interface ScoreStore {
  /** All scores for one seed. */
  forSeed(seed: string): Promise<ScoreEntry[]>;
  /** The player's score for that seed, if any. */
  get(seed: string, key: string): Promise<ScoreEntry | null>;
  put(key: string, entry: ScoreEntry): Promise<void>;
  /** The all-time board: each player's best run, best first. */
  best(limit: number): Promise<ScoreEntry[]>;
  /** The player's best run on any seed, if any. */
  getBest(key: string): Promise<ScoreEntry | null>;
  putBest(key: string, entry: ScoreEntry): Promise<void>;
  /**
   * Counts one more hit under `key` and returns how many there have been in
   * the current window of `seconds`.
   */
  hit(key: string, seconds: number, now: number): Promise<number>;
}

/**
 * Fewer days first, then more cash, then the earlier score. All three come
 * from the server: the replay gives the days and the cash, the clock the rest.
 */
export function byRank(a: ScoreEntry, b: ScoreEntry): number {
  return a.days - b.days || b.cash - a.cash || a.at - b.at;
}

/**
 * Local stand-in: one JSON file under .data/. Used in development and in
 * tests. Production uses the hosted store (see store.ts).
 */
export function fileStore(
  file = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "scores.json"),
): ScoreStore {
  interface Table {
    /** <seed>|<name key> -> that day's score. */
    days: Record<string, ScoreEntry>;
    /** <name key> -> the player's best run. */
    best: Record<string, ScoreEntry>;
  }
  const load = async (): Promise<Table> => {
    try {
      const saved = JSON.parse(await readFile(/* turbopackIgnore: true */ file, "utf8"));
      return { days: saved.days ?? {}, best: saved.best ?? {} };
    } catch {
      return { days: {}, best: {} };
    }
  };
  const save = async (table: Table) => {
    await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(table, null, 2));
  };
  // Submission counts do not need to outlive the process.
  const hits = new Map<string, number>();
  return {
    async forSeed(seed) {
      return Object.values((await load()).days).filter((e) => e.seed === seed);
    },
    async get(seed, key) {
      return (await load()).days[`${seed}|${key}`] ?? null;
    },
    async put(key, entry) {
      const table = await load();
      table.days[`${entry.seed}|${key}`] = entry;
      await save(table);
    },
    async best(limit) {
      return Object.values((await load()).best).sort(byRank).slice(0, limit);
    },
    async getBest(key) {
      return (await load()).best[key] ?? null;
    },
    async putBest(key, entry) {
      const table = await load();
      table.best[key] = entry;
      await save(table);
    },
    async hit(key, seconds, now) {
      const bucket = `${key}|${Math.floor(now / (seconds * 1000))}`;
      const count = (hits.get(bucket) ?? 0) + 1;
      hits.set(bucket, count);
      return count;
    },
  };
}
