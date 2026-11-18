import { encodeMoves } from "@/game/codec";
import type { GameState } from "@/game/types";
import type { ScoreEntry } from "@/server/scores";
import type { Board, BoardDay, SubmitError, Submitted } from "@/server/submit";

export type { Board, BoardDay, ScoreEntry };

export async function fetchBoard(seed: string): Promise<Board> {
  const res = await fetch(`/api/scores?seed=${encodeURIComponent(seed)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("network");
  return (await res.json()) as Board;
}

export type SubmitResult =
  | Submitted
  | { ok: false; error: SubmitError | "network" | "offline" | "busy" };

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
