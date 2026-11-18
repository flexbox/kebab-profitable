import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { encodeMoves } from "@/game/codec";
import { playRun } from "@/game/sim/run";
import { cleanPseudo } from "./pseudo";
import { bestScore } from "./redis";
import { byRank, fileStore, type ScoreEntry } from "./scores";
import { board, LIMIT, openSeeds, submit, underLimit } from "./submit";

const NOW = new Date("2026-12-10T19:30:00+01:00");
const SEED = "2026-12-10";
const EVE = "2026-12-09";

/** A score written straight to the store, for cases a real run cannot stage. */
function score(pseudo: string, fields: Partial<ScoreEntry> = {}): ScoreEntry {
  return {
    seed: SEED,
    pseudo,
    character: "karl",
    days: 40,
    cash: 1000,
    attempts: 1,
    at: NOW.getTime(),
    ...fields,
  };
}

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
    expect(result).toMatchObject({ ok: true, rank: 1, days: run.outcome!.day, day: "today" });
    const saved = await board(store, SEED);
    expect(saved.today).toHaveLength(1);
    expect(saved.today[0]).toMatchObject({
      pseudo: "flexbox",
      attempts: 3,
      cash: Math.round(run.cash),
    });
    expect(saved.allTime).toHaveLength(1);
  });

  it("takes the cash from the replay, never from the request", async () => {
    const store = tempStore();
    const run = winningRun(SEED);
    await submit(
      store,
      {
        seed: SEED,
        character: run.character,
        pseudo: "flexbox",
        cash: 999_999,
        days: 1,
        moves: encodeMoves(run.history),
      },
      NOW,
    );
    const [saved] = (await board(store, SEED)).today;
    expect(saved).toMatchObject({ days: run.outcome!.day, cash: Math.round(run.cash) });
  });

  it("keeps one score per name, and the earlier score wins an exact tie", async () => {
    const store = tempStore();
    const run = winningRun(SEED);
    const body = { seed: SEED, character: run.character, moves: encodeMoves(run.history) };
    const later = new Date(NOW.getTime() + 60_000);
    await submit(store, { ...body, pseudo: "Karl", attempts: 1 }, NOW);
    await submit(store, { ...body, pseudo: "karl", attempts: 5 }, later);
    // The same run with fewer attempts: attempts no longer decide anything.
    const second = await submit(store, { ...body, pseudo: "Mick", attempts: 1 }, later);
    const saved = await board(store, SEED);
    expect(saved.today.map((e) => e.pseudo)).toEqual(["Karl", "Mick"]);
    expect(saved.today[0]).toMatchObject({ attempts: 5, at: NOW.getTime() });
    expect(second).toMatchObject({ ok: true, rank: 2 });
  });

  it("ranks by days, then by cash, then by time", async () => {
    const rows = [
      score("slow", { days: 45, cash: 9000 }),
      score("late", { at: NOW.getTime() + 1 }),
      score("rich", { cash: 2500 }),
      score("first"),
    ];
    expect(rows.sort(byRank).map((e) => e.pseudo)).toEqual(["rich", "first", "late", "slow"]);
    // The all-time index sorts the same way, short of the time of saving.
    expect(bestScore(score("a", { cash: 2500 }))).toBeLessThan(bestScore(score("b")));
    expect(bestScore(score("a", { days: 39, cash: 0 }))).toBeLessThan(
      bestScore(score("b", { cash: 9_000_000 })),
    );
  });

  it("gives the rank over every score, past the 50 shown", async () => {
    const store = tempStore();
    for (let i = 0; i < 55; i++) await store.put(`bot${i}`, score(`bot${i}`, { days: 1 }));
    const run = winningRun(SEED);
    const result = await submit(
      store,
      { seed: SEED, character: run.character, pseudo: "flexbox", moves: encodeMoves(run.history) },
      NOW,
    );
    expect(result).toMatchObject({ ok: true, rank: 56 });
    expect(result.ok && result.board.today).toHaveLength(50);
  });

  it("says which day's board a run finished after midnight went to", async () => {
    const store = tempStore();
    const run = winningRun(EVE);
    const result = await submit(
      store,
      { seed: EVE, character: run.character, pseudo: "flexbox", moves: encodeMoves(run.history) },
      NOW,
    );
    expect(result).toMatchObject({ ok: true, rank: 1, day: "yesterday" });
  });

  it("shows one row per player on the all-time board: their best run", async () => {
    const store = tempStore();
    // A better run than any real one, saved yesterday under another spelling.
    await store.putBest("flexbox", score("Flexbox", { seed: EVE, days: 1 }));
    const run = winningRun(SEED);
    const body = { seed: SEED, character: run.character, moves: encodeMoves(run.history) };
    await submit(store, { ...body, pseudo: "flexbox" }, NOW);
    await submit(store, { ...body, pseudo: "Mick" }, NOW);

    const { allTime } = await board(store, SEED);
    expect(allTime.map((e) => [e.pseudo, e.seed])).toEqual([
      ["Flexbox", EVE],
      ["Mick", SEED],
    ]);

    // A weaker best is replaced by today's run.
    await store.putBest("flexbox", score("Flexbox", { seed: EVE, days: 900 }));
    await submit(store, { ...body, pseudo: "flexbox" }, NOW);
    const after = (await board(store, SEED)).allTime.find((e) => e.pseudo === "flexbox");
    expect(after).toMatchObject({ seed: SEED, days: run.outcome!.day });
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

describe("the submission limit", () => {
  it("lets one address send 30 scores in 10 minutes, then makes it wait", async () => {
    const store = tempStore();
    for (let i = 0; i < LIMIT.max; i++) expect(await underLimit(store, "bar", NOW)).toBe(true);
    expect(await underLimit(store, "bar", NOW)).toBe(false);
    // Another address is not held back, and the first one is free again later.
    expect(await underLimit(store, "home", NOW)).toBe(true);
    const later = new Date(NOW.getTime() + LIMIT.seconds * 1000);
    expect(await underLimit(store, "bar", later)).toBe(true);
  });
});
