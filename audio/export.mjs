// Copies what the game plays out of the chirp build, as MP3:
//  - the effects, in one file, with a map of where each one is in it;
//  - each piece of music, made to loop without a seam.
//
// An MP3 starts with a little silence that browsers do not all skip the same
// way, so a loop cannot run from the first sample to the last. Instead, each
// tune is followed by a repeat of its own first second, and the game loops
// between two points exactly one pass apart: whatever the silence, what plays
// at the second point is what played at the first.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
const target = join(here, "..", "public", "audio");
mkdirSync(target, { recursive: true });

/** How much of its start a tune repeats at its end, and where in it the loop begins. */
const REPEAT = 1;
const LOOP_FROM = 0.5;

/** The format and the samples of a PCM WAV file. */
function readWav(path) {
  const file = readFileSync(path);
  let format = null;
  let data = null;
  for (let at = 12; at + 8 <= file.length; ) {
    const id = file.toString("ascii", at, at + 4);
    const size = file.readUInt32LE(at + 4);
    if (id === "fmt ") {
      format = { channels: file.readUInt16LE(at + 10), rate: file.readUInt32LE(at + 12), bits: file.readUInt16LE(at + 22) };
    }
    if (id === "data") data = file.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  if (!format || !data) throw new Error(`${path} is not a PCM WAV file`);
  return { ...format, data };
}

function writeWav(path, { channels, rate, bits, data }) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE((rate * channels * bits) / 8, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

function mp3(from, to, ...options) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", from, ...options, "-c:a", "libmp3lame", to]);
}

const scratch = mkdtempSync(join(tmpdir(), "kebab-audio-"));
const manifest = { sfx: {}, music: {} };
let bytes = 0;
const size = (path) => readFileSync(path).length;

// The effects: one channel is enough, and they are short.
mp3(join(out, "sfx.wav"), join(target, "sfx.mp3"), "-ac", "1", "-b:a", "80k");
bytes += size(join(target, "sfx.mp3"));
const bank = JSON.parse(readFileSync(join(out, "sfx.json"), "utf8"));
for (const [name, [start, length]] of Object.entries(bank.sprite)) manifest.sfx[name] = [start, length];

// The music: each tune, then its first second again.
// A name that starts with "_" is a part of something else: the win fanfare is
// a song, but the game plays it once, from the effects file.
const tunes = readdirSync(join(out, "music")).filter((name) => name.endsWith(".wav") && !name.startsWith("_"));
for (const file of tunes.sort()) {
  const name = file.replace(/\.wav$/, "");
  const wav = readWav(join(out, "music", file));
  const frame = (wav.channels * wav.bits) / 8;
  const repeat = wav.data.subarray(0, REPEAT * wav.rate * frame);
  const longer = join(scratch, file);
  writeWav(longer, { ...wav, data: Buffer.concat([wav.data, repeat]) });
  mp3(longer, join(target, `${name}.mp3`), "-b:a", "96k");
  bytes += size(join(target, `${name}.mp3`));
  manifest.music[name] = { from: LOOP_FROM, length: wav.data.length / frame / wav.rate };
}
rmSync(scratch, { recursive: true });

writeFileSync(join(here, "..", "src", "lib", "audio.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `audio: ${Object.keys(manifest.sfx).length} effects and ${Object.keys(manifest.music).length} tunes exported, ${Math.round(bytes / 1024)} kB`,
);
