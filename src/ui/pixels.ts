/**
 * All the pixel art, drawn in code. No image files, no asset packs.
 *
 * Everything is drawn at a small logical size and scaled up by CSS with
 * `image-rendering: pixelated`. The room is an isometric cutaway, and the
 * people are flat sprites standing in it.
 */
import type { CharacterId } from "@/game/types";

type Ctx = CanvasRenderingContext2D;

/** A dusty palette: worn wood, tired metal, Lille brick and a little phosphor. */
export const C = {
  void: "#0c0b09",
  ink: "#171411",
  bone: "#d8caa6",
  paper: "#e6dcc0",
  white: "#f1ead8",
  amber: "#e0a13c",
  rust: "#9c4f2c",
  rustDark: "#733821",
  red: "#b5412f",
  leaf: "#6c9450",
  leafDark: "#4a6e3a",
  phosphor: "#69e07c",
  phosphorDim: "#3fae55",
  skin: "#e6b950",
  skinShade: "#c79a3c",
  hair: "#3a2a1f",
  denim: "#454d57",
  wood: "#7a5a3a",
  woodDark: "#59412a",
  woodLight: "#93714a",
  steel: "#7c8376",
  steelDark: "#585e54",
  steelLight: "#9ba294",
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

/** The same body seen from behind, for whoever sits at the terminal. */
const BACK = BODY.map((row, i) =>
  i >= 2 && i <= 4 ? "..HHHHHHHH.." : i === 5 ? "..SHHHHHHS.." : row,
);

export const BODY_W = 12;
export const BODY_H = BODY.length;

interface Look {
  shirt: string;
  hair: string;
}

export type PersonId = CharacterId | "chef";

const LOOKS: Record<PersonId, Look> = {
  david: { shirt: "#3f8f86", hair: C.hair },
  karl: { shirt: "#d8d2c0", hair: C.hair },
  mickael: { shirt: "#c9762f", hair: C.hair },
  christophe: { shirt: "#3f62a8", hair: C.hair },
  matthys: { shirt: "#7a58b8", hair: C.hair },
  chef: { shirt: "#a8402e", hair: "#2a2523" },
};

const CAPE = "#a8372b";
const CAPE_DARK = "#8c2c22";

function drawProp(c: Ctx, who: PersonId, x: number, y: number, back: boolean) {
  switch (who) {
    case "david": // headphones: he is the DJ
      rect(c, x + 2, y - 1, 8, 1, C.ink);
      rect(c, x + 1, y, 1, 2, C.ink);
      rect(c, x + 10, y, 1, 2, C.ink);
      rect(c, x, y + 2, 2, 3, "#d9553f");
      rect(c, x + 10, y + 2, 2, 3, "#d9553f");
      break;
    case "karl": // mortarboard: he is the doctor
      rect(c, x + 3, y, 6, 1, C.ink);
      rect(c, x, y - 1, 12, 1, C.ink);
      rect(c, x + 5, y - 2, 2, 1, C.ink);
      rect(c, x + 11, y - 1, 1, 4, C.amber);
      break;
    case "mickael": // podcast headset
      rect(c, x + 2, y - 1, 8, 1, C.steelLight);
      rect(c, x + 1, y, 1, 2, C.steelLight);
      rect(c, x, y + 2, 2, 3, C.ink);
      if (!back) {
        rect(c, x + 1, y + 5, 3, 1, C.ink);
        rect(c, x + 3, y + 5, 1, 1, C.steelLight);
      }
      break;
    case "christophe": // mask: he is the superhero
      rect(c, x + 2, y + 3, 8, 1, CAPE_DARK);
      if (!back) {
        rect(c, x + 4, y + 3, 1, 1, C.white);
        rect(c, x + 7, y + 3, 1, 1, C.white);
      }
      break;
    case "matthys": // cap and shades: he is the cool kid
      rect(c, x + 2, y - 1, 8, 2, "#e3b548");
      if (back) {
        rect(c, x + 4, y + 1, 4, 1, "#c9992f");
      } else {
        rect(c, x + 9, y + 1, 3, 1, "#c9992f");
        rect(c, x + 3, y + 3, 6, 1, C.ink);
      }
      break;
    case "chef": // paper hat, moustache and apron
      rect(c, x + 2, y - 2, 8, 3, C.white);
      rect(c, x + 2, y - 2, 8, 1, "#d9d1bc");
      rect(c, x + 4, y + 5, 4, 1, "#2a2523");
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
  options: { rows?: number; blink?: boolean; armUp?: boolean; back?: boolean } = {},
) {
  const look = LOOKS[who];
  const back = !!options.back;
  const rows = (back ? BACK : BODY).slice(0, options.rows ?? BODY.length);
  const capeRows = Math.min(rows.length, 15) - 7;
  if (who === "christophe" && !back && capeRows > 0) {
    // Seen from the front, the cape hangs behind the body.
    rect(c, x, y + 7, 12, 1, CAPE_DARK);
    rect(c, x - 1, y + 8, 14, capeRows - 1, CAPE);
  }
  sprite(
    c,
    rows,
    {
      H: look.hair,
      S: C.skin,
      E: options.blink ? C.skinShade : C.ink,
      M: "#a8522f",
      T: look.shirt,
      P: C.denim,
      B: C.ink,
    },
    x,
    y,
  );
  if (who === "christophe" && back && capeRows > 0) {
    // Seen from behind, it covers the back.
    rect(c, x + 2, y + 7, 8, 1, CAPE_DARK);
    rect(c, x + 1, y + 8, 10, capeRows - 1, CAPE);
  }
  if (options.armUp && rows.length > 10) {
    // Right arm raised, holding something at shoulder height.
    rect(c, x + 10, y + 10, 1, 1, look.shirt);
    rect(c, x + 10, y + 7, 2, 2, look.shirt);
    rect(c, x + 11, y + 6, 1, 1, C.skin);
  }
  drawProp(c, who, x, y, back);
}

/** A head-and-shoulders portrait on a coloured tile. Logical size 16×16. */
export function drawPortrait(c: Ctx, who: PersonId, background: string) {
  rect(c, 0, 0, 16, 16, background);
  // A height chart behind the sitter, as on an identity photo.
  for (let y = 2; y < 16; y += 4) rect(c, 0, y, 16, 1, shade(background, -12));
  drawPerson(c, who, 2, 4, { rows: 12 });
}

// ---------------------------------------------------------------------------
// Isometric drawing
// ---------------------------------------------------------------------------

export const ROOM_W = 192;
export const ROOM_H = 128;

/** Where the back corner of the floor sits on the canvas. */
const OX = 88;
const OY = 47;
/** The room, in cells: x runs down and to the right, y down and to the left. */
const RW = 84;
const RD = 68;
const RH = 42;

/** Canvas position of a cell, two across for one down. */
const sx = (x: number, y: number) => OX + x - y;
const sy = (x: number, y: number, z = 0) => OY + ((x + y) >> 1) - z;

/** A level patch at height z: w cells along x, d cells along y. */
function flat(c: Ctx, x: number, y: number, z: number, w: number, d: number, color: string) {
  c.fillStyle = color;
  for (let j = y; j < y + d; j++) {
    for (let i = x; i < x + w; i++) c.fillRect(OX + i - j, OY + ((i + j) >> 1) - z, 1, 1);
  }
}

/** An upright patch that catches the light: w cells along x, standing in row y. */
function lit(c: Ctx, x: number, y: number, z: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  for (let i = x; i < x + w; i++) c.fillRect(OX + i - y, OY + ((i + y) >> 1) - z - h + 1, 1, h);
}

/** An upright patch in the shade: d cells along y, standing in column x. */
function dim(c: Ctx, x: number, y: number, z: number, d: number, h: number, color: string) {
  c.fillStyle = color;
  for (let j = y; j < y + d; j++) c.fillRect(OX + x - j, OY + ((x + j) >> 1) - z - h + 1, 1, h);
}

/** Top, lit side, shaded side. */
type Faces = readonly [string, string, string];

function box(
  c: Ctx,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  faces: Faces,
) {
  flat(c, x, y, z + h, w, d, faces[0]);
  lit(c, x, y + d - 1, z, w, h, faces[1]);
  dim(c, x + w - 1, y, z, d, h, faces[2]);
}

/** A patch on the right-hand wall: u along it from the corner, v up from the floor. */
function wallR(c: Ctx, u: number, v: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  for (let i = u; i < u + w; i++) c.fillRect(OX + i, OY + (i >> 1) - v - h, 1, h);
}

/** A patch on the left-hand wall, clipped to it. */
function wallL(c: Ctx, u: number, v: number, w: number, h: number, color: string) {
  const from = Math.max(0, u);
  const to = Math.min(RD - 1, u + w);
  const height = Math.min(h, RH - v);
  if (to <= from || height <= 0) return;
  c.fillStyle = color;
  for (let j = from; j < to; j++) c.fillRect(OX - 1 - j, OY + ((j + 1) >> 1) - v - height, 1, height);
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

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
  { top: "#e9c48f", bottom: "#b9c9bd", town: "#7d4636", lit: false },
  { top: "#9dbccb", bottom: "#cdd6c4", town: "#8a4f3b", lit: false },
  { top: "#5d4a73", bottom: "#d98250", town: "#4c2a2d", lit: true },
  { top: "#10131f", bottom: "#1d2233", town: "#15131c", lit: true },
];

const WINDOW_LIGHT = "#f4c06a";
const MORTAR = "#4d2c23";

function drawWalls(c: Ctx) {
  // The right-hand wall catches the light: tired plaster above a painted dado.
  wallR(c, 0, 0, RW, RH, "#b5a786");
  wallR(c, 0, 0, RW, 13, "#737a5e");
  wallR(c, 0, 13, RW, 1, "#8f9473");
  wallR(c, 0, 0, RW, 2, "#4b4132");
  // Damp in the corner, and a patch where the plaster gave up.
  wallR(c, 0, 30, 5, 12, "#a89a79");
  wallR(c, 5, 34, 4, 8, "#a89a79");
  wallR(c, 17, 27, 10, 10, "#94553c");
  wallR(c, 16, 29, 1, 6, "#94553c");
  wallR(c, 27, 28, 1, 7, "#94553c");
  wallR(c, 19, 37, 6, 1, "#94553c");
  for (const v of [29, 32, 35]) wallR(c, 17, v, 10, 1, "#6e3d2c");
  for (const [u, v] of [[20, 27], [24, 27], [18, 30], [22, 30], [26, 30], [20, 33], [24, 33]]) {
    wallR(c, u, v, 1, 2, "#6e3d2c");
  }

  // The left-hand wall is in the shade: bare Lille brick.
  wallL(c, 0, 0, RD, RH, "#774234");
  for (let row = 0; row * 4 < RH; row++) {
    const v = row * 4;
    for (let k = 0; k * 8 < RD + 8; k++) {
      const u = k * 8 - (row % 2) * 4;
      const bake = (row * 7 + k * 13) % 6;
      if (bake === 0) wallL(c, u + 1, v + 1, 7, 3, "#85503b");
      if (bake === 3) wallL(c, u + 1, v + 1, 7, 3, "#693a2e");
      wallL(c, u, v + 1, 1, 3, MORTAR);
    }
    wallL(c, 0, v, RD, 1, MORTAR);
  }
  // A heating pipe that has not been warm in years.
  wallL(c, 0, 37, RD, 2, C.steelDark);
  wallL(c, 0, 38, RD, 1, C.steel);
  for (let u = 6; u < RD; u += 18) wallL(c, u, 36, 2, 4, "#3f443c");

  // The cut tops of both walls, where the cutaway slices through.
  flat(c, -3, -3, RH, RW + 3, 3, "#d0c4a4");
  flat(c, -3, 0, RH, 3, RD - 1, "#a8654b");
}

function drawWindow(c: Ctx, s: RoomScene) {
  const U = 42;
  const V = 15;
  const W = 36;
  const H = 24;
  const sky = SKY[Math.min(3, s.time)];
  /** Window coordinates: a across from the left, b down from the top. */
  const put = (a: number, b: number, w: number, h: number, color: string) =>
    wallR(c, U + a, V + H - b - h, w, h, color);

  put(-2, -2, W + 4, H + 4, C.woodDark);
  // Sky, in three bands.
  const grey = s.raining && s.time < 2;
  const top = grey ? "#8d948f" : sky.top;
  const bottom = grey ? "#a9aea2" : sky.bottom;
  put(0, 0, W, 8, top);
  put(0, 8, W, 8, mix(top, bottom, 0.5));
  put(0, 16, W, 8, bottom);

  if (s.time === 3) {
    put(4, 3, 4, 4, C.bone);
    put(6, 3, 2, 2, sky.top);
    for (const [a, b] of [[12, 2], [19, 6], [28, 3], [32, 8], [15, 10]]) {
      if ((s.frame + a) % 4 !== 0) put(a, b, 1, 1, C.bone);
    }
  } else if (!s.raining) {
    const sunB = s.time === 0 ? 9 : s.time === 1 ? 2 : 12;
    put(5, sunB, 4, 4, s.time === 2 ? WINDOW_LIGHT : "#f7e7b0");
  }

  // The belfry and a row of stepped Flemish gables.
  const town = sky.town;
  put(24, 3, 1, 3, town);
  put(23, 6, 3, 4, town);
  put(22, 10, 5, 14, town);
  if (sky.lit) put(24, 8, 1, 1, WINDOW_LIGHT);
  const gables = [
    { a: 0, w: 7, h: 9 },
    { a: 8, w: 6, h: 7 },
    { a: 15, w: 6, h: 10 },
    { a: 28, w: 8, h: 8 },
  ];
  gables.forEach((g, i) => {
    put(g.a, H - g.h, g.w, g.h, town);
    put(g.a + 1, H - g.h - 1, g.w - 2, 1, town);
    put(g.a + 2, H - g.h - 2, g.w - 4, 1, town);
    const lit = sky.lit && (i + s.seed) % 3 !== 0;
    put(g.a + 2, H - g.h + 2, 2, 2, lit ? WINDOW_LIGHT : shade(town, -18));
  });

  if (s.raining) {
    for (let i = 0; i < 14; i++) {
      const a = (i * 7 + s.frame * 3) % W;
      const b = (i * 11 + s.frame * 7) % (H - 2);
      put(a, b, 1, 2, "rgba(214,226,232,0.7)");
    }
  }
  // Glazing bars and the sill.
  put(17, 0, 2, H, C.woodDark);
  put(0, 11, W, 2, C.woodDark);
  put(-3, H + 2, W + 6, 2, C.woodLight);
}

function drawChart(c: Ctx, s: RoomScene) {
  const U = 33;
  const V = 13;
  const W = 26;
  const H = 22;
  /** Poster coordinates, read left to right on screen: a across, b down. */
  const put = (a: number, b: number, w: number, h: number, color: string) =>
    wallL(c, U + W - a - w, V + H - b - h, w, h, color);

  put(-1, -1, W + 2, H + 2, "#33251b");
  put(0, 0, W, H, C.paper);
  // The kebab line, dashed, near the top.
  for (let a = 1; a < W - 1; a += 3) put(a, 4, 2, 1, C.amber);
  // The MRR curve, as bars growing towards it.
  const bars = 7;
  for (let i = 0; i < bars; i++) {
    const ramp = Math.pow((i + 1) / bars, 1.6);
    const h = Math.round(ramp * s.goal * 16);
    if (h > 0) put(2 + i * 3, H - 3 - h, 2, h, s.goal >= 1 ? C.leaf : "#4f6f8a");
  }
  put(1, H - 3, W - 2, 1, C.ink);
}

function drawFloor(c: Ctx, s: RoomScene) {
  const planks = ["#6b523a", "#634b35", "#72583f"];
  const seam = "#4b3828";
  for (let k = 0; k * 6 < RD; k++) {
    const y = k * 6;
    const d = Math.min(6, RD - y);
    flat(c, 0, y, 0, RW, d, planks[(k * 2) % 3]);
    flat(c, 0, y, 0, RW, 1, seam);
    for (let x = 5 + ((k * 17) % 29); x < RW; x += 34) flat(c, x, y + 1, 0, 1, d - 1, seam);
  }
  // The edge of the slab.
  lit(c, 0, RD - 1, -3, RW, 3, "#3d2f22");
  dim(c, RW - 1, 0, -3, RD, 3, "#2b2119");

  // A rug that was red once.
  flat(c, 34, 30, 0, 34, 26, "#7a3c2e");
  flat(c, 36, 32, 0, 30, 22, "#96503a");
  flat(c, 38, 34, 0, 26, 18, "#7a3c2e");
  for (let i = 0; i < 4; i++) flat(c, 41 + i * 6, 42, 0, 2, 2, C.amber);

  // Daylight through the two panes, longer in the morning.
  if (s.time < 2 && !s.raining) {
    const reach = s.time === 0 ? 24 : 16;
    const light = s.time === 0 ? "rgba(255,214,150,0.15)" : "rgba(255,240,205,0.12)";
    flat(c, 44, 14, 0, 15, reach, light);
    flat(c, 61, 14, 0, 15, reach, light);
  }

  // Kebab wrappers pile up on the floor.
  const spots = [
    [44, 60], [62, 50], [30, 46], [70, 34], [54, 64], [74, 56], [26, 58], [66, 62],
  ];
  const wrappers = Math.min(spots.length, Math.floor(s.kebabs / 2));
  for (let i = 0; i < wrappers; i++) {
    const px = sx(spots[i][0], spots[i][1]);
    const py = sy(spots[i][0], spots[i][1]);
    rect(c, px - 2, py - 2, 5, 3, "#c4c0ae");
    rect(c, px - 1, py - 3, 3, 1, "#dedbcb");
    rect(c, px + 1, py - 1, 2, 1, C.amber);
  }
}

const METAL: Faces = ["#8f957f", "#7b826d", "#5d6455"];
const DARK_METAL: Faces = ["#6a6f60", "#5a5f52", "#474b41"];
const TIMBER: Faces = [C.woodLight, C.wood, C.woodDark];

function drawFridge(c: Ctx) {
  box(c, 1, 2, 0, 11, 11, 28, METAL);
  // The door faces the room.
  dim(c, 11, 2, 18, 11, 1, "#3f453a");
  dim(c, 11, 3, 20, 1, 5, "#b4b9a6");
  dim(c, 11, 3, 9, 1, 7, "#b4b9a6");
  dim(c, 11, 7, 22, 3, 3, C.amber);
  dim(c, 11, 8, 23, 1, 1, C.rust);
  dim(c, 11, 9, 0, 4, 2, C.rustDark);
  dim(c, 11, 5, 0, 2, 1, C.rustDark);
  lit(c, 3, 12, 3, 6, 1, "#565c4e");
  lit(c, 3, 12, 5, 6, 1, "#565c4e");
  lit(c, 2, 12, 14, 2, 3, C.rustDark);
}

function drawScreen(c: Ctx, s: RoomScene) {
  /** Screen coordinates: a across, b down, ten wide and seven tall. */
  const line = (a: number, b: number, w: number, color: string) =>
    lit(c, 26 + a, 10, 19 - b, w, 1, color);
  const blink = s.frame % 2 === 0;
  if (s.screen === "code") {
    line(1, 1, 5, C.phosphor);
    line(2, 2, 6, C.phosphorDim);
    line(2, 3, 4, C.phosphorDim);
    line(1, 4, 7, C.phosphor);
    if (blink) line(1, 5, 1, C.phosphor);
  } else if (s.screen === "ship") {
    line(1, 1, 8, C.amber);
    line(1, 3, 2 + (s.frame % 4) * 2, C.phosphor);
    line(1, 5, 4, C.phosphorDim);
  } else if (s.screen === "chat") {
    line(1, 1, 5, C.bone);
    line(4, 3, 5, C.phosphor);
    if (blink) line(1, 5, 3, C.bone);
  } else if (s.screen === "invoice") {
    line(1, 1, 4, C.bone);
    line(6, 1, 3, C.phosphor);
    line(1, 3, 4, C.bone);
    line(6, 3, 3, C.phosphor);
    line(5, 5, 4, C.amber);
  }
}

function drawDesk(c: Ctx, s: RoomScene) {
  flat(c, 15, 4, 0, 28, 11, "rgba(0,0,0,0.22)");
  box(c, 14, 1, 0, 2, 12, 9, TIMBER);
  // Drawers.
  box(c, 36, 1, 0, 8, 12, 9, [C.wood, "#6c5034", C.woodDark]);
  for (const z of [3, 6]) lit(c, 36, 12, z, 8, 1, C.woodDark);
  for (const z of [1, 4, 7]) lit(c, 39, 12, z, 2, 1, C.bone);
  box(c, 14, 1, 9, 30, 12, 2, TIMBER);

  // Bowls of pasta pile up at the far end, next to the mug.
  const bowls = Math.min(3, Math.floor(s.pates / 4));
  for (let i = 0; i < bowls; i++) {
    box(c, 15, 3, 11 + i * 2, 4, 4, 2, ["#efd98c", "#ddd5bf", "#bdb6a2"]);
  }
  box(c, 21, 3, 11, 2, 2, 3, ["#3a2c20", "#d9d1bc", "#bab39f"]);

  // The terminal, its screen turned towards the room.
  box(c, 25, 3, 11, 12, 8, 10, ["#cbc0a2", "#b5aa8a", "#91876c"]);
  lit(c, 26, 10, 13, 10, 7, s.screen === "off" ? "#20231f" : "#0b2012");
  drawScreen(c, s);
  box(c, 26, 11, 11, 10, 2, 1, ["#c2b899", "#a99f81", "#8c836a"]);

  // Lamp.
  const on = s.time >= 2;
  box(c, 39, 4, 11, 3, 3, 1, DARK_METAL);
  rect(c, sx(40, 5), sy(40, 5, 12) - 7, 1, 7, "#474b41");
  box(c, 38, 3, 19, 5, 5, 3, on ? ["#ffe09a", "#f2c468", "#d9a440"] : METAL);

  // The stool, and whoever is working.
  box(c, 28, 15, 0, 5, 5, 5, DARK_METAL);
  if (s.pose === "desk") {
    drawPerson(c, s.who, sx(30, 17) - 6, sy(30, 17, 5) - 13, { rows: 13, back: true });
  }
}

function drawPlant(c: Ctx, s: RoomScene) {
  // It lives and dies with your morale.
  box(c, 74, 2, 0, 7, 7, 6, ["#4f3423", "#a8603e", "#844a30"]);
  const px = sx(77, 5);
  const py = sy(77, 5, 6);
  if (s.moral >= 60) {
    rect(c, px, py - 12, 2, 12, C.leafDark);
    rect(c, px - 5, py - 8, 5, 2, C.leaf);
    rect(c, px + 2, py - 10, 5, 2, C.leaf);
    rect(c, px - 3, py - 15, 7, 3, C.leaf);
    rect(c, px - 6, py - 4, 5, 2, C.leaf);
    rect(c, px + 2, py - 5, 4, 2, C.leaf);
  } else if (s.moral >= 25) {
    rect(c, px, py - 8, 2, 8, "#7d8a4a");
    rect(c, px - 4, py - 5, 4, 2, "#a3a65a");
    rect(c, px + 2, py - 7, 4, 2, "#a3a65a");
    rect(c, px - 1, py - 10, 4, 2, "#a3a65a");
  } else {
    rect(c, px, py - 6, 1, 6, "#7a5c36");
    rect(c, px + 1, py - 6, 3, 1, "#7a5c36");
    rect(c, px + 3, py - 5, 1, 2, "#7a5c36");
    rect(c, px - 2, py - 3, 2, 1, "#7a5c36");
  }
}

function drawBed(c: Ctx, s: RoomScene, asleep: boolean) {
  const frame: Faces = ["#5b594f", "#4b4941", "#3a3832"];
  box(c, 1, 26, 0, 17, 1, 12, frame);
  box(c, 1, 27, 0, 17, 38, 4, frame);
  box(c, 1, 27, 4, 17, 38, 3, ["#cfc2a2", "#b4a787", "#968a6c"]);
  box(c, 3, 28, 7, 13, 7, 2, [C.white, "#d3c9af", "#b4aa90"]);
  if (asleep) {
    drawPerson(c, s.who, sx(9, 31) - 6, sy(9, 31, 9) - 7, { rows: 7, blink: true });
  }
  // An army blanket.
  box(c, 1, 37, 7, 17, 28, 2, ["#64744c", "#53623b", "#44502f"]);
  flat(c, 1, 39, 9, 17, 2, "#7f8d5e");
  flat(c, 1, 61, 9, 17, 1, "#7f8d5e");
  box(c, 1, 65, 0, 17, 1, 9, frame);

  // A crate for a bedside table, and a radio that has seen better decades.
  box(c, 20, 28, 0, 8, 8, 7, TIMBER);
  lit(c, 20, 35, 3, 8, 1, C.woodDark);
  dim(c, 27, 28, 3, 8, 1, "#49351f");
  box(c, 21, 30, 7, 6, 4, 4, ["#8d7350", "#a78a5f", "#6f583b"]);
  dim(c, 26, 30, 8, 2, 2, "#3a2e20");
  dim(c, 26, 33, 9, 1, 1, s.time >= 2 ? C.amber : C.bone);
  rect(c, sx(21, 30), sy(21, 30, 11) - 6, 1, 6, C.steelLight);
}

function drawBubble(c: Ctx, x: number, y: number, kind: "zzz" | "heart" | "idea" | "bang") {
  rect(c, x, y, 9, 8, C.paper);
  rect(c, x + 1, y - 1, 7, 1, C.paper);
  rect(c, x + 1, y + 8, 7, 1, C.paper);
  rect(c, x + 2, y + 9, 2, 1, C.paper);
  if (kind === "zzz") {
    rect(c, x + 2, y + 1, 5, 1, C.ink);
    rect(c, x + 5, y + 2, 1, 1, C.ink);
    rect(c, x + 4, y + 3, 1, 1, C.ink);
    rect(c, x + 3, y + 4, 1, 1, C.ink);
    rect(c, x + 2, y + 5, 5, 1, C.ink);
  } else if (kind === "heart") {
    rect(c, x + 2, y + 2, 2, 2, C.red);
    rect(c, x + 5, y + 2, 2, 2, C.red);
    rect(c, x + 2, y + 3, 5, 2, C.red);
    rect(c, x + 3, y + 5, 3, 1, C.red);
    rect(c, x + 4, y + 6, 1, 1, C.red);
  } else if (kind === "idea") {
    rect(c, x + 3, y + 1, 3, 4, C.amber);
    rect(c, x + 2, y + 2, 5, 2, C.amber);
    rect(c, x + 3, y + 5, 3, 1, C.ink);
    rect(c, x + 4, y + 6, 1, 1, C.ink);
  } else {
    rect(c, x + 4, y + 1, 1, 4, C.red);
    rect(c, x + 4, y + 6, 1, 1, C.red);
  }
}

function glow(c: Ctx, x: number, y: number, radius: number, rgb: string, strength: number) {
  const g = c.createRadialGradient(x, y, 1, x, y, radius);
  g.addColorStop(0, `rgba(${rgb},${strength})`);
  g.addColorStop(0.5, `rgba(${rgb},${strength * 0.4})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawRoom(c: Ctx, s: RoomScene) {
  // The building is drawn on an empty canvas; the void goes in behind it last,
  // so that light and shade can be laid on the building alone.
  c.clearRect(0, 0, ROOM_W, ROOM_H);
  drawWalls(c);
  drawWindow(c, s);
  drawChart(c, s);
  drawFloor(c, s);

  const blink = s.frame % 7 === 0;
  const asleep = s.pose === "bed";
  drawFridge(c);
  drawDesk(c, s);
  drawPlant(c, s);
  drawBed(c, s, asleep);

  if (s.pose === "idle" || s.pose === "think" || s.pose === "phone" || s.pose === "eat") {
    const bob = s.frame % 2;
    const px = sx(50, 42) - 6;
    const feet = sy(50, 42);
    const py = feet - BODY_H + (s.pose === "idle" ? 0 : bob);
    rect(c, px + 1, feet - 1, 10, 2, "rgba(0,0,0,0.3)");
    drawPerson(c, s.who, px, py, { blink, armUp: s.pose === "phone" || s.pose === "eat" });
    if (s.pose === "phone") {
      rect(c, px + 11, py + 4, 2, 3, C.ink);
      rect(c, px + 11, py + 5, 2, 1, C.phosphor);
      if (s.frame % 2 === 0) drawBubble(c, px + 13, py - 8, "heart");
    }
    if (s.pose === "eat") {
      // A kebab, held high.
      rect(c, px + 10, py + 3, 4, 3, "#e3d3a2");
      rect(c, px + 11, py + 2, 3, 1, C.leaf);
      rect(c, px + 12, py + 3, 2, 1, C.rust);
    }
    if (s.pose === "think") drawBubble(c, px + 12, py - 9, "idea");
  }
  if (asleep) drawBubble(c, sx(9, 31) + 7, sy(9, 31, 9) - 18 - (s.frame % 2), "zzz");

  // Evening and night fall on the room, with the lamp and the screen still glowing.
  c.save();
  c.globalCompositeOperation = "source-atop";
  if (s.time >= 2) {
    rect(c, 0, 0, ROOM_W, ROOM_H, s.time === 3 ? "rgba(8,12,30,0.5)" : "rgba(80,40,30,0.18)");
    glow(c, sx(40, 5), sy(40, 5, 17), 36, "255,214,140", s.time === 3 ? 0.45 : 0.3);
  }
  if (s.screen !== "off") {
    glow(c, sx(31, 12), sy(31, 12, 16), 16, "105,224,124", s.time >= 2 ? 0.34 : 0.2);
  }
  c.globalCompositeOperation = "destination-over";
  rect(c, 0, 0, ROOM_W, ROOM_H, C.void);
  c.restore();
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
