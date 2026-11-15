import { ACTIONS } from "./data/actions";
import { IDEAS } from "./data/ideas";
import { MEALS } from "./data/meals";
import type { Move } from "./types";

/**
 * Packs a run's moves into a short string for the leaderboard.
 *
 *   a-i  an action (by position in ACTIONS)
 *   0-3  a meal (by position in MEALS)
 *   x-z  an event choice (0, 1, 2)
 *   k    a dismissed month report
 *   Ixx  an idea (two base-36 digits, by position in IDEAS)
 */
export function encodeMoves(moves: readonly Move[]): string {
  let out = "";
  for (const move of moves) {
    switch (move.t) {
      case "act":
        out += String.fromCharCode(97 + ACTIONS.findIndex((a) => a.id === move.id));
        break;
      case "meal":
        out += String(MEALS.findIndex((m) => m.id === move.id));
        break;
      case "choice":
        out += String.fromCharCode(120 + move.id);
        break;
      case "ok":
        out += "k";
        break;
      case "idea":
        out += "I" + IDEAS.findIndex((i) => i.id === move.id).toString(36).padStart(2, "0");
        break;
    }
  }
  return out;
}

export function decodeMoves(code: string): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === "I") {
      const def = IDEAS[parseInt(code.slice(i + 1, i + 3), 36)];
      if (!def) throw new Error("Bad idea code");
      moves.push({ t: "idea", id: def.id });
      i += 2;
    } else if (c === "k") {
      moves.push({ t: "ok" });
    } else if (c >= "x" && c <= "z") {
      moves.push({ t: "choice", id: c.charCodeAt(0) - 120 });
    } else if (c >= "0" && c <= "9") {
      const def = MEALS[Number(c)];
      if (!def) throw new Error("Bad meal code");
      moves.push({ t: "meal", id: def.id });
    } else if (c >= "a" && c <= "w") {
      const def = ACTIONS[c.charCodeAt(0) - 97];
      if (!def) throw new Error("Bad action code");
      moves.push({ t: "act", id: def.id });
    } else {
      throw new Error("Bad move code");
    }
  }
  return moves;
}
