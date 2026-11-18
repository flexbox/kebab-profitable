// Copies what the game uses out of the pxl build: the room in each light, the
// bar, the sprite sheet, the portraits (members and guests), the pictures of the intro,
// and a compact atlas for each sheet saying where each sprite is.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync, inflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
const target = join(here, "..", "public", "art");
mkdirSync(target, { recursive: true });

let files = 0;
for (const name of readdirSync(join(out, "scenes"))) {
  // The room in each light, the bar, and the three depths of the intro's street.
  if ((name.startsWith("room_") || name.startsWith("intro_") || name === "bar.png") && name.endsWith(".png")) {
    copyFileSync(join(out, "scenes", name), join(target, name));
    files++;
  }
}
for (const name of readdirSync(join(out, "sprites"))) {
  if ((name.startsWith("portrait_") || name.startsWith("guest_")) && name.endsWith(".png")) {
    copyFileSync(join(out, "sprites", name), join(target, name));
    files++;
  }
}

// Each sheet, and its atlas: name -> [x, y, width, height] on the sheet.
let sprites = 0;
for (const [sheetName, atlasName] of [
  ["sprites", "atlas"],
  ["intro", "intro-atlas"],
]) {
  copyFileSync(join(out, `${sheetName}.png`), join(target, `${sheetName}.png`));
  files++;
  const sheet = JSON.parse(readFileSync(join(out, `${sheetName}.json`), "utf8"));
  const atlas = {};
  for (const [name, entry] of Object.entries(sheet.frames)) {
    const { x, y, w, h } = entry.frame;
    atlas[name] = [x, y, w, h];
  }
  writeFileSync(join(here, "..", "src", "ui", `${atlasName}.json`), JSON.stringify(atlas) + "\n");
  sprites += Object.keys(atlas).length;
}

// The picture a link is shared with: painted at 200 by 105, and wanted at
// 1200 by 630, each pixel six times larger. Next.js serves the file as the
// Open Graph image because of where it is and what it is called.
const SHARE_SCALE = 6;

/** The pixels of a PNG as pxl writes them: eight bits, with a palette or without, not interlaced. */
function readPng(path) {
  const file = readFileSync(path);
  let width = 0;
  let height = 0;
  let channels = 4;
  // A picture of few colours is stored as a list of them, and one number a pixel.
  let palette = null;
  let alpha = Buffer.alloc(0);
  const packed = [];
  for (let at = 8; at < file.length; ) {
    const size = file.readUInt32BE(at);
    const kind = file.toString("ascii", at + 4, at + 8);
    const body = file.subarray(at + 8, at + 8 + size);
    if (kind === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const colour = body[9];
      if (body[8] !== 8 || ![2, 3, 6].includes(colour) || body[12] !== 0) {
        throw new Error(`${path}: only 8-bit RGB, RGBA or palette, not interlaced`);
      }
      channels = colour === 6 ? 4 : colour === 2 ? 3 : 1;
    }
    if (kind === "PLTE") palette = Buffer.from(body);
    if (kind === "tRNS") alpha = Buffer.from(body);
    if (kind === "IDAT") packed.push(body);
    at += 12 + size;
  }
  const raw = inflateSync(Buffer.concat(packed));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4, 255);
  let before = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    // Each row may be stored as its difference from its neighbours.
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = before[i];
      const corner = i >= channels ? before[i - channels] : 0;
      const guess = left + up - corner;
      const [a, b, c] = [Math.abs(guess - left), Math.abs(guess - up), Math.abs(guess - corner)];
      const paeth = a <= b && a <= c ? left : b <= c ? up : corner;
      row[i] = (row[i] + [0, left, up, (left + up) >> 1, paeth][filter]) & 255;
    }
    for (let x = 0; x < width; x++) {
      const to = (y * width + x) * 4;
      if (palette) {
        palette.copy(pixels, to, row[x] * 3, row[x] * 3 + 3);
        pixels[to + 3] = alpha[row[x]] ?? 255;
      } else row.copy(pixels, to, x * channels, (x + 1) * channels);
    }
    before = row;
  }
  return { width, height, pixels };
}

function writePng(path, { width, height, pixels }) {
  const chunk = (kind, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(kind, 4, "ascii");
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

/** The same picture with each pixel `scale` times larger. */
function enlarge(small, scale) {
  const large = { width: small.width * scale, height: small.height * scale };
  large.pixels = Buffer.alloc(large.width * large.height * 4);
  for (let y = 0; y < large.height; y++) {
    for (let x = 0; x < large.width; x++) {
      const from = (Math.floor(y / scale) * small.width + Math.floor(x / scale)) * 4;
      small.pixels.copy(large.pixels, (y * large.width + x) * 4, from, from + 4);
    }
  }
  return large;
}

/** Puts `top` on `under` at x, y. A pixel is either there or not: there is no blending. */
function place(under, top, x, y) {
  for (let row = 0; row < top.height; row++) {
    for (let col = 0; col < top.width; col++) {
      const from = (row * top.width + col) * 4;
      if (top.pixels[from + 3] < 128) continue;
      top.pixels.copy(under.pixels, ((y + row) * under.width + x + col) * 4, from, from + 4);
    }
  }
}

const sitePicture = enlarge(readPng(join(out, "scenes", "og.png")), SHARE_SCALE);
writePng(join(here, "..", "src", "app", "opengraph-image.png"), sitePicture);
files++;

// The picture a win is shared with, one for each founder: the founder who won
// with a fist in the air on the rug, and Chef in the corner. The server writes
// the score on it (src/server/card.tsx), so it is kept out of public/.
const WINNER_SCALE = 12;
const CHEF_SCALE = 4;
const cards = join(here, "..", "assets", "og");
mkdirSync(cards, { recursive: true });
// A link to a score that is no longer on the board shows the game's own picture.
writePng(join(cards, "site.png"), sitePicture);
files++;
const chef = enlarge(readPng(join(out, "sprites", "portrait_chef.png")), CHEF_SCALE);
for (const who of ["david", "karl", "mickael", "christophe", "matthys"]) {
  const card = enlarge(readPng(join(out, "scenes", "og_win.png")), SHARE_SCALE);
  const winner = enlarge(readPng(join(out, "sprites", `${who}_cheer_0_day.png`)), WINNER_SCALE);
  // Feet on the rug, a little above the bottom edge.
  place(card, winner, 84, card.height - 24 - winner.height);
  place(card, chef, card.width - 72 - chef.width, card.height - 24 - chef.height);
  writePng(join(cards, `win_${who}.png`), card);
  files++;
}

console.log(`art: ${files} images and ${sprites} sprites exported`);
