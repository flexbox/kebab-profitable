/**
 * Putting the room together.
 *
 * The pixel art itself is written in `art/kebab.px.js` and rendered to PNGs by
 * `pnpm art`: the room in each light, and one sheet of everything that moves.
 * This file only decides which pieces to place, and where, for a given moment
 * of a run. Nothing is tinted here: each piece was painted in the right light.
 * The one exception is the neon sign, which is light itself: it is see-through,
 * and drawn fainter while it flickers.
 */
import type { CharacterId } from "@/game/types";
import atlasJson from "./atlas.json";

type Ctx = CanvasRenderingContext2D;

/** Where each sprite sits on the sheet: x, y, width, height. */
const ATLAS = atlasJson as unknown as Record<string, [number, number, number, number]>;

export type PersonId = CharacterId | "chef";

export const ROOM_W = 192;
export const ROOM_H = 128;

/**
 * A new customer, as a hero marks a fallen boss: two turns on the spot, then a
 * fist in the air. The turns last as long as the run of notes in the sound,
 * and the fist goes up on its chord.
 */
export const CHEER = {
  /** One quarter of a turn, in milliseconds. */
  quarter: 60,
  /** How long the turning lasts: two turns. */
  spin: 480,
  /** The pose starts washed out to white, for this long. */
  flash: 90,
  /** And with a small hop. */
  hop: 160,
  /** The whole of it: the sound has faded by then. */
  length: 2000,
};

/** "eat" is lunch, sitting against the fridge; "feast" is the same on the rug, once you have won. */
export type Pose =
  | "idle"
  | "desk"
  | "post"
  | "call"
  | "bed"
  | "eat"
  | "feast"
  | "think"
  | "alert"
  | "hungry"
  | "cheer"
  | "out";
export type Screen = "code" | "ship" | "chat" | "invoice" | "off";

