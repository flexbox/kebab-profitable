// Kebab Profitable: every sound and every piece of music, as code.
//
// Rendered with chirp (https://github.com/uilianks/chirp). `pnpm audio` builds
// this file and copies what the game plays into public/audio.
//
// The effects are one family: square and triangle waves, a little noise for
// the attack of anything that hits. The music is three loops in E minor and
// its relative major, so one can follow another without a jolt.

// ---------------------------------------------------------------------------
// Sound effects
// ---------------------------------------------------------------------------

// An ordinary move: a short tick, high and dry.
sfx("click", { vol: 0.5 },
  tone({ wave: "square", duty: 0.25, freq: "A5", to: "E6", slide: 0.02, dur: 0.03, env: [0.001, 0.025, 0.2, 0.03] }),
  noise({ dur: 0.01, env: [0.001, 0.01, 0, 0.01], filter: { type: "hp", cutoff: 6000 }, vol: 0.25 }))

// A new customer: the till. A knock, then two bright notes, the second ringing.
sfx("coin", { vol: 0.5 },
  noise({ dur: 0.02, env: [0.001, 0.02, 0, 0.02], filter: { type: "bp", cutoff: 3000, q: 1 }, vol: 0.4 }),
  tone({ wave: "square", duty: 0.25, freq: "B5", dur: 0.06, env: [0.001, 0.02, 0.6, 0.02] }),
  at(0.065, tone({ wave: "square", duty: 0.25, freq: "E6", dur: 0.2, env: [0.001, 0.06, 0.5, 0.22] })),
  at(0.065, tone({ wave: "fm", fm: { ratio: 3.5, index: 3, decay: 0.2 }, freq: "E7", dur: 0.15, env: [0.001, 0.1, 0.2, 0.2], vol: 0.25 })))

// Lunch: two bites, crisp on top, a thump underneath.
sfx("bite", { vol: 0.6 },
  [0, 0.11].map((t, i) => at(t,
    noise({ dur: 0.05, env: [0.001, 0.05, 0, 0.03], filter: { type: "bp", from: 2600 - i * 400, to: 900, q: 1.2 }, vol: 0.7 }),
    tone({ wave: "triangle", freq: 170 - i * 30, to: 90, dur: 0.06, env: [0.001, 0.06, 0, 0.03], vol: 0.6 }))))

// The day is over: two soft bells, falling.
sfx("night", { vol: 0.5, fx: [reverb({ size: 0.35, mix: 0.18 })] },
  tone({ wave: "fm", fm: { ratio: 2, index: 1.5, decay: 0.3 }, freq: "G5", dur: 0.14, env: [0.003, 0.2, 0.3, 0.3] }),
  at(0.16, tone({ wave: "fm", fm: { ratio: 2, index: 1.5, decay: 0.3 }, freq: "D5", dur: 0.3, env: [0.003, 0.3, 0.3, 0.5] })))

// A card lands on the table: the flick of the paper, then two rising notes.
sfx("card", { vol: 0.5 },
  noise({ dur: 0.06, env: [0.002, 0.06, 0, 0.03], filter: { type: "hp", from: 2000, to: 7000 }, vol: 0.35 }),
  at(0.02, tone({ wave: "triangle", freq: "E5", dur: 0.06, env: [0.002, 0.04, 0.5, 0.04] })),
  at(0.08, tone({ wave: "triangle", freq: "A5", dur: 0.1, env: [0.002, 0.06, 0.5, 0.1] })))

// Something urgent: an alarm, two beeps and a higher one, a little rough.
sfx("alarm", { vol: 0.42, fx: [drive({ amount: 1.4 })] },
  [0, 0.11].map((t) => at(t, tone({ wave: "square", duty: 0.5, freq: "D6", dur: 0.07, env: [0.001, 0.01, 0.9, 0.02] }))),
  at(0.22, tone({ wave: "square", duty: 0.5, freq: "G6", dur: 0.16, env: [0.001, 0.02, 0.9, 0.05], vibrato: { rate: 18, depth: 0.3 } })))

