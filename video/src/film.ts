/**
 * Draws one frame of the film. `seek(t)` paints time t, in seconds, and every
 * frame is a pure function of t, the format and the reduced-motion switch:
 * no clocks, no state carried from the frame before, randomness only from
 * the seed. The room and the founder are drawn by the game's own code.
 */
import { drawRoom, image, loadArt, ROOM_H, ROOM_W, type Art, type Pose, type RoomScene, type Screen } from "../../src/ui/pixels";
import introAtlas from "../../src/ui/intro-atlas.json";
import { CELL, drawText, loadFonts, measure } from "./font";
import {
  BAR, BEAT, CAPTIONS, CHEF, DURATION, MODEL, PLAY, RUN, SCALE, SCENES, TITLES, bar, dayAt, monthEnds,
  timeOfDay, type Caption, type Day, type SceneId,
} from "./timeline";
import { COLOR, EASE, FORMATS, type Format } from "./tokens";

type Ctx = CanvasRenderingContext2D;
interface Rect { x: number; y: number; w: number; h: number }

// ---------------------------------------------------------------------------
// Layouts: one per format. The picture is the game's room, 192 by 128, at
// one art pixel per pixel; the bars sit beside it or over it.
// ---------------------------------------------------------------------------

interface Layout {
  pic: Rect;
  /** The founder's bars and Chef's bar. */
  you: Rect;
  chef: Rect;
  /** Bars drawn over the room, without portraits or labels. */
  compact: boolean;
  band: Rect;
  /** Where the day counter goes. */
  day: { x: number; y: number; scale: number; panel: boolean };
  narrow: boolean;
}

const LAYOUTS: Record<Format, Layout> = {
  "16x9": {
    pic: { x: 64, y: 6, w: ROOM_W, h: ROOM_H },
    you: { x: 6, y: 6, w: 54, h: 132 },
    chef: { x: 260, y: 6, w: 54, h: 132 },
    compact: false,
    band: { x: 8, y: 144, w: 304, h: 36 },
    day: { x: 160, y: 10, scale: 2, panel: true },
    narrow: false,
  },
  "9x16": {
    pic: { x: 12, y: 64, w: ROOM_W, h: ROOM_H },
    you: { x: 12, y: 200, w: 92, h: 116 },
    chef: { x: 112, y: 200, w: 92, h: 116 },
    compact: false,
    band: { x: 6, y: 328, w: 204, h: 36 },
    day: { x: 108, y: 34, scale: 2, panel: false },
    narrow: true,
  },
  "1x1": {
    pic: { x: 12, y: 6, w: ROOM_W, h: ROOM_H },
    you: { x: 14, y: 10, w: 26, h: 104 },
    chef: { x: 182, y: 10, w: 20, h: 104 },
    compact: true,
    band: { x: 6, y: 144, w: 204, h: 36 },
    day: { x: 108, y: 116, scale: 2, panel: true },
    narrow: true,
  },
};

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const progress = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

/** The game's --ease-swap, solved for x: cubic-bezier(0.2, 0, 0, 1). */
function ease(u: number): number {
  const [x1, y1, x2, y2] = EASE;
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < u) lo = mid; else hi = mid;
  }
  return by((lo + hi) / 2);
}

const sceneAt = (t: number): SceneId => (SCENES.find((s) => t >= s.from && t < s.to) ?? SCENES[SCENES.length - 1]).id;

/** Whole frames of a 60 fps film: the room's animation clock. */
const frameOf = (t: number, perSecond: number) => Math.floor(t * perSecond + 1e-6);

// ---------------------------------------------------------------------------
// The numbers on the bars, from the timeline and the recorded runs.
// ---------------------------------------------------------------------------

function sample(days: Day[], day: number, key: "cash" | "mrr"): number {
  const i = Math.max(0, Math.min(days.length - 1, Math.floor(day) - 1));
  const j = Math.min(days.length - 1, i + 1);
  const u = day - Math.floor(day);
  return days[i][key] + (days[j][key] - days[i][key]) * u;
}

interface Numbers { cash: number; mrr: number; day: number | null; run: "silent" | "expert" | null }

