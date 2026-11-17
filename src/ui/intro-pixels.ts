/**
 * Putting the intro together: a street in Lille on the last evening of the
 * year, then the owner of the kebab shop.
 *
 * The pictures are painted in `art/intro.px.js`. This file only places them
 * for a given moment: where the walker is, how far Chef has come in, what the
 * rain and the neon are doing.
 */
import atlasJson from "./intro-atlas.json";
import { image } from "./pixels";

type Ctx = CanvasRenderingContext2D;

/** Where each sprite sits on the intro's sheet: x, y, width, height. */
const ATLAS = atlasJson as unknown as Record<string, [number, number, number, number]>;

export const INTRO_W = 256;
export const INTRO_H = 144;

/** How wide the street is, and where the walker comes out and stops. */
const STREET_W = 560;
export const WALK_FROM = 60;
export const WALK_TO = 388;
/** The walker stays this far from the left of the screen once the camera moves. */
const LEAD = 110;
/** The skyline moves this much slower than the street. */
const DEPTH = 0.3;
/** The pavement, under the walker's feet. */
const GROUND = 124;
/** A stride, in pixels: the legs change every quarter of it. */
const STRIDE = 20;

export interface IntroArt {
  sky: HTMLImageElement;
  far: HTMLImageElement;
  street: HTMLImageElement;
  sheet: HTMLImageElement;
}

let loading: Promise<IntroArt> | null = null;

/** Loads the intro's four images once, about 14 kB in all. */
export function loadIntroArt(): Promise<IntroArt> {
  loading ??= Promise.all(
    ["intro_sky", "intro_far", "intro_street", "intro"].map((name) => image(`/art/${name}.png`)),
  ).then(([sky, far, street, sheet]) => ({ sky, far, street, sheet }));
  return loading;
}

export interface IntroFrame {
  scene: "street" | "chef";
  /** Street: the walker's left edge, in street pixels, and whether they are moving. */
  walker: number;
  walking: boolean;
  /** Chef: how far he has come in, from 0 to 1, and which face he pulls. */
  enter: number;
  face: 0 | 1 | 2;
  /** Light runs along the knife. */
  glint: boolean;
  /** The screen shakes by this many pixels. */
  shake: number;
  /** A white flash over everything, from 0 to 1. */
  flash: number;
  /** Milliseconds since the intro began: the rain, the neon, the spit. */
  clock: number;
}

function sprite(c: Ctx, art: IntroArt, name: string, x: number, y: number) {
  const frame = ATLAS[name];
  if (!frame) return;
  const [fx, fy, w, h] = frame;
  c.drawImage(art.sheet, fx, fy, w, h, Math.round(x), Math.round(y), w, h);
}

/** Rain: thin streaks, falling fast and a little to the left. */
function drawRain(c: Ctx, clock: number) {
  c.fillStyle = "rgba(196,210,236,0.42)";
  for (let i = 0; i < 54; i++) {
    const fall = 0.2 + (i % 5) * 0.012;
    const y = ((i * 67) % (INTRO_H + 8)) + clock * fall;
    const x = (i * 131) % (INTRO_W + 40) - clock * fall * 0.22;
    const px = ((x % (INTRO_W + 40)) + INTRO_W + 40) % (INTRO_W + 40) - 20;
    c.fillRect(Math.round(px), Math.round(y % (INTRO_H + 8)) - 4, 1, 3);
  }
}

/** The neon over the shop is steady, apart from one stutter every few seconds. */
function neonLevel(clock: number): number {
  const t = clock % 5200;
  return t < 70 ? 0.35 : t < 130 ? 1 : t < 180 ? 0.55 : 1;
}

function drawStreet(c: Ctx, art: IntroArt, f: IntroFrame) {
  const camera = Math.max(0, Math.min(STREET_W - INTRO_W, Math.round(f.walker - LEAD)));
  c.drawImage(art.sky, 0, 0);
  c.drawImage(art.far, -Math.round(camera * DEPTH), 0);
  c.drawImage(art.street, -camera, 0);

  // The neon hangs on the band over the shop window, as in the art file.
  c.globalAlpha = neonLevel(f.clock);
  sprite(c, art, "intro_neon", 343 - camera, 66);
  c.globalAlpha = 1;

  // Standing still, the legs are together.
  const step = f.walking ? Math.floor((f.walker / STRIDE) * 4) % 4 : 1;
  const x = Math.round(f.walker) - camera;
  c.fillStyle = "rgba(0,0,0,0.28)";
  c.fillRect(x + 3, GROUND, 13, 2);
  sprite(c, art, `intro_walk_${step}`, x, GROUND - 28);

  drawRain(c, f.clock);
}

/** Lines streaking past behind Chef: the oldest trick for an entrance. */
const LINES = ["#1a3653", "#264663", "#1a3653", "#4f7aa6", "#264663", "#f2b441"];

function drawChef(c: Ctx, art: IntroArt, f: IntroFrame) {
  c.fillStyle = "#081726";
  c.fillRect(0, 0, INTRO_W, INTRO_H);
  for (let i = 0; i < 20; i++) {
    const length = 26 + ((i * 37) % 64);
    const speed = 0.16 + ((i * 53) % 17) * 0.012;
    const span = INTRO_W + length;
    const x = INTRO_W - ((f.clock * speed + i * 97) % span);
    c.fillStyle = LINES[i % LINES.length];
    c.fillRect(Math.round(x), 3 + i * 7 + ((i * 5) % 3), length, i % 6 === 5 ? 1 : 2);
  }

  // He comes in from the right and stops dead; the spit rolls in behind him.
  const ease = 1 - Math.pow(1 - f.enter, 3);
  const shove = Math.round((1 - ease) * 220);
  const y = f.shake;
  c.globalAlpha = Math.min(1, f.enter * 1.4);
  sprite(c, art, "intro_halo", 14, 6 + y);
  c.globalAlpha = 1;
  sprite(c, art, `intro_spit_${Math.floor(f.clock / 120) % 8}`, 176 + shove * 1.3, 52 + y);
  sprite(c, art, `intro_chef_${f.face}`, 39 + shove, 40 + y);
  if (f.glint) {
    const step = Math.floor(f.clock / 90) % 10;
    if (step < 4) sprite(c, art, `intro_glint_${step}`, 39 + shove + 64, 40 + y + 16);
  }
}

export function drawIntro(c: Ctx, art: IntroArt, f: IntroFrame) {
  c.clearRect(0, 0, INTRO_W, INTRO_H);
  if (f.scene === "street") drawStreet(c, art, f);
  else drawChef(c, art, f);
  if (f.flash > 0) {
    c.fillStyle = `rgba(255,248,232,${Math.min(1, f.flash).toFixed(3)})`;
    c.fillRect(0, 0, INTRO_W, INTRO_H);
  }
}
