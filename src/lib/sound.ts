/** A handful of sound effects synthesised with the Web Audio API. */
type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number };

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function play(notes: Note[]) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = n.type ?? "square";
      osc.frequency.setValueAtTime(n.freq, now + n.at);
      amp.gain.setValueAtTime(0, now + n.at);
      amp.gain.linearRampToValueAtTime(n.gain ?? 0.06, now + n.at + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(now + n.at);
      osc.stop(now + n.at + n.dur + 0.02);
    }
  } catch {
    // No audio device, or the browser refused: silence is fine.
  }
}

export const sfx = {
  click: () => play([{ freq: 520, at: 0, dur: 0.05, gain: 0.035 }]),
  /** A new customer: the cash register everyone waits for. */
  coin: () =>
    play([
      { freq: 988, at: 0, dur: 0.08 },
      { freq: 1319, at: 0.07, dur: 0.22 },
    ]),
  bite: () =>
    play([
      { freq: 180, at: 0, dur: 0.06, type: "sawtooth" },
      { freq: 140, at: 0.08, dur: 0.07, type: "sawtooth" },
    ]),
  night: () =>
    play([
      { freq: 392, at: 0, dur: 0.12, type: "triangle" },
      { freq: 294, at: 0.1, dur: 0.2, type: "triangle" },
    ]),
  card: () =>
    play([
      { freq: 660, at: 0, dur: 0.06, type: "triangle" },
      { freq: 880, at: 0.06, dur: 0.1, type: "triangle" },
    ]),
  /** Something urgent: three quick beeps. */
  alarm: () =>
    play([
      { freq: 1175, at: 0, dur: 0.07, gain: 0.05 },
      { freq: 1175, at: 0.11, dur: 0.07, gain: 0.05 },
      { freq: 1568, at: 0.22, dur: 0.14, gain: 0.05 },
    ]),
  /** One of the last seconds on the clock. */
  tick: () => play([{ freq: 880, at: 0, dur: 0.04, type: "triangle", gain: 0.05 }]),
  bad: () =>
    play([
      { freq: 220, at: 0, dur: 0.12, type: "sawtooth", gain: 0.05 },
      { freq: 165, at: 0.1, dur: 0.22, type: "sawtooth", gain: 0.05 },
    ]),
  win: () =>
    play([
      { freq: 523, at: 0, dur: 0.12 },
      { freq: 659, at: 0.12, dur: 0.12 },
      { freq: 784, at: 0.24, dur: 0.12 },
      { freq: 1047, at: 0.36, dur: 0.4 },
    ]),
  /** One letter of the intro's captions, then one of Chef's: lower, and rougher. */
  type: () => play([{ freq: 1320, at: 0, dur: 0.025, gain: 0.016 }]),
  talk: () => play([{ freq: 185, at: 0, dur: 0.045, gain: 0.03 }]),
  /** Chef lands in front of you. */
  slam: () =>
    play([
      { freq: 110, at: 0, dur: 0.16, type: "sawtooth", gain: 0.07 },
      { freq: 55, at: 0.03, dur: 0.4, type: "triangle", gain: 0.1 },
    ]),
  /** The dare: four notes going up, and the last one held. */
  dare: () =>
    play([
      { freq: 220, at: 0, dur: 0.12, type: "sawtooth", gain: 0.045 },
      { freq: 262, at: 0.12, dur: 0.12, type: "sawtooth", gain: 0.045 },
      { freq: 330, at: 0.24, dur: 0.12, type: "sawtooth", gain: 0.045 },
      { freq: 440, at: 0.36, dur: 0.55, type: "sawtooth", gain: 0.05 },
    ]),
  lose: () =>
    play([
      { freq: 392, at: 0, dur: 0.18, type: "triangle" },
      { freq: 330, at: 0.18, dur: 0.18, type: "triangle" },
      { freq: 262, at: 0.36, dur: 0.5, type: "triangle" },
    ]),
};
