/**
 * Plays one real run twice, for the film: the expert player, and the same
 * player with one change, never posting. Writes the day-by-day cash, MRR and
 * moves of both to video/src/runs.json, so every number on screen comes from
 * the rules engine. `npx tsx video/scripts/runs.ts`
 */
import { writeFileSync } from "node:fs";
import { createRun, mrrOf, step } from "../../src/game/engine";
import { BOTS } from "../../src/game/sim/bots";
import type { GameState } from "../../src/game/types";

type Move = ReturnType<(typeof BOTS)["expert"]>;
const silent = (s: GameState): Move => {
  const m = BOTS.expert(s);
  return m.t === "act" && m.id === "poster" ? { t: "act", id: "coder" } : m;
};

interface Day { day: number; cash: number; mrr: number; customers: number; moves: string[] }

function play(seed: string, bot: (s: GameState) => Move) {
  const s = createRun(seed, "david");
  const days: Day[] = [];
  let moves: string[] = [];
  let day = s.day;
  while (!s.outcome && s.day <= 240) {
    const m = bot(s);
    if (m.t === "act") moves.push(m.id);
    step(s, m);
    if (s.day !== day || s.outcome) {
      // A move that spans several days (time away) leaves the days between unchanged.
      const last = s.outcome ? day : s.day - 1;
      for (let d = day; d <= last; d++) {
        days.push({ day: d, cash: Math.round(s.cash), mrr: Math.round(mrrOf(s)), customers: s.project?.customers ?? 0, moves: d === day ? moves : [] });
      }
      moves = [];
      day = s.day;
    }
  }
  return { outcome: s.outcome, days };
}

for (let i = 0; i < 400; i++) {
  const seed = `sim-${i}`;
  const a = play(seed, silent);
  const b = play(seed, BOTS.expert);
  if (a.outcome?.result === "lost" && b.outcome?.result === "won" && b.outcome.day === 43 && a.outcome.day === 59) {
    writeFileSync("video/src/runs.json", JSON.stringify({ seed, founder: "david", silent: a, expert: b }));
    console.log(seed, "silent lost day", a.outcome.day, (a.outcome as { reason?: string }).reason, "| expert won day", b.outcome.day);
    console.log("silent moves days 1-3:", a.days.slice(0, 3).map((d) => d.moves.join(",")));
    console.log("expert moves days 1-3:", b.days.slice(0, 3).map((d) => d.moves.join(",")));
    console.log("silent last days:", a.days.slice(-3));
    console.log("expert last days:", b.days.slice(-3));
    break;
  }
}
