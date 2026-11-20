/**
 * Renders the film. Bundles src/, serves it with the game's art, steps a
 * headless Chrome through t = n/60 and pipes the frames to ffmpeg.
 *
 *   node scripts/render.mjs            everything: audio, three cuts, reduced cut, captions, stills, checks
 *   node scripts/render.mjs stills     stills and the contact sheet only
 *   node scripts/render.mjs check      the determinism check only
 *   node scripts/render.mjs 16x9       one cut (with audio)
 */
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(HERE, "..");
const OUT = join(HERE, "out");
const FPS = 60;
const FORMATS = { "16x9": [320, 180, 6], "9x16": [216, 384, 5], "1x1": [216, 216, 5] };
const NAMES = { "16x9": "master_16x9", "9x16": "cut_9x16", "1x1": "cut_1x1" };

const arg = process.argv[2] ?? "all";
mkdirSync(OUT, { recursive: true });

// 1. Bundle.
await build({
  entryPoints: [join(HERE, "src/main.ts")],
  bundle: true,
  outfile: join(HERE, ".build/bundle.js"),
  format: "iife",
  target: "chrome120",
  logLevel: "warning",
  tsconfigRaw: { compilerOptions: { paths: { "@/*": ["./src/*"] } } },
  alias: { "@": join(ROOT, "src") },
});

// 2. Serve the page, the bundle and the game's art, sound and type.
const MOUNTS = [
  ["/art/", join(ROOT, "public/art")],
  ["/audio/", join(ROOT, "public/audio")],
  ["/fonts/", join(ROOT, "assets/fonts")],
];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".mp3": "audio/mpeg", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let file = url === "/" ? join(HERE, "index.html") : url === "/bundle.js" ? join(HERE, ".build/bundle.js") : null;
  for (const [prefix, dir] of MOUNTS) if (url.startsWith(prefix)) file = join(dir, url.slice(prefix.length));
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
async function open() {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${ORIGIN}/?still&t=0`);
  await page.evaluate(() => window.ready);
  return page;
}
const page = await open();
const timeline = await page.evaluate(() => window.TIMELINE);
const DURATION = timeline.DURATION;
const FRAMES = Math.round(DURATION * FPS);

// The words must fit before anything is rendered.
const overflow = await page.evaluate(() => window.overflow());
if (overflow.length) {
  console.error("Lines that do not fit:\n" + overflow.join("\n"));
  process.exit(1);
}

function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr}`);
  return r.stderr.toString();
}

// 3. Sound: rendered in the page, then brought to -16 LUFS, peaks under -1.5 dBTP.
async function audio() {
  const [l, r] = await page.evaluate(() => window.audio());
  const L = new Float32Array(Buffer.from(l, "base64").buffer.slice(0));
  const R = new Float32Array(Buffer.from(r, "base64").buffer.slice(0));
  const raw = Buffer.alloc(L.length * 8);
  for (let i = 0; i < L.length; i++) {
    raw.writeFloatLE(L[i], i * 8);
    raw.writeFloatLE(R[i], i * 8 + 4);
  }
  const pre = join(OUT, "audio_raw.wav");
  run("ffmpeg", ["-y", "-f", "f32le", "-ar", "48000", "-ac", "2", "-i", "-", pre], raw);
  const probe = run("ffmpeg", ["-i", pre, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]);
  const m = JSON.parse(probe.slice(probe.lastIndexOf("{"), probe.lastIndexOf("}") + 1));
  const final = join(OUT, "audio.wav");
  run("ffmpeg", [
    "-y", "-i", pre, "-af",
    `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`,
    "-c:a", "pcm_s16le", final,
  ]);
  rmSync(pre);
  return final;
}

