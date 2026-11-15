/**
 * Balance report: plays many runs per character with each scripted player.
 *
 *   pnpm sim            400 runs per cell
 *   pnpm sim 2000       2000 runs per cell
 */
import { CHARACTER_IDS } from "../data/characters";
import { createRun, step } from "../engine";
import type { CharacterId, GameState } from "../types";
import { BOTS, type BotName } from "./bots";

const MAX_DAYS = 240;

export function playRun(seed: string, who: CharacterId, bot: BotName): GameState {
  const s = createRun(seed, who);
  const play = BOTS[bot];
  while (!s.outcome && s.day <= MAX_DAYS) step(s, play(s));
  return s;
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function report(runs: number) {
  const bots: BotName[] = ["random", "newcomer", "expert"];
  console.log(`${runs} runs per cell. Win = kebab profitable before day ${MAX_DAYS}.\n`);
  for (const bot of bots) {
    console.log(`== ${bot} ==`);
    console.log(
      "character     win%   med.day  p25  p75   cash-out  cdi  timeout  pivots  moves  loss.day",
    );
    for (const who of CHARACTER_IDS) {
      const wins: number[] = [];
      let cash = 0;
      let cdi = 0;
      let timeout = 0;
      let pivots = 0;
      let moves = 0;
      const lossDays: number[] = [];
      for (let i = 0; i < runs; i++) {
        const s = playRun(`sim-${i}`, who, bot);
        pivots += s.stats.pivots;
        moves += s.history.length;
        if (!s.outcome) timeout++;
        else if (s.outcome.result === "won") wins.push(s.outcome.day);
        else if (s.outcome.reason === "cash") {
          cash++;
          lossDays.push(s.outcome.day);
        }
        else cdi++;
      }
      const sorted = wins.slice().sort((a, b) => a - b);
      const pct = (n: number) => ((100 * n) / runs).toFixed(0).padStart(4) + "%";
      console.log(
        [
          who.padEnd(12),
          pct(wins.length),
          String(median(wins)).padStart(8),
          String(sorted[Math.floor(sorted.length * 0.25)] ?? "-").padStart(5),
          String(sorted[Math.floor(sorted.length * 0.75)] ?? "-").padStart(4),
          pct(cash).padStart(9),
          pct(cdi).padStart(5),
          pct(timeout).padStart(7),
          (pivots / runs).toFixed(1).padStart(7),
          (moves / runs).toFixed(0).padStart(6),
          String(median(lossDays)).padStart(9),
        ].join(" "),
      );
    }
    console.log("");
  }
}

if (process.argv[1]?.endsWith("run.ts")) {
  report(Number(process.argv[2] ?? 400));
}
