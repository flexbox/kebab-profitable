// Copies what the game uses out of the pxl build: the room in each light, the
// sprite sheet, the portraits (members and guests), the pictures of the intro,
// and a compact atlas for each sheet saying where each sprite is.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
const target = join(here, "..", "public", "art");
mkdirSync(target, { recursive: true });

let files = 0;
for (const name of readdirSync(join(out, "scenes"))) {
  // The room in each light, and the three depths of the intro's street.
  if ((name.startsWith("room_") || name.startsWith("intro_")) && name.endsWith(".png")) {
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

console.log(`art: ${files} images and ${sprites} sprites exported`);
