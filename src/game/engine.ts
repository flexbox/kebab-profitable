/**
 * The rules of Kebab Profitable.
 *
 * Pure TypeScript with no browser or server dependency. A run is fully
 * described by a seed, a character and a list of moves, so the same code
 * drives the game in the browser, the balance simulations and the
 * leaderboard's replay check.
 */
import { B, efficiency } from "./balance";
import { dateOf, daysToApero, isAperoDay, SLOT_COUNT } from "./calendar";
import { ACTIONS, action } from "./data/actions";
import { character } from "./data/characters";
import { CHEF, MILESTONES, type ChefCue } from "./data/chef";
import { EVENTS, FOLLOW_UPS, eventCard } from "./data/events";
import { IDEAS, idea } from "./data/ideas";
import { meal } from "./data/meals";
import { M, WHY } from "./messages";
import { between, poisson, rand, shuffle, stream, weighted } from "./rng";
import type {
  ActionId,
  CharacterId,
  Condition,
  Effect,
  EventDef,
  EventOutcome,
  GameState,
  L,
  MealId,
  Move,
  Potential,
  Project,
  Tone,
} from "./types";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** Cards drawn at random. The others only come when another card deals them. */
const DECK = EVENTS.filter((e) => !FOLLOW_UPS.has(e.id));
/** Cards dealt overnight and answered in the morning, at leisure. */
const OVERNIGHT = DECK.filter((e) => !e.urgent);
/** Cards dealt in the middle of the day and answered against the clock. */
const URGENT = DECK.filter((e) => !!e.urgent);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** The product is on sale and its launch results are in. */
export function isLive(p: Project | null): p is Project {
  return !!p && p.launched && !p.pending.some((x) => x.first);
}

export function mrrOf(s: GameState): number {
  return s.project && s.project.launched
    ? s.project.customers * s.project.price
    : 0;
}

/** How well an idea really sells on this seed: 0 (flop) to 4 (gem). */
export function potentialOf(seed: string, ideaId: string): Potential {
  return weighted(B.potentialWeights, rand(seed, "potential", ideaId)) as Potential;
}

export function slotsToday(s: GameState): number {
  const every = character(s.character).mods.bonusSlotEvery;
  return SLOT_COUNT + (every && s.day % every === 0 ? 1 : 0);
}

/** Output multiplier for the slot about to be played. */
export function efficiencyNow(s: GameState): number {
  const sluggish =
    s.slot === 1 && s.mealToday ? (meal(s.mealToday).sluggish ?? 1) : 1;
  return efficiency(s.faim, s.energie, s.moral) * sluggish;
}

export function churnRate(s: GameState): number {
  const p = s.project;
  if (!p || !p.launched) return 0;
  return clamp(
    B.churnBase -
      p.quality * B.churnPerQuality +
      idea(p.ideaId).churn -
      s.month.supportSlots * B.churnPerSupport,
    B.churnMin,
    B.churnMax,
  );
}

/** Three ideas for the given draw. The first draw includes the signature idea. */
export function drawIdeas(
  seed: string,
  drawIndex: number,
  characterId: CharacterId,
  used: readonly string[],
): string[] {
  const all = IDEAS.map((i) => i.id);
  let pool = shuffle(all, stream(seed, "ideas", drawIndex)).filter(
    (id) => !used.includes(id),
  );
  if (pool.length === 0) pool = shuffle(all, stream(seed, "ideas", drawIndex));
  if (drawIndex === 0) {
    const signature = character(characterId).signatureIdea;
    return [signature, ...pool.filter((id) => id !== signature).slice(0, 2)];
  }
  return pool.slice(0, 3);
}

export interface ActionOption {
  id: ActionId;
  enabled: boolean;
  /** Why the action is unavailable. */
  reason?: L;
}

export function legalActions(s: GameState): ActionOption[] {
  const p = s.project;
  return ACTIONS.map(({ id }): ActionOption => {
    switch (id) {
      case "shipper": {
        if (!p) return { id, enabled: false };
        if (!p.launched) {
          return p.built >= p.mvpSize
            ? { id, enabled: true }
            : { id, enabled: false, reason: WHY.mvpNotReady() };
        }
        if (!isLive(p)) return { id, enabled: false, reason: WHY.inReview() };
        return p.built >= B.updateMin
          ? { id, enabled: true }
          : { id, enabled: false, reason: WHY.nothingToShip() };
      }
      case "support":
        return isLive(p) && p.customers > 0
          ? { id, enabled: true }
          : { id, enabled: false, reason: WHY.noCustomers() };
      case "apero": {
        if (!(isAperoDay(s.day) && s.slot === 2)) {
          return { id, enabled: false, reason: WHY.notAperoDay(daysToApero(s.day)) };
        }
        return s.cash >= B.aperoCost
          ? { id, enabled: true }
          : { id, enabled: false, reason: WHY.noCash() };
      }
      case "freelance":
        return s.month.freelanceSlots < B.freelancePerMonth
          ? { id, enabled: true }
          : { id, enabled: false, reason: WHY.noBudget() };
      case "coder":
      case "pivoter":
        return { id, enabled: !!p };
      default:
        return { id, enabled: true };
    }
  });
}

