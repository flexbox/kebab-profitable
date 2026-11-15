/**
 * Putting the room together.
 *
 * The pixel art itself is written in `art/kebab.px.js` and rendered to PNGs by
 * `pnpm art`: the room in each light, and one sheet of everything that moves.
 * This file only decides which pieces to place, and where, for a given moment
 * of a run. Nothing is tinted here: each piece was painted in the right light.
 */
import type { CharacterId } from "@/game/types";
import atlasJson from "./atlas.json";

type Ctx = CanvasRenderingContext2D;

/** Where each sprite sits on the sheet: x, y, width, height. */
const ATLAS = atlasJson as unknown as Record<string, [number, number, number, number]>;

export type PersonId = CharacterId | "chef";

export const ROOM_W = 192;
export const ROOM_H = 128;

/** The same geometry as the art file: the back corner of the floor, then cells. */
const OX = 88;
const OY = 47;
const sx = (x: number, y: number) => OX + x - y;
const sy = (x: number, y: number, z = 0) => OY + ((x + y) >> 1) - z;

export type Pose = "idle" | "desk" | "phone" | "bed" | "eat" | "think" | "out";
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
  /** Animation frame, toggles a few times a second. */
  frame: number;
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
}

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

let loading: Promise<Art> | null = null;

/** Loads the art once. It is seven small images, about 40 kB in all. */
export function loadArt(): Promise<Art> {
  loading ??= Promise.all([
    image("/art/sprites.png"),
    ...ROOMS.map((name) => image(`/art/room_${name}.png`)),
  ]).then(([sheet, ...rooms]) => ({
    sheet,
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

function sprite(c: Ctx, art: Art, name: string, x: number, y: number) {
  const frame = ATLAS[name];
  if (!frame) return;
  const [fx, fy, w, h] = frame;
  c.drawImage(art.sheet, fx, fy, w, h, Math.round(x), Math.round(y), w, h);
}

/** Top-left corners of the pieces that have a fixed place, as in the art file. */
const PLACE = {
  chart: [28, 24],
  screen: [103, 44],
  plant: [151, 64],
  bowl: [98, 39],
} as const;

/** Where kebab wrappers land, in floor cells. */
const WRAPPERS = [
  [44, 60], [62, 50], [30, 46], [70, 34], [54, 64], [74, 56], [26, 58], [66, 62],
];

/** Rain on the glass. The window is on the right-hand wall, which slants. */
function drawRain(c: Ctx, frame: number) {
  const U = 42;
  const V = 15;
  const W = 36;
  const H = 24;
  c.fillStyle = "rgba(214,226,232,0.7)";
  for (let i = 0; i < 14; i++) {
    const a = (i * 7 + frame * 3) % W;
    const b = (i * 11 + frame * 7) % (H - 2);
    // Not over the glazing bars.
    if (a === 17 || a === 18 || (b >= 10 && b <= 12)) continue;
    const u = U + a;
    c.fillRect(OX + u, OY + (u >> 1) - (V + H - b), 1, 2);
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

  // Kebab wrappers pile up on the floor, bowls of pasta on the desk.
  const wrappers = Math.min(WRAPPERS.length, Math.floor(s.kebabs / 2));
  for (let i = 0; i < wrappers; i++) {
    const [x, y] = WRAPPERS[i];
    sprite(c, art, `wrapper_${light}`, sx(x, y) - 2, sy(x, y) - 3);
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
    // On the stool, back to the room.
    sprite(c, art, `${s.who}_back_${desk}`, sx(30, 17) - 7, sy(30, 17, 5) - 15);
  } else if (s.pose === "bed") {
    const x = sx(9, 31) - 7;
    const y = sy(9, 31, 9) - 8;
    sprite(c, art, `${s.who}_asleep_${light}`, x, y);
    sprite(c, art, "bubble_zzz", x + 13, y - 11 - (s.frame % 2));
  } else if (s.pose !== "out") {
    // Standing on the rug.
    const rug = onRug(s);
    const bob = s.pose === "idle" ? 0 : s.frame % 2;
    const x = sx(50, 42) - 7;
    const feet = sy(50, 42);
    const y = feet - 20 + bob;
    c.fillStyle = "rgba(0,0,0,0.28)";
    c.fillRect(x + 2, feet - 1, 10, 2);
    const holding = s.pose === "phone" || s.pose === "eat";
    sprite(c, art, `${s.who}_${holding ? "arm" : "front"}_${rug}`, x, y);
    if (s.pose === "phone") {
      sprite(c, art, `phone_${rug}`, x + 11, y + 2);
      if (s.frame % 2 === 0) sprite(c, art, "bubble_heart", x + 13, y - 10);
    }
    if (s.pose === "eat") sprite(c, art, `kebab_${rug}`, x + 10, y + 2);
    if (s.pose === "think") sprite(c, art, "bubble_idea", x + 12, y - 10);
  }
}
