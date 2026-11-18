// The apéro: the back room of the bar, one long table, and everyone at it.
//
// Included at the end of kebab.px.js, whose colours, painter and people it
// uses. The room is seen like the flat: from three-quarters above, the back
// wall facing you. One row sits behind the table and faces you, the other
// sits in front of it with its back to you, and the founder stands at the
// head of the table, on the left.
//
// Everything here is painted in the light of a lamp, the one grade the bar
// needs: the founder's own sprites already exist in it.

const BAR_FLOOR = 48
/** The top of the table. Its front edge hangs four rows below. */
const BAR_TABLE = { x: 32, y: 68, w: 148, h: 22 }
/** The projector screen, and the picture on it. */
const BAR_SCREEN = { x: 70, y: 6, w: 56, h: 30 }
const MATCH = { w: 54, h: 26 }

const BC = {
  plaster: "#8dbba6",
  plasterDark: "#75a391",
  wedge: "#c9573c",
  stripe: "#eadfc0",
  concrete: "#8f918c",
  plank: "#b9aa90",
  plankDark: "#a39479",
  plankLight: "#cabca2",
  boards: ["#586c80", "#607589", "#506377", "#5b7084"],
  boardSeam: "#35465a",
  table: "#c8a676",
  bench: "#8a6a48",
  slate: "#2c3835",
  chalk: "#e8e4d4",
  napkinBlue: "#5f83c8",
  beer: "#e9a63a",
  beerLight: "#f6cf6a",
  pitchA: "#3f9a4c",
  pitchB: "#4aa858",
  pitchLine: "#d8f0d0",
}

// ---------------------------------------------------------------------------
// The match on the screen
// ---------------------------------------------------------------------------