// One of the last seconds on the clock: a wood block.
sfx("tick", { vol: 0.5 },
  tone({ wave: "triangle", freq: 1400, to: 900, dur: 0.03, env: [0.001, 0.03, 0, 0.02] }),
  noise({ dur: 0.008, env: [0.001, 0.008, 0, 0.005], filter: { type: "bp", cutoff: 2500, q: 2 }, vol: 0.3 }))

// A setback: two notes falling a tritone, the second sagging.
sfx("bad", { vol: 0.5 },
  tone({ wave: "saw", freq: "A3", dur: 0.12, env: [0.003, 0.05, 0.7, 0.03], filter: { type: "lp", cutoff: 1800 } }),
  at(0.13, tone({ wave: "saw", freq: "D#3", to: "D3", slide: 0.25, dur: 0.26, env: [0.003, 0.1, 0.6, 0.15], filter: { type: "lp", from: 1800, to: 500 } })))

// Kebab profitable: four notes up a major chord, the last held under a sparkle.
sfx("win", { vol: 0.4, fx: [reverb({ size: 0.3, mix: 0.12 })] },
  [["G4", 0], ["C5", 0.1], ["E5", 0.2], ["G5", 0.3]].map(([note, t]) =>
    at(t, tone({ wave: "square", duty: 0.25, freq: note, dur: 0.09, env: [0.002, 0.03, 0.7, 0.03] }))),
  at(0.4,
    tone({ wave: "square", duty: 0.25, freq: "C6", dur: 0.5, env: [0.002, 0.1, 0.7, 0.3], vibrato: { rate: 6, depth: 0.2, delay: 0.15 } }),
    tone({ wave: "triangle", freq: "E5", dur: 0.5, env: [0.002, 0.1, 0.7, 0.3], vol: 0.6 }),
    tone({ wave: "triangle", freq: "C3", dur: 0.5, env: [0.002, 0.1, 0.8, 0.3], vol: 0.8 })),
  at(0.45, tone({ wave: "fm", fm: { ratio: 3.5, index: 3, decay: 0.3 }, freq: "C7", dur: 0.4, arp: { notes: [0, 4, 7, 12], rate: 0.06 }, env: [0.001, 0.2, 0.3, 0.3], vol: 0.2 })))

// Back to the day job: three steps down, and a long last note.
sfx("lose", { vol: 0.45, fx: [reverb({ size: 0.35, mix: 0.15 })] },
  [["E5", 0], ["D5", 0.2], ["C5", 0.4]].map(([note, t]) =>
    at(t, tone({ wave: "triangle", freq: note, dur: 0.17, env: [0.004, 0.05, 0.7, 0.05] }))),
  at(0.6,
    tone({ wave: "triangle", freq: "A4", dur: 0.6, env: [0.004, 0.2, 0.6, 0.5], vibrato: { rate: 5, depth: 0.2, delay: 0.2 } }),
    tone({ wave: "sine", freq: "A2", dur: 0.6, env: [0.004, 0.2, 0.7, 0.5], vol: 0.8 })))

// A founder is chosen: a quick run up a major chord, and off you go.
sfx("pick", { vol: 0.45, fx: [reverb({ size: 0.25, mix: 0.1 })] },
  tone({ wave: "square", duty: 0.25, freq: "G4", dur: 0.36, arp: { notes: [0, 4, 7, 12, 16, 19], rate: 0.05 }, env: [0.002, 0.1, 0.7, 0.15] }),
  at(0.3, tone({ wave: "triangle", freq: "G5", dur: 0.25, env: [0.002, 0.1, 0.6, 0.25], vol: 0.6 })))

// One letter of a caption. Three pitches, so the typing does not drone.
for (const [name, note] of [["type_1", "C7"], ["type_2", "D7"], ["type_3", "B6"]]) {
  sfx(name, { vol: 0.22 }, tone({ wave: "square", duty: 0.125, freq: note, dur: 0.012, env: [0.001, 0.012, 0.2, 0.015] }))
}