function numbers(t: number, reduced: boolean): Numbers {
  const silent = RUN.silent.days;
  const expert = RUN.expert.days;
  if (t < PLAY.silent.from) {
    // The model: the bank fills, rent comes out, the MRR bar waits at zero.
    const fill = reduced ? (t >= MODEL.cashFill.from ? 1 : 0) : progress(t, MODEL.cashFill.from, MODEL.cashFill.to);
    let cash = SCALE.cash * fill;
    if (t >= MODEL.rent) cash -= 600 * (reduced ? 1 : ease(progress(t, MODEL.rent, MODEL.rent + 0.3)));
    // Between Chef and the first run, the bars go to day one.
    if (t >= TITLES.ready.from) {
      const u = reduced ? 1 : ease(progress(t, TITLES.ready.from, TITLES.ready.to));
      cash = cash + (silent[0].cash - cash) * u;
    }
    return { cash, mrr: 0, day: t >= TITLES.ready.from ? 1 : null, run: null };
  }
  if (t < PLAY.rewind.from) {
    const day = dayAt(PLAY.silent, t);
    return { cash: sample(silent, day, "cash"), mrr: sample(silent, day, "mrr"), day, run: "silent" };
  }
  if (t < PLAY.expert.from) {
    // Run 1 winds back to day one.
    const u = reduced ? 1 : ease(progress(t, PLAY.rewind.from, PLAY.rewind.to));
    const day = silent.length - u * (silent.length - 1);
    return { cash: sample(silent, day, "cash"), mrr: sample(silent, day, "mrr"), day, run: u < 1 ? "silent" : "expert" };
  }
  const day = dayAt(PLAY.expert, t);
  return { cash: sample(expert, day, "cash"), mrr: sample(expert, day, "mrr"), day, run: "expert" };
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

interface Assets {
  art: Art;
  intro: HTMLImageElement;
  portraits: Record<"david" | "chef", HTMLImageElement>;
  room: HTMLCanvasElement;
}
let A: Assets;

const INTRO = introAtlas as unknown as Record<string, [number, number, number, number]>;
function introSprite(c: Ctx, name: string, x: number, y: number) {
  const [fx, fy, w, h] = INTRO[name];
  c.drawImage(A.intro, fx, fy, w, h, Math.round(x), Math.round(y), w, h);
}

function panel(c: Ctx, r: Rect, fill: string = COLOR.panel) {
  c.fillStyle = COLOR.ground;
  c.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  c.fillStyle = fill;
  c.fillRect(r.x, r.y, r.w, r.h);
}

/**
 * A segmented energy bar, filled from the bottom: dark frame, empty segments
 * in the border colour, full ones in the bar's colour with a light top edge.
 */
function energyBar(
  c: Ctx,
  x: number,
  y: number,
  segments: number,
  fill: number,
  color: string,
  notch?: number,
) {
  const w = 8;
  const h = segments * 3 + 3;
  c.fillStyle = COLOR.ground;
  c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = COLOR.dim;
  c.fillRect(x, y, w, h);
  c.fillStyle = COLOR.ground;
  c.fillRect(x + 1, y + 1, w - 2, h - 2);
  const full = Math.round(clamp01(fill) * segments);
  for (let i = 0; i < segments; i++) {
    const sy = y + h - 3 - i * 3;
    c.fillStyle = i < full ? color : COLOR.line;
    c.fillRect(x + 2, sy, w - 4, 2);
    if (i < full) {
      c.fillStyle = "rgba(255,255,255,0.45)";
      c.fillRect(x + 2, sy, w - 4, 1);
    }
  }
  if (notch !== undefined) {
    // The goal: a mark that sticks out on both sides, in the accent.
    const ny = y + h - 3 - Math.round(notch * segments) * 3 + 2;
    c.fillStyle = COLOR.accent;
    c.fillRect(x - 3, ny, w + 6, 1);
  }
  return h;
}

function money(v: number) {
  const n = Math.max(0, Math.round(v));
  return "€" + n.toLocaleString("en-US");
}

/** The founder's two bars, cash and MRR, under their portrait. */
function drawYou(c: Ctx, L: Layout, t: number, n: Numbers, reduced: boolean) {
  if (t < MODEL.cashFill.from || t >= TITLES.title.from) return;
  const r = L.you;
  const mrrShown = t >= MODEL.mrrIn;
  if (L.compact) {
    // Over the room, the bars would cover WARNING: they step aside for it.
    if (t >= TITLES.warning.from && t < TITLES.warning.to) return;
    const segments = 24;
    panel(c, { x: r.x - 2, y: r.y - 2, w: mrrShown ? 26 : 12, h: segments * 3 + 7 });
    energyBar(c, r.x, r.y, segments, n.cash / SCALE.cash, COLOR.text);
    if (mrrShown) energyBar(c, r.x + 13, r.y, segments, n.mrr / SCALE.mrr, COLOR.accent, SCALE.goal / SCALE.mrr);
    return;
  }
  const portraitY = r.y;
  c.drawImage(A.portraits.david, r.x + Math.round((r.w - 32) / 2), portraitY);
  // Under the bars, one row each, in the bars' order: name, then amount.
  const rows = 20;
  const top = portraitY + 36;
  const segments = Math.floor((r.h - 36 - rows - 6) / 3);
  const cashX = r.x + Math.round(r.w * 0.3) - 4;
  const mrrX = r.x + Math.round(r.w * 0.7) - 4;
  const h = energyBar(c, cashX, top, segments, n.cash / SCALE.cash, COLOR.text);
  const row = (y: number, name: string, value: string, color: string) => {
    const w = measure(name + " " + value);
    const x = r.x + Math.round((r.w - w) / 2);
    drawText(c, name, x, y, { color: COLOR.soft });
    drawText(c, value, x + measure(name + " ") + 1, y, { color });
  };
  row(top + h + 4, "CASH", money(n.cash), COLOR.text);
  if (mrrShown) {
    const won = n.mrr >= SCALE.goal;
    energyBar(c, mrrX, top, segments, n.mrr / SCALE.mrr, COLOR.accent, SCALE.goal / SCALE.mrr);
    row(top + h + 13, "MRR", money(n.mrr), won ? COLOR.accent : COLOR.text);
  }
  drawPopups(c, t, cashX + 10, top, h, reduced);
}

/** Small words centred on x. */
function label(c: Ctx, text: string, cx: number, y: number, color: string) {
  drawText(c, text, cx - Math.round(measure(text) / 2), y, { color });
}

/**
 * What a month-end takes out, beside the cash bar: the real drop, in the run
 * being played. It rises a few pixels and goes.
 */
function drawPopups(c: Ctx, t: number, x: number, top: number, h: number, reduced: boolean) {
  const drops: { at: number; amount: number }[] = [];
  drops.push({ at: MODEL.rent, amount: 600 });
  for (const [play, days] of [[PLAY.silent, RUN.silent.days], [PLAY.expert, RUN.expert.days]] as const) {
    for (const d of monthEnds(days)) {
      const prev = days[d - 2];
      drops.push({ at: timeOfDay({ ...play, days }, d), amount: prev.cash - days[d - 1].cash });
    }
  }
  for (const d of drops) {
    const u = (t - d.at) / 1.1;
    if (u < 0 || u > 1) continue;
    const rise = reduced ? 0 : Math.round(ease(Math.min(1, u * 2)) * 6);
    drawText(c, "-" + money(d.amount), x, top + Math.round(h * 0.35) - rise, { color: COLOR.loss, shadow: COLOR.ground });
  }
}

/** Chef's bar: his portrait, one bar, always full. */
function drawChefBar(c: Ctx, L: Layout, t: number, reduced: boolean) {
  if (t < CHEF.barFill.from || t >= TITLES.title.from) return;
  const fill = reduced ? 1 : progress(t, CHEF.barFill.from, CHEF.barFill.to);
  const r = L.chef;
  if (L.compact) {
    const segments = 24;
    panel(c, { x: r.x - 2, y: r.y - 2, w: 12, h: segments * 3 + 7 });
    energyBar(c, r.x, r.y, segments, fill, COLOR.accent);
    return;
  }
  c.drawImage(A.portraits.chef, r.x + Math.round((r.w - 32) / 2), r.y);
  const top = r.y + 36;
  const segments = Math.floor((r.h - 36 - 22 - 3) / 3);
  const x = r.x + Math.round(r.w / 2) - 4;
  const h = energyBar(c, x, top, segments, fill, COLOR.accent);
  label(c, "CHEF", x + 4, top + h + 4, COLOR.soft);
  label(c, "PROFITABLE", x + 4, top + h + 13, COLOR.accent);
}

// ---------------------------------------------------------------------------
// The picture
// ---------------------------------------------------------------------------

function roomScene(t: number, n: Numbers): RoomScene & { veil: number } {
  const scene = sceneAt(t);
  const base: RoomScene = {
    who: RUN.founder,
    time: 3,
    pose: "desk",
    screen: "ship",
    raining: false,
    moral: 60,
    goal: clamp01(n.mrr / SCALE.goal),
    kebabs: 0,
    pates: 0,
    cheer: 0,
    frame: frameOf(t, 4),
    beat: frameOf(t, 12),
    dark: 0,
    neon: 1,
    seed: 36,
  };
  let veil = 0;
  if (scene === "question") {
    veil = 1 - progress(t, 0, 0.8);
  } else if (scene === "model") {
    // The three moves, each as the founder does it in the game.
    const [code, ship, post] = MODEL.moves;
    const poses: [number, Pose, Screen][] = [[code, "desk", "code"], [ship, "desk", "ship"], [post, "post", "ship"]];
    for (const [at, pose, screen] of poses) if (t >= at) Object.assign(base, { pose, screen });
  } else if (scene === "proof") {
    Object.assign(base, { time: 1, pose: "desk", screen: "code", neon: 0 });
    // Broke: the room is empty, the founder is back at a day job.
    if (n.day !== null && n.day >= RUN.silent.days.length - 0.01 && t >= PLAY.silent.to) base.pose = "out";
  } else if (scene === "turn") {
    if (n.run === "silent") Object.assign(base, { time: 1, pose: "desk", screen: "code", neon: 0 });
    else Object.assign(base, { time: 2, pose: "post", screen: "chat" });
  } else if (scene === "payoff") {
    const since = (t - bar(26)) * 1000;
    Object.assign(base, { time: 3, pose: "cheer", cheer: Math.min(since, 1999), goal: 1, kebabs: 6 });
    if (t >= TITLES.title.from) veil = 0.75;
  }
  return { ...base, veil };
}

/**
 * The camera: close on the desk to open, pulled back for the model and the
 * runs, close on the rug for the payoff. It moves only between ideas.
 */
const DESK = { cx: 112, cy: 40 };
const RUG = { cx: 104, cy: 78 };
function camera(t: number, reduced: boolean): { zoom: number; cx: number; cy: number } {
  const whole = { zoom: 1, cx: ROOM_W / 2, cy: ROOM_H / 2 };
  const lerp = (a: typeof whole, b: typeof whole, u: number) => ({
    zoom: a.zoom + (b.zoom - a.zoom) * u, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u,
  });
  const close = (at: { cx: number; cy: number }) => ({ zoom: 2, ...at });
  if (t < bar(3)) return close(DESK);
  if (t < bar(26)) {
    const u = reduced ? 1 : ease(progress(t, bar(3), bar(3) + 0.6));
    return lerp(close(DESK), whole, u);
  }
  const u = reduced ? 1 : ease(progress(t, bar(26), bar(26) + 0.6));
  return lerp(whole, close(RUG), u);
}

function drawPicture(c: Ctx, L: Layout, t: number, n: Numbers, reduced: boolean) {
  const p = L.pic;
  const scene = sceneAt(t);
  if (scene === "chef") drawChefStage(c, p, t, reduced, L.compact);
  else {
    const s = roomScene(t, n);
    if (reduced && s.pose === "cheer") s.cheer = 1999;
    const rc = A.room.getContext("2d")!;
    drawRoom(rc, A.art, s);
    if (s.veil > 0) {
      // In steps, as a console dims its palette.
      rc.fillStyle = `rgba(8,10,26,${Math.round(s.veil * 8) / 8})`;
      rc.fillRect(0, 0, ROOM_W, ROOM_H);
    }
    const cam = camera(t, reduced);
    const sw = ROOM_W / cam.zoom, sh = ROOM_H / cam.zoom;
    const sx = Math.max(0, Math.min(ROOM_W - sw, cam.cx - sw / 2));
    const sy = Math.max(0, Math.min(ROOM_H - sh, cam.cy - sh / 2));
    c.drawImage(A.room, sx, sy, sw, sh, p.x, p.y, p.w, p.h);
  }
  // Between the room and Chef's stage, a panel wipes across, right to left.
  if (!reduced) {
    for (const at of [bar(10), bar(14)]) {
      const u = (t - (at - 0.12)) / 0.24;
      if (u <= 0 || u >= 1) continue;
      const cover = u < 0.5 ? ease(u * 2) : 1 - ease((u - 0.5) * 2);
      const w = Math.round(p.w * cover);
      c.fillStyle = COLOR.ground;
      if (u < 0.5) c.fillRect(p.x + p.w - w, p.y, w, p.h);
      else c.fillRect(p.x, p.y, w, p.h);
    }
  }
  // A one-pixel frame keeps the picture a picture in every format.
  c.strokeStyle = COLOR.line;
  c.lineWidth = 1;
  c.strokeRect(p.x - 0.5, p.y - 0.5, p.w + 1, p.h + 1);
}

/** Lines streaking past behind Chef, only while he comes in. */
const STREAKS = [COLOR.panel, COLOR.line, COLOR.panel, COLOR.dim, COLOR.line];

function drawChefStage(c: Ctx, p: Rect, t: number, reduced: boolean, compactStage = false) {
  c.save();
  c.beginPath();
  c.rect(p.x, p.y, p.w, p.h);
  c.clip();
  c.fillStyle = COLOR.ground;
  c.fillRect(p.x, p.y, p.w, p.h);

  if (t < TITLES.warning.to) {
    // WARNING, between two hazard bands that crawl to the left.
    const crawl = reduced ? 0 : Math.floor((t - bar(10)) * 24);
    for (const by of [p.y + 18, p.y + p.h - 26]) {
      c.fillStyle = COLOR.accent;
      c.fillRect(p.x, by, p.w, 8);
      c.fillStyle = COLOR.ground;
      for (let x = -16; x < p.w + 16; x += 8) {
        const sx = p.x + ((x - crawl) % 16 + 16) % 16 + Math.floor(x / 16) * 16;
        c.beginPath();
        c.moveTo(sx, by);
        c.lineTo(sx + 4, by);
        c.lineTo(sx + 8, by + 8);
        c.lineTo(sx + 4, by + 8);
        c.fill();
      }
    }
    // On for most of a beat, off for the rest: 2.5 times a second.
    const on = reduced || (t - bar(10)) % BEAT < BEAT * 0.65;
    if (on) {
      const scale = 3;
      const w = measure("WARNING", scale, "Silkscreen Bold");
      drawText(c, "WARNING", p.x + Math.round((p.w - w) / 2), p.y + 50, { scale, color: COLOR.text, family: "Silkscreen Bold" });
    }
    c.restore();
    return;
  }

  const enter = reduced ? 1 : ease(progress(t, CHEF.enter.from, CHEF.enter.to));
  const shove = Math.round((1 - enter) * 200);
  if (!reduced && enter < 1) {
    for (let i = 0; i < 14; i++) {
      const length = 20 + ((i * 37) % 50);
      const x = p.x + p.w - (((t - CHEF.enter.from) * (500 + (i % 4) * 90) + i * 61) % (p.w + length));
      c.fillStyle = STREAKS[i % STREAKS.length];
      c.fillRect(Math.round(x), p.y + 6 + i * 9, length, i % 5 === 4 ? 1 : 2);
    }
  }
  // The spit turns slowly behind him.
  const spin = reduced ? 0 : Math.floor(t / 0.16) % 8;
  introSprite(c, `intro_spit_${spin}`, p.x + 146 + shove * 1.3, p.y + p.h - 92);
  // Grinning while he talks, smug once he has made his point.
  const talking = t >= bar(12) && t < bar(12) + 0.84;
  const face = t >= bar(13) ? 2 : talking && !reduced ? (Math.floor((t - bar(12)) / 0.14) % 2 ? 1 : 0) : talking ? 1 : 0;
  introSprite(c, `intro_chef_${face}`, p.x + 70 + shove, p.y + p.h - 106);

  if (t >= TITLES.chefName.from && t < TITLES.chefName.to) {
    drawText(c, "CHEF", p.x + (compactStage ? 34 : 8), p.y + 8, { scale: compactStage ? 2 : 3, color: COLOR.accent, family: "Silkscreen Bold", shadow: COLOR.ground });
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const TYPE_RATE = 40;

function visible(text: string, at: number, t: number, reduced: boolean) {
  if (t < at) return "";
  if (reduced) return text;
  return text.slice(0, Math.floor((t - at) * TYPE_RATE) + 1);
}

function drawCaption(c: Ctx, L: Layout, cap: Caption, t: number, reduced: boolean) {
  const lines = L.narrow && cap.narrow ? cap.narrow : cap.lines;
  lines.forEach((line, i) => {
    const full = measure(line.text, 2);
    const shown = visible(line.text, line.at, t, reduced);
    if (!shown) return;
    const x = L.band.x + Math.round((L.band.w - full) / 2);
    drawText(c, shown, x, L.band.y + i * 18, { scale: 2, color: line.accent ? COLOR.accent : COLOR.text });
  });
}

function drawDay(c: Ctx, L: Layout, n: Numbers) {
  if (n.day === null) return;
  const s = L.day.scale;
  const day = `DAY ${Math.round(n.day)}`;
  const mrr = `MRR ${money(n.mrr)}`;
  // Wide enough for the longest values, so the box does not twitch as the days go by.
  const gap = measure("  ", s);
  const w = measure("DAY 00", s) + gap + measure("MRR €000", s);
  const x = L.day.x - Math.round(w / 2);
  if (L.day.panel) panel(c, { x: x - 4, y: L.day.y - 3, w: w + 8, h: CELL * s + 4 });
  drawText(c, day, x, L.day.y, { scale: s, color: COLOR.text });
  drawText(c, mrr, x + measure("DAY 00", s) + gap, L.day.y, { scale: s, color: n.mrr >= SCALE.goal ? COLOR.accent : COLOR.text });
}

/**
 * What the founder is doing, over their head, while a run plays: the one
 * variable between the two runs, big enough to read on a phone.
 */
function drawMove(c: Ctx, L: Layout, t: number, n: Numbers) {
  const playing = (t >= PLAY.silent.from && t < PLAY.silent.to) || (t >= PLAY.expert.from && t < PLAY.expert.to);
  if (!playing) return;
  const posts = n.run === "expert";
  const word = posts ? "POST" : "CODE";
  // Beside the desk, or over the rug.
  const [cx, top] = posts ? [104, 46] : [148, 48];
  const w = measure(word, 2);
  const x = L.pic.x + cx - Math.round(w / 2);
  const y = L.pic.y + top;
  panel(c, { x: x - 3, y: y - 3, w: w + 6, h: CELL * 2 + 3 }, posts ? COLOR.accent : COLOR.panel);
  drawText(c, word, x, y, { scale: 2, color: posts ? COLOR.ground : COLOR.text });
}

/** Chef, when he speaks outside his own scene: his face in the picture's corner. */
function drawChefAside(c: Ctx, L: Layout, t: number) {
  if (sceneAt(t) === "chef") return;
  const speaking = CAPTIONS.some((cap) => cap.chef && t >= cap.from && t < cap.to);
  if (!speaking) return;
  const x = L.pic.x + L.pic.w - 40;
  const y = L.pic.y + L.pic.h - 40;
  panel(c, { x: x - 2, y: y - 2, w: 36, h: 36 });
  c.drawImage(A.portraits.chef, x, y);
}

function drawReady(c: Ctx, L: Layout, t: number, reduced: boolean) {
  const { from, to } = TITLES.ready;
  if (t < from || t >= to) return;
  if (!reduced && (t - from) % BEAT >= BEAT * 0.65) return;
  const p = L.pic;
  const w = measure("READY", 3, "Silkscreen Bold");
  drawText(c, "READY", p.x + Math.round((p.w - w) / 2), p.y + 54, { scale: 3, color: COLOR.text, family: "Silkscreen Bold", shadow: COLOR.ground });
}

function drawTitle(c: Ctx, L: Layout, f: { w: number; h: number }, t: number, reduced: boolean) {
  const { from } = TITLES.title;
  if (t < from) return;
  const p = L.pic;
  let scale = 5;
  while (scale > 1 && measure("PROFITABLE", scale, "Silkscreen Bold") > f.w - 12) scale--;
  const lineH = CELL * scale + 2;
  const top = p.y + Math.round((p.h - lineH * 2) / 2) - (L.narrow ? 10 : 0);
  // The two words land one after the other, a beat apart.
  ["KEBAB", "PROFITABLE"].forEach((word, i) => {
    const at = from + i * BEAT;
    if (t < at) return;
    const w = measure(word, scale, "Silkscreen Bold");
    const drop = reduced ? 0 : Math.round((1 - ease(progress(t, at, at + 0.3))) * -8);
    drawText(c, word, Math.round((f.w - w) / 2), top + i * lineH + drop, {
      scale,
      color: i === 0 ? COLOR.accent : COLOR.text,
      family: "Silkscreen Bold",
      shadow: COLOR.ground,
    });
  });
  if (L.narrow) {
    const line = TITLES.playLine;
    const shown = visible(line.text, line.from, t, reduced);
    const w = measure(line.text, 2);
    if (shown) drawText(c, shown, Math.round((f.w - w) / 2), top + lineH * 2 + 6, { scale: 2, color: COLOR.text, shadow: COLOR.ground });
  }
}

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------

export function paint(c: Ctx, format: Format, t: number, reduced: boolean) {
  const f = FORMATS[format];
  const L = LAYOUTS[format];
  t = Math.max(0, Math.min(DURATION - 1e-6, t));
  c.imageSmoothingEnabled = false;
  c.fillStyle = COLOR.ground;
  c.fillRect(0, 0, f.w, f.h);

  const n = numbers(t, reduced);
  drawPicture(c, L, t, n, reduced);
  drawYou(c, L, t, n, reduced);
  drawChefBar(c, L, t, reduced);
  if (sceneAt(t) === "proof" || sceneAt(t) === "turn") {
    drawDay(c, L, n);
    drawMove(c, L, t, n);
  }
  drawChefAside(c, L, t);
  drawReady(c, L, t, reduced);
  drawTitle(c, L, f, t, reduced);
  for (const cap of CAPTIONS) if (t >= cap.from && t < cap.to) drawCaption(c, L, cap, t, reduced);
}

/** Lines that do not fit their band, per format: the render refuses them. */
export function overflow(): string[] {
  const out: string[] = [];
  for (const [format, L] of Object.entries(LAYOUTS)) {
    for (const cap of CAPTIONS) {
      const lines = L.narrow && cap.narrow ? cap.narrow : cap.lines;
      if (lines.length > 2) out.push(`${format} ${cap.id}: more than two lines`);
      for (const line of lines) {
        const w = measure(line.text, 2);
        if (w > L.band.w) out.push(`${format} ${cap.id}: "${line.text}" is ${w}px in a ${L.band.w}px band`);
        if (line.text.split(" ").length > 8) out.push(`${cap.id}: more than 8 words`);
      }
    }
  }
  return out;
}

export async function load() {
  await loadFonts("/fonts");
  const [art, intro, david, chef] = await Promise.all([
    loadArt(),
    image("/art/intro.png"),
    image("/art/portrait_david.png"),
    image("/art/portrait_chef.png"),
  ]);
  const room = document.createElement("canvas");
  room.width = ROOM_W;
  room.height = ROOM_H;
  A = { art, intro, portraits: { david, chef }, room };
}

export { BAR, DURATION };
