import { CHARACTER_IDS } from "@/game/data/characters";
import { decodeMoves } from "@/game/codec";
import { replay } from "@/game/engine";
import { B } from "@/game/balance";
import type { CharacterId } from "@/game/types";
import { isSeed, seedFor } from "@/lib/seed";
import { cleanPseudo, pseudoKey } from "./pseudo";
import { byRank, type ScoreEntry, type ScoreStore } from "./scores";

export type SubmitError = "pseudo" | "stale" | "invalid";

export interface Board {
  today: ScoreEntry[];
  allTime: ScoreEntry[];
  /** True when no leaderboard database is connected yet. */
  offline?: boolean;
}

/** Which board a score went to. A run finished after midnight goes to yesterday's. */
export type BoardDay = "today" | "yesterday";

export interface Submitted {
  ok: true;
  /** The player's place on that day's board, counted over every score. */
  rank: number;
  days: number;
  day: BoardDay;
  board: Board;
}

const TOP = 50;

export async function board(store: ScoreStore, seed: string): Promise<Board> {
  const [today, allTime] = await Promise.all([store.forSeed(seed), store.best(TOP)]);
  return { today: today.sort(byRank).slice(0, TOP), allTime };
}

/** Seeds that still accept scores: today and yesterday, Paris time. */
export function openSeeds(now: Date): string[] {
  return [seedFor(now), seedFor(new Date(now.getTime() - 24 * 60 * 60 * 1000))];
}

/** How many scores one address may send, and in how many seconds. */
export const LIMIT = { max: 30, seconds: 10 * 60 };

/**
 * False once an address has sent too many scores. The limit is wide on
 * purpose: a whole bar on one Wi-Fi shares one address, and an honest win
 * takes some 190 clicks.
 */
export async function underLimit(store: ScoreStore, who: string, now: Date): Promise<boolean> {
  return (await store.hit(who, LIMIT.seconds, now.getTime())) <= LIMIT.max;
}

/**
 * Checks a submitted run by replaying it move by move with the rules engine.
 * The score is whatever the replay says, never what the client claims.
 */
export async function submit(
  store: ScoreStore,
  body: unknown,
  now: Date,
): Promise<Submitted | { ok: false; error: SubmitError }> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid" };
  const { seed, character, pseudo, moves, attempts } = body as Record<string, unknown>;

  const name = cleanPseudo(pseudo);
  if (!name) return { ok: false, error: "pseudo" };
  if (typeof seed !== "string" || !isSeed(seed)) return { ok: false, error: "invalid" };
  if (!openSeeds(now).includes(seed)) return { ok: false, error: "stale" };
  if (typeof character !== "string" || !CHARACTER_IDS.includes(character as CharacterId)) {
    return { ok: false, error: "invalid" };
  }
  if (typeof moves !== "string" || moves.length > B.maxMoves * 3) {
    return { ok: false, error: "invalid" };
  }

  let days: number;
  let cash: number;
  try {
    const final = replay(seed, character as CharacterId, decodeMoves(moves));
    if (final.outcome?.result !== "won") return { ok: false, error: "invalid" };
    days = final.outcome.day;
    cash = Math.max(0, Math.round(final.cash));
  } catch {
    return { ok: false, error: "invalid" };
  }

  const tries = Math.max(1, Math.min(999, Math.floor(Number(attempts) || 1)));
  const key = pseudoKey(name);
  const run: ScoreEntry = {
    seed,
    pseudo: name,
    character: character as CharacterId,
    days,
    cash,
    attempts: tries,
    at: now.getTime(),
  };

  // One score per name and per day: the better run stays.
  const existing = await store.get(seed, key);
  const entry =
    existing && byRank(existing, run) <= 0
      ? { ...existing, attempts: Math.max(existing.attempts, tries) }
      : run;
  await store.put(key, entry);

  // One row per name on the all-time board: their best run on any day.
  const top = await store.getBest(key);
  if (!top || top.seed === seed || byRank(entry, top) < 0) await store.putBest(key, entry);

  const [scores, allTime] = await Promise.all([store.forSeed(seed), store.best(TOP)]);
  scores.sort(byRank);
  const rank = scores.findIndex((e) => pseudoKey(e.pseudo) === key) + 1;
  return {
    ok: true,
    rank: rank || scores.length + 1,
    days: entry.days,
    day: seed === seedFor(now) ? "today" : "yesterday",
    board: { today: scores.slice(0, TOP), allTime },
  };
}
