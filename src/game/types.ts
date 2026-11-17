export type Lang = "fr" | "en";

/** A piece of text in both languages. */
export type L = Record<Lang, string>;

export type CharacterId =
  | "david"
  | "karl"
  | "mickael"
  | "christophe"
  | "matthys";

export type ActionId =
  | "coder"
  | "shipper"
  | "poster"
  | "demarcher"
  | "support"
  | "freelance"
  | "repos"
  | "pivoter"
  | "apero";

export type MealId = "skip" | "pates" | "kebab" | "welsh";

export type Phase =
  | "idea" // choose one of the ideas on offer
  | "slot" // choose an action for the current slot
  | "meal" // choose the midi meal
  | "event" // an event card is waiting for a choice
  | "report" // the month-end report is waiting to be dismissed
  | "won"
  | "lost";

export type Potential = 0 | 1 | 2 | 3 | 4;

export type Tone = "good" | "bad" | "neutral";

/** One player input. A run is fully described by its seed, character and moves. */
export type Move =
  | { t: "idea"; id: string }
  | { t: "act"; id: ActionId }
  | { t: "meal"; id: MealId }
  | { t: "choice"; id: number }
  /** The clock ran out on an urgent card. */
  | { t: "miss" }
  | { t: "ok" };

export interface Project {
  ideaId: string;
  /** Monthly price per customer, character modifiers included. */
  price: number;
  /** Points of work needed before the first launch. */
  mvpSize: number;
  /** Points coded and not shipped yet. */
  built: number;
  launched: boolean;
  launchDay: number | null;
  /** 0..100, meaningful once launched. */
  quality: number;
  customers: number;
  /** True once the market has answered (or for Karl, from the start). */
  potentialKnown: boolean;
  /** Signups that land later (App Store review, enterprise sales cycle). */
  pending: { day: number; signups: number; first: boolean }[];
}

export interface Flags {
  /** Multiplier applied to the next launch burst. */
  burstMult: number;
  /** The next pivot costs no time. */
  freePivot: boolean;
  /** This month's Stripe payout is held until next month. */
  payoutHold: boolean;
}

export interface MonthStats {
  revenue: number;
  supportSlots: number;
  freelanceSlots: number;
  startMrr: number;
  newCustomers: number;
  /** Revenue held back by Stripe from a previous month. */
  held: number;
}

export interface MonthReport {
  /** 1..12 */
  month: number;
  revenue: number;
  held: number;
  released: number;
  urssaf: number;
  rent: number;
  churned: number;
  newCustomers: number;
  cashAfter: number;
  mrr: number;
}

export interface LogEntry {
  day: number;
  /** -1 for things that happen overnight or outside a slot. */
  slot: number;
  text: L;
  tone: Tone;
}

export interface Outcome {
  result: "won" | "lost";
  reason: "kebab" | "cash" | "cdi";
  day: number;
}

export interface RunStats {
  kebabs: number;
  pates: number;
  welshs: number;
  skipped: number;
  pivots: number;
  launches: number;
  freelance: number;
  aperos: number;
  posts: number;
  coded: number;
  lostDays: number;
  coffees: number;
  /** Urgent cards the clock ran out on. */
  missed: number;
}

export interface GameState {
  v: 2;
  seed: string;
  character: CharacterId;
  /** 1 = 1 January 2027. */
  day: number;
  /** Next slot to play: 0 matin, 1 après-midi, 2 soir, 3 bonus. */
  slot: number;
  phase: Phase;

  faim: number;
  energie: number;
  moral: number;
  cash: number;
  audience: number;

  project: Project | null;
  /** Ideas on offer while phase is "idea". */
  offer: string[];
  ideaDraws: number;
  usedIdeas: string[];

  mealToday: MealId | null;
  soirWorked: boolean;
  /** True once this day's morning checks have run. */
  morning: boolean;
  /** Upcoming slots lost to an event. */
  skipSlots: number;
  /** Whole days away (retreat): meals included, no slots. */
  awayDays: number;
  /** Temporary multipliers on overnight signups. */
  boosts: { mult: number; until: number }[];

  flags: Flags;
  month: MonthStats;

  eventsSeen: string[];
  pendingEvent: string | null;
  /** What the last event choice led to, until the next move. */
  eventResult: { id: string; text: L; tone: Tone; missed?: boolean } | null;
  report: MonthReport | null;

  milestones: string[];
  /** What the kebab shop owner last said. */
  chef: L | null;
  log: LogEntry[];
  /** Entries ever written to the log, including the ones it has dropped. */
  logCount: number;
  history: Move[];
  outcome: Outcome | null;
  stats: RunStats;
}

// ---------------------------------------------------------------------------
// Data definitions (characters, ideas, events live in src/game/data)
// ---------------------------------------------------------------------------

