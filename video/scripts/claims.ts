/**
 * Checks the film's one claim against the rules engine: the expert player,
 * then the same player with one thing changed: it never posts (every
 * "poster" becomes "coder"). `npx tsx video/scripts/claims.ts`
 */
import { CHARACTER_IDS } from "../../src/game/data/characters";
import { createRun, step } from "../../src/game/engine";
import { BOTS } from "../../src/game/sim/bots";
import type { GameState } from "../../src/game/types";

type Move = ReturnType<(typeof BOTS)["expert"]>;
const silent = (s: GameState): Move => {
  const m = BOTS.expert(s);
  return m.t === "act" && m.id === "poster" ? { t: "act", id: "coder" } : m;
};
const median = (v: number[]) => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)] ?? NaN;

for (const [name, bot] of [["expert", BOTS.expert], ["never posts", silent]] as const) {
  let wins = 0, n = 0;
  const firstCustomer: number[] = [], winDays: number[] = [], lossDays: number[] = [];
  for (const who of CHARACTER_IDS) for (let i = 0; i < 400; i++) {
    const s = createRun(`sim-${i}`, who);
    let first = 0;
    while (!s.outcome && s.day <= 240) {
      step(s, bot(s));
      if (!first && (s.project?.customers ?? 0) > 0) first = s.day;
    }
    n++;
    if (first) firstCustomer.push(first);
    if (s.outcome?.result === "won") { wins++; winDays.push(s.outcome.day); }
    else if (s.outcome) lossDays.push(s.outcome.day);
  }
  console.log(`${name.padEnd(12)} win ${(100 * wins / n).toFixed(0)}%  median win day ${median(winDays)}  ` +
    `first customer in ${(100 * firstCustomer.length / n).toFixed(0)}% (median day ${median(firstCustomer)})  median loss day ${median(lossDays)}`);
}