// The derby, of course. Eleven a side would be a crowd at this size: five
// each, drifting about, and the ball going from one foot to the next.
const MATCH_HOME = [[10, 15], [20, 11], [22, 20], [33, 14], [41, 19]]
const MATCH_AWAY = [[14, 19], [25, 15], [31, 21], [38, 11], [46, 15]]
const MATCH_PASSES = [[20, 12], [33, 15], [41, 20], [33, 15]]
for (let f = 0; f < 4; f++) {
  sprite(`bar_match_${f}`, { w: MATCH.w, h: MATCH.h }, (c) => {
    for (let x = 0; x < MATCH.w; x++) c.rect(x, 0, 1, MATCH.h, Math.floor(x / 6) % 2 ? BC.pitchA : BC.pitchB)
    // The lines: touchlines, halfway, the centre circle, and a box at each end.
    c.box(1, 8, MATCH.w - 2, MATCH.h - 9, BC.pitchLine)
    c.vline(27, 8, MATCH.h - 9, BC.pitchLine)
    c.ring(27, 16, 3, BC.pitchLine)
    c.box(1, 12, 5, 9, BC.pitchLine)
    c.box(MATCH.w - 6, 12, 5, 9, BC.pitchLine)
    // The score, across the top.
    c.rect(0, 0, MATCH.w, 7, "#1c2438")
    c.text(3, 1, "LIL 1-0 LEN", "#f4eedd")
    c.rect(49, 2, 2, 3, "#e0483f")
    const drift = (i, k) => Math.round(Math.sin(((f + i * 1.7) / 4) * Math.PI * 2 + k) * 1.4)
    MATCH_HOME.forEach(([x, y], i) => {
      c.rect(x + drift(i, 0), y + drift(i, 2), 1, 2, "#e0483f")
      c.px(x + drift(i, 0), y + drift(i, 2) + 2, "#2a4a30")
    })
    MATCH_AWAY.forEach(([x, y], i) => {
      c.rect(x + drift(i, 1), y + drift(i, 3), 1, 2, "#f6c453")
      c.px(x + drift(i, 1), y + drift(i, 3) + 2, "#2a4a30")
    })
    const [bx, by] = MATCH_PASSES[f]
    c.px(bx + 1, by + 2, "#ffffff")
  })
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

/**
 * The long table: three of them pushed end to end, as the bar does when a
 * booking turns out to be twenty people. Painted with its top-left corner
 * at x, y, so the same pixels make the room and the piece the game lays
 * over the back row's knees.
 */
function paintBarTable(p, x, y) {
  const { w, h } = BAR_TABLE
  for (let t = 0; t < 3; t++) {
    const x0 = x + Math.round((t * w) / 3)
    const x1 = x + Math.round(((t + 1) * w) / 3)
    const tone = [BC.table, lighten(BC.table, 0.06), darken(BC.table, 0.05)][t]
    p.r(x0, y, x1 - x0, h, tone)
    // Planks along its length, each with a streak or two of grain.
    for (const [dy, i] of [[5, 0], [11, 1], [16, 2]]) {
      p.r(x0, y + dy, x1 - x0, 1, darken(tone, 0.16))
      const length = 12 + ((t * 7 + i * 5) % 9)
      p.r(x0 + 5 + ((t * 13 + i * 17) % (x1 - x0 - length - 8)), y + dy + 2, length, 1, darken(tone, 0.07))
    }
    p.r(x0 + 9 + t * 4, y + 2, 14, 1, darken(tone, 0.07))
    // The far edge catches the light; so does the near one, less.
    p.r(x0, y, x1 - x0, 1, lighten(tone, 0.22))
    p.r(x0, y + h - 1, x1 - x0, 1, lighten(tone, 0.08))
    // Where two tables meet.
    if (t > 0) p.r(x0, y, 1, h, darken(tone, 0.34))
  }
  // The front edge, in its own shade.
  p.r(x, y + h, w, 4, darken(BC.table, 0.3))
  p.r(x, y + h, w, 1, darken(BC.table, 0.2))
  p.r(x, y + h + 3, w, 1, rimOf(rgb(BC.table), C.ink, false))
  p.r(x, y, 1, h + 4, rimOf(rgb(BC.table), C.ink, true))
  p.r(x + w - 1, y, 1, h + 4, rimOf(rgb(BC.table), C.ink, false))

  // What is on it and does not move: napkins in the bar's blue check, with a
  // fork on each, carafes of water, and the phones nobody is looking at.
  for (const dx of [5, 41, 77, 113]) {
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 7; i++) p.r(x + dx + i, y + 9 + j, 1, 1, (i + j) % 2 ? BC.napkinBlue : C.white)
    }
    p.r(x + dx + 1, y + 10, 5, 1, C.steelLight)
    p.dim(x + dx, y + 13, 7, 1, 0.16)
  }
  for (const dx of [27, 99]) {
    // A carafe: clear glass, the water line, and a glint down one side.
    p.box(x + dx, y + 8, 3, 6, "#b9d2d8")
    p.r(x + dx, y + 6, 3, 2, "#d6e6e8")
    p.r(x + dx + 1, y + 5, 1, 1, "#d6e6e8")
    p.r(x + dx, y + 8, 1, 5, "#eef6f4")
    p.dim(x + dx, y + 14, 4, 1, 0.16)
  }
  for (const [dx, dy] of [[19, 9], [63, 10], [91, 9], [135, 10]]) {
    p.box(x + dx, y + dy, 3, 4, "#2b2f3a")
    p.r(x + dx, y + dy, 2, 1, "#4a5568")
  }
}

