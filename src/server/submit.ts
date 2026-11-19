import { CHARACTER_IDS } from "@/game/data/characters";
import { decodeMoves } from "@/game/codec";
import { replay } from "@/game/engine";
import { B } from "@/game/balance";
import type { CharacterId } from "@/game/types";
import { isSeed, seedFor, weekOf } from "@/lib/seed";
import { cleanPseudo, pseudoKey } from "./pseudo";
import { byRank, type ScoreEntry, type ScoreStore } from "./scores";

export type SubmitError = "pseudo" | "stale" | "invalid";

export interface Board {
  /** This week's board: each player's best run from Monday to Sunday, Paris time. */
  week: ScoreEntry[];
  allTime: ScoreEntry[];
  /** True when no leaderboard database is connected yet. */
  offline?: boolean;
}

/**
 * Which week's board a score went to. Sunday's run finished after midnight
 * goes to last week's.
 */
export type BoardDay = "thisWeek" | "lastWeek";

export interface Submitted {
  ok: true;
  /** The player's place on that week's board, counted over every player. */
  rank: number;
  days: number;
  day: BoardDay;
  /** The player's name key: with the seed, it is the address of the score. */
  key: string;
  board: Board;
}

const TOP = 50;

/** Every player's best run in the seed's week, best first. */
async function weekScores(store: ScoreStore, seed: string): Promise<ScoreEntry[]> {
  const days = await Promise.all(weekOf(seed).map((day) => store.forSeed(day)));
  const best = new Map<string, ScoreEntry>();
  for (const entry of days.flat()) {
    const key = pseudoKey(entry.pseudo);
    const held = best.get(key);
    if (!held || byRank(entry, held) < 0) best.set(key, entry);
  }
  return [...best.values()].sort(byRank);
}

export async function board(store: ScoreStore, seed: string): Promise<Board> {
  const [week, allTime] = await Promise.all([weekScores(store, seed), store.best(TOP)]);
  return { week: week.slice(0, TOP), allTime };
}

/** Seeds that still accept scores: today and yesterday, Paris time. */
export function openSeeds(now: Date): string[] {
  return [seedFor(now), seedFor(new Date(now.getTime() - 24 * 60 * 60 * 1000))];
}

/**
 * A saved score and its place on its week's board, for the picture a win is
 * shared with: one more than the other players whose best run that week beats it.
 */
export async function placeOf(
  store: ScoreStore,
  seed: string,
  key: string,
): Promise<{ entry: ScoreEntry; rank: number } | null> {
  const [entry, week] = await Promise.all([store.get(seed, key), weekScores(store, seed)]);
  if (!entry) return null;
  const ahead = week.filter((e) => pseudoKey(e.pseudo) !== key && byRank(e, entry) < 0);
  return { entry, rank: ahead.length + 1 };
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

  const [week, allTime] = await Promise.all([weekScores(store, seed), store.best(TOP)]);
  const rank = week.findIndex((e) => pseudoKey(e.pseudo) === key) + 1;
  return {
    ok: true,
    rank: rank || week.length + 1,
    days: entry.days,
    day: weekOf(seed)[0] === weekOf(seedFor(now))[0] ? "thisWeek" : "lastWeek",
    key,
    board: { week: week.slice(0, TOP), allTime },
  };
}