// 4. One cut: every frame, through ffmpeg.
async function cut(format, wav, { reduced = false, name = NAMES[format] } = {}) {
  const [w, h, scale] = FORMATS[format];
  await page.evaluate(([f, r]) => window.setup(f, r), [format, reduced]);
  const file = join(OUT, `${name}.mp4`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-r", String(FPS), "-i", "-",
    "-i", wav,
    "-vf", `scale=${w * scale}:${h * scale}:flags=neighbor`,
    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-tune", "animation",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((r, j) => ff.on("close", (code) => (code === 0 ? r() : j(new Error("ffmpeg " + code)))));
  const started = Date.now();
  for (let n = 0; n < FRAMES; n++) {
    const b64 = await page.evaluate((t) => window.frame(t), n / FPS);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
  console.log(`${name}.mp4  ${FRAMES} frames in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}

// 5. Captions: the on-screen words, and what the sound does, as SubRip.
function captions() {
  const stamp = (t) => {
    const ms = Math.round(t * 1000);
    const p = (n, d = 2) => String(n).padStart(d, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  const items = [
    ...timeline.CAPTIONS.map((c) => ({ from: c.lines[0].at, to: c.to, text: (c.chef ? "CHEF: " : "") + c.lines.map((l) => l.text).join("\n") })),
    { from: 16.0, to: 17.5, text: "WARNING" },
    { from: 17.8, to: 19.1, text: "CHEF" },
    { from: 22.4, to: 23.1, text: "READY" },
    { from: 44.8, to: DURATION, text: "KEBAB PROFITABLE" },
    ...timeline.CUES.filter((c) => c.says).map((c) => ({ from: c.t, to: c.t + 1.2, text: c.says })),
  ].sort((a, b) => a.from - b.from);
  const srt = items.map((it, i) => `${i + 1}\n${stamp(it.from)} --> ${stamp(it.to)}\n${it.text}\n`).join("\n");
  writeFileSync(join(OUT, "captions.srt"), srt);
  console.log(`captions.srt  ${items.length} entries`);
}

// 6. A still at every beat that matters, and the contact sheet.
const BEATS = [
  ["q-shipped", 1.6], ["q-nobody", 3.8], ["m-cash", 6.5], ["m-rent", 8.6], ["m-goal", 11.9], ["m-moves", 15.2],
  ["c-warning", 16.5], ["c-enter", 17.75], ["c-name", 18.9], ["c-quote", 20.3], ["c-more", 21.9], ["p-ready", 22.5],
  ["p-early", 25.0], ["p-month", 27.0], ["p-broke", 31.5], ["t-rewind", 32.6], ["t-posts", 34.2], ["t-climb", 37.5],
  ["t-win", 40.6], ["y-came", 42.9], ["y-chef", 44.4], ["y-title", 47.5],
];
async function stills(format = "16x9", reduced = false) {
  const dir = join(OUT, "stills", format + (reduced ? "-reduced" : ""));
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const [w, h] = FORMATS[format];
  await page.evaluate(([f, r]) => window.setup(f, r), [format, reduced]);
  let i = 0;
  for (const [name, t] of BEATS) {
    const b64 = await page.evaluate((t) => window.frame(t), t);
    const file = join(dir, `${String(i++).padStart(2, "0")}-${name}.png`);
    run("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-i", "-",
      "-vf", `scale=${w * 3}:${h * 3}:flags=neighbor`, "-frames:v", "1", file], Buffer.from(b64, "base64"));
  }
  return dir;
}
async function contact() {
  const dir = await stills("16x9");
  run("ffmpeg", ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", join(dir, "*.png"),
    "-vf", "scale=480:270:flags=neighbor,pad=488:278:4:4:0x081726,tile=4x6:color=0x081726", "-frames:v", "1", join(OUT, "contact.png")]);
  console.log("contact.png");
  for (const [f, size, tile] of [["9x16", "216:384", "7x3"], ["1x1", "324:324", "6x4"]]) {
    const d = await stills(f);
    const [w, h] = size.split(":").map(Number);
    run("ffmpeg", ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", join(d, "*.png"),
      "-vf", `scale=${w}:${h}:flags=neighbor,pad=${w + 8}:${h + 8}:4:4:0x081726,tile=${tile}:color=0x081726`, "-frames:v", "1",
      join(OUT, "stills", `contact_${f}.png`)]);
  }
  await stills("16x9", true);
}

// 7. Every frame a pure function of t: one frame, rendered twice in two pages, must match.
async function check() {
  const t = 37.517;
  const a = await page.evaluate((t) => { window.setup("16x9"); window.seek(0); return window.frame(t); }, t);
  const other = await open();
  const b = await other.evaluate((t) => { window.setup("16x9"); window.seek(44); return window.frame(t); }, t);
  await other.close();
  const same = a === b;
  console.log(`determinism: frame at t=${t} rendered twice, in two pages, after different frames: ${same ? "identical" : "DIFFERENT"}`);
  if (!same) process.exitCode = 1;
}

try {
  if (arg === "stills") await contact();
  else if (arg === "check") await check();
  else if (FORMATS[arg]) await cut(arg, await audio());
  else {
    await check();
    captions();
    await contact();
    const wav = await audio();
    for (const f of Object.keys(FORMATS)) await cut(f, wav);
    await cut("16x9", wav, { reduced: true, name: "master_16x9_reduced_motion" });
    console.log(run("ffmpeg", ["-i", join(OUT, "master_16x9.mp4"), "-af", "ebur128=peak=true", "-f", "null", "-"]).split("Summary:")[1]);
  }
} finally {
  await browser.close();
  server.close();
}
