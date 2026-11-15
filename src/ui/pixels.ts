/**
 * All the pixel art, drawn in code. No image files, no asset packs.
 *
 * Everything is drawn at a small logical size and scaled up by CSS with
 * `image-rendering: pixelated`.
 */
import type { CharacterId } from "@/game/types";

type Ctx = CanvasRenderingContext2D;

export const C = {
  ink: "#1a1423",
  night: "#2b2540",
  plum: "#3a3550",
  brick: "#b5523b",
  brickDark: "#8c3d2c",
  kebab: "#e8a23c",
  cream: "#f4e9d0",
  paper: "#fff7e6",
  green: "#6fbf73",
  red: "#d9534f",
  sky: "#8cc7ea",
  pink: "#e58fb1",
  skin: "#f6c453",
  skinShade: "#dba93a",
  hair: "#4a3324",
  wood: "#a8703f",
  woodDark: "#7a4f2a",
  wall: "#dcc9a3",
  wallStripe: "#d3be95",
  steel: "#aeb4bd",
  white: "#ffffff",
};

function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Draws rows of characters, each mapped to a colour. "." is transparent. */
function sprite(
  c: Ctx,
  rows: readonly string[],
  palette: Record<string, string>,
  ox: number,
  oy: number,
) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (color) rect(c, ox + x, oy + y, 1, 1, color);
    }
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * Everyone shares one body and an emoji-yellow face. The members are told
 * apart by a signature prop, not by a likeness: real portraits come later,
 * once each member has approved theirs.
 */
const BODY = [
  "...HHHHHH...",
  "..HHHHHHHH..",
  "..HSSSSSSH..",
  "..SSESSESS..",
  "..SSSSSSSS..",
  "..SSSMMSSS..",
  "...SSSSSS...",
  "..TTTTTTTT..",
  ".TTTTTTTTTT.",
  ".TTTTTTTTTT.",
  ".STTTTTTTTS.",
  "..TTTTTTTT..",
  "..PPPPPPPP..",
  "..PPP..PPP..",
  "..PPP..PPP..",
  "..PPP..PPP..",
  "..BBB..BBB..",
];

export const BODY_W = 12;
export const BODY_H = BODY.length;

interface Look {
  shirt: string;
  hair: string;
}

export type PersonId = CharacterId | "chef";

const LOOKS: Record<PersonId, Look> = {
  david: { shirt: "#3fa7a3", hair: C.hair },
  karl: { shirt: "#e8e4da", hair: C.hair },
  mickael: { shirt: "#e8833a", hair: C.hair },
  christophe: { shirt: "#3b6fd4", hair: C.hair },
  matthys: { shirt: "#8b5cf6", hair: C.hair },
  chef: { shirt: "#c0392b", hair: "#2f2a2a" },
};

function drawProp(c: Ctx, who: PersonId, x: number, y: number) {
  switch (who) {
    case "david": // headphones: he is the DJ
      rect(c, x + 2, y - 1, 8, 1, C.plum);
      rect(c, x + 1, y, 1, 2, C.plum);
      rect(c, x + 10, y, 1, 2, C.plum);
      rect(c, x, y + 2, 2, 3, "#e8553f");
      rect(c, x + 10, y + 2, 2, 3, "#e8553f");
      break;
    case "karl": // mortarboard: he is the doctor
      rect(c, x + 3, y, 6, 1, C.ink);
      rect(c, x, y - 1, 12, 1, C.ink);
      rect(c, x + 5, y - 2, 2, 1, C.ink);
      rect(c, x + 11, y - 1, 1, 4, C.kebab);
      break;
    case "mickael": // podcast headset
      rect(c, x + 2, y - 1, 8, 1, C.steel);
      rect(c, x + 1, y, 1, 2, C.steel);
      rect(c, x, y + 2, 2, 3, C.plum);
      rect(c, x + 1, y + 5, 3, 1, C.plum);
      rect(c, x + 3, y + 5, 1, 1, C.ink);
      break;
    case "christophe": // mask: he is the superhero
      rect(c, x + 2, y + 3, 8, 1, "#b02a2a");
      rect(c, x + 4, y + 3, 1, 1, C.white);
      rect(c, x + 7, y + 3, 1, 1, C.white);
      break;
    case "matthys": // cap and shades: he is the cool kid
      rect(c, x + 2, y - 1, 8, 2, "#f2c14e");
      rect(c, x + 9, y + 1, 3, 1, "#d9a531");
      rect(c, x + 3, y + 3, 6, 1, C.ink);
      break;
    case "chef": // paper hat, moustache and apron
      rect(c, x + 2, y - 2, 8, 3, C.white);
      rect(c, x + 2, y - 2, 8, 1, "#e6e2da");
      rect(c, x + 4, y + 5, 4, 1, "#2f2a2a");
      rect(c, x + 3, y + 8, 6, 4, C.white);
      rect(c, x + 4, y + 7, 1, 1, C.white);
      rect(c, x + 7, y + 7, 1, 1, C.white);
      break;
  }
}

