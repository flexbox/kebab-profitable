/**
 * The film, as data. Every beat, every line, every sound cue, every number.
 * film.ts draws a frame from it, audio.ts plays it, render.mjs reads the
 * captions out of it. Nothing about the film's timing lives anywhere else.
 *
 * 150 beats a minute: a beat is 0.4 s, a bar 1.6 s, the film 30 bars.
 */
import runs from "./runs.json";

export const BPM = 150;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const bar = (n: number) => +(n * BAR).toFixed(4);
export const DURATION = bar(30);

export type SceneId = "question" | "model" | "chef" | "proof" | "turn" | "payoff";

/** The story arc: question, model, the boss, proof, turn, payoff. */
export const SCENES: { id: SceneId; from: number; to: number; teaches: string }[] = [
  { id: "question", from: 0, to: bar(3), teaches: "Shipping alone brought nobody." },
  { id: "model", from: bar(3), to: bar(10), teaches: "Cash runs down, MRR has to reach €270, three moves a day." },
  { id: "chef", from: bar(10), to: bar(14), teaches: "Chef downstairs is already profitable: he is the bar to clear." },
  { id: "proof", from: bar(14), to: bar(20), teaches: "A real run that codes and never posts goes broke on day 59." },
  { id: "turn", from: bar(20), to: bar(26), teaches: "The same run, posting instead of coding, is profitable on day 43." },
  { id: "payoff", from: bar(26), to: bar(30), teaches: "The opening room, read correctly, and where to play." },
];

// ---------------------------------------------------------------------------
// Words. At most two lines on screen, at most 18 characters to a line, so
// that every format keeps the same words.
// ---------------------------------------------------------------------------

export interface Line {
  text: string;
  /** When it starts typing in. */
  at: number;
  /** The accent colour, for the goal and the result. */
  accent?: boolean;
}

export interface Caption {
  id: string;
  from: number;
  to: number;
  lines: Line[];
  /** Chef is speaking: his face beside the box, his voice blips. */
  chef?: boolean;
  /** The lines for formats too narrow for the default ones. */
  narrow?: Line[];
}

const L = (text: string, at: number, accent = false): Line => ({ text, at, accent });

export const CAPTIONS: Caption[] = [
  { id: "q1", from: 0.8, to: bar(3) - 0.1, lines: [L("YOU SHIPPED IT.", 0.8), L("NOBODY CAME.", bar(1.5))] },

  { id: "m1", from: bar(3) + 0.8, to: bar(5) - 0.1, lines: [L("€1,500 IN THE BANK.", bar(3) + 0.8)] },
  { id: "m2", from: bar(5), to: bar(6) - 0.1, lines: [L("€1,500 IN THE BANK.", bar(5)), L("RENT: €600 A MONTH.", bar(5) + 0.2)] },
  { id: "m3", from: bar(6), to: bar(8) - 0.1, lines: [L("GOAL: €270 MRR.", bar(6), true), L("A €9 KEBAB A DAY.", bar(7))] },
  { id: "m4", from: bar(8), to: bar(10) - 0.15, lines: [L("THREE MOVES A DAY:", bar(8)), L("CODE, SHIP, POST...", bar(8.5))] },

  { id: "c1", from: bar(11) + 0.3, to: bar(12) - 0.1, lines: [L("OWNS THE KEBAB", bar(11) + 0.3), L("SHOP DOWNSTAIRS.", bar(11) + 0.7)] },
  { id: "c2", from: bar(12), to: bar(13) - 0.1, chef: true, lines: [L("PROFITABLE SINCE", bar(12)), L("DAY ONE.", bar(12) + 0.6)] },
  { id: "c3", from: bar(13), to: bar(14) - 0.15, lines: [L("HE EARNS MORE", bar(13)), L("THAN YOU. FOR NOW.", bar(13) + 0.5)] },

  { id: "p1", from: bar(14.5), to: bar(19) - 0.1, lines: [L("RUN 1: CODE, SHIP,", bar(14.5)), L("NEVER POST.", bar(14.5) + 0.5)] },
  { id: "p2", from: bar(19), to: bar(20) - 0.1, lines: [L("BROKE ON DAY 59.", bar(19)), L("WINS 9 RUNS IN 100", bar(19) + 0.5)] },

  { id: "t1", from: bar(20) + 0.4, to: bar(21) + 0.7, lines: [L("SAME START.", bar(20) + 0.4), L("NOW IT POSTS.", bar(20) + 1.2, true)] },
  { id: "t2", from: bar(21) + 0.8, to: bar(24.75) - 0.1, lines: [L("RUN 2: POST", bar(21) + 0.8), L("INSTEAD OF CODE.", bar(21) + 1.2)] },
  { id: "t3", from: bar(24.75), to: bar(26) - 0.1, lines: [L("PROFITABLE, DAY 43.", bar(24.75), true), L("WINS 96 RUNS IN 100", bar(24.75) + 0.5)] },

  { id: "y1", from: bar(26) + 0.2, to: bar(27) - 0.05, lines: [L("YOU POSTED IT.", bar(26) + 0.2), L("THEY CAME.", bar(26) + 0.8, true)] },
  // Chef's line for a win, src/game/data/chef.ts: "Kebab profitable! From today, you have your own table here, chef."
  { id: "y2c", from: bar(27), to: bar(28) - 0.1, chef: true, lines: [L("YOU HAVE YOUR OWN", bar(27)), L("TABLE HERE, CHEF.", bar(27) + 0.5)] },
  {
    id: "y2",
    from: bar(28),
    to: DURATION,
    lines: [L("PLAY TODAY'S RUN, FREE:", bar(28) + 0.3), L("KEBAB-PROFITABLE.VERCEL.APP", bar(28) + 0.7, true)],
    narrow: [L("KEBAB-PROFITABLE", bar(28) + 0.3, true), L(".VERCEL.APP", bar(28) + 0.7, true)],
  },
];