// One letter of Chef's: lower, and rougher.
for (const [name, note] of [["talk_1", "F#3"], ["talk_2", "A3"], ["talk_3", "E3"]]) {
  sfx(name, { vol: 0.4 }, tone({ wave: "saw", freq: note, dur: 0.035, env: [0.002, 0.03, 0.4, 0.03], filter: { type: "lp", cutoff: 1400 } }))
}

// Chef lands in front of you: a crack, and the floor answering.
sfx("slam", { vol: 0.65, fx: [crush({ bits: 9, rate: 16000 }), drive({ amount: 1.5 })] },
  noise({ color: "brown", dur: 0.3, env: [0.001, 0.15, 0.3, 0.4], filter: { type: "lp", from: 5000, to: 200 } }),
  noise({ dur: 0.03, env: [0.001, 0.03, 0, 0.02], filter: { type: "hp", cutoff: 3000 }, vol: 0.5 }),
  tone({ wave: "sine", freq: 120, to: 38, dur: 0.35, env: [0.001, 0.2, 0.4, 0.3], vol: 0.9 }))

// The dare: a power chord on E, struck hard, with a cymbal over it. It is in
// the key of the music it lands on.
sfx("dare", { vol: 0.5, fx: [drive({ amount: 1.8 }), reverb({ size: 0.3, mix: 0.12 })] },
  ["E2", "B2", "E3", "B3"].map((note) =>
    tone({ wave: "saw", freq: note, dur: 0.45, env: [0.002, 0.2, 0.5, 0.3], vol: 0.4, filter: { type: "lp", from: 4000, to: 900 } })),
  noise({ dur: 0.4, env: [0.001, 0.25, 0.15, 0.35], filter: { type: "hp", cutoff: 6000 }, vol: 0.35 }),
  tone({ wave: "sine", freq: 80, to: 40, dur: 0.3, env: [0.001, 0.2, 0.3, 0.2], vol: 0.8 }))

// One file for all of them, each with a little silence after it.
bank("sfx", ["click", "coin", "bite", "night", "card", "alarm", "tick", "bad", "win", "lose", "pick", "type_*", "talk_*", "slam", "dare"], { gap: 0.15 })

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

/** A line of music from [note, steps] pairs; a null note is a rest. Sixteen steps make a bar. */
const line = (...notes) =>
  notes.map(([note, steps]) => [note ?? ".", ...Array(steps - 1).fill(note ? "-" : ".")].join(" ")).join(" ")
/** Bars, one after another. */
const bars = (...list) => list.join(" | ")
/** The same bar, several times. */
const times = (n, bar) => Array(n).fill(bar).join(" | ")

// The lead: a saw with a square under it, and vibrato once a note is held.
inst("lead", (freq, dur) => [
  tone({ wave: "saw", freq, dur, env: [0.004, 0.08, 0.75, 0.07], vol: 0.34, vibrato: { rate: 6, depth: 0.18, delay: 0.18 }, filter: { type: "lp", cutoff: 5200 } }),
  tone({ wave: "square", duty: 0.25, freq, dur, env: [0.004, 0.08, 0.6, 0.07], vol: 0.18, vibrato: { rate: 6, depth: 0.18, delay: 0.18 } }),
])
// The same tune, alone and far away, for the walk home.
inst("lonely", { wave: "square", duty: 0.5, env: [0.02, 0.15, 0.6, 0.25], vol: 0.21, vibrato: { rate: 5, depth: 0.15, delay: 0.3 }, filter: { type: "lp", cutoff: 3000 } })
inst("bass", (freq, dur) => [
  tone({ wave: "triangle", freq, dur, env: [0.002, 0.05, 0.8, 0.03], vol: 0.36 }),
  tone({ wave: "square", duty: 0.5, freq, dur, env: [0.002, 0.04, 0.5, 0.03], vol: 0.08, filter: { type: "lp", cutoff: 700 } }),
])
// Power chords, muted with the palm: short, and dark.
inst("chug", { wave: "saw", env: [0.002, 0.05, 0.45, 0.03], vol: 0.15, filter: { type: "lp", cutoff: 1500 } })
inst("arp", { wave: "square", duty: 0.125, env: [0.002, 0.04, 0.3, 0.04], vol: 0.09 })
inst("keys", { wave: "fm", fm: { ratio: 1, index: 1.6, decay: 0.5 }, env: [0.01, 0.6, 0.35, 0.6], vol: 0.18 })
inst("pluck", { wave: "triangle", env: [0.003, 0.12, 0.2, 0.15], vol: 0.24 })
inst("stab", { wave: "square", duty: 0.25, env: [0.002, 0.05, 0.3, 0.04], vol: 0.12 })
inst("bounce", { wave: "square", duty: 0.25, env: [0.003, 0.06, 0.55, 0.05], vol: 0.26, vibrato: { rate: 6, depth: 0.12, delay: 0.2 } })