/** Draws a person. `rows` limits how much of the body is shown (seated, in bed). */
export function drawPerson(
  c: Ctx,
  who: PersonId,
  x: number,
  y: number,
  options: { rows?: number; blink?: boolean; armUp?: boolean } = {},
) {
  const look = LOOKS[who];
  const rows = BODY.slice(0, options.rows ?? BODY.length);
  if (who === "christophe") {
    // The cape goes behind the body.
    const capeRows = Math.min(rows.length, 15) - 7;
    if (capeRows > 0) {
      rect(c, x, y + 7, 12, 1, "#b02a2a");
      rect(c, x - 1, y + 8, 14, capeRows - 1, "#c0392b");
    }
  }
  sprite(
    c,
    rows,
    {
      H: look.hair,
      S: C.skin,
      E: options.blink ? C.skinShade : C.ink,
      M: "#b4532f",
      T: look.shirt,
      P: C.plum,
      B: C.ink,
    },
    x,
    y,
  );
  if (options.armUp && rows.length > 10) {
    // Right arm raised, holding something at shoulder height.
    rect(c, x + 10, y + 10, 1, 1, look.shirt);
    rect(c, x + 10, y + 7, 2, 2, look.shirt);
    rect(c, x + 11, y + 6, 1, 1, C.skin);
  }
  drawProp(c, who, x, y);
}