/** Big words that belong to the picture, not to the caption band. */
export const TITLES = {
  warning: { from: bar(10), to: bar(11) },
  chefName: { from: bar(11) + 0.2, to: bar(12) - 0.1 },
  ready: { from: bar(14), to: bar(14.5) },
  title: { from: bar(28), to: DURATION },
  /** Under the title, in narrow formats only, where the band holds the link. */
  playLine: { from: bar(28) + 0.3, to: DURATION, text: "PLAY TODAY'S RUN" },
};

// ---------------------------------------------------------------------------
// The two runs. Same seed, same founder, same player; the second posts where
// the first codes. Recorded from the rules engine by scripts/runs.ts.
// ---------------------------------------------------------------------------

export interface Day {
  day: number;
  cash: number;
  mrr: number;
  customers: number;
  moves: string[];
}

export const RUN = runs as unknown as {
  seed: string;
  founder: "david";
  silent: { days: Day[] };
  expert: { days: Day[] };
};

/** When each run plays, and over how many days. */
export const PLAY = {
  silent: { from: bar(14.5), to: bar(19), days: RUN.silent.days },
  /** Run 1 winds back to day one before run 2 starts. */
  rewind: { from: bar(20), to: bar(20.75) },
  expert: { from: bar(21) + 0.8, to: bar(24.75), days: RUN.expert.days },
};

/** What the bars measure. The goal sits at €270 of a €300 bar. */
export const SCALE = { cash: 1500, mrr: 300, goal: 270 };

/** The model's beats: when each piece of the picture arrives. */
export const MODEL = {
  cashFill: { from: bar(3) + 0.1, to: bar(3) + 0.75 },
  rent: bar(5) + 0.4,
  mrrIn: bar(6),
  kebab: bar(7),
  moves: [bar(8) + 0.1, bar(8) + 0.5, bar(8) + 0.9],
  /** The model's bars empty out before Chef's scene. */
  reset: bar(9.75),
};

export const CHEF = {
  enter: { from: bar(11), to: bar(11) + 0.45 },
  barFill: { from: bar(11) + 0.6, to: bar(11) + 1.5 },
};

// ---------------------------------------------------------------------------
// Sound cues: the game's own effects, only where something happens.
// ---------------------------------------------------------------------------

export type Sfx =
  | "type_1" | "type_2" | "type_3" | "talk_1" | "talk_2" | "talk_3"
  | "bad" | "tick" | "bite" | "click" | "alarm" | "slam" | "card"
  | "customer" | "lose" | "pick";

export interface Cue {
  t: number;
  sfx: Sfx;
  gain?: number;
  /** Cut the effect short, in seconds. */
  length?: number;
  /** What the caption file says about it. */
  says?: string;
}

