/**
 * Silkscreen, turned into hard pixels. The face is drawn on an 8-pixel grid,
 * so at 8 px each of its squares is one art pixel: render every glyph once,
 * keep the pixels that are more than half covered, and the text sits on the
 * same grid as the sprites, with no smoothing at any scale.
 */
type Ctx = CanvasRenderingContext2D;

interface Glyph {
  advance: number;
  /** Covered pixels, as [x, y] pairs from the cell's top-left. */
  px: Int8Array;
}

/** A line of text is this many art pixels tall at scale 1. */
export const CELL = 8;
const BASELINE = 7;
const CHARS =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~€é·×…";

const faces = new Map<string, Map<string, Glyph>>();

export async function loadFonts(base: string) {
  const files = { Silkscreen: "Silkscreen-Regular.ttf", "Silkscreen Bold": "Silkscreen-Bold.ttf" };
  for (const [family, file] of Object.entries(files)) {
    const face = new FontFace(family, `url(${base}/${file})`);
    await face.load();
    document.fonts.add(face);
    faces.set(family, rasterize(family));
  }
}

function rasterize(family: string): Map<string, Glyph> {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = CELL + 4;
  const c = canvas.getContext("2d", { willReadFrequently: true })!;
  c.font = `8px "${family}"`;
  c.textBaseline = "alphabetic";
  const out = new Map<string, Glyph>();
  for (const ch of CHARS) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = "#fff";
    c.fillText(ch, 0, BASELINE);
    const data = c.getImageData(0, 0, canvas.width, canvas.height).data;
    const px: number[] = [];
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) if (data[(y * canvas.width + x) * 4 + 3] >= 128) px.push(x, y);
    out.set(ch, { advance: Math.round(c.measureText(ch).width), px: Int8Array.from(px) });
  }
  return out;
}

function glyphs(family: string) {
  const g = faces.get(family);
  if (!g) throw new Error(`font ${family} not loaded`);
  return g;
}

export function measure(text: string, scale = 1, family = "Silkscreen"): number {
  const g = glyphs(family);
  let w = 0;
  for (const ch of text) w += g.get(ch)?.advance ?? g.get("?")!.advance;
  // The last letter's spacing is not part of the line.
  return Math.max(0, w - 1) * scale;
}

export function drawText(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  { scale = 1, color = "#fff", family = "Silkscreen", shadow }: { scale?: number; color?: string; family?: string; shadow?: string } = {},
) {
  const g = glyphs(family);
  const paint = (dx: number, dy: number, fill: string) => {
    c.fillStyle = fill;
    let cx = Math.round(x);
    for (const ch of text) {
      const glyph = g.get(ch) ?? g.get("?")!;
      for (let i = 0; i < glyph.px.length; i += 2)
        c.fillRect(cx + glyph.px[i] * scale + dx, Math.round(y) + glyph.px[i + 1] * scale + dy, scale, scale);
      cx += glyph.advance * scale;
    }
  };
  if (shadow) paint(scale, scale, shadow);
  paint(0, 0, color);
}
