/**
 * The soundtrack, rendered offline from the timeline: an original bed at
 * 150 beats a minute in E minor, built from square, triangle and seeded
 * noise, with the game's own effects (public/audio/sfx.mp3) on the cues.
 * One motif, four notes rising, returns where the idea lands.
 */
import manifest from "../../src/lib/audio.json";
import { BAR, BEAT, CUES, DURATION, MOTIF, bar } from "./timeline";

const RATE = 48000;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** mulberry32: the same noise on every render. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Notes, as MIDI numbers. E minor: i - VI - VII - V, the oldest climb there is.
const E2 = 40, C2 = 36, D2 = 38, B1 = 35, G2 = 43;
const PROGRESSION = [E2, C2, D2, B1];
const BRIGHT = [C2, D2, E2, G2];

export async function renderAudio(): Promise<Float32Array[]> {
  const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * RATE), RATE);
  const random = rng(36);

  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  const music = ctx.createGain();
  music.gain.value = 0.55;
  music.connect(master);
  const fx = ctx.createGain();
  fx.gain.value = 1;
  fx.connect(master);

  // A quarter-wide pulse, the lead's voice.
  const real = new Float32Array(32), imag = new Float32Array(32);
  for (let k = 1; k < 32; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
  const pulse = ctx.createPeriodicWave(real, imag);

  const noise = ctx.createBuffer(1, RATE, RATE);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = random() * 2 - 1;

  function tone(
    at: number,
    note: number,
    length: number,
    { type = "square", gain = 0.2, pan = 0, attack = 0.004, release = 0.06, to }: {
      type?: OscillatorType | "pulse"; gain?: number; pan?: number; attack?: number; release?: number; to?: number;
    } = {},
  ) {
    const o = ctx.createOscillator();
    if (type === "pulse") o.setPeriodicWave(pulse); else o.type = type;
    o.frequency.setValueAtTime(midi(note), at);
    if (to !== undefined) o.frequency.exponentialRampToValueAtTime(midi(to), at + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + attack);
    g.gain.setValueAtTime(gain, at + Math.max(attack, length - release));
    g.gain.linearRampToValueAtTime(0, at + length);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p).connect(music);
    o.start(at);
    o.stop(at + length + 0.01);
  }

  function hiss(at: number, length: number, { gain = 0.1, high = 7000, low = 0, pan = 0 } = {}) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = high;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = low || 18000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0008, at + length);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    s.connect(hp).connect(lp).connect(g).connect(p).connect(music);
    s.start(at, random() * 0.5, length + 0.02);
  }

  function kick(at: number, gain = 0.7) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
    o.connect(g).connect(music);
    o.start(at);
    o.stop(at + 0.25);
  }

  const snare = (at: number, gain = 0.32) => {
    hiss(at, 0.16, { gain, high: 1400, low: 9000 });
    tone(at, 50, 0.07, { type: "triangle", gain: gain * 0.6, to: 43 });
  };
  const hat = (at: number, gain = 0.06, pan = 0.25) => hiss(at, 0.035, { gain, high: 8000, pan });

  /** One bar of the band: bass, drums, and what the lead plays over it. */
  function groove(b: number, root: number, { drums = true, hats = true, lead = null as number[] | null, bright = false } = {}) {
    const t0 = bar(b);
    const e = BEAT / 2;
    for (let i = 0; i < 8; i++) {
      const at = t0 + i * e;
      // Driving eighths, the octave jumping on the off-beats.
      tone(at, root + (i % 2 ? 12 : 0), e * 0.9, { type: "triangle", gain: 0.42, release: 0.02 });
      if (hats) hat(at, i % 2 ? 0.05 : 0.08);
    }
    if (drums) {
      kick(t0);
      kick(t0 + BEAT * 2);
      kick(t0 + BEAT * 2.5, 0.45);
      snare(t0 + BEAT);
      snare(t0 + BEAT * 3);
    }
    // Power chords: root and fifth, a short stab on the one and the "and" of two.
    const chord = bright ? [root + 24, root + 31, root + 36] : [root + 24, root + 31];
    for (const at of [t0, t0 + BEAT * 1.5]) for (const n of chord) tone(at, n, BEAT * 0.45, { type: "square", gain: 0.05, pan: -0.3 });
    if (lead) lead.forEach((n, i) => n && tone(t0 + i * e, n, e * 0.85, { type: "pulse", gain: 0.1, pan: 0.2 }));
  }

  // Bars 0-2, the question: a held fifth and nothing else.
  for (const n of [E2 + 12, E2 + 19]) tone(0, n, bar(3), { type: "triangle", gain: 0.12, attack: 0.8, release: 0.8 });
  // Bars 3-9, the model: the band comes in without drums, then with them.
  for (let b = 3; b < 10; b++) {
    const root = PROGRESSION[(b - 3) % 4];
    groove(b, root, { drums: b >= 5, hats: true });
  }
  // Bar 10, WARNING: only the bass, on the low E, in sixteenths.
  for (let i = 0; i < 16; i++) tone(bar(10) + (i * BEAT) / 4, E2 - 12 + (i % 4 === 3 ? 12 : 0), BEAT / 4.5, { type: "triangle", gain: 0.5 });
  // Bars 11-13, Chef: the full band and a lead line.
  const riff = [64, 0, 67, 64, 71, 0, 69, 67];
  const riff2 = [64, 0, 67, 69, 71, 74, 72, 71];
  for (let b = 11; b < 14; b++) groove(b, PROGRESSION[(b - 11) % 4], { lead: b === 12 ? null : b === 11 ? riff : riff2 });
  // Bars 14-19, run 1: the groove keeps going, and stops dead when the money does.
  for (let b = 14; b < 19; b++) groove(b, PROGRESSION[(b - 14) % 4], { lead: b >= 15 && b % 2 ? riff : null });
  // Bar 20, the rewind: a falling sweep, then the motif.
  tone(bar(20), 88, BAR * 0.7, { type: "square", gain: 0.06, to: 52, release: 0.2 });
  // Bars 21-25, run 2: brighter, major chords on top.
  for (let b = 21; b < 26; b++) groove(b, BRIGHT[(b - 21) % 4], { bright: true, lead: b >= 22 ? riff2 : null });
  // Bars 26-29, payoff: half time, then the last chord in E major.
  for (let b = 26; b < 29; b++) groove(b, [C2, D2, B1][b - 26], { drums: b >= 27, hats: true });
  for (const n of [E2, E2 + 12, E2 + 19, E2 + 24, E2 + 28, E2 + 31]) {
    tone(bar(29), n, BAR, { type: n < 50 ? "triangle" : "square", gain: n < 50 ? 0.4 : 0.05, release: 1.2 });
  }
  kick(bar(29), 0.8);
  hiss(bar(29), 1.2, { gain: 0.12, high: 5000 });

  // The motif: B, E, G, B, rising. "It works."
  for (const at of MOTIF) [71, 76, 79, 83].forEach((n, i) => tone(at + i * (BEAT / 2), n, BEAT * 0.5, { type: "pulse", gain: 0.14, pan: 0 }));

  // The game's effects, on their cues.
  const sfx = await fetch("/audio/sfx.mp3").then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b));
  for (const cue of CUES) {
    const [start, length] = (manifest.sfx as unknown as Record<string, [number, number]>)[cue.sfx];
    const s = ctx.createBufferSource();
    s.buffer = sfx;
    const g = ctx.createGain();
    const len = Math.min(cue.length ?? Infinity, length / 1000 + 0.06);
    g.gain.setValueAtTime(cue.gain ?? 1, cue.t);
    g.gain.setValueAtTime(cue.gain ?? 1, cue.t + Math.max(0, len - 0.15));
    g.gain.linearRampToValueAtTime(0, cue.t + len);
    s.connect(g).connect(fx);
    s.start(cue.t, start / 1000, len);
  }

  const out = await ctx.startRendering();
  return [out.getChannelData(0), out.getChannelData(1)];
}