// ---------------------------------------------------------------------------
// Small helpers that write to the state
// ---------------------------------------------------------------------------

function log(s: GameState, text: L, tone: Tone = "neutral", slot = s.slot) {
  s.logCount++;
  s.log.push({ day: s.day, slot, text, tone });
  if (s.log.length > B.logSize) s.log.splice(0, s.log.length - B.logSize);
}

/**
 * Chef says one of his lines for the occasion. Each occasion's lines are a
 * deck, shuffled once for the run and dealt in turn: he goes through all he
 * has to say on a subject before saying any of it again.
 */
function chef(s: GameState, cue: ChefCue) {
  const lines = CHEF[cue];
  const said = (s.chefSaid ??= {});
  const turn = said[cue] ?? 0;
  said[cue] = turn + 1;
  const deck = shuffle(lines, stream(s.seed, "chef", cue));
  s.chef = deck[turn % deck.length];
}

/**
 * At lunch, about one day in two, Chef looks up from the spit and talks about
 * your business instead of your plate. He speaks to what he sees, or gives
 * the advice he gives everyone.
 */
function coaching(s: GameState): ChefCue | null {
  if (rand(s.seed, "coach", s.day) >= B.coachChance) return null;
  const p = s.project;
  const mrr = mrrOf(s);
  const sees: ChefCue[] = ["coach"];
  if (p && !p.launched && s.day >= B.coachBuildingDay) sees.push("coachBuilding");
  if (isLive(p) && p.customers === 0) sees.push("coachNoCustomers");
  if (isLive(p) && p.customers > 0) {
    if (mrr > s.month.startMrr) sees.push("coachGrowing");
    else if (dateOf(s.day).dayOfMonth >= 12) sees.push("coachFlat");
  }
  if (s.audience >= B.coachAudience && mrr < B.kebabMrr / 4) sees.push("coachAudience");
  if (s.cash < B.coachBroke) sees.push("coachBroke");
  if (s.stats.pivots >= 2) sees.push("coachPivots");
  return sees[Math.floor(rand(s.seed, "coach-sees", s.day) * sees.length)];
}

function lose(s: GameState, reason: "cash" | "cdi") {
  if (s.outcome) return;
  s.outcome = { result: "lost", reason, day: s.day };
  if (reason === "cash") {
    s.cash = 0;
    log(s, M.lostCash(), "bad", -1);
    chef(s, "loseCash");
  } else {
    log(s, M.lostCdi(), "bad", -1);
    chef(s, "loseCdi");
  }
}

function addCash(s: GameState, amount: number) {
  s.cash += amount;
  if (s.cash < 0) lose(s, "cash");
}

function checkMilestones(s: GameState) {
  const hit = (id: string) => {
    if (s.milestones.includes(id)) return false;
    s.milestones.push(id);
    return true;
  };
  const p = s.project;
  const mrr = mrrOf(s);
  if (p && p.launched && p.customers >= 1 && hit("firstCustomer")) {
    log(s, MILESTONES.firstCustomer, "good", -1);
    chef(s, "firstCustomer");
  }
  if (mrr >= 100 && hit("mrr100")) {
    log(s, MILESTONES.mrr100, "good", -1);
    chef(s, "mrr100");
  }
  if (mrr >= 200 && hit("mrr200")) chef(s, "mrr200");
  if (mrr >= B.kebabMrr && !s.outcome) {
    s.outcome = { result: "won", reason: "kebab", day: s.day };
    log(s, M.won(mrr), "good", -1);
    log(s, MILESTONES.kebab, "good", -1);
    chef(s, "win");
  }
}

/** Probabilistic rounding: 2.3 becomes 3 with a 30% chance. */
function roundRandom(value: number, roll: number): number {
  const whole = Math.floor(value);
  return whole + (roll < value - whole ? 1 : 0);
}

/** How well the product converts attention into customers. */
function inboundFactor(s: GameState, p: Project): number {
  const def = idea(p.ideaId);
  const mods = character(s.character).mods;
  const potential = B.potentialMult[potentialOf(s.seed, p.ideaId)];
  const price = Math.pow(B.refPrice / def.price, B.inboundPriceExp);
  const quality = 0.4 + p.quality / 80;
  return B.inbound * potential * price * quality * (mods.inboundMult ?? 1);
}

