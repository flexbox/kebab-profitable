import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { encodeMoves } from "@/game/codec";
import { playRun } from "@/game/sim/run";
import { cleanPseudo } from "./pseudo";
import { fileStore } from "./scores";
import { board, openSeeds, submit } from "./submit";

const NOW = new Date("2026-12-10T19:30:00+01:00");
const SEED = "2026-12-10";

function tempStore() {
  return fileStore(path.join(mkdtempSync(path.join(tmpdir(), "kp-")), "scores.json"));
}

/** A real winning run for the seed, found by the scripted expert. */
function winningRun(seed: string) {
  for (const who of ["karl", "mickael", "matthys", "david", "christophe"] as const) {
    const s = playRun(seed, who, "expert");
    if (s.outcome?.result === "won") return s;
  }
  throw new Error("no winning run found");
}

describe("pseudo", () => {
  it("accepts ordinary names and trims them", () => {
    expect(cleanPseudo("  flexbox ")).toBe("flexbox");
    expect(cleanPseudo("Jean-Michel")).toBe("Jean-Michel");
    expect(cleanPseudo("Zoé 59")).toBe("Zoé 59");
  });

  it("rejects names that are too short, too long, rude or odd", () => {
    expect(cleanPseudo("a")).toBeNull();
    expect(cleanPseudo("x".repeat(17))).toBeNull();
    expect(cleanPseudo("p.u.t.a.i.n")).toBeNull();
    expect(cleanPseudo("<script>")).toBeNull();
    expect(cleanPseudo(42)).toBeNull();
  });
});

describe("submitting a score", () => {
  it("accepts today's and yesterday's seeds only", () => {
    expect(openSeeds(NOW)).toEqual(["2026-12-10", "2026-12-09"]);
  });

  it("replays the run and records the days the replay finds", async () => {
    const store = tempStore();
    const run = winningRun(SEED);
    const result = await submit(
      store,
      {
        seed: SEED,
        character: run.character,
        pseudo: "flexbox",
        attempts: 3,
        moves: encodeMoves(run.history),
      },
      NOW,
    );
    expect(result).toMatchObject({ ok: true, rank: 1, days: run.outcome!.day });
    const saved = await board(store, SEED);
    expect(saved.today).toHaveLength(1);
    expect(saved.today[0]).toMatchObject({ pseudo: "flexbox", attempts: 3 });
    expect(saved.allTime).toHaveLength(1);
  });

  it("keeps the best score per name and ranks by days", async () => {
    const store = tempStore();
    const run = winningRun(SEED);
    const body = { seed: SEED, character: run.character, moves: encodeMoves(run.history) };
    await submit(store, { ...body, pseudo: "Karl", attempts: 1 }, NOW);
    await submit(store, { ...body, pseudo: "karl", attempts: 5 }, NOW);
    const second = await submit(store, { ...body, pseudo: "Mick", attempts: 2 }, NOW);
    const saved = await board(store, SEED);
    expect(saved.today.map((e) => e.pseudo)).toEqual(["Mick", "Karl"]);
    expect(saved.today[1].attempts).toBe(5);
    expect(second).toMatchObject({ ok: true, rank: 1 });
  });

  it("rejects a run that does not win, a tampered run and a stale seed", async () => {
    const store = tempStore();
    const run = winningRun(SEED);
    const moves = encodeMoves(run.history);
    const base = { seed: SEED, character: run.character, pseudo: "cheater", attempts: 1 };

    expect(await submit(store, { ...base, moves: moves.slice(0, -40) }, NOW)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await submit(store, { ...base, moves: "zzzz" }, NOW)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await submit(store, { ...base, moves, character: "levels" }, NOW)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await submit(store, { ...base, moves, seed: "2026-11-01" }, NOW)).toEqual({
      ok: false,
      error: "stale",
    });
    expect(await submit(store, { ...base, moves, pseudo: "x" }, NOW)).toEqual({
      ok: false,
      error: "pseudo",
    });
    expect((await board(store, SEED)).today).toHaveLength(0);
  });
});
