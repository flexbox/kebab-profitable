import { describe, expect, it } from "vitest";
import { B } from "./balance";
import { dateOf, isAperoDay, isLastDayOfMonth } from "./calendar";
import { decodeMoves, encodeMoves } from "./codec";
import { ACTIONS } from "./data/actions";
import { CHARACTERS, CHARACTER_IDS } from "./data/characters";
import { CHEF, MILESTONES } from "./data/chef";
import { EVENTS } from "./data/events";
import { IDEAS } from "./data/ideas";
import { MEALS } from "./data/meals";
import {
  apply,
  createRun,
  drawIdeas,
  effectTone,
  legalActions,
  mrrOf,
  potentialOf,
  replay,
  step,
} from "./engine";
import { BOTS } from "./sim/bots";
import { playRun } from "./sim/run";
import type { GameState, L, Move } from "./types";

const filled = (text: L) => text.fr.trim().length > 0 && text.en.trim().length > 0;

/** Plays until the next action slot, eating pasta and taking the first choice. */
function toSlot(s: GameState): GameState {
  let state = s;
  for (let i = 0; i < 50 && !state.outcome && state.phase !== "slot"; i++) {
    const move: Move =
      state.phase === "idea"
        ? { t: "idea", id: state.offer[0] }
        : state.phase === "meal"
          ? { t: "meal", id: "pates" }
          : state.phase === "event"
            ? { t: "choice", id: 1 }
            : { t: "ok" };
    try {
      state = apply(state, move);
    } catch {
      state = apply(state, { t: "choice", id: 0 });
    }
  }
  return state;
}

describe("calendar", () => {
  it("starts on Friday 1 January 2027", () => {
    expect(dateOf(1)).toMatchObject({ year: 2027, month: 1, dayOfMonth: 1, weekday: 4 });
    expect(dateOf(32)).toMatchObject({ month: 2, dayOfMonth: 1, daysInMonth: 28 });
  });

  it("holds the apéro on the third Thursday of each month", () => {
    const aperos = Array.from({ length: 120 }, (_, i) => i + 1).filter(isAperoDay);
    expect(aperos.map((d) => `${dateOf(d).dayOfMonth}/${dateOf(d).month}`)).toEqual([
      "21/1",
      "18/2",
      "18/3",
      "15/4",
    ]);
  });
});

describe("content", () => {
  it("has both languages everywhere", () => {
    for (const c of CHARACTERS) {
      expect(filled(c.role) && filled(c.perk.name) && filled(c.perk.desc)).toBe(true);
      expect(filled(c.flaw.name) && filled(c.flaw.desc)).toBe(true);
    }
    for (const i of IDEAS) expect(filled(i.name) && filled(i.pitch)).toBe(true);
    for (const m of MEALS) expect(filled(m.name) && filled(m.desc)).toBe(true);
    for (const a of ACTIONS) expect(filled(a.name) && filled(a.desc)).toBe(true);
    for (const e of EVENTS) {
      expect(filled(e.title) && filled(e.text), e.id).toBe(true);
      for (const c of e.choices) {
        expect(filled(c.label), e.id).toBe(true);
        expect(c.outcomes.length, e.id).toBeGreaterThan(0);
        for (const o of c.outcomes) expect(filled(o.text), e.id).toBe(true);
      }
      for (const o of e.urgent?.missed ?? []) expect(filled(o.text), e.id).toBe(true);
    }
    for (const lines of Object.values(CHEF)) for (const l of lines) expect(filled(l)).toBe(true);
    for (const l of Object.values(MILESTONES)) expect(filled(l)).toBe(true);
  });

  it("has unique ids and valid references", () => {
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const c of CHARACTERS) {
      const signature = IDEAS.find((i) => i.id === c.signatureIdea);
      expect(signature?.owner).toBe(c.id);
    }
    expect(IDEAS).toHaveLength(15);
    expect(EVENTS.filter((e) => e.kind === "cameo").every((e) => !!e.who)).toBe(true);
  });

  it("gives every event a choice that is always open", () => {
    for (const e of EVENTS) {
      expect(e.choices.some((c) => !c.when), e.id).toBe(true);
    }
  });

  it("gives every urgent card a real choice, a short clock and a price for missing it", () => {
    const urgent = EVENTS.filter((e) => e.urgent);
    expect(urgent.length).toBeGreaterThanOrEqual(10);
    for (const e of urgent) {
      expect(e.kind, e.id).toBe("urgent");
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.urgent!.seconds, e.id).toBeGreaterThanOrEqual(6);
      expect(e.urgent!.seconds, e.id).toBeLessThanOrEqual(15);
      // Letting the clock run out always costs something.
      expect(e.urgent!.missed.some((o) => !o.when), e.id).toBe(true);
      for (const o of e.urgent!.missed) expect(effectTone(o.effect), e.id).toBe("bad");
    }
    // Cards answered at leisure have no clock.
    expect(EVENTS.filter((e) => e.kind === "urgent").every((e) => !!e.urgent)).toBe(true);
  });

  it("never lets an urgent card end a run by itself", () => {
    for (const e of EVENTS.filter((card) => card.urgent)) {
      const floor = e.when?.minCash ?? 0;
      for (const o of e.urgent!.missed) {
        expect(-(o.effect.cash ?? 0), e.id).toBeLessThanOrEqual(floor);
      }
      for (const c of e.choices) {
        const guard = Math.max(floor, c.when?.minCash ?? 0);
        for (const o of c.outcomes) {
          expect(-(o.effect.cash ?? 0), e.id).toBeLessThanOrEqual(guard);
          expect(o.effect.end, e.id).toBeUndefined();
        }
      }
    }
  });
});