function paintBar(c) {
  const tint = grader("lamp")
  const p = painter(c, tint)

  // The floor: boards painted blue a long time ago, laid across the room.
  for (let k = 0; BAR_FLOOR + k * 6 < BOTTOM; k++) {
    const y = BAR_FLOOR + k * 6
    const h = Math.min(6, BOTTOM - y)
    const joints = []
    for (let x = LEFT + 14 + ((k * 31) % 43); x < RIGHT; x += 49) joints.push(x)
    const ends = [LEFT, ...joints, RIGHT]
    for (let b = 0; b + 1 < ends.length; b++) {
      const tone = BC.boards[(k * 3 + b * 5 + 1) % BC.boards.length]
      p.r(ends[b], y, ends[b + 1] - ends[b], h, tone)
      p.r(ends[b], y + 1, ends[b + 1] - ends[b], 1, lighten(tone, 0.1))
      // Where the paint has worn through to the wood, along the board.
      const length = 5 + ((k * 11 + b * 7) % 8)
      const room = ends[b + 1] - ends[b] - length - 8
      if (room > 0 && h > 3 && (k + b) % 2 === 0) {
        p.r(ends[b] + 4 + ((k * 29 + b * 17) % room), y + 3, length, 1, "#8a7a66")
      }
    }
    p.r(LEFT, y, RIGHT - LEFT, 1, BC.boardSeam)
    for (const x of joints) p.r(x, y + 1, 1, h - 1, BC.boardSeam)
  }

  // The back wall. Plaster above: green, with a wedge of red coming down
  // from the corner and a cream stripe along its edge.
  p.r(LEFT, WALL_Y, RIGHT - LEFT, 24, BC.plaster)
  c.poly([LEFT, WALL_Y, 54, WALL_Y, LEFT, WALL_Y + 24], tint(BC.wedge))
  c.poly([54, WALL_Y, 60, WALL_Y, LEFT, WALL_Y + 27, LEFT, WALL_Y + 24], tint(BC.stripe))
  p.r(LEFT, WALL_Y + 24, 60, 1, BC.plasterDark)

  // Boards below, up to a rail. Each has its own tone and a shaded joint.
  const planks = [BC.plank, BC.plankLight, BC.plank, BC.plankDark, lighten(BC.plank, 0.05)]
  for (let k = 0; LEFT + k * 6 < RIGHT; k++) {
    const x = LEFT + k * 6
    const w = Math.min(6, RIGHT - x)
    const tone = planks[(k * 3 + 1) % planks.length]
    p.r(x, 28, w, BAR_FLOOR - 28, tone)
    p.r(x, 28, 1, BAR_FLOOR - 28, darken(tone, 0.22))
    p.r(x + 1, 28, 1, BAR_FLOOR - 28, lighten(tone, 0.1))
    // A knot now and then.
    if (k % 4 === 1) p.r(x + 3, 33 + ((k * 5) % 9), 1, 2, darken(tone, 0.2))
  }
  p.r(LEFT, 27, RIGHT - LEFT, 1, C.woodLight)
  p.r(LEFT, 28, RIGHT - LEFT, 1, C.wood)
  p.dim(LEFT, 29, RIGHT - LEFT, 1, 0.22)
  p.r(LEFT, BAR_FLOOR - 2, RIGHT - LEFT, 1, C.woodDark)
  p.r(LEFT, BAR_FLOOR - 1, RIGHT - LEFT, 1, C.ink)

  // A concrete post, to the left of the screen: round, so lit down one side.
  p.strips(61, WALL_Y, BAR_FLOOR - WALL_Y - 1, BC.concrete, [[1, 0.2], [2, 0.08], [2, 0], [1, -0.14], [1, -0.3]])

  // The slate, with tonight's booking in chalk.
  p.slab(137, 8, 37, 17, C.wood)
  p.r(138, 9, 35, 15, BC.slate)
  p.text(146, 11, "APERO", BC.chalk)
  p.text(140, 18, "IH LILLE", C.gold)
  p.dim(137, 26, 38, 1, 0.2)

  // The projector screen: its case under the ceiling, the cloth, and the
  // picture, which gives off its own light.
  const s = BAR_SCREEN
  p.box(s.x - 1, s.y - 2, s.w + 2, 2, C.steel)
  p.r(s.x - 1, s.y - 2, s.w + 2, 1, C.steelLight)
  p.box(s.x, s.y, s.w, s.h, C.white)
  p.r(s.x, s.y + s.h - 2, s.w, 2, C.whiteShade)
  c.stamp("bar_match_0", s.x + 1, s.y + 1)
  p.dim(s.x, s.y + s.h + 1, s.w + 1, 1, 0.24)
  p.dim(s.x + s.w + 1, s.y, 1, s.h + 1, 0.2)

  // The ceiling keeps the top of the wall in shade, and the corners are
  // darker than the middle.
  p.dim(LEFT, WALL_Y, s.x - LEFT - 1, 2, 0.26)
  p.dim(s.x + s.w + 1, WALL_Y, RIGHT - s.x - s.w - 1, 2, 0.26)
  p.dim(LEFT, WALL_Y + 2, s.x - LEFT - 1, 1, 0.26, 0.5)
  p.dim(s.x + s.w + 1, WALL_Y + 2, RIGHT - s.x - s.w - 1, 1, 0.26, 0.5)
  for (const [inset, amount] of [[0, 0.18], [2, 0.09]]) {
    p.dim(LEFT + inset, WALL_Y, 2, BOTTOM - WALL_Y, amount)
    p.dim(RIGHT - 2 - inset, WALL_Y, 2, BOTTOM - WALL_Y, amount)
    p.dim(LEFT + 4, BOTTOM - 2 - inset, RIGHT - LEFT - 8, 2, amount)
  }
  p.shadow(LEFT, BAR_FLOOR, RIGHT - LEFT, 3)

  // The bench behind the table, and the one in front: a plank on trestles.
  const t = BAR_TABLE
  p.box(t.x + 2, t.y - 8, t.w - 4, 5, BC.bench)
  p.r(t.x + 2, t.y - 8, t.w - 4, 1, lighten(BC.bench, 0.2))
  p.shadow(t.x + 2, t.y + t.h + 4, t.w - 2, 5)
  for (const x of [t.x + 3, t.x + t.w - 6]) p.box(x, t.y + t.h + 4, 3, 4, darken(BC.table, 0.36))
  p.shadow(t.x + 3, 113, t.w - 4, 4)
  for (const x of [t.x + 8, t.x + 52, t.x + 94, t.x + t.w - 11]) {
    p.box(x, 112, 3, 4, darken(BC.bench, 0.3))
    p.r(x, 112, 1, 4, BC.bench)
  }
  p.box(t.x + 2, 105, t.w - 4, 5, BC.bench)
  p.r(t.x + 2, 105, t.w - 4, 1, lighten(BC.bench, 0.2))
  p.r(t.x + 2, 109, t.w - 4, 1, darken(BC.bench, 0.2))
  p.r(t.x + 2, 110, t.w - 4, 2, darken(BC.bench, 0.34))
  p.r(t.x + 1, 112, t.w - 2, 1, tint(rimOf(rgb(BC.bench), C.ink, false)))

  paintBarTable(p, t.x, t.y)

  // The tops of the walls, cut through, as in the flat.
  p.r(0, 0, W, WALL_Y, C.wallTop)
  p.r(0, 0, LEFT, H, C.wallTop)
  p.r(RIGHT, 0, W - RIGHT, H, C.wallTop)
  p.r(0, BOTTOM, W, H - BOTTOM, C.wallTop)
  p.r(LEFT - 1, WALL_Y - 1, RIGHT - LEFT + 2, 1, C.wallTopEdge)
  p.r(LEFT - 1, WALL_Y - 1, 1, BOTTOM - WALL_Y + 2, C.wallTopEdge)
  p.r(RIGHT, WALL_Y - 1, 1, BOTTOM - WALL_Y + 2, C.wallTopEdge)
  p.r(LEFT - 1, BOTTOM, RIGHT - LEFT + 2, 1, C.wallTopEdge)
  p.r(LEFT, WALL_Y, 1, BOTTOM - WALL_Y, C.ink)
  p.r(RIGHT - 1, WALL_Y, 1, BOTTOM - WALL_Y, C.ink)
}

