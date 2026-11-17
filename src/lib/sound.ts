/**
 * Sound. Every effect and every tune is written as code in
 * `audio/kebab.cx.js` and rendered by `pnpm audio`; this file only plays them.
 *
 * The effects are cut from one file. The tunes loop: each file ends with a
 * repeat of its own first second, and the loop runs between two points
 * exactly one pass apart, so the seam cannot be heard whatever silence the
 * MP3 has at its start.
 */
import manifest from "./audio.json";

type Effect = keyof typeof manifest.sfx;
export type Tune = keyof typeof manifest.music;

const EFFECTS = "/audio/sfx.mp3";
const tuneUrl = (tune: Tune) => `/audio/${tune}.mp3`;
/** How loud each kind of sound is, against the other. */
const LEVEL = { sfx: 0.9, music: 0.5 };
/** An effect whose file is still on its way is dropped if it would come this late. */
const PATIENCE = 250;

let muted = false;
let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;

// Decoding needs no speaker, so files can be fetched before the first click,
// which is when browsers allow sound to start.
let decoder: OfflineAudioContext | null = null;
const files = new Map<string, Promise<AudioBuffer>>();

function load(url: string): Promise<AudioBuffer> {
  let file = files.get(url);
  if (!file) {
    decoder ??= new OfflineAudioContext(2, 1, 44100);
    const decode = decoder;
    file = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`could not load ${url}`);
        return response.arrayBuffer();
      })
      .then((data) => decode.decodeAudioData(data));
    // A download that failed can be tried again.
    file.catch(() => files.delete(url));
    files.set(url, file);
  }
  return file;
}

/** The speaker, created on first use, with one fader for effects and one for music. */
function output(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = LEVEL.sfx;
    sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = LEVEL.music;
    musicBus.connect(ctx.destination);
  }
  if (ctx.state === "suspended" && !document.hidden) void ctx.resume();
  return ctx;
}

function play(name: Effect) {
  if (muted || typeof window === "undefined") return;
  const asked = performance.now();
  load(EFFECTS).then(
    (buffer) => {
      if (muted || performance.now() - asked > PATIENCE) return;
      try {
        const out = output();
        const [start, length] = manifest.sfx[name];
        const source = out.createBufferSource();
        source.buffer = buffer;
        source.connect(sfxBus!);
        // A little past its end: a browser that keeps the MP3's leading
        // silence plays everything a few hundredths of a second late.
        source.start(0, start / 1000, length / 1000 + 0.06);
      } catch {
        // No audio device, or the browser refused: silence is fine.
      }
    },
    () => undefined,
  );
}

/** One of several takes of the same sound, so that a run of them does not drone. */
const oneOf =
  (...takes: Effect[]) =>
  () =>
    play(takes[Math.floor(Math.random() * takes.length)]);

export const sfx = {
  click: () => play("click"),
  /** A new customer: the till everyone waits for. */
  coin: () => play("coin"),
  bite: () => play("bite"),
  night: () => play("night"),
  card: () => play("card"),
  /** Something urgent: three quick beeps. */
  alarm: () => play("alarm"),
  /** One of the last seconds on the clock. */
  tick: () => play("tick"),
  bad: () => play("bad"),
  win: () => play("win"),
  lose: () => play("lose"),
  /** A founder is chosen. */
  pick: () => play("pick"),
  /** One letter of the intro's captions, then one of Chef's: lower, and rougher. */
  type: oneOf("type_1", "type_2", "type_3"),
  talk: oneOf("talk_1", "talk_2", "talk_3"),
  /** Chef lands in front of you. */
  slam: () => play("slam"),
  /** The dare: a chord struck hard. */
  dare: () => play("dare"),
};

// --- Music -------------------------------------------------------------------

/** The tune the game wants to hear, even while sound is off. */
let wanted: Tune | null = null;
let playing: { tune: Tune; source: AudioBufferSourceNode; fader: GainNode } | null = null;

function fadeOut(seconds: number) {
  if (!playing || !ctx) return;
  const { source, fader } = playing;
  playing = null;
  const now = ctx.currentTime;
  fader.gain.cancelScheduledValues(now);
  fader.gain.setValueAtTime(fader.gain.value, now);
  fader.gain.linearRampToValueAtTime(0, now + seconds);
  source.stop(now + seconds + 0.05);
}

function start(tune: Tune) {
  load(tuneUrl(tune)).then(
    (buffer) => {
      // Something else may have been asked for while this was on its way.
      if (muted || wanted !== tune || playing?.tune === tune) return;
      try {
        const out = output();
        fadeOut(0.3);
        const { from, length } = manifest.music[tune];
        const source = out.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = from;
        source.loopEnd = from + length;
        const fader = out.createGain();
        fader.gain.setValueAtTime(0, out.currentTime);
        fader.gain.linearRampToValueAtTime(1, out.currentTime + 0.04);
        source.connect(fader).connect(musicBus!);
        source.start();
        playing = { tune, source, fader };
      } catch {
        // No audio device, or the browser refused: silence is fine.
      }
    },
    () => undefined,
  );
}

export const music = {
  /** Plays a tune, in a loop, in place of whatever was playing. */
  play(tune: Tune) {
    wanted = tune;
    if (!muted && typeof window !== "undefined") start(tune);
  },
  stop(seconds = 0.5) {
    wanted = null;
    fadeOut(seconds);
  },
  /** Fetches tunes ahead of time, so that they start on the beat. */
  preload(...tunes: Tune[]) {
    if (muted || typeof window === "undefined") return;
    for (const tune of tunes) load(tuneUrl(tune)).catch(() => undefined);
  },
};

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window === "undefined") return;
  if (muted) {
    fadeOut(0.1);
    return;
  }
  load(EFFECTS).catch(() => undefined);
  if (wanted) start(wanted);
}

if (typeof window !== "undefined") {
  // Browsers only let sound start from a click or a key: open the speaker on
  // the first one, so that nothing after it is refused.
  const wake = () => {
    if (!muted) output();
  };
  window.addEventListener("pointerdown", wake);
  window.addEventListener("keydown", wake);
  // A hidden tab is a silent tab.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (!muted) void ctx.resume();
  });
}