function burstSignups(s: GameState, p: Project, rate: number, key: string): number {
  const size =
    s.audience *
    rate *
    inboundFactor(s, p) *
    idea(p.ideaId).burst *
    between(0.75, 1.25, s.seed, "burst", s.day, s.slot, key);
  return roundRandom(size, rand(s.seed, "burst-round", s.day, s.slot, key));
}

function addCustomers(s: GameState, p: Project, n: number) {
  if (n === 0) return;
  p.customers = Math.max(0, p.customers + n);
  if (n > 0) s.month.newCustomers += n;
  checkMilestones(s);
}

/** The first launch results are in: the market answers. */
function landFirstLaunch(s: GameState, p: Project, n: number) {
  p.potentialKnown = true;
  const potential = potentialOf(s.seed, p.ideaId);
  log(s, M.verdict(potential), potential >= 2 ? "good" : "bad", -1);
  s.moral = clamp(s.moral + (n > 0 ? Math.min(12, 4 + n) : -6));
  chef(s, potential <= 1 ? "flop" : "launch");
  addCustomers(s, p, n);
}

function holds(s: GameState, cond: Condition | undefined): boolean {
  if (!cond) return true;
  const p = s.project;
  if (cond.hasProject !== undefined && !!p !== cond.hasProject) return false;
  if (cond.launched === true && !isLive(p)) return false;
  if (cond.launched === false && (!p || p.launched)) return false;
  if (cond.mobile !== undefined) {
    const mobile = !!p && idea(p.ideaId).tags.includes("mobile");
    if (mobile !== cond.mobile) return false;
  }
  if (cond.minDay !== undefined && s.day < cond.minDay) return false;
  if (cond.maxDay !== undefined && s.day > cond.maxDay) return false;
  if (cond.minCash !== undefined && s.cash < cond.minCash) return false;
  if (cond.minAudience !== undefined && s.audience < cond.minAudience) return false;
  if (cond.minMrr !== undefined && mrrOf(s) < cond.minMrr) return false;
  if (cond.minCustomers !== undefined && (p?.customers ?? 0) < cond.minCustomers) {
    return false;
  }
  if (cond.minBuilt !== undefined) {
    if (!p || p.launched || p.built / p.mvpSize < cond.minBuilt) return false;
  }
  if (cond.mrrGrew !== undefined && mrrOf(s) > s.month.startMrr !== cond.mrrGrew) {
    return false;
  }
  return true;
}

function dropProject(s: GameState) {
  if (s.project) s.usedIdeas.push(s.project.ideaId);
  s.project = null;
  s.offer = drawIdeas(s.seed, s.ideaDraws, s.character, s.usedIdeas);
  s.ideaDraws++;
}

function applyEffect(s: GameState, e: Effect) {
  const mods = character(s.character).mods;
  const p = s.project;

  if (e.cashPerMrr) {
    const amount = Math.round(mrrOf(s) * e.cashPerMrr);
    s.cash += amount;
    log(s, M.sold(amount), "good", -1);
  }
  if (e.moral) s.moral = clamp(s.moral + e.moral);
  if (e.socialMoral) {
    s.moral = clamp(s.moral + e.socialMoral * (mods.socialMoralMult ?? 1));
  }
  if (e.energie) s.energie = clamp(s.energie + e.energie);
  if (e.faim) s.faim = clamp(s.faim + e.faim);
  if (e.audiencePct !== undefined) {
    const gain = Math.max(e.audience ?? 0, Math.round(s.audience * e.audiencePct));
    s.audience += gain;
  } else if (e.audience) {
    s.audience = Math.max(0, s.audience + e.audience);
  }
  if (p) {
    if (e.quality && p.launched) p.quality = clamp(p.quality + e.quality);
    if (e.mvpCut && !p.launched) {
      const remaining = Math.max(0, p.mvpSize - p.built);
      p.mvpSize = Math.round(p.mvpSize - remaining * e.mvpCut);
    }
    if (e.mvpAdd && !p.launched) p.mvpSize += e.mvpAdd;
    if (e.built) p.built = Math.max(0, p.built + e.built);
    if (e.burst && isLive(p)) {
      addCustomers(s, p, burstSignups(s, p, B.eventBurstRate * e.burst, "event"));
    }
    if (e.customers && isLive(p)) addCustomers(s, p, e.customers);
  }
  if (e.skipSlots) s.skipSlots += e.skipSlots;
  if (e.awayDays) s.awayDays += e.awayDays;
  if (e.boost) s.boosts.push({ mult: e.boost.mult, until: s.day + e.boost.days - 1 });
  if (e.flags) Object.assign(s.flags, e.flags);
  if (e.sell) dropProject(s);
  if (e.cash) addCash(s, e.cash);
  if (e.end === "cdi") lose(s, "cdi");
}