/** A head-and-shoulders portrait on a coloured tile. Logical size 16×16. */
export function drawPortrait(c: Ctx, who: PersonId, background: string) {
  rect(c, 0, 0, 16, 16, background);
  drawPerson(c, who, 2, 4, { rows: 12 });
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export const ROOM_W = 160;
export const ROOM_H = 100;

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

const SKY = [
  { top: "#ffd9a0", bottom: "#a9d6ea", town: "#9c4a35", lit: false },
  { top: "#7fc0ea", bottom: "#bfe3f2", town: "#a8553c", lit: false },
  { top: "#6a4c93", bottom: "#f08a5d", town: "#5d2f3a", lit: true },
  { top: "#14162e", bottom: "#23264a", town: "#1c1830", lit: true },
];

function drawWindow(c: Ctx, s: RoomScene) {
  const x = 60;
  const y = 10;
  const sky = SKY[Math.min(3, s.time)];
  rect(c, x - 2, y - 2, 44, 40, C.woodDark);
  // Sky, in three bands.
  const top = s.raining && s.time < 2 ? "#8f9aa8" : sky.top;
  const bottom = s.raining && s.time < 2 ? "#aab4be" : sky.bottom;
  rect(c, x, y, 40, 12, top);
  rect(c, x, y + 12, 40, 12, mix(top, bottom, 0.5));
  rect(c, x, y + 24, 40, 12, bottom);

  if (s.time === 3) {
    rect(c, x + 5, y + 4, 4, 4, "#f4e9d0");
    rect(c, x + 7, y + 4, 2, 2, sky.top);
    for (const [sx, sy] of [[14, 3], [22, 8], [30, 4], [35, 11], [18, 13]]) {
      if ((s.frame + sx) % 4 !== 0) rect(c, x + sx, y + sy, 1, 1, "#f4e9d0");
    }
  } else if (!s.raining) {
    const sunY = s.time === 0 ? 12 : s.time === 1 ? 3 : 16;
    rect(c, x + 6, y + sunY, 5, 5, s.time === 2 ? "#ffd27d" : "#fff1b8");
  }

  // The belfry and a row of stepped Flemish gables.
  const town = sky.town;
  rect(c, x + 27, y + 9, 1, 3, town);
  rect(c, x + 26, y + 12, 3, 5, town);
  rect(c, x + 25, y + 17, 5, 19, town);
  if (sky.lit) rect(c, x + 27, y + 14, 1, 1, "#ffd27d");
  const gables = [0, 9, 17, 31];
  gables.forEach((gx, i) => {
    const h = [12, 10, 13, 11][i];
    const w = i === 3 ? 9 : 8;
    rect(c, x + gx, y + 36 - h, w, h, town);
    rect(c, x + gx + 1, y + 36 - h - 2, w - 2, 2, town);
    rect(c, x + gx + 2, y + 36 - h - 4, w - 4, 2, town);
    rect(c, x + gx + 3, y + 36 - h - 5, w - 6, 1, town);
    const lit = sky.lit && (i + s.seed) % 3 !== 0;
    rect(c, x + gx + 2, y + 36 - h + 2, 2, 2, lit ? "#ffd27d" : shade(town, -18));
    rect(c, x + gx + 5, y + 36 - h + 6, 2, 2, lit && i % 2 === 0 ? "#ffd27d" : shade(town, -18));
  });

  if (s.raining) {
    c.fillStyle = "rgba(220,235,255,0.75)";
    for (let i = 0; i < 16; i++) {
      const rx = (i * 7 + s.frame * 3) % 40;
      const ry = (i * 11 + s.frame * 7) % 34;
      c.fillRect(x + rx, y + ry, 1, 2);
    }
  }
  // Frame and cross bars.
  rect(c, x + 19, y, 2, 36, C.woodDark);
  rect(c, x, y + 17, 40, 2, C.woodDark);
  rect(c, x - 3, y + 36, 46, 3, C.wood);
}

function drawChart(c: Ctx, s: RoomScene) {
  const x = 20;
  const y = 12;
  rect(c, x - 1, y - 1, 30, 26, C.woodDark);
  rect(c, x, y, 28, 24, C.paper);
  // The kebab line, dashed, near the top.
  for (let i = 0; i < 28; i += 3) rect(c, x + i, y + 4, 2, 1, C.kebab);
  // The MRR curve, as bars growing towards it.
  const bars = 7;
  for (let i = 0; i < bars; i++) {
    const ramp = Math.pow((i + 1) / bars, 1.6);
    const h = Math.max(1, Math.round(ramp * s.goal * 18));
    rect(c, x + 2 + i * 3.5, y + 22 - h, 2, h, s.goal >= 1 ? C.green : "#6f9bd1");
  }
  rect(c, x + 1, y + 22, 26, 1, C.ink);
}

function drawShelf(c: Ctx, s: RoomScene) {
  const x = 112;
  const y = 30;
  rect(c, x, y, 36, 2, C.woodDark);
  // Books.
  const books = ["#b5523b", "#3fa7a3", "#e8a23c", "#6f9bd1", "#8b5cf6"];
  books.forEach((color, i) => rect(c, x + 18 + i * 3, y - 8 + (i % 2), 2, 8 - (i % 2), color));
  // A plant that lives and dies with your morale.
  rect(c, x + 4, y - 4, 6, 4, "#b5523b");
  if (s.moral >= 60) {
    rect(c, x + 6, y - 11, 2, 7, "#4f9d57");
    rect(c, x + 3, y - 9, 3, 2, C.green);
    rect(c, x + 8, y - 10, 3, 2, C.green);
    rect(c, x + 5, y - 13, 4, 2, C.green);
  } else if (s.moral >= 25) {
    rect(c, x + 6, y - 9, 2, 5, "#7d9a4a");
    rect(c, x + 3, y - 7, 3, 2, "#9bb05a");
    rect(c, x + 8, y - 8, 3, 1, "#9bb05a");
  } else {
    rect(c, x + 6, y - 7, 1, 3, "#8a6a3a");
    rect(c, x + 7, y - 7, 3, 1, "#8a6a3a");
    rect(c, x + 9, y - 6, 1, 2, "#8a6a3a");
  }
}

function drawLaptop(c: Ctx, s: RoomScene, x: number, y: number) {
  // Seen from behind the screen: lid, then a glow on the face when working.
  rect(c, x, y, 14, 9, "#c9ced6");
  rect(c, x + 1, y + 1, 12, 7, "#aeb4bd");
  const dot =
    s.screen === "off"
      ? "#8e949c"
      : s.screen === "ship"
        ? C.kebab
        : s.screen === "chat"
          ? C.pink
          : s.screen === "invoice"
            ? C.green
            : "#6f9bd1";
  rect(c, x + 6, y + 3, 2, 2, s.screen !== "off" && s.frame % 2 === 0 ? shade(dot, 30) : dot);
  rect(c, x - 2, y + 9, 18, 1, "#8e949c");
}

function drawDesk(c: Ctx, s: RoomScene) {
  const x = 12;
  const y = 62;
  // Lamp.
  rect(c, x + 3, y - 2, 4, 2, C.plum);
  rect(c, x + 4, y - 9, 1, 7, C.plum);
  rect(c, x + 4, y - 10, 5, 1, C.plum);
  rect(c, x + 7, y - 9, 4, 3, s.time >= 2 ? "#ffd27d" : C.kebab);
  // Mug, and the bowls of pasta that pile up.
  rect(c, x + 39, y - 4, 3, 4, C.paper);
  rect(c, x + 42, y - 3, 1, 2, C.paper);
  const bowls = Math.min(3, Math.floor(s.pates / 4));
  for (let i = 0; i < bowls; i++) {
    rect(c, x + 44 - i * 0, y - 2 - i * 2, 5, 2, "#e6e2da");
    rect(c, x + 45, y - 3 - i * 2, 3, 1, "#f1d98a");
  }
  // Desk top and legs.
  rect(c, x, y, 50, 3, C.wood);
  rect(c, x, y + 3, 50, 1, C.woodDark);
  rect(c, x + 2, y + 4, 3, 22, C.woodDark);
  rect(c, x + 45, y + 4, 3, 22, C.woodDark);
  rect(c, x + 5, y + 4, 40, 10, shade(C.wood, -14));
}

function drawBed(c: Ctx, s: RoomScene, asleep: boolean) {
  const x = 104;
  const y = 66;
  rect(c, x, y - 12, 3, 30, C.woodDark);
  rect(c, x + 49, y - 6, 3, 24, C.woodDark);
  rect(c, x + 3, y, 46, 8, "#efe7d6");
  rect(c, x + 3, y + 8, 46, 4, C.woodDark);
  rect(c, x + 3, y + 12, 3, 6, C.woodDark);
  rect(c, x + 46, y + 12, 3, 6, C.woodDark);
  // Pillow at the head.
  rect(c, x + 4, y - 3, 12, 4, C.white);
  rect(c, x + 4, y, 12, 1, "#d9d2c2");
  if (asleep) {
    drawPerson(c, s.who, x + 3, y - 9, { rows: 7, blink: true });
  }
  // Blanket.
  rect(c, x + 15, y - 2, 34, 9, "#3b6f8f");
  rect(c, x + 15, y - 2, 34, 2, "#4d86a8");
  for (let i = 0; i < 5; i++) rect(c, x + 19 + i * 7, y + 2, 3, 2, "#4d86a8");
}

function drawFloor(c: Ctx, s: RoomScene) {
  rect(c, 0, 67, ROOM_W, 33, C.wood);
  for (let i = 0; i < 5; i++) rect(c, 0, 67 + i * 7, ROOM_W, 1, C.woodDark);
  for (let i = 0; i < 9; i++) rect(c, 8 + i * 19 + ((i * 7) % 5), 68 + (i % 5) * 7, 1, 6, C.woodDark);
  rect(c, 0, 64, ROOM_W, 3, "#7a5a3c");
  // Rug.
  rect(c, 62, 82, 40, 13, C.brick);
  rect(c, 64, 84, 36, 9, "#c96a4f");
  rect(c, 66, 86, 32, 5, C.brick);
  for (let i = 0; i < 8; i++) rect(c, 67 + i * 4, 88, 2, 1, C.kebab);

  // Kebab wrappers pile up on the floor.
  const spots = [
    [56, 90], [50, 95], [104, 93], [44, 88], [110, 97], [58, 96], [98, 88], [38, 94],
  ];
  const wrappers = Math.min(spots.length, Math.floor(s.kebabs / 2));
  for (let i = 0; i < wrappers; i++) {
    const [wx, wy] = spots[i];
    rect(c, wx, wy, 5, 3, "#d5d9de");
    rect(c, wx + 1, wy - 1, 3, 1, "#eef0f2");
    rect(c, wx + 3, wy + 1, 2, 1, C.kebab);
  }
}

function drawBubble(c: Ctx, x: number, y: number, kind: "zzz" | "heart" | "idea" | "bang") {
  rect(c, x, y, 9, 8, C.paper);
  rect(c, x + 1, y - 1, 7, 1, C.paper);
  rect(c, x + 1, y + 8, 7, 1, C.paper);
  rect(c, x + 2, y + 9, 2, 1, C.paper);
  if (kind === "zzz") {
    rect(c, x + 2, y + 1, 5, 1, C.plum);
    rect(c, x + 5, y + 2, 1, 1, C.plum);
    rect(c, x + 4, y + 3, 1, 1, C.plum);
    rect(c, x + 3, y + 4, 1, 1, C.plum);
    rect(c, x + 2, y + 5, 5, 1, C.plum);
  } else if (kind === "heart") {
    rect(c, x + 2, y + 2, 2, 2, C.red);
    rect(c, x + 5, y + 2, 2, 2, C.red);
    rect(c, x + 2, y + 3, 5, 2, C.red);
    rect(c, x + 3, y + 5, 3, 1, C.red);
    rect(c, x + 4, y + 6, 1, 1, C.red);
  } else if (kind === "idea") {
    rect(c, x + 3, y + 1, 3, 4, C.kebab);
    rect(c, x + 2, y + 2, 5, 2, C.kebab);
    rect(c, x + 3, y + 5, 3, 1, C.plum);
    rect(c, x + 4, y + 6, 1, 1, C.plum);
  } else {
    rect(c, x + 4, y + 1, 1, 4, C.red);
    rect(c, x + 4, y + 6, 1, 1, C.red);
  }
}

export function drawRoom(c: Ctx, s: RoomScene) {
  c.clearRect(0, 0, ROOM_W, ROOM_H);
  // Wall.
  rect(c, 0, 0, ROOM_W, 67, C.wall);
  for (let i = 0; i < ROOM_W; i += 8) rect(c, i, 0, 1, 64, C.wallStripe);

  drawWindow(c, s);
  drawChart(c, s);
  drawShelf(c, s);
  drawFloor(c, s);

  const blink = s.frame % 7 === 0;
  const asleep = s.pose === "bed";
  drawBed(c, s, asleep);

  if (s.pose === "desk") {
    drawPerson(c, s.who, 32, 44, { rows: 13, blink });
  }
  drawDesk(c, s);
  drawLaptop(c, s, 30, 53);

  if (s.pose === "idle" || s.pose === "think" || s.pose === "phone" || s.pose === "eat") {
    const bob = s.frame % 2;
    const px = 76;
    const py = 68 + (s.pose === "idle" ? 0 : bob);
    rect(c, px + 1, 86, 10, 2, "rgba(26,20,35,0.25)");
    drawPerson(c, s.who, px, py, { blink, armUp: s.pose === "phone" || s.pose === "eat" });
    if (s.pose === "phone") {
      rect(c, px + 11, py + 4, 2, 3, C.ink);
      rect(c, px + 11, py + 5, 2, 1, "#6f9bd1");
      if (s.frame % 2 === 0) drawBubble(c, px + 13, py - 8, "heart");
    }
    if (s.pose === "eat") {
      // A kebab, held high.
      rect(c, px + 10, py + 3, 4, 3, "#e9d8a6");
      rect(c, px + 11, py + 2, 3, 1, C.green);
      rect(c, px + 12, py + 3, 2, 1, C.brick);
    }
    if (s.pose === "think") drawBubble(c, px + 12, py - 9, "idea");
  }
  if (asleep) drawBubble(c, 122, 44 - (s.frame % 2), "zzz");

  // Evening and night tint, with the lamp and the screen still glowing.
  if (s.time >= 2) {
    c.fillStyle = s.time === 3 ? "rgba(20,18,48,0.45)" : "rgba(60,30,60,0.2)";
    c.fillRect(0, 0, ROOM_W, ROOM_H);
    // A pool of lamplight over the desk.
    const glow = c.createRadialGradient(22, 55, 2, 22, 55, 30);
    glow.addColorStop(0, "rgba(255,214,140,0.42)");
    glow.addColorStop(0.5, "rgba(255,214,140,0.16)");
    glow.addColorStop(1, "rgba(255,214,140,0)");
    c.fillStyle = glow;
    c.fillRect(0, 22, 60, 66);
  }
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hex(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function shade(color: string, amount: number): string {
  const [r, g, b] = hex(color);
  return toHex(r + amount, g + amount, b + amount);
}