function typing(from: number, to: number): Cue[] {
  const out: Cue[] = [];
  let i = 0;
  for (let t = from; t < to; t += 0.13 + ((i * 37) % 5) * 0.012, i++) {
    out.push({ t: +t.toFixed(3), sfx: (["type_1", "type_2", "type_3"] as const)[i % 3], gain: 0.55 });
  }
  return out;
}

function ticks(from: number, to: number, n: number, gain = 0.4): Cue[] {
  return Array.from({ length: n }, (_, i) => ({ t: +(from + ((to - from) * i) / n).toFixed(3), sfx: "tick" as const, gain }));
}

/** The day each run crosses a month-end, from the data: cash falls by rent. */
export function monthEnds(days: Day[]): number[] {
  return days.filter((d, i) => i > 0 && d.cash < days[i - 1].cash - 300).map((d) => d.day);
}

export function dayAt(play: { from: number; to: number; days: Day[] }, t: number): number {
  const n = play.days.length;
  const u = Math.max(0, Math.min(1, (t - play.from) / (play.to - play.from)));
  return 1 + u * (n - 1);
}

export function timeOfDay(play: { from: number; to: number; days: Day[] }, day: number): number {
  return play.from + ((day - 1) / (play.days.length - 1)) * (play.to - play.from);
}

const silentHits = monthEnds(RUN.silent.days).map((d) => timeOfDay(PLAY.silent, d));
const expertHits = monthEnds(RUN.expert.days).map((d) => timeOfDay(PLAY.expert, d));

export const CUES: Cue[] = [
  ...typing(0.1, 2.2).map((c, i) => (i === 0 ? { ...c, says: "[keyboard typing]" } : c)),
  { t: bar(1.5), sfx: "bad", gain: 0.7, says: "[a dull thud]" },
  ...ticks(MODEL.cashFill.from, MODEL.cashFill.to, 20).map((c, i) => (i === 0 ? { ...c, says: "[the cash bar fills, tick by tick]" } : c)),
  { t: MODEL.rent, sfx: "bad", gain: 0.8, says: "[rent comes out]" },
  { t: MODEL.kebab, sfx: "bite", gain: 0.9, says: "[a bite of kebab]" },
  ...MODEL.moves.map((t) => ({ t, sfx: "click" as const, gain: 0.7 })),
  { t: bar(10), sfx: "alarm", gain: 0.55, says: "[warning alarm]" },
  { t: bar(10.5), sfx: "alarm", gain: 0.55 },
  { t: CHEF.enter.to, sfx: "slam", gain: 0.9, says: "[Chef slams down]" },
  ...ticks(CHEF.barFill.from, CHEF.barFill.to, 16, 0.35).map((c, i) => (i === 0 ? { ...c, says: "[Chef's bar fills]" } : c)),
  ...Array.from({ length: 6 }, (_, i) => ({ t: +(bar(12) + i * 0.14).toFixed(3), sfx: (["talk_1", "talk_2", "talk_3"] as const)[i % 3], gain: 0.6 })),
  { t: TITLES.ready.from, sfx: "pick", gain: 0.6, length: 0.6, says: "[ready]" },
  ...ticks(TITLES.ready.from, TITLES.ready.to - 0.2, 12, 0.3).map((c, i) => (i === 0 ? { ...c, says: "[cash refills for a new run]" } : c)),
  ...silentHits.map((t, i) => ({ t, sfx: "bad" as const, gain: 0.7, says: i === 0 ? "[rent]" : undefined })),
  { t: PLAY.silent.to + 0.05, sfx: "lose", gain: 0.6, length: 2.4, says: "[game over]" },
  ...expertHits.map((t) => ({ t, sfx: "bad" as const, gain: 0.6 })),
  { t: PLAY.expert.to, sfx: "customer", gain: 0.9, says: "[a chest opens: kebab profitable]" },
  ...Array.from({ length: 6 }, (_, i) => ({ t: +(bar(27) + i * 0.14).toFixed(3), sfx: (["talk_1", "talk_2", "talk_3"] as const)[i % 3], gain: 0.6 })),
];

/** Where the music's motif plays: the rising four notes of "it works". */
export const MOTIF = [bar(20.75), bar(26), bar(28.5)];