/** For a chord: its bass note, its power chord, and four notes to run up and down. */
const HARMONY = {
  Em: { root: "E2", power: "E3+B3", run: ["E5", "G5", "B5", "G5"] },
  C: { root: "C2", power: "C3+G3", run: ["E5", "G5", "C6", "G5"] },
  D: { root: "D2", power: "D3+A3", run: ["F#5", "A5", "D6", "A5"] },
  B: { root: "B1", power: "B2+F#3", run: ["F#5", "B5", "D#6", "B5"] },
  Am: { root: "A1", power: "A2+E3", run: ["E5", "A5", "C6", "A5"] },
  G: { root: "G1", power: "G2+D3", run: ["D5", "G5", "B5", "G5"] },
}
/** The bass at a gallop: a quaver and two semiquavers on every beat. */
const gallop = (name) => times(4, `${HARMONY[name].root} . ${HARMONY[name].root} ${HARMONY[name].root}`).replaceAll(" | ", " ")
/** Power chords on the quavers, the first of each beat struck harder. */
const chugging = (name) => times(4, `${HARMONY[name].power}! . ${HARMONY[name].power} .`).replaceAll(" | ", " ")
const running = (name) => times(4, HARMONY[name].run.join(" ")).replaceAll(" | ", " ")

// --- The dare: Chef comes in, and the band with him ---------------------------
//
// Sixteen bars at 160: eight that state the tune over E minor, C and D, eight
// that climb, and a bar of B major to throw it back to the top.
const DARE = ["Em", "Em", "C", "D", "Em", "Em", "C", "B", "C", "D", "Em", "Em", "C", "D", "B", "B"]
const dareTune = bars(
  line(["B4", 2], ["E5", 4], ["F#5", 2], ["G5", 4], ["F#5", 2], ["E5", 2]),
  line(["B5", 6], ["A5", 2], ["G5", 4], ["F#5", 2], ["G5", 2]),
  line(["C6", 6], ["B5", 2], ["G5", 4], ["E5", 2], ["G5", 2]),
  line(["A5", 6], ["F#5", 2], ["D5", 4], ["F#5", 2], ["A5", 2]),
  line(["B4", 2], ["E5", 4], ["F#5", 2], ["G5", 4], ["B5", 2], ["A5", 2]),
  line(["G5", 6], ["F#5", 2], ["E5", 4], ["D5", 2], ["E5", 2]),
  line(["E5", 4], ["G5", 2], ["C6", 6], ["B5", 2], ["A5", 2]),
  line(["B5", 8], ["F#5", 2], ["A5", 2], ["B5", 2], ["D#6", 2]),
  line(["E6", 6], ["D6", 2], ["C6", 4], ["G5", 2], ["C6", 2]),
  line(["D6", 6], ["C6", 2], ["A5", 4], ["F#5", 2], ["A5", 2]),
  line(["B5", 4], ["G5", 2], ["E5", 2], ["G5", 2], ["B5", 2], ["E6", 4]),
  line(["E6", 8], [null, 2], ["B5", 2], ["D6", 2], ["E6", 2]),
  line(["C6", 4], ["E6", 4], ["D6", 2], ["C6", 2], ["B5", 2], ["C6", 2]),
  line(["A5", 4], ["D6", 4], ["C6", 2], ["B5", 2], ["A5", 2], ["F#5", 2]),
  line(["B5", 6], ["A5", 2], ["F#5", 4], ["D#5", 2], ["F#5", 2]),
  line(["B5", 4], ["A5", 2], ["F#5", 2], ["D#5", 4], [null, 4]),
)
const rock = "x . . . . . x . x . . . . . x ."
const backbeat = ". . . . x . . . . . . . x . . ."
const fill = ". . . . x . . . x . x . x x x x"
song("intro_dare", { bpm: 160, vol: 0.8, fx: [chorus({ mix: 0.2 }), reverb({ size: 0.35, mix: 0.1 }), limiter({ ceiling: 0.8 })] },
  track("lead", dareTune),
  track("bass", DARE.map(gallop).join(" | ")),
  track("chug", DARE.map(chugging).join(" | "), { pan: -0.25 }),
  track("arp", DARE.map(running).join(" | "), { pan: 0.35 }),
  track("kick", bars(times(7, rock), "x . . . . . x . x . x . . . . .", times(7, rock), "x . . . . . x . x . x . . . . ."), { vol: 0.85 }),
  track("snare", bars(times(7, backbeat), fill, times(7, backbeat), fill)),
  track("hat", times(16, "x . x . x . x . x . x . x . x ."), { vol: 1.1 }),
  track("openhat", bars("x . . . . . . . . . . . . . . .", times(7, ". . . . . . . . . . . . . . . ."), "x . . . . . . . . . . . . . . .", times(7, ". . . . . . . . . . . . . . . ."))),
  track("tom", bars(times(7, ". . . . . . . . . . . . . . . ."), ". . . . . . . . . . . . . . x x", times(7, ". . . . . . . . . . . . . . . ."), ". . . . . . . . . . x . . . x x")))

