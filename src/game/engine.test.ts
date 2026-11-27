import { describe, expect, it } from "vitest";
import { B } from "./balance";
import { dateOf, isAperoDay, isLastDayOfMonth } from "./calendar";
import { decodeMoves, encodeMoves } from "./codec";
import { ACTIONS } from "./data/actions";
import { CHARACTERS, CHARACTER_IDS } from "./data/characters";
import { CHEF, MILESTONES } from "./data/chef";
import { EVENTS, FOLLOW_UPS, eventCard, outcomesOf } from "./data/events";
import { APERO_CARDS, APERO_HOST } from "./data/apero";
import { GUESTS } from "./data/guests";
import { IDEAS } from "./data/ideas";
import { MEALS } from "./data/meals";
import {
  apply,
  createRun,
  drawIdeas,
  effectTone,
  legalActions,
  mrrOf,
  outcomeTone,
  potentialOf,
  replay,
  shownChoices,
  step,
} from "./engine";
import { BOTS } from "./sim/bots";
import { playRun } from "./sim/run";
import type { EventDef, GameState, L, Move } from "./types";

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
    for (const lines of Object.values(MILESTONES)) for (const l of lines) expect(filled(l)).toBe(true);
  });

  it("has unique ids and valid references", () => {
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const c of CHARACTERS) {
      const signature = IDEAS.find((i) => i.id === c.signatureIdea);
      expect(signature?.owner).toBe(c.id);
      // A handle on X is written without the @.
      if (c.handle) expect(c.handle, c.id).toMatch(/^\w{1,15}$/);
    }
    expect(IDEAS).toHaveLength(30);
    expect(EVENTS.filter((e) => e.kind === "cameo").every((e) => !!e.who)).toBe(true);
    // Every guest has a cameo, and a handle without the @.
    for (const [id, g] of Object.entries(GUESTS)) {
      expect(EVENTS.some((e) => e.who === id), id).toBe(true);
      expect(g.handle, id).toMatch(/^\w{1,15}$/);
    }
    // A card dealt by another one exists, and is answered the same way.
    for (const e of EVENTS) {
      for (const o of outcomesOf(e)) {
        if (o.then) expect(!!eventCard(o.then).urgent, e.id).toBe(!!e.urgent);
      }
    }
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
      expect(e.urgent!.seconds, e.id).toBeGreaterThanOrEqual(5);
      expect(e.urgent!.seconds, e.id).toBeLessThanOrEqual(10);
      // Letting the clock run out always costs something.
      expect(e.urgent!.missed.some((o) => !o.when), e.id).toBe(true);
      for (const o of e.urgent!.missed) expect(effectTone(o.effect), e.id).toBe("bad");
    }
    // Cards answered at leisure have no clock.
    expect(EVENTS.filter((e) => e.kind === "urgent").every((e) => !!e.urgent)).toBe(true);
  });

  it("never lets an urgent card end a run by itself", () => {
    // Checks a card with the cash it is sure to find, then the cards it deals
    // with what is left of it.
    const check = (e: EventDef, floor: number, depth = 0) => {
      // A chain of reminders always ends.
      expect(depth, e.id).toBeLessThan(8);
      const answers = [
        ...e.choices.map((c) => ({
          guard: Math.max(floor, c.when?.minCash ?? 0),
          outcomes: c.outcomes,
        })),
        { guard: floor, outcomes: e.urgent!.missed },
      ];
      for (const { guard, outcomes } of answers) {
        for (const o of outcomes) {
          const cost = Math.max(0, -(o.effect.cash ?? 0));
          expect(cost, e.id).toBeLessThanOrEqual(guard);
          expect(o.effect.end, e.id).toBeUndefined();
          if (o.then) check(eventCard(o.then), guard - cost, depth + 1);
        }
      }
    };
    for (const e of EVENTS.filter((card) => card.urgent && !FOLLOW_UPS.has(card.id))) {
      check(e, e.when?.minCash ?? 0);
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
        if (FOLLOW_UPS.has(s.pendingEvent!)) {
          // A reminder is never drawn: it follows the answer to the card before it.
          expect(["choice", "miss"]).toContain(last.t);
          continue;
        }
        if (APERO_CARDS.some((e) => e.id === s.pendingEvent)) {
          // Dealt by the evening at the bar, not by the night.
          expect(last).toEqual({ t: "act", id: "apero" });
          continue;
        }
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

  it("deals a card at every apéro, never an urgent one: Indie Hackers first, then the others", () => {
    const met = new Set<string>();
    let evenings = 0;
    for (let i = 0; i < 40; i++) {
      const who = CHARACTER_IDS[i % CHARACTER_IDS.length];
      const s = createRun(`apero-${i}`, who);
      const cards: string[] = [];
      while (!s.outcome && s.day <= 120) {
        const out = s.phase === "slot" && legalActions(s).some((a) => a.id === "apero" && a.enabled);
        const move: Move = out ? { t: "act", id: "apero" } : BOTS.newcomer(s);
        step(s, move);
        if (!out || s.outcome) continue;
        evenings++;
        const card = APERO_CARDS.find((e) => e.id === s.pendingEvent);
        expect(card, `day ${s.day}`).toBeDefined();
        cards.push(card!.id);
        met.add(card!.id);
        // A member never sells their own advice to themselves.
        expect(card!.when?.notFounder).not.toBe(who);
      }
      if (cards.length > 0) expect(cards[0]).toBe(APERO_HOST);
      // Nobody tells you the same thing twice while there is something new to hear.
      expect(new Set(cards).size).toBe(cards.length);
    }
    expect(evenings).toBeGreaterThan(40);
    expect(met.size).toBe(APERO_CARDS.length);
  });

  it("brings each founder different guests, and the same founder the same ones", () => {
    const guests = (seed: string, who: (typeof CHARACTER_IDS)[number]) => {
      const s = createRun(seed, who);
      const met: string[] = [];
      while (!s.outcome && s.day <= 60) {
        const before = s.pendingEvent;
        step(s, BOTS.expert(s));
        const card = s.pendingEvent && s.pendingEvent !== before ? eventCard(s.pendingEvent) : null;
        if (card?.kind === "cameo") met.push(`${card.who} on day ${s.day}`);
      }
      return met.join(", ");
    };
    // Who drops by is the founder's luck: on one day's seed, no two founders get the same visits.
    const today = CHARACTER_IDS.map((who) => guests("guests", who));
    expect(new Set(today).size).toBe(CHARACTER_IDS.length);
    // The same founder playing the same moves gets the same visits: the leaderboard relies on it.
    expect(guests("guests", "karl")).toBe(guests("guests", "karl"));
    // And the first guest of a run is not always the same one.
    const first = new Set<string>();
    for (let i = 0; i < 30; i++) first.add(guests(`first-${i}`, "david").split(" ")[0]);
    expect(first.size).toBeGreaterThanOrEqual(5);

    // At a milestone, the guest who walks on changes with the run too.
    const walkOns = new Set<string>();
    for (let i = 0; i < 12; i++) {
      for (const who of CHARACTER_IDS) {
        const s = createRun(`walk-${i}`, who);
        // The journal only keeps its last entries: read it as the run goes.
        while (!s.outcome && s.day <= 60 && !s.milestones.includes("firstCustomer")) step(s, BOTS.expert(s));
        const line = s.log.find((entry) => MILESTONES.firstCustomer.some((l) => l.fr === entry.text.fr));
        if (line) walkOns.add(line.text.fr);
      }
    }
    expect(walkOns.size).toBe(MILESTONES.firstCustomer.length);
  });

  it("calls a guest's advice good news when it pays, and a setback when it backfires", () => {
    // Arvid's card is the exception: it opens on bad news, and the advice is how to take it.
    const cameos = EVENTS.filter((e) => e.kind === "cameo" && e.tone !== "bad");
    expect(cameos.length).toBeGreaterThanOrEqual(13);
    for (const e of cameos) {
      // The first choice is the one that takes the advice.
      const outcomes = e.choices[0].outcomes;
      const usual = Math.max(...outcomes.map((o) => o.p ?? 1));
      // It can go wrong, but it usually does not.
      expect(outcomes.length, e.id).toBeGreaterThanOrEqual(2);
      for (const o of outcomes) {
        const pays = (o.p ?? 1) === usual && o.when?.mrrGrew !== false;
        expect(outcomeTone(o), `${e.id}: ${o.text.en}`).toBe(pays ? "good" : "bad");
      }
    }
  });

  it("never brings a guest whose advice changes nothing", () => {
    const stand = (s: GameState) =>
      JSON.stringify([s.cash, s.moral, s.energie, s.audience, s.flags, s.boosts.length, s.project]);
    const paid = new Map<string, number>();
    for (const bot of ["newcomer", "expert"] as const) {
      for (let i = 0; i < 40; i++) {
        const who = CHARACTER_IDS[i % CHARACTER_IDS.length];
        const s = createRun(`advice-${i}`, who);
        while (!s.outcome && s.day <= 120) {
          const card = s.phase === "event" && s.pendingEvent ? eventCard(s.pendingEvent) : null;
          if (card?.kind === "cameo") {
            const next = apply(s, { t: "choice", id: 0 });
            if (next.eventResult?.tone === "good") {
              const where = `${card.id} on day ${s.day} of advice-${i}`;
              paid.set(card.id, (paid.get(card.id) ?? 0) + 1);
              expect(stand(next), where).not.toBe(stand(s));
              // What the result says happened did happen.
              if (card.id === "levels-ship" || card.id === "marclou-boilerplate") {
                expect(next.project!.mvpSize, where).toBeLessThan(s.project!.mvpSize);
              }
              if (card.id === "sanlis-uneed") {
                expect(next.project!.customers, where).toBeGreaterThan(s.project!.customers);
              }
            }
          }
          step(s, BOTS[bot](s));
        }
      }
    }
    // Every guest turned up, and their advice paid, at least once.
    for (const e of EVENTS.filter((card) => card.kind === "cameo")) {
      expect(paid.get(e.id) ?? 0, e.id).toBeGreaterThan(0);
    }
  });

  it("gives every guest advice short enough to post", () => {
    for (const who of Object.values(GUESTS)) {
      expect(filled(who.lesson)).toBe(true);
      expect(who.lesson.fr.length).toBeLessThanOrEqual(150);
      expect(who.lesson.en.length).toBeLessThanOrEqual(150);
    }
  });

  it("lifts morale when the month's report is shared, once", () => {
    // The deck shifts whenever a card is added, so take the first seed whose
    // run lives to see a month-end report.
    let seed = "";
    let s = createRun(seed, "david");
    for (let i = 0; i < 20 && s.phase !== "report"; i++) {
      seed = `share-${i}`;
      s = createRun(seed, "david");
      while (!s.outcome && s.phase !== "report") step(s, BOTS.expert(s));
    }
    expect(s.phase).toBe("report");
    const before = s.moral;
    expect(before).toBeLessThanOrEqual(100 - B.shareMoral);
    step(s, { t: "share" });
    expect(s.moral).toBe(before + B.shareMoral);
    // The month stays open, and a second post earns nothing.
    expect(s.phase).toBe("report");
    expect(() => step(s, { t: "share" })).toThrow();
    step(s, { t: "ok" });
    expect(s.phase).not.toBe("report");
    expect(decodeMoves(encodeMoves(s.history))).toEqual(s.history);
    expect(replay(seed, "david", s.history)).toEqual(s);
  });

  it("deals urgent choices in a seeded new order, and leaves the others alone", () => {
    let moved = 0;
    for (const ev of EVENTS) {
      const s = toSlot(createRun(`order-${ev.id}`, "david"));
      s.pendingEvent = ev.id;
      s.phase = "event";
      const order = shownChoices(s).map((c) => c.index);
      // Every choice is still there, once, and the order holds on a reload.
      expect([...order].sort(), ev.id).toEqual(ev.choices.map((_, i) => i));
      expect(shownChoices(s).map((c) => c.index), ev.id).toEqual(order);
      if (!ev.urgent) expect(order, ev.id).toEqual(ev.choices.map((_, i) => i));
      else if (order.some((index, place) => index !== place)) moved++;
    }
    expect(moved).toBeGreaterThan(0);
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
      const reminders = ev.urgent.missed.flatMap((o) => (o.then ? [o.then] : []));
      if (reminders.length > 0) {
        // Silence is a refusal: the reminder lands at once, with no result to read.
        expect(reminders).toContain(next.pendingEvent);
        expect(next.eventResult).toBeNull();
      } else {
        expect(next.eventResult).toMatchObject({ id: ev.id, missed: true, tone: "bad" });
      }
      expect(next.stats.missed).toBe(1);
      expect(next.pendingEvent === ev.id).toBe(false);
      expect(next.history[next.history.length - 1]).toEqual({ t: "miss" });
    }
  });

  it("brings a refused fine back three times in a row, dearer each time", () => {
    const start = toSlot(createRun("vat", "david"));
    start.pendingEvent = "vat-error";
    start.phase = "event";
    const price = (s: GameState) => {
      const label = eventCard(s.pendingEvent!).choices[0].label.en;
      return Number(label.match(/\d+/)![0]);
    };

    // Refusing, or letting the clock run out, deals the next card at once.
    let state = start;
    const asked = [price(state)];
    for (const move of [{ t: "choice", id: 1 }, { t: "miss" }, { t: "choice", id: 1 }] as Move[]) {
      const before = state.pendingEvent;
      state = apply(state, move);
      expect(state.phase).toBe("event");
      expect(state.pendingEvent).not.toBe(before);
      expect(FOLLOW_UPS.has(state.pendingEvent!)).toBe(true);
      expect(state.eventResult).toBeNull();
      expect(state.cash).toBe(start.cash);
      asked.push(price(state));
    }
    expect(asked).toEqual([120, 132, 168, 216]);

    // Paying closes it, at the price it has reached.
    const paid = apply(state, { t: "choice", id: 0 });
    expect(paid.cash).toBe(start.cash - 216);
    expect(paid.pendingEvent).toBeNull();
    expect(paid.eventResult).toMatchObject({ id: "vat-seizure", tone: "bad" });

    // A fourth refusal ends it too: the fine is waived or taken, bank fee included.
    const lost = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const s = toSlot(createRun(`vat-${i}`, "david"));
      s.pendingEvent = "vat-seizure";
      s.phase = "event";
      const end = apply(s, { t: "choice", id: 1 });
      expect(end.pendingEvent).toBeNull();
      expect(end.eventResult).toMatchObject({ id: "vat-seizure" });
      lost.add(s.cash - end.cash);
    }
    expect([...lost].sort((a, b) => a - b)).toEqual([0, 236]);
  });

  it("starts the product again from zero over a copied logo, unless the trademark is bought", () => {
    const sued = (cash: number) => {
      const s = toSlot(createRun("logo", "david"));
      Object.assign(s.project!, { launched: true, launchDay: 1, customers: 12, quality: 40, built: 30 });
      s.cash = cash;
      s.audience = 300;
      s.pendingEvent = "logo-troll";
      s.phase = "event";
      return s;
    };
    // Starting again keeps the idea, the audience and the cash, and nothing else.
    const before = sued(1000);
    const rebooted = apply(before, { t: "choice", id: 0 });
    expect(rebooted.project).toMatchObject({
      ideaId: before.project!.ideaId,
      launched: false,
      launchDay: null,
      built: 0,
      customers: 0,
      quality: 0,
    });
    expect(mrrOf(rebooted)).toBe(0);
    expect(rebooted.audience).toBe(300);
    expect(rebooted.cash).toBe(1000);
    // Buying the trademark keeps the product, at a price.
    const bought = apply(sued(1000), { t: "choice", id: 1 });
    expect(bought.project!.customers).toBe(12);
    expect(bought.cash).toBe(550);
    // Without the cash, starting again is the only answer left.
    const broke = sued(300);
    expect(shownChoices(broke).map((c) => c.enabled)).toEqual([true, false]);
    expect(() => apply(broke, { t: "choice", id: 1 })).toThrow();
    expect(effectTone({ reboot: true })).toBe("bad");
  });

  it("gives Chef a new thing to say each time, and has him coach at lunch", () => {
    const cueOf = (text: string) =>
      (Object.keys(CHEF) as (keyof typeof CHEF)[]).find((cue) => CHEF[cue].some((l) => l.fr === text));
    // Every cue has several lines: he does not repeat himself.
    for (const [cue, lines] of Object.entries(CHEF)) expect(lines.length, cue).toBeGreaterThanOrEqual(3);

    const said = new Set<string>();
    const cues = new Set<string>();
    for (const who of CHARACTER_IDS) {
      for (const bot of ["newcomer", "expert"] as const) {
        const s = createRun(`chef-${who}`, who);
        let before = s.chef!.fr;
        let lunches = 0;
        let fresh = 0;
        while (!s.outcome && s.day <= 120) {
          const eating = s.phase === "meal";
          step(s, BOTS[bot](s));
          if (eating) {
            lunches++;
            // He speaks at every lunch, and never says the same line twice running.
            if (s.chef!.fr !== before) fresh++;
          }
          before = s.chef!.fr;
          said.add(before);
          cues.add(cueOf(before)!);
        }
        expect(fresh, `${who} ${bot}`).toBe(lunches);
      }
    }
    // He goes through all he has to say on a subject before saying any of it again.
    const run = createRun("chef-deck", "david");
    const heard: string[] = [];
    let previous = run.chef!.fr;
    while (!run.outcome && run.day <= 120) {
      step(run, BOTS.newcomer(run));
      if (run.chef!.fr !== previous) {
        previous = run.chef!.fr;
        if (cueOf(previous) === "coach") heard.push(previous);
      }
    }
    expect(heard.length).toBeGreaterThanOrEqual(CHEF.coach.length);
    expect(new Set(heard.slice(0, CHEF.coach.length)).size).toBe(CHEF.coach.length);
    expect(said.size).toBeGreaterThan(60);
    for (const cue of ["coach", "coachBuilding", "coachNoCustomers", "coachGrowing", "coachAudience"]) {
      expect(cues.has(cue), cue).toBe(true);
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
