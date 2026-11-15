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
  /** How many runs the player started that day. */
  attempts: number;
  /** When the score was saved, in milliseconds. */
  at: number;
}

export interface ScoreStore {
  /** All scores for one seed. */
  forSeed(seed: string): Promise<ScoreEntry[]>;
  /** The best scores across all seeds. */
  best(limit: number): Promise<ScoreEntry[]>;
  /** The player's score for that seed, if any. */
  get(seed: string, key: string): Promise<ScoreEntry | null>;
  put(key: string, entry: ScoreEntry): Promise<void>;
}

export function byRank(a: ScoreEntry, b: ScoreEntry): number {
  return a.days - b.days || a.attempts - b.attempts || a.at - b.at;
}

/**
 * Local stand-in: one JSON file under .data/. Used in development and in
 * tests. Production uses the hosted store (see store.ts).
 */
export function fileStore(
  file = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "scores.json"),
): ScoreStore {
  type Table = Record<string, ScoreEntry>;
  const load = async (): Promise<Table> => {
    try {
      return JSON.parse(await readFile(/* turbopackIgnore: true */ file, "utf8")) as Table;
    } catch {
      return {};
    }
  };
  const save = async (table: Table) => {
    await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(table, null, 2));
  };
  return {
    async forSeed(seed) {
      return Object.values(await load()).filter((e) => e.seed === seed);
    },
    async best(limit) {
      return Object.values(await load()).sort(byRank).slice(0, limit);
    },
    async get(seed, key) {
      return (await load())[`${seed}|${key}`] ?? null;
    },
    async put(key, entry) {
      const table = await load();
      table[`${entry.seed}|${key}`] = entry;
      await save(table);
    },
  };
}