export interface CharacterMods {
  /** Multiplier on points produced by Coder. */
  coderMult?: number;
  /** A bonus slot every N days. */
  bonusSlotEvery?: number;
  /** Multiplier on morale gained at apéros and retreats. */
  socialMoralMult?: number;
  /** Sees the hidden potential of ideas and the odds on event cards. */
  seesHidden?: boolean;
  /** Multiplier on prices. */
  priceMult?: number;
  /** Multiplier on inbound signups (launch bursts and trickle). */
  inboundMult?: number;
  /** Days between a launch and its first signups. */
  launchDelay?: number;
  /** Multiplier on Poster and Démarcher. */
  marketingMult?: number;
  /** Multiplier on product quality gained. */
  qualityMult?: number;
  /** Extra nightly chance of a positive cameo. */
  cameoBoost?: number;
  /** Every apéro yields an intro. */
  aperoIntroSure?: boolean;
  /** Daily chance that the après-midi goes to a coffee. */
  coffeeChance?: number;
  /** Multiplier on energy recovered by sleeping and resting. */
  sleepMult?: number;
  /** Multiplier on the chance that a post goes viral. */
  viralMult?: number;
  /** Chance that a Coder slot goes to rewriting the stack. */
  shinyChance?: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  role: L;
  perk: { name: L; desc: L };
  flaw: { name: L; desc: L };
  signatureIdea: string;
  site: string;
  mods: CharacterMods;
}

export type IdeaTag = "mobile" | "ai" | "b2b" | "content";

export interface IdeaDef {
  id: string;
  name: L;
  pitch: L;
  /** Base monthly price per customer in euros. */
  price: number;
  /** Points of work before the first launch. */
  mvp: number;
  /** Added to the monthly churn rate. */
  churn: number;
  /** Multiplier on overnight signups. */
  trickle: number;
  /** Multiplier on launch bursts. */
  burst: number;
  /** Multiplier on cold outreach. */
  outreach: number;
  tags: IdeaTag[];
  /** Set on signature ideas: the member whose real product this is. */
  owner?: CharacterId;
}

export interface Condition {
  hasProject?: boolean;
  launched?: boolean;
  mobile?: boolean;
  minDay?: number;
  maxDay?: number;
  minCash?: number;
  minAudience?: number;
  minMrr?: number;
  minCustomers?: number;
  /** MVP progress as a fraction of its size, before launch. */
  minBuilt?: number;
  /** MRR is higher than at the start of the month. */
  mrrGrew?: boolean;
}

export interface Effect {
  cash?: number;
  /** Cash equal to this many months of current MRR. */
  cashPerMrr?: number;
  moral?: number;
  /** Morale that is doubled by the "social" character perk. */
  socialMoral?: number;
  energie?: number;
  faim?: number;
  audience?: number;
  /** Fraction of the current audience, with `audience` as the minimum gain. */
  audiencePct?: number;
  customers?: number;
  quality?: number;
  /** Removes this fraction of the remaining MVP work. */
  mvpCut?: number;
  /** Adds this many points to the MVP. */
  mvpAdd?: number;
  /** Points of work gained, or lost when negative. */
  built?: number;
  skipSlots?: number;
  awayDays?: number;
  /** An immediate launch-like burst with this multiplier. */
  burst?: number;
  /** Multiplies overnight signups for a number of days. */
  boost?: { mult: number; days: number };
  flags?: Partial<Flags>;
  /** Sells the project: customers and product are gone, the audience stays. */
  sell?: boolean;
  end?: "cdi";
}

export interface EventOutcome {
  /** Weight among the outcomes whose condition holds. Defaults to 1. */
  p?: number;
  when?: Condition;
  effect: Effect;
  text: L;
  /**
   * The card this outcome deals at once, in place of a result to read: a
   * reminder after a refusal, say. A card dealt this way is never drawn from
   * the deck.
   */
  then?: string;
}

export interface EventChoice {
  label: L;
  when?: Condition;
  outcomes: EventOutcome[];
}

export type GuestId =
  | "levels"
  | "marc"
  | "tibo"
  | "dago"
  | "nico"
  | "thomas"
  | "tony"
  | "danny"
  | "arvid"
  | "benjamin";

export interface GuestDef {
  name: string;
  /** Their handle on X, without the @. */
  handle: string;
}

export type EventKind = "cameo" | "admin" | "lille" | "scene" | "urgent";

export interface EventDef {
  id: string;
  kind: EventKind;
  tone: Tone;
  /** For cameos: the real public figure the card nods to, see `GUESTS`. */
  who?: GuestId;
  title: L;
  text: L;
  when?: Condition;
  repeatable?: boolean;
  choices: EventChoice[];
  /**
   * Urgent cards turn up in the middle of the day and are answered against
   * the clock. When it runs out, one of the `missed` outcomes applies.
   */
  urgent?: { seconds: number; missed: EventOutcome[] };
}

export interface MealDef {
  id: MealId;
  name: L;
  price: number;
  faim: number;
  moral: number;
  /** Multiplier on the après-midi slot. */
  sluggish?: number;
  desc: L;
}

export interface ActionDef {
  id: ActionId;
  name: L;
  desc: L;
  /** Keyboard shortcut. */
  key: string;
  energie: number;
  /** Counts as work for the soir slot (shorter night). */
  work: boolean;
}
