/**
 * Every tunable number in one place. Change a value, then run `pnpm sim` to
 * see what it does to win rates and run length for each character.
 */
export const B = {
  // --- start ---------------------------------------------------------------
  startCash: 2500,
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
  coderPoints: 8,
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
  postBase: 4,
  postPct: 0.008,
  viralChance: 0.04,
  viralMult: 4,
  /** Audience gained by outreach before launch (waitlist). */
  waitlistGain: 6,

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
  trickleRate: 0.0008,
  outreachChance: 0.1,
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
