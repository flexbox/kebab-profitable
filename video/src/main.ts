/**
 * The page the renderer drives. window.seek(t) paints the frame at time t;
 * window.frame(t) also hands back its pixels, at art resolution.
 */
import { renderAudio } from "./audio";
import { load, overflow, paint } from "./film";
import { CAPTIONS, CUES, DURATION, SCENES } from "./timeline";
import { FORMATS, type Format } from "./tokens";

const canvas = document.querySelector("canvas")!;
const c = canvas.getContext("2d", { willReadFrequently: true })!;
let format: Format = "16x9";
let reduced = false;

function setup(f: Format, r = false) {
  format = f;
  reduced = r;
  canvas.width = FORMATS[f].w;
  canvas.height = FORMATS[f].h;
  const scale = FORMATS[f].scale;
  canvas.style.width = `${canvas.width * scale}px`;
}

function seek(t: number) {
  paint(c, format, t, reduced);
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function frame(t: number) {
  seek(t);
  const data = c.getImageData(0, 0, canvas.width, canvas.height).data;
  return toBase64(new Uint8Array(data.buffer));
}

async function audio() {
  const [l, r] = await renderAudio();
  return [toBase64(new Uint8Array(l.buffer)), toBase64(new Uint8Array(r.buffer))];
}

const TIMELINE = { DURATION, SCENES, CAPTIONS, CUES };
const ready = load().then(() => {
  setup("16x9");
  const q = new URLSearchParams(location.search);
  if (q.has("f")) setup(q.get("f") as Format, q.has("reduced"));
  if (q.has("t")) seek(+q.get("t")!);
  else {
    // In a browser, without the renderer: play it.
    const start = performance.now();
    const tick = () => {
      seek(((performance.now() - start) / 1000) % DURATION);
      requestAnimationFrame(tick);
    };
    if (!q.has("still")) tick();
  }
});

Object.assign(window, { ready, setup, seek, frame, audio, overflow, TIMELINE });
