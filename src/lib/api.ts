import { encodeMoves } from "@/game/codec";
import type { GameState } from "@/game/types";
import type { ScoreEntry } from "@/server/scores";
import type { Board, SubmitError } from "@/server/submit";

export type { Board, ScoreEntry };

export async function fetchBoard(seed: string): Promise<Board> {
  const res = await fetch(`/api/scores?seed=${encodeURIComponent(seed)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("network");
  return (await res.json()) as Board;
}

export type SubmitResult =
  | { ok: true; rank: number; days: number; board: Board }
  | { ok: false; error: SubmitError | "network" | "offline" };

export async function submitScore(
  state: GameState,
  pseudo: string,
  attempts: number,
): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        seed: state.seed,
        character: state.character,
        pseudo,
        attempts,
        moves: encodeMoves(state.history),
      }),
    });
    return (await res.json()) as SubmitResult;
  } catch {
    return { ok: false, error: "network" };
  }
}
