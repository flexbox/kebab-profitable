/**
 * Every tunable number in one place. Change a value, then run `pnpm sim` to
 * see what it does to win rates and run length for each character.
 */
export const B = {
  // --- start ---------------------------------------------------------------
  startCash: 1500,
  startAudience: 20,
  startFaim: 80,
  startEnergie: 90,
  startMoral: 70,

  // --- money ---------------------------------------------------------------
  rent: 600,
  urssafRate: 0.22,
  /** Chapter 1 goal: one kebab a day. */
  kebabMrr: 270,
  freelancePay: 60,
  /** A single client with a small budget: this many slots a month. */
  freelancePerMonth: 4,
  aperoCost: 8,

  // --- founder gauges ------------------------------------------------------
  faimPerSlot: 11,
  /** Morale lost per slot spent with an empty stomach. */
  starvingMoral: 3,
  nightWorked: 20,
  nightRested: 32,
  /** Working alone wears you down a little every night. */
  nightMoral: -3,
  restEnergie: 20,
  restMoral: 10,
  /** Gauges after a day lost to exhaustion or gloom. */
  lostDayEnergie: 60,
  lostDayMoral: 38,

  // --- work ----------------------------------------------------------------
  coderPoints: 14,
  /** Quality of a product at its first launch. */
  launchQuality: 32,
  /** Extra quality per point built beyond the MVP, capped. */
  overbuildQuality: 0.4,
  overbuildCap: 18,
  /** Points needed to ship an update. */
  updateMin: 16,
  /** Quality gained per shipped point of an update. */
  updateQuality: 0.55,

  // --- audience ------------------------------------------------------------
  postBase: 7,
  postPct: 0.014,
  viralChance: 0.06,
  viralMult: 4,
  /** Audience gained by outreach before launch (waitlist). */
  waitlistGain: 10,

  // --- customers -----------------------------------------------------------
  /** Reference price: conversion is scaled against it. */
  refPrice: 9,
  /** Inbound conversion falls with price to this power. */
  inboundPriceExp: 0.9,
  /** Outreach conversion falls with price to this power. */
  outreachPriceExp: 0.6,
  /** Outreach also depends on how good the idea is, to this power. */
  outreachPotentialExp: 0.7,
  /** Global dial on every inbound signup (launches, updates, overnight). */
  inbound: 0.16,
  burstRate: 0.03,
  updateBurstRate: 0.002,
  /** Bursts triggered by event cards (Uneed, Product Hunt). */
  eventBurstRate: 0.012,
  trickleRate: 0.0016,
  outreachChance: 0.18,
  /** Potential multipliers, from flop to gem, and their weights. */
  potentialMult: [0.2, 0.5, 1, 1.5, 2.3],
  potentialWeights: [22, 25, 26, 18, 9],

  // --- churn ---------------------------------------------------------------
  churnBase: 0.14,
  churnPerQuality: 0.001,
  churnPerSupport: 0.02,
  churnMin: 0.02,
  churnMax: 0.4,

  // --- events --------------------------------------------------------------
  eventChance: 0.34,
  /** No event before this day. */
  eventFirstDay: 3,
  /** Chance, after each slot played, that something urgent turns up. */
  urgentChance: 0.1,
  /** The first day is for learning the buttons: no clock yet. */
  urgentFirstDay: 2,

  // --- Chef ----------------------------------------------------------------
  /** How often, at lunch, he talks about your business instead of your plate. */
  coachChance: 0.5,
  /** From this day on, he asks why nothing is on sale yet. */
  coachBuildingDay: 5,
  /** Followers it takes for him to ask where the customers are. */
  coachAudience: 150,
  /** Below this, he can see you counting your coins. */
  coachBroke: 500,

  // --- limits --------------------------------------------------------------
  /** A replayed run longer than this is rejected by the leaderboard. */
  maxMoves: 4000,
  logSize: 80,
} as const;

/** Output multiplier from the founder's state. */
export function efficiency(faim: number, energie: number, moral: number): number {
  const hunger = faim <= 0 ? 0.5 : 1;
  const energy = energie >= 50 ? 1 : energie >= 25 ? 0.85 : 0.65;
  const mood = moral >= 40 ? 1 : moral >= 20 ? 0.85 : 0.7;
  return hunger * energy * mood;
}
