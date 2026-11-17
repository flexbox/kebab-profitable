/**
 * Three scripted players used to tune the balance:
 *
 *  - random    presses buttons at random
 *  - newcomer  plays like a first-timer: codes too much, posts too little,
 *              never pivots in time
 *  - expert    knows the rules: ships early, builds an audience, kills flops
 */
import { B } from "../balance";
import { dateOf } from "../calendar";
import { eventCard } from "../data/events";
import { idea } from "../data/ideas";
import { MEALS } from "../data/meals";
import {
  effectTone,
  eventChoices,
  isLive,
  legalActions,
  mrrOf,
  potentialOf,
} from "../engine";
import { rand } from "../rng";
import type { ActionId, Effect, GameState, MealId, Move } from "../types";

export type BotName = "random" | "newcomer" | "expert";

type Roll = (label: string) => number;

function roller(s: GameState, bot: string): Roll {
  return (label) => rand(s.seed, "bot", bot, s.history.length, label);
}

function can(s: GameState, id: ActionId): boolean {
  return !!legalActions(s).find((a) => a.id === id)?.enabled;
}

function affordable(s: GameState, wanted: MealId): MealId {
  const order: MealId[] = [wanted, "kebab", "pates", "skip"];
  for (const id of order) {
    const def = MEALS.find((m) => m.id === id)!;
    if (s.cash >= def.price) return id;
  }
  return "skip";
}

/** How often a player lets the clock run out on an urgent card. */
function tooSlow(s: GameState, roll: Roll, chance: number): boolean {
  return !!eventCard(s.pendingEvent!).urgent && roll("clock") < chance;
}

function effectScore(e: Effect): number {
  const tone = effectTone(e);
  return tone === "good" ? 1 : tone === "bad" ? -1 : 0;
}

// --- random ----------------------------------------------------------------

function randomBot(s: GameState): Move {
  const roll = roller(s, "random");
  switch (s.phase) {
    case "idea":
      return { t: "idea", id: s.offer[Math.floor(roll("idea") * s.offer.length)] };
    case "meal": {
      const id = MEALS[Math.floor(roll("meal") * MEALS.length)].id;
      return { t: "meal", id: affordable(s, id) };
    }
    case "event": {
      if (tooSlow(s, roll, 0.35)) return { t: "miss" };
      const open = eventChoices(s).filter(
        (c) => c.enabled && !c.odds.some((o) => o.effect.end),
      );
      return { t: "choice", id: open[Math.floor(roll("choice") * open.length)].index };
    }
    case "report":
      return { t: "ok" };
    default: {
      const open = legalActions(s).filter(
        (a) => a.enabled && (a.id !== "pivoter" || roll("pivot") < 0.03),
      );
      return { t: "act", id: open[Math.floor(roll("act") * open.length)].id };
    }
  }
}

// --- newcomer --------------------------------------------------------------

function newcomerBot(s: GameState): Move {
  const roll = roller(s, "newcomer");
  switch (s.phase) {
    case "idea":
      // Falls for the first idea, which is usually their own.
      return { t: "idea", id: s.offer[roll("idea") < 0.6 ? 0 : 1] ?? s.offer[0] };
    case "meal":
      return { t: "meal", id: affordable(s, s.cash > 900 ? "kebab" : "pates") };
    case "event": {
      // A first-timer reads the card to the end, and sometimes past it.
      if (tooSlow(s, roll, 0.2)) return { t: "miss" };
      const open = eventChoices(s).filter(
        (c) => c.enabled && !c.odds.some((o) => o.effect.end),
      );
      return { t: "choice", id: open[Math.floor(roll("choice") * open.length)].index };
    }
    case "report":
      return { t: "ok" };
    default: {
      const p = s.project!;
      if (can(s, "apero") && roll("apero") < 0.6) return { t: "act", id: "apero" };
      if (s.energie < 20 || s.moral < 15) return { t: "act", id: "repos" };
      if (s.cash < 200 && can(s, "freelance")) return { t: "act", id: "freelance" };
      if (can(s, "shipper")) return { t: "act", id: "shipper" };
      if (!p.launched) {
        // Heads down until launch, with the odd post.
        return { t: "act", id: roll("pre") < 0.85 ? "coder" : "poster" };
      }
      // Pivots when the game says "flop", but clings to a lukewarm product.
      if (isLive(p) && s.slot === 0 && mrrOf(s) < 60) {
        const potential = potentialOf(s.seed, p.ideaId);
        const stale = s.day - (p.launchDay ?? s.day) > 35;
        if (
          (potential === 0 && roll("pivot") < 0.4) ||
          (potential === 1 && stale && roll("pivot") < 0.1)
        ) {
          return { t: "act", id: "pivoter" };
        }
      }
      const r = roll("post");
      if (r < 0.5) return { t: "act", id: "coder" };
      if (r < 0.8) return { t: "act", id: "poster" };
      if (r < 0.9 && can(s, "support")) return { t: "act", id: "support" };
      return { t: "act", id: "demarcher" };
    }
  }
}