// --- The walk home: the same tune, slowly, in the rain ------------------------
//
// The same tempo, felt at half speed, so that the dare can cut in on any beat:
// a piano holding each chord for two bars, a bass like a pulse, the tune alone.
const WALK = ["Em", "C", "Am", "B", "Em", "C", "Am", "B"]
const TRIADS = { Em: chord("Em", 3), C: chord("C", 3), Am: chord("Am", 3), B: chord("B", 2) }
const held = (token) => line([token, 32])
const walkTune = bars(
  line(["B4", 4], ["E5", 8], ["F#5", 4]), line(["G5", 8], ["F#5", 4], ["E5", 4]),
  line(["E5", 4], ["G5", 8], ["E5", 4]), line(["C5", 8], ["D5", 4], ["E5", 4]),
  line(["A4", 4], ["C5", 8], ["E5", 4]), line(["A5", 8], ["G5", 4], ["E5", 4]),
  line(["F#5", 12], ["D#5", 4]), line(["B4", 8], [null, 8]),
  line(["B4", 4], ["E5", 8], ["G5", 4]), line(["B5", 8], ["A5", 4], ["G5", 4]),
  line(["G5", 4], ["E5", 8], ["G5", 4]), line(["C6", 8], ["B5", 4], ["G5", 4]),
  line(["A5", 4], ["E5", 8], ["C5", 4]), line(["E5", 8], ["F#5", 4], ["G5", 4]),
  line(["F#5", 8], ["A5", 8]), line(["B5", 12], [null, 4]),
)
const pulse = (name) => times(4, line([HARMONY[name].root, 6], [null, 2])).replaceAll(" | ", " ")
const drops = (name) => {
  const [a, b, c] = HARMONY[name].run
  return times(2, [a, ".", b, ".", c, ".", b, ".", a, ".", b, ".", c, ".", b, "."].join(" "))
}
song("intro_walk", { bpm: 160, vol: 0.8, fx: [chorus({ mix: 0.3 }), reverb({ size: 0.75, mix: 0.3 }), limiter({ ceiling: 0.8 })] },
  track("lonely", walkTune),
  track("keys", WALK.map((name) => held(TRIADS[name])).join(" | ")),
  track("bass", WALK.map(pulse).join(" | "), { vol: 0.8 }),
  track("pluck", WALK.map(drops).join(" | "), { transpose: -12, pan: 0.3, vol: 0.7 }),
  track("kick", times(16, "x . . . . . . . . . . . . . . ."), { vol: 0.7 }),
  track("hat", bars(times(8, ". . . . . . . . x . . . . . . ."), times(8, ". . . . x . . . x . . . x . . .")), { vol: 0.6 }),
  track("snare", bars(times(8, ". . . . . . . . . . . . . . . ."), times(7, ". . . . . . . . x . . . . . . ."), ". . . . . . . . x . . . x . x x"), { vol: 0.7 }))