scene("bar", { w: W, h: H }, paintBar)
// The table again, on its own: the game lays it over the row sitting behind it.
sprite("bar_table", { w: BAR_TABLE.w, h: BAR_TABLE.h + 4 }, (c) => paintBarTable(painter(c, grader("lamp")), 0, 0))

// ---------------------------------------------------------------------------
// Everyone at the table
// ---------------------------------------------------------------------------

/** Someone sitting at the table, facing you: the standing figure down to the waist. */
const BAR_BUST = rows(FRONT).slice(0, 18).join("\n")

/** The arm on the right goes up and out, with a glass of beer at the end of it, clear of the head. */
const BAR_RAISED = [
  grid(12, 14, "__\n__\n__\n__"),
  grid(12, 7, "...H\n...C\n..CC\n..C.\n.CC.\nCC..\nC..."),
  grid(14, 3, "xxx\njJj\njJj\njjj"),
]
/** Eyes shut in a smile, mouth wide open: the face of a toast. */
const BAR_GRIN = [...gladEyes(0, 1), grid(5, 9, "MxxM\n.MM.")]

{
  const tint = grader("lamp")
  const base = Object.fromEntries(Object.entries(BODY).map(([key, h]) => [key, tint(h)]))
  const beer = { j: tint(BC.beer), J: tint(BC.beerLight) }

  // A glass of beer on the table, and the same glass in a founder's fist.
  pal({ ...base, ...beer })
  figure("bar_pint", { w: 3, h: 4 }, base.k, "xxx\njJj\njJj\njjj")

  // The members, with what they always wear. Any of them may be the founder,
  // who stands; the other four sit, two on each side.
  for (const [who, look] of Object.entries(PEOPLE)) {
    pal({
      ...base,
      ...beer,
      C: tint(look.shirt),
      c: tint(darken(look.shirt, 0.24)),
      D: tint(lighten(look.shirt, 0.22)),
      ...Object.fromEntries(Object.entries(look.wear).map(([key, h]) => [key, tint(h)])),
    })
    const cape = who === "christophe"
    const shades = who === "matthys"
    const front = [
      ...(cape ? [rect(1, 13, 12, 6, "r"), rect(1, 13, 12, 1, "R")] : []),
      clip([0, 0, 14, 19], stamp(`_${who}_front_lamp`, 0, 1)),
    ]
    const back = [stamp(`_${who}_back_lamp`, 0, 1), ...(cape ? [rect(2, 13, 10, 6, "r"), rect(3, 12, 8, 1, "R")] : [])]
    figure(`bar_${who}_f_0`, { w: 14, h: 19 }, base.k, ...front, ...props(who, false))
    figure(
      `bar_${who}_f_1`,
      { w: 17, h: 19 },
      base.k,
      ...front,
      ...(shades || cape ? [BAR_GRIN[2]] : BAR_GRIN),
      ...BAR_RAISED,
      ...props(who, false),
      ...(cape ? [grid(3, 7, ".k....k.\nkrk..krk")] : []),
    )
    figure(`bar_${who}_b_0`, { w: 14, h: 19 }, base.k, ...back, ...props(who, true))
    figure(`bar_${who}_b_1`, { w: 17, h: 19 }, base.k, ...back, ...BAR_RAISED, ...props(who, true))
  }

  // The rest of the table: nobody in particular, and a bit of everybody who
  // turns up. Black T-shirts, beards, one cap. Faces are the same yellow as
  // the members': nobody here is a likeness.
  const HAIR = { dark: "#3a2a22", black: "#2b2530", brown: "#5a3a24", blond: "#d8b060", ginger: "#b8602c", grey: "#8f8d8a" }
  const TEE = { black: "#3a3a44", white: "#e8e2d0", olive: "#7c7c5e", navy: "#34477a", sky: "#a9c4e0", grey: "#858d98", wine: "#8a3a48", green: "#4c8a5c" }
  const CROWD = {
    // Facing you, behind the table.
    c1: { view: "f", hair: HAIR.dark, shirt: TEE.black, beard: true },
    c2: { view: "f", hair: HAIR.brown, shirt: TEE.white, glasses: true },
    c3: { view: "f", bald: true, shirt: TEE.black, beard: HAIR.brown },
    c4: { view: "f", hair: HAIR.ginger, shirt: TEE.sky },
    c5: { view: "f", hair: HAIR.black, shirt: TEE.olive, beard: true },
    c6: { view: "f", hair: HAIR.blond, shirt: TEE.wine, long: true },
    // Their backs to you, in front of it.
    c7: { view: "b", hair: HAIR.dark, shirt: TEE.navy, cap: "#ece6d6" },
    c8: { view: "b", hair: HAIR.grey, shirt: TEE.sky },
    c9: { view: "b", hair: HAIR.black, shirt: TEE.black },
    c10: { view: "b", hair: HAIR.dark, shirt: TEE.green, long: true },
    c11: { view: "b", bald: true, shirt: TEE.grey },
    c12: { view: "b", hair: HAIR.blond, shirt: TEE.white },
  }
  for (const [id, look] of Object.entries(CROWD)) {
    const hair = look.bald ? [BODY.H, BODY.I, BODY.Y] : [look.hair, lighten(look.hair, 0.25), darken(look.hair, 0.3)]
    const beard = look.beard === true ? look.hair : look.beard
    pal({
      ...base,
      ...beer,
      K: tint(hair[0]),
      L: tint(hair[1]),
      Z: tint(hair[2]),
      C: tint(look.shirt),
      c: tint(darken(look.shirt, 0.24)),
      D: tint(lighten(look.shirt, 0.22)),
      ...(beard ? { B: tint(beard), F: tint(darken(beard, 0.25)) } : {}),
      ...(look.cap ? { y: tint(look.cap), w: tint(darken(look.cap, 0.2)) } : {}),
    })
    sprite(`_bar_${id}`, { mx: true }, look.view === "f" ? BAR_BUST : BACK)
    const body = [stamp(`_bar_${id}`, 0, 1)]
    let worn = []
    if (look.view === "f") {
      // The beard runs along the jaw and under the mouth.
      if (beard) body.push(rect(1, 9, 2, 1, "B"), rect(11, 9, 2, 1, "B"), rect(2, 10, 4, 1, "B"), rect(8, 10, 4, 1, "B"), rect(3, 11, 8, 1, "F"))
      // Long hair comes down over the shoulders.
      if (look.long) worn.push(rect(0, 5, 2, 7, "K"), rect(12, 5, 2, 7, "K"), rect(0, 12, 2, 2, "Z"), rect(12, 12, 2, 2, "Z"))
      if (look.glasses) worn.push(px(3, 7, "x"), px(5, 7, "x"), px(3, 8, "x"), px(5, 8, "x"), px(8, 7, "x"), px(10, 7, "x"), px(8, 8, "x"), px(10, 8, "x"), rect(6, 7, 2, 1, "s"), px(2, 7, "s"), px(11, 7, "s"))
    } else {
      if (look.long) worn.push(rect(1, 10, 12, 3, "K"), rect(2, 13, 10, 1, "Z"))
      if (look.cap) worn.push(rect(2, 1, 10, 3, "y"), rect(2, 3, 10, 1, "w"), rect(5, 4, 4, 1, "w"))
    }
    figure(`bar_${id}_0`, { w: 14, h: 19 }, base.k, ...body, ...worn)
    figure(`bar_${id}_1`, { w: 17, h: 19 }, base.k, ...body, ...(look.view === "f" ? BAR_GRIN : []), ...BAR_RAISED, ...worn)
  }
}

// ---------------------------------------------------------------------------
// Arriving
// ---------------------------------------------------------------------------

// Nobody walks in. Each one drops out of the ceiling as a streak of light,
// lands as a blob, and is sitting there the moment after: the way a hero
// arrives at the start of a stage.
pal({ w: "#fffaf0", a: "#f6c453", o: "#e8963a" })
sprite("bar_beam", { w: 4, h: 26 }, rect(0, 3, 4, 23, "a"), rect(1, 0, 2, 26, "w"), rect(0, 22, 4, 4, "w"), px(0, 3, "o"), px(3, 3, "o"))
sprite("bar_land_0", `
  ..aaaaaaaaaa..
  aawwwwwwwwwwaa
  awwwwwwwwwwwwa
  aawwwwwwwwwwaa
  ..aaaaaaaaaa..`)
sprite("bar_land_1", `
  ..aaaaaa..
  .awwwwwwa.
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  awwwwwwwwa
  .awwwwwwa.
  ..aaaaaa..`)
