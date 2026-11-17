// Copies what the game uses out of the pxl build: the room in each light, the
// sprite sheet, the portraits (members and guests), and a compact atlas saying where each sprite is.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
const target = join(here, "..", "public", "art");
mkdirSync(target, { recursive: true });

let files = 0;
for (const name of readdirSync(join(out, "scenes"))) {
  if (name.startsWith("room_") && name.endsWith(".png")) {
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
copyFileSync(join(out, "sprites.png"), join(target, "sprites.png"));
files++;

// name -> [x, y, width, height] on the sheet.
const sheet = JSON.parse(readFileSync(join(out, "sprites.json"), "utf8"));
const atlas = {};
for (const [name, entry] of Object.entries(sheet.frames)) {
  const { x, y, w, h } = entry.frame;
  atlas[name] = [x, y, w, h];
}
writeFileSync(join(here, "..", "src", "ui", "atlas.json"), JSON.stringify(atlas) + "\n");

console.log(`art: ${files} images and ${Object.keys(atlas).length} sprites exported`);