// --- Choosing a founder: lighter, and it bounces -------------------------------
//
// Eight bars at 126 in G major, the relative of everything before it: C, D,
// E minor and G, a bass that skips, chords off the beat, a tune you can hum.
const SELECT = ["C", "D", "Em", "G", "C", "D", "Em", "Em"]
const skipping = (name) => {
  const low = HARMONY[name].root
  const [, fifth] = HARMONY[name].power.split("+")
  const high = low.replace(/\d/, (n) => String(Number(n) + 1))
  return `${low} . . ${low} . . ${high} . ${low} . . ${low} . ${fifth} . .`
}
const CHORDS = { C: chord("C", 4), D: chord("D", 4), Em: chord("Em", 4), G: chord("G", 4) }
const offbeat = (name) => `. . ${CHORDS[name]} . . . ${CHORDS[name]} . . . ${CHORDS[name]} . . ${CHORDS[name]} . .`
const selectTune = bars(
  line(["E5", 2], ["G5", 2], [null, 1], ["E5", 1], ["G5", 2], ["A5", 2], ["G5", 2], ["E5", 2], [null, 2]),
  line(["F#5", 2], ["A5", 2], [null, 1], ["F#5", 1], ["A5", 2], ["B5", 2], ["A5", 2], ["F#5", 2], [null, 2]),
  line(["G5", 2], ["B5", 2], [null, 1], ["G5", 1], ["B5", 2], ["D6", 2], ["B5", 2], ["G5", 2], ["E5", 2]),
  line(["D6", 4], ["B5", 2], ["G5", 2], ["A5", 2], ["B5", 2], ["D6", 2], [null, 2]),
  line(["E6", 2], ["D6", 2], ["C6", 2], ["G5", 2], ["E5", 2], ["G5", 2], ["C6", 4]),
  line(["D6", 2], ["C6", 2], ["A5", 2], ["F#5", 2], ["D5", 2], ["F#5", 2], ["A5", 4]),
  line(["B5", 2], ["A5", 2], ["G5", 2], ["E5", 2], ["G5", 2], ["A5", 2], ["B5", 4]),
  line(["E5", 4], [null, 2], ["B4", 2], ["D5", 2], ["E5", 2], ["G5", 2], ["B5", 2]),
)
song("select", { bpm: 126, vol: 0.8, fx: [chorus({ mix: 0.2 }), reverb({ size: 0.4, mix: 0.14 }), limiter({ ceiling: 0.8 })] },
  track("bounce", selectTune),
  track("bass", SELECT.map(skipping).join(" | ")),
  track("stab", SELECT.map(offbeat).join(" | "), { pan: -0.3, gate: 0.6 }),
  track("arp", SELECT.map(running).join(" | "), { pan: 0.4, vol: 0.7 }),
  track("kick", times(8, "x . . . x . . . x . . . x . . ."), { vol: 0.8 }),
  track("clap", times(8, ". . . . x . . . . . . . x . . ."), { vol: 2.2 }),
  track("hat", times(8, "x . x x x . x x x . x x x . x x"), { vol: 0.85 }),
  track("openhat", bars(times(7, ". . . . . . . . . . . . . . x ."), ". . . . . . x . . . . . . . x ."), { vol: 0.6 }))
