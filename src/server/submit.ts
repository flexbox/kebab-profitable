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

/**
 * Checks a submitted run by replaying it move by move with the rules engine.
 * The score is whatever the replay says, never what the client claims.
 */
export async function submit(
  store: ScoreStore,
  body: unknown,
  now: Date,
): Promise<{ ok: true; rank: number; days: number; board: Board } | { ok: false; error: SubmitError }> {
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
  try {
    const final = replay(seed, character as CharacterId, decodeMoves(moves));
    if (final.outcome?.result !== "won") return { ok: false, error: "invalid" };
    days = final.outcome.day;
  } catch {
    return { ok: false, error: "invalid" };
  }

  const tries = Math.max(1, Math.min(999, Math.floor(Number(attempts) || 1)));
  const key = pseudoKey(name);
  const existing = await store.get(seed, key);
  const entry: ScoreEntry =
    existing && existing.days <= days
      ? { ...existing, attempts: Math.max(existing.attempts, tries) }
      : {
          seed,
          pseudo: name,
          character: character as CharacterId,
          days,
          attempts: tries,
          at: now.getTime(),
        };
  await store.put(key, entry);

  const result = await board(store, seed);
  const rank = result.today.findIndex((e) => pseudoKey(e.pseudo) === key) + 1;
  return { ok: true, rank: rank || result.today.length + 1, days: entry.days, board: result };
}