export interface RoomScene {
  who: CharacterId;
  /** 0 morning, 1 afternoon, 2 evening, 3 night. */
  time: number;
  pose: Pose;
  screen: Screen;
  raining: boolean;
  /** 0..100 */
  moral: number;
  /** 0..1, progress towards the kebab goal. */
  goal: number;
  kebabs: number;
  pates: number;
  /** With the "cheer" pose: how far into it, in milliseconds. */
  cheer: number;
  /** Animation frame, toggles a few times a second. */
  frame: number;
  /** A finer clock for the founder's own movements: three beats to a frame. */
  beat: number;
  /** How far night has fallen over the whole picture, from 0 to 1: see `Room`. */
  dark: number;
  /** How bright the neon sign is, from 0 (off, by day) to 1. */
  neon: number;
  seed: number;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const ROOMS = [
  "morning",
  "morning_rain",
  "afternoon",
  "afternoon_rain",
  "evening",
  "night",
] as const;
type RoomName = (typeof ROOMS)[number];

export interface Art {
  sheet: HTMLImageElement;
  rooms: Record<RoomName, HTMLImageElement>;
  /** The back room of the bar, on apéro nights. */
  bar: HTMLImageElement;
}

export function image(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

let loading: Promise<Art> | null = null;

/** Loads the art once: the sheet, the room in each light, and the bar. */
export function loadArt(): Promise<Art> {
  loading ??= Promise.all([
    image("/art/sprites.png"),
    image("/art/bar.png"),
    ...ROOMS.map((name) => image(`/art/room_${name}.png`)),
  ]).then(([sheet, bar, ...rooms]) => ({
    sheet,
    bar,
    rooms: Object.fromEntries(ROOMS.map((name, i) => [name, rooms[i]])) as Art["rooms"],
  }));
  return loading;
}

// ---------------------------------------------------------------------------
// Light
// ---------------------------------------------------------------------------

/** The lights each sprite was painted in. */
type Grade = "day" | "morning" | "rain" | "evening" | "night" | "lamp" | "night2";

function roomName(s: RoomScene): RoomName {
  if (s.time >= 3) return "night";
  if (s.time === 2) return "evening";
  const hour = s.time === 0 ? "morning" : "afternoon";
  return s.raining ? `${hour}_rain` : hour;
}

/** The light away from the lamp. */
function ambient(s: RoomScene): Grade {
  if (s.time >= 3) return "night";
  if (s.time === 2) return "evening";
  if (s.raining) return "rain";
  return s.time === 0 ? "morning" : "day";
}

/** The light at the desk: after dark, the lamp's. */
function atDesk(s: RoomScene): Grade {
  return s.time >= 2 ? "lamp" : ambient(s);
}

/** The light on the rug: at night it still catches the edge of the lamp. */
function onRug(s: RoomScene): Grade {
  return s.time >= 3 ? "night2" : ambient(s);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/** The shadow under someone: a flat ellipse, `w` pixels wide, centred on x. */
export function groundShadow(c: Ctx, x: number, y: number, w: number) {
  c.fillStyle = "rgba(24,12,40,0.3)";
  c.fillRect(x - w / 2 + 2, y - 1, w - 4, 1);
  c.fillRect(x - w / 2, y, w, 2);
  c.fillRect(x - w / 2 + 2, y + 2, w - 4, 1);
}

export function sprite(c: Ctx, art: Art, name: string, x: number, y: number, flipped = false) {
  const frame = ATLAS[name];
  if (!frame) return;
  const [fx, fy, w, h] = frame;
  if (!flipped) {
    c.drawImage(art.sheet, fx, fy, w, h, Math.round(x), Math.round(y), w, h);
    return;
  }
  // The same piece, facing the other way.
  c.save();
  c.translate(Math.round(x) + w, Math.round(y));
  c.scale(-1, 1);
  c.drawImage(art.sheet, fx, fy, w, h, 0, 0, w, h);
  c.restore();
}

/** Where the sparkles fly, from the top-left of the standing figure: around the raised fist. */
const SPARKS = [
  [18, -7],
  [8, -10],
  [20, 3],
] as const;

/** Top-left corners of the pieces that have a fixed place, as in the art file. */
const PLACE = {
  /** The bars of the wall chart, over the bed. */
  chart: [11, 16],
  /** The neon sign, with the light around it. */
  neon: [61, 6],
  /** The terminal's screen. */
  screen: [110, 24],
  /** The plant, above its pot. */
  plant: [160, 26],
  /** The first bowl, at the left end of the desk. */
  bowl: [97, 38],
  /** Whoever sits on the stool, back to the room. */
  seat: [109, 42],
  /** A head on the pillow. */
  pillow: [15, 55],
  /** Whoever stands on the rug. */
  rug: [96, 68],
  /** Whoever stands by the wall chart, in profile, looking at it. */
  board: [39, 27],
  /** Whoever sits on the rug to eat. */
  rugSeat: [95, 72],
  /** Whoever sits against the fridge to eat. */
  fridgeSeat: [43, 27],
} as const;

/** Where kebab wrappers land on the floor. */
const WRAPPERS = [
  [60, 66], [150, 84], [52, 116], [144, 110], [120, 116], [164, 98], [58, 96], [172, 74],
];

/** The glass of the window, and its glazing bars, as in the art file. */
const GLASS = { x: 150, y: 8, w: 32, h: 24 };

/** Rain on the glass. */
function drawRain(c: Ctx, frame: number) {
  c.fillStyle = "rgba(226,236,240,0.75)";
  for (let i = 0; i < 14; i++) {
    const a = (i * 7 + frame * 3) % GLASS.w;
    const b = (i * 11 + frame * 7) % (GLASS.h - 2);
    // Not over the glazing bars.
    if (a === 15 || a === 16 || (b >= 10 && b <= 12)) continue;
    c.fillRect(GLASS.x + a, GLASS.y + b, 1, 2);
  }
}

export function drawRoom(c: Ctx, art: Art, s: RoomScene) {
  c.clearRect(0, 0, ROOM_W, ROOM_H);
  c.drawImage(art.rooms[roomName(s)], 0, 0);

  const light = ambient(s);
  const desk = atDesk(s);

  // The MRR bars on the wall chart, in eight steps up to the kebab line.
  const step = Math.min(8, Math.round(s.goal * 8));
  if (step > 0) sprite(c, art, `chart_${step}_${light}`, PLACE.chart[0], PLACE.chart[1]);

  if (s.raining && s.time < 2) drawRain(c, s.frame);

  if (s.neon > 0) {
    c.globalAlpha = s.neon;
    sprite(c, art, "neon", PLACE.neon[0], PLACE.neon[1]);
    c.globalAlpha = 1;
  }

  // Kebab wrappers pile up on the floor, bowls of pasta on the desk.
  const wrappers = Math.min(WRAPPERS.length, Math.floor(s.kebabs / 2));
  for (let i = 0; i < wrappers; i++) {
    sprite(c, art, `wrapper_${light}`, WRAPPERS[i][0], WRAPPERS[i][1]);
  }
  const bowls = Math.min(3, Math.floor(s.pates / 4));
  for (let i = 0; i < bowls; i++) {
    sprite(c, art, `bowl_${desk}`, PLACE.bowl[0], PLACE.bowl[1] - i * 2);
  }

  if (s.screen !== "off") {
    sprite(c, art, `screen_${s.screen}_${s.frame % 2}`, PLACE.screen[0], PLACE.screen[1]);
  }

  // The plant lives and dies with your morale.
  const plant = s.moral >= 60 ? "lush" : s.moral >= 25 ? "wilting" : "dead";
  sprite(c, art, `plant_${plant}_${light}`, PLACE.plant[0], PLACE.plant[1]);

  if (s.pose === "desk") {
    // Typing comes in bursts: elbows out and in, then a pause to read.
    const typing = s.beat % 10 < 7 && s.beat % 2 === 1;
    sprite(c, art, `${s.who}_${typing ? "type" : "back"}_${desk}`, PLACE.seat[0], PLACE.seat[1]);
  } else if (s.pose === "bed") {
    // Asleep: the head rises and falls, and one z after another drifts up,
    // growing as it goes.
    const [x, y] = PLACE.pillow;
    sprite(c, art, `${s.who}_asleep_${light}`, x, y + (Math.floor(s.beat / 6) % 2));
    for (let i = 0; i < 3; i++) {
      const rise = (s.beat + i * 6) % 18;
      if (rise >= 14) continue;
      const size = rise < 5 ? 0 : rise < 10 ? 1 : 2;
      sprite(c, art, `zed_${size}`, x + 14 + Math.round(rise / 2) + (rise % 4 < 2 ? 0 : 1), y - 2 - rise);
    }
  } else if (s.pose === "eat" || s.pose === "feast") {
    // Sitting on the floor with a kebab, in two frames: a bite, then chewing.
    const [x, y] = s.pose === "eat" ? PLACE.fridgeSeat : PLACE.rugSeat;
    const grade = s.pose === "eat" ? light : onRug(s);
    groundShadow(c, x + 9, y + 23, 18);
    sprite(c, art, `${s.who}_eat_${s.frame % 2}_${grade}`, x, y);
  } else if (s.pose === "hungry") {
    // An empty stomach: doubled over, and every other beat the pang hits,
    // the body flinches and flushes, and the sweat starts.
    const [x0, y] = PLACE.rug;
    const pang = s.frame % 2 === 1;
    const x = x0 + (pang ? 1 : 0);
    groundShadow(c, x0 + 8, y + 27, 14);
    sprite(c, art, `${s.who}_hungry_${pang ? 1 : 0}_${onRug(s)}`, x, y);
    sprite(c, art, "bubble_growl", x + 13, y - 8 - (pang ? 1 : 0));
    if (pang) {
      sprite(c, art, "sweat", x - 2, y + 6);
      sprite(c, art, "sweat", x + 13, y + 9);
    }
  } else if (s.pose === "cheer") {
    const rug = onRug(s);
    const [x, y] = PLACE.rug;
    groundShadow(c, x + 8, y + 27, 14);
    if (s.cheer < CHEER.spin) {
      // Front, right, back, left: the profile is one picture, flipped for the left.
      const quarter = Math.floor(s.cheer / CHEER.quarter) % 4;
      if (quarter === 0) sprite(c, art, `${s.who}_front_${rug}`, x, y);
      else if (quarter === 2) sprite(c, art, `${s.who}_away_${rug}`, x, y);
      else sprite(c, art, `${s.who}_side_${rug}`, x + 2, y, quarter === 3);
    } else {
      // The pose is two pixels taller than the standing figure: the feet stay put.
      const since = s.cheer - CHEER.spin;
      const hop = since < CHEER.hop / 2 ? 3 : since < CHEER.hop ? 1 : 0;
      sprite(c, art, `${s.who}_cheer_${since < CHEER.flash ? 1 : 0}_${rug}`, x, y - 2 - hop);
      // Each sparkle is big, then small, then gone, one after the other.
      const beat = Math.floor(since / 140);
      SPARKS.forEach(([dx, dy], i) => {
        const size = (beat + i) % 3;
        if (size === 0) sprite(c, art, "sparkle_0", x + dx - 1, y + dy - 1);
        else if (size === 1) sprite(c, art, "sparkle_1", x + dx, y + dy);
      });
    }
  } else if (s.pose === "think") {
    // A pivot is thought over by the wall chart, in profile and facing it:
    // a hand on the chin and a doubt, then a finger on the curve and an idea.
    const [x, y] = PLACE.board;
    const found = s.beat % 20 >= 12;
    groundShadow(c, x + 6, y + 27, 12);
    sprite(c, art, `${s.who}_ponder_${found ? 1 : 0}_${light}`, x, y, true);
    const lift = found ? (s.beat % 20 < 14 ? 2 : 1) : Math.floor(s.beat / 3) % 2;
    sprite(c, art, found ? "bubble_idea" : "bubble_what", x + 9, y - 10 - lift);
  } else if (s.pose === "post") {
    // Posting: the phone held up. Hearts rise from it one after the other,
    // and every so often the face lights up and the feet leave the floor.
    const rug = onRug(s);
    const [x, y0] = PLACE.rug;
    const liked = s.beat % 12 < 6;
    const y = y0 - (s.beat % 12 < 2 ? 1 : 0);
    groundShadow(c, x + 8, y0 + 27, 14);
    sprite(c, art, `${s.who}_${liked ? "post" : "arm"}_${rug}`, x, y);
    sprite(c, art, `phone_${rug}`, x + 12, y + 6);
    for (let i = 0; i < 3; i++) {
      const rise = (s.beat + i * 5) % 15;
      if (rise >= 11) continue;
      sprite(c, art, `heart_${rise < 6 ? 0 : 1}`, x + 13 + [0, 1, 0, -1][rise % 4], y0 - 3 - Math.round(rise * 1.5));
    }
  } else if (s.pose === "call") {
    // Cold outreach: pacing the rug with the phone at the ear, listening,
    // then talking with the free hand.
    const rug = onRug(s);
    const [x0, y] = PLACE.rug;
    const x = x0 + [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1][Math.floor(s.beat / 2) % 12];
    const talking = Math.floor(s.beat / 5) % 2 === 1;
    groundShadow(c, x + 8, y + 27, 14);
    sprite(c, art, `${s.who}_call_${talking ? 1 : 0}_${rug}`, x, y);
    if (talking) sprite(c, art, `bubble_talk_${Math.floor(s.beat / 2) % 3}`, x + 14, y - 11);
  } else if (s.pose === "alert") {
    // Something urgent: hands in the air, a jump every second or so, and
    // sweat flying off.
    const rug = onRug(s);
    const [x, y0] = PLACE.rug;
    const jump = s.beat % 7;
    const y = y0 - (jump === 0 ? 2 : jump === 1 ? 3 : jump === 2 ? 1 : 0);
    groundShadow(c, x + 8, y0 + 27, 14);
    // The body is one column in, to leave room for the arms.
    sprite(c, art, `${s.who}_alarm_${rug}`, x - 1, y);
    sprite(c, art, "bubble_alert", x + 14 + (s.beat % 2), y - 11);
    if (jump < 3) {
      sprite(c, art, "sweat", x - 5, y + 2 + jump);
      sprite(c, art, "sweat", x + 16, y + 4 + jump);
    }
  } else if (s.pose !== "out") {
    // Standing on the rug, with nothing to do but blink.
    const rug = onRug(s);
    const [x, y] = PLACE.rug;
    const blink = s.beat % 24 === 23 && ATLAS[`${s.who}_blink_${rug}`];
    groundShadow(c, x + 8, y + 27, 14);
    sprite(c, art, `${s.who}_${blink ? "blink" : "front"}_${rug}`, x, y);
  }

  veil(c, s.dark);
}

/**
 * Night falling, or lifting: a veil of deep blue over everything, in a few
 * steps rather than smoothly, the way a console dims its palette.
 */
export function veil(c: Ctx, dark: number) {
  if (dark <= 0) return;
  c.fillStyle = `rgba(8,10,26,${Math.round(dark * 8) / 8})`;
  c.fillRect(0, 0, ROOM_W, ROOM_H);
}