// --- expert ----------------------------------------------------------------

function expertBot(s: GameState): Move {
  const seesHidden = s.character === "karl";
  switch (s.phase) {
    case "idea": {
      const scored = s.offer.map((id) => {
        const def = idea(id);
        const known = seesHidden ? B.potentialMult[potentialOf(s.seed, id)] : 0.9;
        // Cheap tests first: a small MVP reveals the market sooner.
        return { id, score: known * 100 - def.mvp * (seesHidden ? 0.3 : 1) };
      });
      scored.sort((a, b) => b.score - a.score);
      return { t: "idea", id: scored[0].id };
    }
    case "meal": {
      const want: MealId =
        s.moral < 30 && s.cash > 600
          ? "welsh"
          : s.moral < 62 && s.cash > 350
            ? "kebab"
            : "pates";
      return { t: "meal", id: affordable(s, want) };
    }
    case "event": {
      const ev = eventCard(s.pendingEvent!);
      const p = s.project;
      const flop = !!p && p.potentialKnown && potentialOf(s.seed, p.ideaId) <= 1;
      const options = eventChoices(s)
        .filter((c) => c.enabled)
        .map((c) => {
          let score = c.odds.reduce((sum, o) => sum + o.p * effectScore(o.effect), 0);
          if (c.odds.some((o) => o.effect.end)) score = -100;
          if (c.odds.some((o) => o.effect.sell)) score = flop ? 5 : -5;
          if (c.odds.some((o) => (o.effect.cash ?? 0) < -s.cash + 650)) score -= 3;
          if (ev.id === "ltd") score = c.index === 1 ? 1 : -1;
          return { index: c.index, score };
        });
      options.sort((a, b) => b.score - a.score);
      return { t: "choice", id: options[0].index };
    }
    case "report":
      return { t: "ok" };
    default: {
      const p = s.project!;
      const def = idea(p.ideaId);
      const date = dateOf(s.day);
      const daysLeft = date.daysInMonth - date.dayOfMonth;

      if (can(s, "apero")) return { t: "act", id: "apero" };
      if (s.energie < 22 || s.moral < 18) return { t: "act", id: "repos" };

      // Keep the rent covered.
      const due = B.rent - mrrOf(s) * (1 - B.urssafRate);
      if (s.cash < due + 40 && daysLeft <= 8 && can(s, "freelance")) {
        return { t: "act", id: "freelance" };
      }

      if (can(s, "shipper")) return { t: "act", id: "shipper" };

      if (!p.launched) {
        return { t: "act", id: s.slot === 2 ? "poster" : "coder" };
      }
      if (!isLive(p)) return { t: "act", id: "poster" };

      const potential = potentialOf(s.seed, p.ideaId);
      if (potential <= 1 && mrrOf(s) < 120) return { t: "act", id: "pivoter" };

      if (s.slot === 0 && p.quality < 70) return { t: "act", id: "coder" };
      if (def.price >= 20 && s.slot === 1) return { t: "act", id: "demarcher" };
      if (p.customers >= 6 && s.month.supportSlots < 3 && daysLeft <= 6) {
        return { t: "act", id: "support" };
      }
      return { t: "act", id: "poster" };
    }
  }
}

export const BOTS: Record<BotName, (s: GameState) => Move> = {
  random: randomBot,
  newcomer: newcomerBot,
  expert: expertBot,
};
