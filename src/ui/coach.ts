import { B, character, idea, isLive, legalActions, potentialOf } from "@/game";
import type { ActionId, GameState, L } from "@/game/types";
import { UI } from "@/i18n/strings";

/*
 * Chef's tips for a first run. They read the state and write nothing to it:
 * a coached run plays and replays exactly like any other.
 *
 * They tell a newcomer what the expert bot knows (src/game/sim/bots.ts): test
 * the smallest idea, code by day and post by night, ship the moment it is
 * ready, then post until the first customer signs. Measured against the
 * newcomer bot over 400 seeds a founder, following them takes the win rate
 * from 28-42 % to 61-78 %. Sending cold outreach instead of posting once the
 * product is live, the obvious advice, brings it down to 24-60 %: check a
 * new tip against the sim before shipping it.
 */

function tired(s: GameState) {
  return s.energie < 22 || s.moral < 18;
}

/** The idea Chef would pick: the quickest to test, or for Karl, the best. */
export function suggestIdea(s: GameState): string | null {
  if (s.phase !== "idea" || s.offer.length === 0) return null;
  const seesHidden = !!character(s.character).mods.seesHidden;
  const score = (id: string) => {
    const known = seesHidden ? B.potentialMult[potentialOf(s.seed, id)] : 1;
    return known * 100 - idea(id).mvp * (seesHidden ? 0.3 : 1);
  };
  return [...s.offer].sort((a, b) => score(b) - score(a))[0];
}

/** The action Chef would take, until the first customer signs. */
export function suggestAction(s: GameState): ActionId | null {
  const p = s.project;
  if (s.phase !== "slot" || !p || p.customers > 0) return null;
  const can = (id: ActionId) => !!legalActions(s).find((o) => o.id === id)?.enabled;
  if (tired(s)) return "repos";
  if (can("shipper")) return "shipper";
  if (!p.launched) return s.slot === 2 ? "poster" : "coder";
  return "poster";
}

export interface Step {
  label: L;
  done: boolean;
  /** How far along a step in progress is, 0..1. */
  progress?: number;
}

/**
 * The road to a first customer. It opens one step in, already walked: you
 * quit the day job in the intro.
 */
export function roadmap(s: GameState): { steps: Step[]; tip: L; reached: boolean } {
  const c = UI.coach;
  const p = s.project;
  const built = !!p && (p.launched || p.built >= p.mvpSize);
  const steps: Step[] = [
    { label: c.steps.quit, done: true },
    { label: c.steps.idea, done: !!p },
    {
      label: c.steps.build,
      done: built,
      progress: p && !built ? p.built / p.mvpSize : undefined,
    },
    { label: c.steps.ship, done: !!p?.launched },
    { label: c.steps.customer, done: (p?.customers ?? 0) > 0 },
  ];
  const reached = steps.every((x) => x.done);
  const seesHidden = !!character(s.character).mods.seesHidden;
  const tip = reached
    ? c.tips.reached
    : !p
      ? seesHidden
        ? c.tips.ideaHidden
        : c.tips.idea
      : tired(s)
        ? c.tips.tired
        : !built
          ? c.tips.build
          : !p.launched
            ? c.tips.ship
            : !isLive(p)
              ? c.tips.review
              : c.tips.customer;
  return { steps, tip, reached };
}