describe("a new run", () => {
  it("starts on day 1 with the agreed pot and the signature idea on offer", () => {
    for (const c of CHARACTERS) {
      const s = createRun("seed", c.id);
      expect(s.cash).toBe(1500);
      expect(s.day).toBe(1);
      expect(s.phase).toBe("idea");
      expect(s.offer).toHaveLength(3);
      expect(s.offer[0]).toBe(c.signatureIdea);
    }
  });

  it("offers everyone the same two generic ideas on the same seed", () => {
    const tails = CHARACTER_IDS.map((id) =>
      drawIdeas("same-day", 0, id, []).slice(1).join(","),
    );
    // A character whose signature idea is one of the generic two sees the next one instead.
    const counts = new Map<string, number>();
    for (const t of tails) counts.set(t, (counts.get(t) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(3);
  });

  it("fixes each idea's potential by seed, whoever plays", () => {
    expect(potentialOf("a", "vigie")).toBe(potentialOf("a", "vigie"));
    const spread = new Set(
      Array.from({ length: 60 }, (_, i) => potentialOf(`s${i}`, "vigie")),
    );
    expect(spread.size).toBeGreaterThan(2);
  });
});

describe("rules", () => {
  it("asks for the meal after the morning slot and charges for it", () => {
    let s = toSlot(createRun("meal", "david"));
    s = apply(s, { t: "act", id: "coder" });
    expect(s.phase).toBe("meal");
    const before = s.cash;
    s = apply(s, { t: "meal", id: "kebab" });
    expect(s.cash).toBe(before - 9);
    expect(s.stats.kebabs).toBe(1);
  });

  it("only ships once the MVP is built", () => {
    let s = toSlot(createRun("ship", "mickael"));
    const shipper = () => legalActions(s).find((a) => a.id === "shipper")!;
    expect(shipper().enabled).toBe(false);
    for (let i = 0; i < 60 && !shipper().enabled; i++) {
      s = toSlot(apply(s, { t: "act", id: "coder" }));
    }
    expect(shipper().enabled).toBe(true);
    s = apply(s, { t: "act", id: "shipper" });
    expect(s.project?.launched).toBe(true);
  });

  it("only opens the apéro on the evening of the third Thursday", () => {
    let s = toSlot(createRun("apero", "karl"));
    const apero = () => legalActions(s).find((a) => a.id === "apero")!;
    let opened = 0;
    for (let i = 0; i < 400 && s.day <= 21 && !s.outcome; i++) {
      if (apero().enabled) {
        opened++;
        expect(s.day).toBe(21);
        expect(s.slot).toBe(2);
      }
      s = toSlot(apply(s, { t: "act", id: "repos" }));
    }
    expect(opened).toBe(1);
  });

  it("caps freelance at the monthly budget", () => {
    let s = toSlot(createRun("freelance", "karl"));
    let done = 0;
    while (legalActions(s).find((a) => a.id === "freelance")!.enabled && done < 20) {
      s = toSlot(apply(s, { t: "act", id: "freelance" }));
      done++;
    }
    expect(done).toBe(B.freelancePerMonth);
  });

  it("ends in a return to the day job when the rent cannot be paid", () => {
    const s = toSlot(createRun("broke", "matthys"));
    let state = s;
    for (let i = 0; i < 3000 && !state.outcome; i++) {
      state = toSlot(apply(state, { t: "act", id: "repos" }));
    }
    expect(state.outcome).toMatchObject({ result: "lost", reason: "cash" });
    // Rent is what ends it, so the last day is always a month-end.
    expect(isLastDayOfMonth(state.outcome!.day)).toBe(true);
    expect(state.outcome!.day).toBeGreaterThanOrEqual(59);
    expect(state.phase).toBe("lost");
  });

  it("wins the moment MRR reaches the price of a kebab a day", () => {
    const s = toSlot(createRun("win", "david"));
    s.project!.launched = true;
    s.project!.customers = Math.ceil(B.kebabMrr / s.project!.price) - 1;
    expect(mrrOf(s)).toBeLessThan(B.kebabMrr);
    s.project!.customers += 1;
    const next = toSlot(apply(s, { t: "act", id: "repos" }));
    let state = next;
    for (let i = 0; i < 10 && !state.outcome; i++) {
      state = toSlot(apply(state, { t: "act", id: "repos" }));
    }
    expect(state.outcome).toMatchObject({ result: "won", reason: "kebab" });
  });

  it("deals urgent cards right after a slot, and the others overnight", () => {
    let urgent = 0;
    let overnight = 0;
    for (let i = 0; i < 12; i++) {
      const s = createRun(`urgent-${i}`, "david");
      while (!s.outcome && s.day <= 60) {
        step(s, BOTS.expert(s));
        if (s.phase !== "event") continue;
        const last = s.history[s.history.length - 1];
        if (EVENTS.find((e) => e.id === s.pendingEvent)!.urgent) {
          urgent++;
          expect(last.t).toBe("act");
          expect(s.day).toBeGreaterThanOrEqual(B.urgentFirstDay);
        } else {
          overnight++;
          expect(s.slot).toBe(0);
        }
      }
    }
    expect(urgent).toBeGreaterThan(20);
    expect(overnight).toBeGreaterThan(20);
  });

  it("takes a missed clock as a move, on urgent cards only", () => {
    for (const ev of EVENTS) {
      const s = toSlot(createRun(`miss-${ev.id}`, "david"));
      s.project!.launched = true;
      s.project!.customers = 5;
      s.project!.quality = 40;
      s.audience = 400;
      s.pendingEvent = ev.id;
      s.phase = "event";
      if (!ev.urgent) {
        expect(() => apply(s, { t: "miss" })).toThrow(/Not an urgent card/);
        continue;
      }
      const next = apply(s, { t: "miss" });
      expect(next.eventResult).toMatchObject({ id: ev.id, missed: true, tone: "bad" });
      expect(next.stats.missed).toBe(1);
      expect(next.pendingEvent === ev.id).toBe(false);
      expect(next.history[next.history.length - 1]).toEqual({ t: "miss" });
    }
  });

  it("rejects illegal moves and leaves the state untouched", () => {
    const s = createRun("illegal", "david");
    expect(() => apply(s, { t: "act", id: "coder" })).toThrow();
    expect(() => apply(s, { t: "idea", id: "not-on-offer" })).toThrow();
    expect(s.history).toHaveLength(0);
  });
});

describe("determinism", () => {
  it("replays a run to the same state from its moves", () => {
    for (const who of CHARACTER_IDS) {
      const played = playRun("replay-seed", who, "expert");
      const again = replay("replay-seed", who, played.history);
      expect(again).toEqual(played);
    }
  });

  it("round-trips moves through the leaderboard code", () => {
    const played = playRun("codec-seed", "christophe", "random");
    // The random player lets the clock run out now and then.
    expect(played.history.some((m) => m.t === "miss")).toBe(true);
    const code = encodeMoves(played.history);
    expect(code.length).toBeLessThanOrEqual(played.history.length * 3);
    expect(decodeMoves(code)).toEqual(played.history);
    expect(replay("codec-seed", "christophe", decodeMoves(code)).outcome).toEqual(
      played.outcome,
    );
  });

  it("plays every character to the end with every scripted player", () => {
    for (const who of CHARACTER_IDS) {
      for (const bot of Object.keys(BOTS) as (keyof typeof BOTS)[]) {
        for (let i = 0; i < 6; i++) {
          const s = playRun(`all-${i}`, who, bot);
          expect(s.day).toBeGreaterThan(1);
          expect(Number.isFinite(s.cash)).toBe(true);
          expect(s.faim).toBeGreaterThanOrEqual(0);
          expect(s.moral).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("survives every event choice", () => {
    for (const ev of EVENTS) {
      for (let c = 0; c < ev.choices.length; c++) {
        const s = toSlot(createRun(`event-${ev.id}`, "david"));
        s.project!.launched = true;
        s.project!.customers = 5;
        s.project!.quality = 40;
        s.audience = 400;
        s.pendingEvent = ev.id;
        s.phase = "event";
        const state = structuredClone(s);
        try {
          step(state, { t: "choice", id: c });
        } catch (error) {
          // A choice may be closed in this state; anything else is a bug.
          expect(String(error)).toMatch(/Illegal choice/);
          continue;
        }
        expect(state.eventsSeen).toContain(ev.id);
        expect(state.pendingEvent === ev.id).toBe(false);
      }
    }
  });
});