/** Whether an effect is, on the whole, good or bad news. */
export function effectTone(e: Effect): Tone {
  if (e.end) return "bad";
  const score =
    (e.cash ?? 0) +
    (e.cashPerMrr ? 100 : 0) +
    ((e.moral ?? 0) + (e.socialMoral ?? 0)) * 5 +
    (e.energie ?? 0) * 2 +
    (e.faim ?? 0) +
    (e.audience ?? 0) +
    (e.audiencePct ? 50 : 0) +
    (e.customers ?? 0) * 50 +
    (e.burst ?? 0) * 60 +
    (e.mvpCut ? 60 : 0) +
    (e.built ?? 0) * 6 +
    (e.quality ?? 0) * 6 -
    (e.mvpAdd ?? 0) * 4 -
    (e.skipSlots ?? 0) * 25 +
    (e.boost ? (e.boost.mult < 1 ? -60 : 60) : 0) +
    (e.flags?.burstMult ? 60 : 0) +
    (e.flags?.freePivot ? 30 : 0) -
    (e.flags?.payoutHold ? 40 : 0);
  return score > 0 ? "good" : score < 0 ? "bad" : "neutral";
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

function pickIdea(s: GameState, id: string) {
  if (!s.offer.includes(id)) throw new Error(`Idea not on offer: ${id}`);
  const def = idea(id);
  const mods = character(s.character).mods;
  s.project = {
    ideaId: id,
    price: Math.round(def.price * (mods.priceMult ?? 1)),
    mvpSize: def.mvp,
    built: 0,
    launched: false,
    launchDay: null,
    quality: 0,
    customers: 0,
    potentialKnown: !!mods.seesHidden,
    pending: [],
  };
  s.offer = [];
  log(s, M.ideaPicked(def.name), "neutral", -1);
}

function spendHunger(s: GameState) {
  if (s.faim <= 0) s.moral = clamp(s.moral - B.starvingMoral);
  s.faim = clamp(s.faim - B.faimPerSlot);
}

function ship(s: GameState, p: Project) {
  const def = idea(p.ideaId);
  const mods = character(s.character).mods;
  const qualityMult = mods.qualityMult ?? 1;
  const first = !p.launched;
  const review = def.tags.includes("mobile") ? 1 : 0;
  s.stats.launches++;

  if (first) {
    const over = Math.max(0, p.built - p.mvpSize);
    const quality =
      B.launchQuality + Math.min(B.overbuildCap, over * B.overbuildQuality);
    p.quality = clamp(Math.round(quality * qualityMult));
    p.launched = true;
    p.launchDay = s.day;
    p.built = 0;
    const n = roundRandom(
      burstSignups(s, p, B.burstRate, "launch") * s.flags.burstMult,
      rand(s.seed, "launch-mult", s.day, s.slot),
    );
    s.flags.burstMult = 1;
    const delay = review + (mods.launchDelay ?? 0);
    if (delay > 0) {
      p.pending.push({ day: s.day + delay, signups: n, first: true });
      log(s, review ? M.launchInReview() : M.launchSalesCycle(delay));
    } else {
      log(s, M.launched(n), n > 0 ? "good" : "bad");
      landFirstLaunch(s, p, n);
    }
    return;
  }

  const shipped = p.built;
  p.quality = clamp(Math.round(p.quality + shipped * B.updateQuality * qualityMult));
  p.built = 0;
  const size = Math.min(1, shipped / 40);
  const n = roundRandom(
    burstSignups(s, p, B.updateBurstRate * size, "update") * s.flags.burstMult,
    rand(s.seed, "update-mult", s.day, s.slot),
  );
  s.flags.burstMult = 1;
  log(s, M.updateShipped(n, p.quality), n > 0 ? "good" : "neutral");
  if (review) p.pending.push({ day: s.day + review, signups: n, first: false });
  else addCustomers(s, p, n);
}

function act(s: GameState, id: ActionId) {
  const option = legalActions(s).find((a) => a.id === id);
  if (!option || !option.enabled) throw new Error(`Illegal action: ${id}`);

  const def = action(id);
  const mods = character(s.character).mods;
  const eff = efficiencyNow(s);
  const p = s.project;
  const key = [s.day, s.slot] as const;
  let free = false;

  switch (id) {
    case "coder": {
      if (!p) break;
      if (mods.shinyChance && rand(s.seed, "shiny", ...key) < mods.shinyChance) {
        s.moral = clamp(s.moral + 5);
        log(s, M.shiny());
        break;
      }
      const points = B.coderPoints * eff * (mods.coderMult ?? 1);
      p.built += points;
      s.stats.coded++;
      s.moral = clamp(s.moral - 2);
      if (!p.launched) {
        const pct = Math.min(100, Math.floor((p.built / p.mvpSize) * 100));
        log(s, p.built >= p.mvpSize ? M.mvpReady() : M.coded(pct));
      } else {
        log(s, M.codedUpdate(p.built, B.updateMin));
      }
      break;
    }
    case "shipper": {
      if (p) ship(s, p);
      break;
    }
    case "poster": {
      const viral =
        rand(s.seed, "viral", ...key) < B.viralChance * (mods.viralMult ?? 1);
      const gain = Math.max(
        1,
        Math.round(
          (B.postBase + B.postPct * s.audience) *
            between(0.6, 1.5, s.seed, "post", ...key) *
            (mods.marketingMult ?? 1) *
            eff *
            (viral ? B.viralMult : 1),
        ),
      );
      s.audience += gain;
      s.stats.posts++;
      s.moral = clamp(
        s.moral + (viral ? 10 : Math.round(between(-4, 3, s.seed, "likes", ...key))),
      );
      log(s, viral ? M.postedViral(gain) : M.posted(gain), viral ? "good" : "neutral");
      break;
    }
    case "demarcher": {
      if (isLive(p)) {
        const ideaDef = idea(p.ideaId);
        const chance =
          B.outreachChance *
          Math.pow(B.refPrice / ideaDef.price, B.outreachPriceExp) *
          Math.pow(
            B.potentialMult[potentialOf(s.seed, p.ideaId)],
            B.outreachPotentialExp,
          ) *
          (0.7 + p.quality / 200) *
          ideaDef.outreach *
          (mods.marketingMult ?? 1) *
          eff;
        if (rand(s.seed, "outreach", ...key) < chance) {
          s.moral = clamp(s.moral + 6);
          log(s, M.outreachWin(), "good");
          addCustomers(s, p, 1);
        } else {
          s.moral = clamp(s.moral - 5);
          log(s, M.outreachFail());
        }
      } else {
        const gain = Math.max(
          1,
          Math.round(B.waitlistGain * (mods.marketingMult ?? 1) * eff),
        );
        s.audience += gain;
        s.moral = clamp(s.moral - 2);
        log(s, M.waitlist(gain));
      }
      break;
    }
    case "support": {
      s.month.supportSlots++;
      s.audience += 2;
      s.moral = clamp(s.moral - 3);
      log(s, M.supportDone());
      break;
    }
    case "freelance": {
      s.cash += B.freelancePay;
      s.stats.freelance++;
      s.month.freelanceSlots++;
      s.moral = clamp(s.moral - 11);
      log(s, M.freelanceDone(B.freelancePay));
      break;
    }
    case "repos": {
      s.energie = clamp(s.energie + B.restEnergie * (mods.sleepMult ?? 1));
      s.moral = clamp(s.moral + B.restMoral);
      log(s, M.rested());
      break;
    }
    case "pivoter": {
      if (!p) break;
      const name = idea(p.ideaId).name;
      free = s.flags.freePivot;
      s.flags.freePivot = false;
      s.stats.pivots++;
      log(s, free ? M.pivotedFree(name) : M.pivoted(name));
      dropProject(s);
      chef(s, "pivot");
      break;
    }
    case "apero": {
      s.cash -= B.aperoCost;
      s.stats.aperos++;
      s.moral = clamp(s.moral + 22 * (mods.socialMoralMult ?? 1));
      log(s, M.apero(), "good");
      const intro =
        mods.aperoIntroSure || rand(s.seed, "intro", ...key) < 0.6;
      if (intro) {
        if (isLive(p) && rand(s.seed, "intro-kind", ...key) < 0.5) {
          log(s, M.introCustomer(), "good");
          addCustomers(s, p, 1);
        } else {
          s.audience += 25;
          log(s, M.introAudience(25), "good");
        }
      }
      break;
    }
  }

  if (free) return; // a free pivot costs no time at all

  s.energie = clamp(s.energie + def.energie);
  if (s.slot < SLOT_COUNT) spendHunger(s);
  if (s.slot === 2) s.soirWorked = def.work;
  s.slot++;

  if (id === "pivoter") {
    // The rest of the day goes with the project.
    const last = slotsToday(s);
    while (s.slot < last) {
      if (s.slot < SLOT_COUNT) spendHunger(s);
      s.slot++;
    }
  }

  // Now and then something cannot wait until tomorrow morning.
  if (!s.outcome && !s.pendingEvent) s.pendingEvent = pickUrgent(s, key[1]);
}

function eat(s: GameState, id: MealId) {
  const def = meal(id);
  if (s.cash < def.price) throw new Error(`Cannot afford: ${id}`);
  s.cash -= def.price;
  s.faim = clamp(s.faim + def.faim);
  s.moral = clamp(s.moral + def.moral);
  s.mealToday = id;
  if (id === "kebab") s.stats.kebabs++;
  else if (id === "pates") s.stats.pates++;
  else if (id === "welsh") s.stats.welshs++;
  else s.stats.skipped++;
  log(s, M.mealEaten(def.name, def.price), "neutral", -1);
  chef(s, isAperoDay(s.day) && id === "kebab" ? "apero" : (coaching(s) ?? id));

  // Christophe's flaw: the afternoon sometimes goes to a coffee.
  const coffee = character(s.character).mods.coffeeChance;
  if (
    coffee &&
    s.slot === 1 &&
    s.skipSlots === 0 &&
    rand(s.seed, "coffee", s.day) < coffee
  ) {
    s.stats.coffees++;
    s.moral = clamp(s.moral + 4);
    s.audience += 3;
    log(s, M.coffee());
    spendHunger(s);
    s.slot++;
  }
}

/** Closes the pending card with one of the given outcomes. */
function settle(
  s: GameState,
  ev: EventDef,
  all: readonly EventOutcome[],
  key: string | number,
  missed: boolean,
) {
  const outcomes = all.filter((o) => holds(s, o.when));
  s.eventsSeen.push(ev.id);
  s.pendingEvent = null;
  if (outcomes.length === 0) return;
  const picked =
    outcomes[
      weighted(
        outcomes.map((o) => o.p ?? 1),
        // An urgent card can come back the same day: the slot is part of its luck.
        rand(s.seed, "outcome", s.day, s.slot, ev.id, key),
      )
    ];
  applyEffect(s, picked.effect);
  const tone = effectTone(picked.effect);
  log(s, { fr: `${ev.title.fr} — ${picked.text.fr}`, en: `${ev.title.en} — ${picked.text.en}` }, tone, -1);
  if (picked.then && !s.outcome) {
    // The next card lands at once, and the journal says what led to it.
    s.pendingEvent = eventCard(picked.then).id;
    return;
  }
  s.eventResult = missed
    ? { id: ev.id, text: picked.text, tone, missed }
    : { id: ev.id, text: picked.text, tone };
}

function choose(s: GameState, index: number) {
  const ev = eventCard(s.pendingEvent!);
  const choice = ev.choices[index];
  if (!choice || !holds(s, choice.when)) {
    throw new Error(`Illegal choice ${index} for ${ev.id}`);
  }
  settle(s, ev, choice.outcomes, index, false);
}

/** The clock ran out on an urgent card. */
function miss(s: GameState) {
  const ev = eventCard(s.pendingEvent!);
  if (!ev.urgent) throw new Error(`Not an urgent card: ${ev.id}`);
  s.stats.missed++;
  settle(s, ev, ev.urgent.missed, "missed", true);
}

// ---------------------------------------------------------------------------
// Days, nights and month-ends
// ---------------------------------------------------------------------------

/** A card that can be dealt right now. */
function playable(s: GameState, e: EventDef): boolean {
  return (
    (e.repeatable || !s.eventsSeen.includes(e.id)) &&
    holds(s, e.when) &&
    e.choices.some((c) => holds(s, c.when))
  );
}

/** An urgent card for the slot that was just played, now and then. */
function pickUrgent(s: GameState, slot: number): string | null {
  if (s.day < B.urgentFirstDay) return null;
  if (rand(s.seed, "urgent", s.day, slot) >= B.urgentChance) return null;
  const deck = shuffle(URGENT, stream(s.seed, "urgent-deck"));
  const candidates = deck.filter((e) => playable(s, e));
  if (candidates.length === 0) return null;
  // New cards first, starting with the ones about where the project stands:
  // a force-push before launch, an outage after it. Once all have been seen,
  // any of them can come back.
  const unseen = candidates.filter((e) => !s.eventsSeen.includes(e.id));
  const fitting = unseen.find((e) => e.when?.launched !== undefined);
  if (unseen.length > 0) return (fitting ?? unseen[0]).id;
  const i = Math.floor(rand(s.seed, "urgent-again", s.day, slot) * candidates.length);
  return candidates[i].id;
}

function pickEvent(s: GameState): string | null {
  if (s.day < B.eventFirstDay) return null;
  const mods = character(s.character).mods;
  const deck = shuffle(OVERNIGHT, stream(s.seed, "deck"));
  const fresh = (e: EventDef) => !s.eventsSeen.includes(e.id);

  if (rand(s.seed, "event", s.day) < B.eventChance) {
    const candidates = deck.filter((e) => playable(s, e));
    return (candidates.find(fresh) ?? candidates[0])?.id ?? null;
  }
  if (mods.cameoBoost && rand(s.seed, "cameo", s.day) < mods.cameoBoost) {
    const card = deck.find(
      (e) => e.kind === "cameo" && e.tone === "good" && fresh(e) && playable(s, e),
    );
    return card?.id ?? null;
  }
  return null;
}

function monthEnd(s: GameState) {
  const p = s.project;
  const date = dateOf(s.day);
  const revenue = Math.round(s.month.revenue);
  const released = s.month.held;
  const held = s.flags.payoutHold ? revenue : 0;
  s.flags.payoutHold = false;
  const paid = revenue - held + released;
  const urssaf = Math.round(paid * B.urssafRate);

  let churned = 0;
  if (p && p.launched && p.customers > 0) {
    churned = Math.min(
      p.customers,
      roundRandom(p.customers * churnRate(s), rand(s.seed, "churn", s.day)),
    );
    if (churned > 0) {
      p.customers -= churned;
      s.moral = clamp(s.moral - Math.min(10, churned * 2));
    }
  }

  const net = paid - urssaf - B.rent;
  log(s, M.monthEnd(net), net >= 0 ? "good" : "bad", -1);
  if (churned > 0) log(s, M.churned(churned), "bad", -1);
  s.report = {
    month: date.month,
    revenue,
    held,
    released,
    urssaf,
    rent: B.rent,
    churned,
    newCustomers: s.month.newCustomers,
    cashAfter: Math.max(0, s.cash + net),
    mrr: mrrOf(s),
  };
  s.month = {
    revenue: 0,
    supportSlots: 0,
    freelanceSlots: 0,
    startMrr: mrrOf(s),
    newCustomers: 0,
    held,
  };
  chef(s, "report");
  addCash(s, net);
}

function endDay(s: GameState) {
  const mods = character(s.character).mods;

  // Sleep.
  const sleep = (s.soirWorked ? B.nightWorked : B.nightRested) * (mods.sleepMult ?? 1);
  s.energie = clamp(s.energie + sleep);
  s.moral = clamp(s.moral + B.nightMoral);

  // Overnight signups.
  const p = s.project;
  if (isLive(p)) {
    const boost = s.boosts.reduce((m, b) => m * b.mult, 1);
    const rate =
      s.audience * B.trickleRate * inboundFactor(s, p) * idea(p.ideaId).trickle * boost;
    const n = poisson(rate, stream(s.seed, "trickle", s.day));
    if (n > 0) {
      s.moral = clamp(s.moral + Math.min(3, n));
      log(s, M.nightSignups(n), "good", -1);
      addCustomers(s, p, n);
    }
  }
  checkMilestones(s);
  if (s.outcome) return;

  // Revenue accrues daily and is paid out at month-end.
  const date = dateOf(s.day);
  s.month.revenue += mrrOf(s) / date.daysInMonth;
  if (date.dayOfMonth === date.daysInMonth) monthEnd(s);
  if (s.outcome) return;

  // Next morning.
  s.day++;
  s.slot = 0;
  s.mealToday = null;
  s.soirWorked = false;
  s.morning = false;
  s.boosts = s.boosts.filter((b) => b.until >= s.day);

  const next = s.project;
  if (next) {
    const due = next.pending.filter((x) => x.day <= s.day);
    next.pending = next.pending.filter((x) => x.day > s.day);
    for (const landing of due) {
      log(s, M.pendingLanded(landing.signups), landing.signups > 0 ? "good" : "bad", -1);
      if (landing.first) landFirstLaunch(s, next, landing.signups);
      else addCustomers(s, next, landing.signups);
    }
  }
  if (s.outcome) return;

  const month = dateOf(s.day).month;
  if (s.cash < 300 && !s.milestones.includes(`lowCash-${month}`)) {
    s.milestones.push(`lowCash-${month}`);
    chef(s, "lowCash");
  }

  if (s.awayDays === 0) s.pendingEvent = pickEvent(s);
}

/** Things that can swallow a whole day before it starts. Returns true if they did. */
function morning(s: GameState): boolean {
  const consume = (meal: MealId) => {
    s.mealToday = meal;
    s.slot = slotsToday(s);
    s.soirWorked = false;
  };

  if (s.awayDays > 0) {
    s.awayDays--;
    s.faim = Math.max(s.faim, 80);
    log(s, M.away(), "good", -1);
    consume("skip");
    return true;
  }

  if (s.energie <= 0 || s.moral <= 0) {
    log(s, s.energie <= 0 ? M.lostDayEnergy() : M.lostDayMoral(), "bad", -1);
    s.energie = Math.max(s.energie, B.lostDayEnergie);
    s.moral = Math.max(s.moral, B.lostDayMoral);
    s.stats.lostDays++;
    s.skipSlots = 0;
    for (let i = 0; i < SLOT_COUNT; i++) s.faim = clamp(s.faim - B.faimPerSlot);
    if (s.cash >= 1) {
      s.cash -= 1;
      s.faim = clamp(s.faim + meal("pates").faim);
      s.stats.pates++;
      consume("pates");
    } else {
      s.stats.skipped++;
      consume("skip");
    }
    chef(s, "lostDay");
    return true;
  }
  return false;
}

/** Runs everything that needs no input and settles on the next phase. */
function advance(s: GameState) {
  for (let guard = 0; guard < 2000; guard++) {
    if (s.outcome) {
      s.phase = s.outcome.result;
      return;
    }
    if (s.report) {
      s.phase = "report";
      return;
    }
    if (s.pendingEvent) {
      s.phase = "event";
      return;
    }
    if (!s.project) {
      s.phase = "idea";
      return;
    }
    if (!s.morning) {
      s.morning = true;
      if (morning(s)) continue;
    }
    if (s.mealToday === null && s.slot >= 1) {
      s.phase = "meal";
      return;
    }
    if (s.slot >= slotsToday(s)) {
      endDay(s);
      continue;
    }
    if (s.skipSlots > 0) {
      s.skipSlots--;
      log(s, M.slotLost());
      if (s.slot < SLOT_COUNT) spendHunger(s);
      if (s.slot === 2) s.soirWorked = false;
      s.slot++;
      continue;
    }
    s.phase = "slot";
    return;
  }
  throw new Error("The game did not settle on a phase");
}

/** Applies a move in place. Throws if the move is not legal right now. */
export function step(s: GameState, move: Move): void {
  if (s.outcome) throw new Error("The run is over");
  s.eventResult = null;
  switch (s.phase) {
    case "idea":
      if (move.t !== "idea") throw new Error("Expected an idea");
      pickIdea(s, move.id);
      break;
    case "slot":
      if (move.t !== "act") throw new Error("Expected an action");
      act(s, move.id);
      break;
    case "meal":
      if (move.t !== "meal") throw new Error("Expected a meal");
      eat(s, move.id);
      break;
    case "event":
      if (move.t === "miss") miss(s);
      else if (move.t === "choice") choose(s, move.id);
      else throw new Error("Expected a choice");
      break;
    case "report":
      if (move.t !== "ok") throw new Error("Expected a dismissal");
      s.report = null;
      break;
    default:
      throw new Error("The run is over");
  }
  s.history.push(move);
  advance(s);
}

/** Applies a move and returns the new state, leaving the old one untouched. */
export function apply(state: GameState, move: Move): GameState {
  const next = structuredClone(state);
  step(next, move);
  return next;
}

export function createRun(seed: string, characterId: CharacterId): GameState {
  character(characterId); // throws on an unknown id
  const s: GameState = {
    v: 2,
    seed,
    character: characterId,
    day: 1,
    slot: 0,
    phase: "idea",
    faim: B.startFaim,
    energie: B.startEnergie,
    moral: B.startMoral,
    cash: B.startCash,
    audience: B.startAudience,
    project: null,
    offer: drawIdeas(seed, 0, characterId, []),
    ideaDraws: 1,
    usedIdeas: [],
    mealToday: null,
    soirWorked: false,
    morning: false,
    skipSlots: 0,
    awayDays: 0,
    boosts: [],
    flags: { burstMult: 1, freePivot: false, payoutHold: false },
    month: {
      revenue: 0,
      supportSlots: 0,
      freelanceSlots: 0,
      startMrr: 0,
      newCustomers: 0,
      held: 0,
    },
    eventsSeen: [],
    pendingEvent: null,
    eventResult: null,
    report: null,
    milestones: [],
    chef: CHEF.start[Math.floor(rand(seed, "chef", "start") * CHEF.start.length)],
    chefSaid: {},
    log: [],
    logCount: 0,
    history: [],
    outcome: null,
    stats: {
      kebabs: 0,
      pates: 0,
      welshs: 0,
      skipped: 0,
      pivots: 0,
      launches: 0,
      freelance: 0,
      aperos: 0,
      posts: 0,
      coded: 0,
      lostDays: 0,
      coffees: 0,
      missed: 0,
    },
  };
  log(s, M.intro(), "neutral", -1);
  return s;
}

/** Replays a run from scratch. Throws if any move is illegal. */
export function replay(
  seed: string,
  characterId: CharacterId,
  moves: readonly Move[],
): GameState {
  if (moves.length > B.maxMoves) throw new Error("Too many moves");
  const s = createRun(seed, characterId);
  for (const move of moves) step(s, move);
  return s;
}

/** Which event choices are open, and for Karl, their odds. */
export function eventChoices(s: GameState) {
  if (!s.pendingEvent) return [];
  const ev = eventCard(s.pendingEvent);
  return ev.choices.map((choice, index) => {
    const outcomes = choice.outcomes.filter((o) => holds(s, o.when));
    const total = outcomes.reduce((sum, o) => sum + (o.p ?? 1), 0);
    return {
      index,
      label: choice.label,
      enabled: holds(s, choice.when),
      odds: outcomes.map((o) => ({ p: (o.p ?? 1) / total, effect: o.effect })),
    };
  });
}
