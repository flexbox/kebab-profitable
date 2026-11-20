import { describe, expect, it } from "vitest";
import { CHARACTER_IDS } from "@/game/data/characters";
import { createRun, step } from "@/game/engine";
import { BOTS } from "@/game/sim/bots";
import type { CharacterId, GameState, Move } from "@/game/types";
import { roadmap, suggestAction, suggestIdea } from "./coach";

/** A newcomer who does what Chef points at, until the first customer. */
function coached(s: GameState): Move {
  const id = suggestIdea(s);
  if (id) return { t: "idea", id };
  const act = suggestAction(s);
  return act ? { t: "act", id: act } : BOTS.newcomer(s);
}

function wins(who: CharacterId, bot: (s: GameState) => Move, seeds: number) {
  let n = 0;
  for (let i = 0; i < seeds; i++) {
    const s = createRun(`coach-${i}`, who);
    while (!s.outcome && s.day <= 240) step(s, bot(s));
    if (s.outcome?.result === "won") n++;
  }
  return n;
}

describe("Chef's first-run tips", () => {
  it("only ever point at a legal move", () => {
    const s = createRun("coach-legal", "david");
    while (!s.outcome && s.day <= 120) {
      const move = coached(s);
      expect(() => step(s, move)).not.toThrow();
    }
  });

  it("make a newcomer win more often, for every founder", () => {
    for (const who of CHARACTER_IDS) {
      expect(wins(who, coached, 60)).toBeGreaterThan(wins(who, BOTS.newcomer, 60));
    }
  });

  it("open the road one step in, and end it at the first customer", () => {
    const s = createRun("coach-road", "mickael");
    expect(roadmap(s).steps.filter((x) => x.done)).toHaveLength(1);
    while (!s.outcome && (s.project?.customers ?? 0) === 0) step(s, coached(s));
    expect(roadmap(s).reached).toBe(true);
    expect(suggestAction(s)).toBeNull();
  });
});
