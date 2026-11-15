// Kebab Profitable: all the pixel art, as code.
//
// Rendered with pxl (https://github.com/crsolver/claude-pxl). `pnpm art` builds
// this file and copies the PNGs the game uses into public/art.
//
// The room is drawn once and rendered in every light the game shows: morning,
// afternoon, rain, evening and night. The people and props are rendered in the
// same lights, so nothing is tinted at run time.

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hex = (c) =>
  "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const mul = (a, m) => a.map((v, i) => v * m[i])
const lighten = (h, t) => hex(mix(rgb(h), [255, 255, 255], t))
const darken = (h, t) => hex(mul(rgb(h), [1 - t, 1 - t, 1 - t]))

/** How each light changes a colour painted for a plain afternoon. */
const GRADE = {
  day: (c) => c,
  morning: (c) => mix(mul(c, [1.03, 1.0, 0.94]), [255, 214, 150], 0.07),
  rain: (c) => mix(mul(c, [0.88, 0.9, 0.94]), [150, 158, 165], 0.1),
  evening: (c) => mix(mul(c, [0.84, 0.72, 0.74]), [217, 130, 80], 0.1),
  night: (c) => mix(mul(c, [0.38, 0.43, 0.6]), [16, 26, 52], 0.22),
  lamp: (c) => mix(mul(c, [1.0, 0.92, 0.78]), [255, 214, 140], 0.1),
}
// Between the lamp and the dark, the light steps down through these.
const between = (a, b, t) => (c) => mix(GRADE[a](c), GRADE[b](c), t)
GRADE.night1 = between("lamp", "night", 0.4)
GRADE.night2 = between("lamp", "night", 0.7)
GRADE.evening1 = between("lamp", "evening", 0.5)

/** The lights the people and props are rendered in. */
const GRADES = ["day", "morning", "rain", "evening", "night", "lamp", "night2"]

function grader(g) {
  const memo = new Map()
  return (h) => {
    let v = memo.get(h)
    if (!v) memo.set(h, (v = hex(GRADE[g](rgb(h)))))
    return v
  }
}

/** Ordered dither: true for `density` of the pixels, in a fixed pattern. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const dithered = (x, y, density) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 < density

// ---------------------------------------------------------------------------
// The isometric room
// ---------------------------------------------------------------------------

const W = 192
const H = 128
/** Where the back corner of the floor sits, and the room's size in cells. */
const OX = 88
const OY = 47
const RW = 84 // along x, which runs down and to the right
const RD = 68 // along y, which runs down and to the left
const RH = 42

const sx = (x, y) => OX + x - y
const sy = (x, y, z = 0) => OY + ((x + y) >> 1) - z

const C = {
  ink: "#171411",
  bone: "#d8caa6",
  paper: "#e6dcc0",
  white: "#f1ead8",
  amber: "#e0a13c",
  rust: "#9c4f2c",
  rustDark: "#733821",
  leaf: "#6c9450",
  leafDark: "#4a6e3a",
  leafLight: "#8fb86a",
  wood: "#7a5a3a",
  woodDark: "#59412a",
  woodLight: "#93714a",
  steel: "#7c8376",
  steelDark: "#585e54",
  steelLight: "#9ba294",
  brick: "#774234",
  brickLight: "#85503b",
  brickDark: "#693a2e",
  mortar: "#4d2c23",
  plaster: "#b5a786",
  plasterShade: "#a2957a",
  dado: "#737a5e",
  dadoTrim: "#8f9473",
}

const METAL = ["#8f957f", "#7b826d", "#5d6455"]
const DARK_METAL = ["#6a6f60", "#5a5f52", "#474b41"]
const TIMBER = [C.woodLight, C.wood, C.woodDark]

/** Drawing in room coordinates. Every colour goes through the light's grade. */
function painter(c, tint) {
  const p = {
    /** A level patch at height z: w cells along x, d cells along y. */
    flat(x, y, z, w, d, h) {
      const k = tint(h)
      for (let j = y; j < y + d; j++) for (let i = x; i < x + w; i++) c.px(sx(i, j), sy(i, j, z), k)
    },
    /** An upright patch that catches the light: w cells along x, standing in row y. */
    lit(x, y, z, w, hgt, h) {
      const k = tint(h)
      for (let i = x; i < x + w; i++) c.rect(sx(i, y), sy(i, y, z) - hgt + 1, 1, hgt, k)
    },
    /** An upright patch in the shade: d cells along y, standing in column x. */
    dim(x, y, z, d, hgt, h) {
      const k = tint(h)
      for (let j = y; j < y + d; j++) c.rect(sx(x, j), sy(x, j, z) - hgt + 1, 1, hgt, k)
    },
    /** A box: top, lit side, shaded side, with its top edges picked out. */
    box(x, y, z, w, d, hgt, [top, l, r], edge = true) {
      p.flat(x, y, z + hgt, w, d, top)
      p.lit(x, y + d - 1, z, w, hgt, l)
      p.dim(x + w - 1, y, z, d, hgt, r)
      if (edge && hgt > 2) {
        p.lit(x, y + d - 1, z + hgt - 1, w, 1, lighten(l, 0.2))
        p.dim(x + w - 1, y, z + hgt - 1, d, 1, lighten(r, 0.14))
      }
    },
    /** A patch on the right-hand wall: u along it from the corner, v up from the floor. */
    wallR(u, v, w, hgt, h) {
      const k = tint(h)
      for (let i = u; i < u + w; i++) c.rect(OX + i, OY + (i >> 1) - v - hgt, 1, hgt, k)
    },
    /** A patch on the left-hand wall, clipped to it. */
    wallL(u, v, w, hgt, h) {
      const from = Math.max(0, u)
      const to = Math.min(RD - 1, u + w)
      const height = Math.min(hgt, RH - v)
      if (to <= from || height <= 0) return
      const k = tint(h)
      for (let j = from; j < to; j++) c.rect(OX - 1 - j, OY + ((j + 1) >> 1) - v - height, 1, height, k)
    },
    /** A flat rectangle on the picture itself, graded. */
    rect(x, y, w, hgt, h) {
      c.rect(x, y, w, hgt, tint(h))
    },
    /** The same, in a colour that gives off its own light. */
    glow(x, y, w, hgt, h) {
      c.rect(x, y, w, hgt, h)
    },
    /** Changes the pixels already on the floor (or on a top face at height z). */
    onFloor(x, y, w, d, z, fn, density = 1) {
      for (let j = y; j < y + d; j++) {
        for (let i = x; i < x + w; i++) {
          const X = sx(i, j)
          const Y = sy(i, j, z)
          if (density < 1 && !dithered(X, Y, density)) continue
          const v = c.get(X, Y)
          if ((v & 255) === 0) continue
          c.px(X, Y, hex(fn([v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255])))
        }
      }
    },
    /** A shadow thrown on the floor to the right of something, soft at its far edge. */
    shadow(x, y, w, d, len = 3) {
      const dark = (px) => mul(px, [0.76, 0.76, 0.8])
      p.onFloor(x + w, y + 1, len - 1, d, 0, dark)
      p.onFloor(x + w + len - 1, y + 1, 1, d, 0, dark, 0.5)
    },
  }
  return p
}

const SKIES = {
  dawn: { top: "#e9c48f", bottom: "#b9c9bd", town: "#7d4636", lit: false },
  day: { top: "#9dbccb", bottom: "#cdd6c4", town: "#8a4f3b", lit: false },
  grey: { top: "#8d948f", bottom: "#a9aea2", town: "#6f5148", lit: false },
  dusk: { top: "#5d4a73", bottom: "#d98250", town: "#4c2a2d", lit: true },
  night: { top: "#10131f", bottom: "#1d2233", town: "#15131c", lit: true },
}
const WINDOW_LIGHT = "#f4c06a"

function paintWalls(p) {
  // The right-hand wall catches the light: plaster above a painted dado.
  p.wallR(0, 0, RW, RH, C.plaster)
  p.wallR(0, 0, RW, 13, C.dado)
  p.wallR(0, 13, RW, 1, C.dadoTrim)
  p.wallR(0, 12, RW, 1, darken(C.dado, 0.12))
  p.wallR(0, 0, RW, 2, "#4b4132")
  p.wallR(0, 2, RW, 1, "#62563f")
  // Damp has crept down from the ceiling in the corner, where the two walls meet.
  p.wallR(0, 33, 4, 9, C.plasterShade)
  p.wallR(4, 36, 3, 6, C.plasterShade)
  p.wallR(7, 39, 3, 3, C.plasterShade)
  // Where the plaster gave up, the brick shows through.
  p.wallR(17, 27, 10, 10, "#94553c")
  p.wallR(16, 29, 1, 6, "#94553c")
  p.wallR(27, 28, 1, 7, "#94553c")
  p.wallR(19, 37, 6, 1, "#94553c")
  for (const v of [29, 32, 35]) p.wallR(17, v, 10, 1, "#6e3d2c")
  for (const [u, v] of [[20, 27], [24, 27], [18, 30], [22, 30], [26, 30], [20, 33], [24, 33]]) {
    p.wallR(u, v, 1, 2, "#6e3d2c")
  }
  p.wallR(16, 26, 12, 1, darken(C.plaster, 0.14))
  // Rain has run down from both ends of the window sill.
  p.wallR(40, 2, 1, 9, darken(C.dado, 0.1))
  p.wallR(79, 3, 1, 8, darken(C.dado, 0.1))

  // The left-hand wall is in the shade: bare Lille brick, in courses.
  p.wallL(0, 0, RD, RH, C.brick)
  for (let row = 0; row * 4 < RH; row++) {
    const v = row * 4
    for (let k = 0; k * 8 < RD + 8; k++) {
      const u = k * 8 - (row % 2) * 4
      const bake = (row * 7 + k * 13) % 6
      if (bake === 0) p.wallL(u + 1, v + 1, 7, 3, C.brickLight)
      if (bake === 3) p.wallL(u + 1, v + 1, 7, 3, C.brickDark)
      p.wallL(u, v + 1, 1, 3, C.mortar)
    }
    p.wallL(0, v, RD, 1, C.mortar)
  }
  // A heating pipe that has not been warm in years, with rust under each bracket.
  p.wallL(0, 37, RD, 2, C.steelDark)
  p.wallL(0, 38, RD, 1, C.steelLight)
  for (let u = 6; u < RD; u += 18) {
    p.wallL(u, 36, 2, 4, "#3f443c")
    p.wallL(u, 32, 1, 4, C.rustDark)
  }

  // The cut tops of both walls, where the cutaway slices through.
  p.flat(-3, -3, RH, RW + 3, 3, "#d0c4a4")
  p.flat(-3, 0, RH, 3, RD - 1, "#a8654b")
  p.flat(-1, -3, RH, RW + 1, 1, "#e2d8bc")
}

function paintWindow(p, c, sky, grey) {
  const U = 42
  const V = 15
  const WW = 36
  const HH = 24
  /** Window coordinates: a across from the left, b down from the top. */
  const frame = (a, b, w, h, col) => p.wallR(U + a, V + HH - b - h, w, h, col)
  const glass = (a, b, w, h, col) => {
    for (let i = U + a; i < U + a + w; i++) c.rect(OX + i, OY + (i >> 1) - (V + HH - b - h) - h, 1, h, col)
  }

  frame(-2, -2, WW + 4, HH + 4, C.woodDark)
  // Sky in three bands, with the seams broken up.
  const top = sky.top
  const bottom = sky.bottom
  const middle = hex(mix(rgb(top), rgb(bottom), 0.5))
  glass(0, 0, WW, 8, top)
  glass(0, 8, WW, 8, middle)
  glass(0, 16, WW, 8, bottom)
  for (let a = 0; a < WW; a++) {
    if (a % 2 === 0) glass(a, 8, 1, 1, top)
    if (a % 2 === 1) glass(a, 16, 1, 1, middle)
  }

  if (sky === SKIES.night) {
    glass(4, 3, 4, 4, C.bone)
    glass(6, 3, 2, 2, top)
    for (const [a, b] of [[12, 2], [19, 6], [28, 3], [32, 8], [15, 10]]) glass(a, b, 1, 1, C.bone)
  } else if (!grey) {
    const sunB = sky === SKIES.dawn ? 9 : sky === SKIES.day ? 2 : 12
    glass(5, sunB, 4, 4, sky === SKIES.dusk ? WINDOW_LIGHT : "#f7e7b0")
  }

  // The belfry and a row of stepped Flemish gables.
  const town = sky.town
  const townDark = darken(town, 0.18)
  glass(24, 3, 1, 3, town)
  glass(23, 6, 3, 4, town)
  glass(22, 10, 5, 14, town)
  glass(26, 10, 1, 14, townDark)
  if (sky.lit) glass(24, 8, 1, 1, WINDOW_LIGHT)
  const gables = [
    { a: 0, w: 7, h: 9 },
    { a: 8, w: 6, h: 7 },
    { a: 15, w: 6, h: 10 },
    { a: 28, w: 8, h: 8 },
  ]
  gables.forEach((g, i) => {
    glass(g.a, HH - g.h, g.w, g.h, town)
    glass(g.a + g.w - 1, HH - g.h, 1, g.h, townDark)
    glass(g.a + 1, HH - g.h - 1, g.w - 2, 1, town)
    glass(g.a + 2, HH - g.h - 2, g.w - 4, 1, town)
    const lit = sky.lit && i !== 1
    glass(g.a + 2, HH - g.h + 2, 2, 2, lit ? WINDOW_LIGHT : townDark)
    if (g.h > 8) glass(g.a + 2, HH - g.h + 6, 2, 2, sky.lit && i === 2 ? WINDOW_LIGHT : townDark)
  })

  // Glazing bars, with the light catching one edge, and the sill.
  frame(17, 0, 2, HH, C.woodDark)
  frame(0, 11, WW, 2, C.woodDark)
  frame(17, 0, 1, HH, C.wood)
  frame(0, 11, WW, 1, C.wood)
  frame(-3, HH + 2, WW + 6, 2, C.woodLight)
  frame(-3, HH + 2, WW + 6, 1, lighten(C.woodLight, 0.2))
}

function paintPoster(p) {
  const U = 33
  const V = 13
  const PW = 26
  const PH = 22
  /** Poster coordinates, read left to right on screen: a across, b down. */
  const put = (a, b, w, h, col) => p.wallL(U + PW - a - w, V + PH - b - h, w, h, col)
  put(-1, 0, PW + 2, PH + 1, "#33251b")
  put(0, 0, PW, PH, C.paper)
  put(0, PH - 1, PW, 1, darken(C.paper, 0.12))
  // The kebab line, dashed, near the top. The game draws the bars under it.
  for (let a = 1; a < PW - 1; a += 3) put(a, 4, 2, 1, C.amber)
  put(1, PH - 3, PW - 2, 1, C.ink)
  // Two pins.
  put(1, 1, 1, 1, "#b5412f")
  put(PW - 2, 1, 1, 1, "#b5412f")
}

function paintFloor(p, sun) {
  const planks = ["#6b523a", "#634b35", "#72583f"]
  const seam = "#4b3828"
  for (let k = 0; k * 6 < RD; k++) {
    const y = k * 6
    const d = Math.min(6, RD - y)
    p.flat(0, y, 0, RW, d, planks[(k * 2) % 3])
    p.flat(0, y, 0, RW, 1, seam)
    for (let x = 5 + ((k * 17) % 29); x < RW; x += 34) p.flat(x, y + 1, 0, 1, d - 1, seam)
  }
  // The walls keep the edge of the floor in shade.
  p.onFloor(0, 0, RW, 2, 0, (px) => mul(px, [0.8, 0.8, 0.84]))
  p.onFloor(0, 2, 2, RD - 2, 0, (px) => mul(px, [0.8, 0.8, 0.84]))
  // The edge of the slab.
  p.lit(0, RD - 1, -3, RW, 3, "#3d2f22")
  p.dim(RW - 1, 0, -3, RD, 3, "#2b2119")
  p.lit(0, RD - 1, -1, RW, 1, "#57432f")

  // A rug that was red once, with a fringe at each end.
  p.flat(34, 30, 0, 34, 26, "#7a3c2e")
  p.flat(36, 32, 0, 30, 22, "#96503a")
  p.flat(38, 34, 0, 26, 18, "#7a3c2e")
  p.flat(40, 36, 0, 22, 14, "#8a4634")
  for (let i = 0; i < 4; i++) p.flat(42 + i * 5, 42, 0, 2, 2, C.amber)
  for (let j = 30; j < 56; j += 2) {
    p.flat(33, j, 0, 1, 1, C.bone)
    p.flat(68, j, 0, 1, 1, C.bone)
  }

  // Daylight through the two panes: longer in the morning.
  if (sun > 0) {
    const reach = sun === 2 ? 24 : 16
    const warm = (px) => mix(px, [255, 232, 180], sun === 2 ? 0.2 : 0.16)
    for (const x of [44, 61]) {
      p.onFloor(x, 14, 15, reach - 2, 0, warm)
      p.onFloor(x, 14 + reach - 2, 15, 2, 0, warm, 0.5)
    }
  }
}

function paintFridge(p) {
  p.shadow(1, 2, 11, 11, 4)
  p.box(1, 2, 0, 11, 11, 28, METAL)
  // The door faces the room.
  p.dim(11, 2, 18, 11, 1, "#3f453a")
  p.dim(11, 3, 20, 1, 5, "#b4b9a6")
  p.dim(11, 3, 9, 1, 7, "#b4b9a6")
  p.dim(11, 4, 20, 1, 5, "#4a5045")
  p.dim(11, 4, 9, 1, 7, "#4a5045")
  // A kebab-shop magnet and a note held under it.
  p.dim(11, 7, 22, 3, 3, C.amber)
  p.dim(11, 8, 23, 1, 1, C.rust)
  p.dim(11, 8, 12, 3, 4, C.paper)
  p.dim(11, 9, 16, 1, 1, "#b5412f")
  // Rust where the floor is damp.
  p.dim(11, 9, 0, 4, 2, C.rustDark)
  p.dim(11, 5, 0, 2, 1, C.rustDark)
  // Vents on the side.
  p.lit(3, 12, 3, 6, 1, "#565c4e")
  p.lit(3, 12, 5, 6, 1, "#565c4e")
  p.lit(3, 12, 7, 6, 1, "#565c4e")
}

function paintDesk(p, lampOn) {
  p.onFloor(15, 4, 28, 11, 0, (px) => mul(px, [0.72, 0.72, 0.76]))
  p.shadow(36, 1, 8, 12, 3)
  p.box(14, 1, 0, 2, 12, 9, TIMBER, false)
  // Drawers, each with a handle.
  p.box(36, 1, 0, 8, 12, 9, [C.wood, "#6c5034", C.woodDark], false)
  for (const z of [3, 6]) p.lit(36, 12, z, 8, 1, C.woodDark)
  for (const z of [1, 4, 7]) p.lit(39, 12, z, 2, 1, C.bone)
  p.box(14, 1, 9, 30, 12, 2, TIMBER, false)
  p.lit(14, 12, 10, 30, 1, lighten(C.wood, 0.2))
  // The grain of the top runs along the desk.
  p.flat(16, 4, 11, 26, 1, darken(C.woodLight, 0.08))
  p.flat(15, 9, 11, 20, 1, darken(C.woodLight, 0.08))

  // A mug, gone cold.
  p.box(21, 3, 11, 2, 2, 3, ["#3a2c20", "#d9d1bc", "#bab39f"], false)

  // The terminal, its screen turned towards the room.
  p.box(25, 3, 11, 12, 8, 10, ["#cbc0a2", "#b5aa8a", "#91876c"])
  p.lit(26, 10, 13, 10, 7, "#20231f")
  p.lit(26, 10, 19, 10, 1, "#2b2f29")
  p.lit(27, 10, 11, 8, 1, "#91876c")
  // Vents on its side, and a cable down the back of the desk.
  p.dim(36, 4, 14, 5, 1, "#7a715a")
  p.dim(36, 4, 16, 5, 1, "#7a715a")
  p.dim(43, 2, 2, 1, 8, C.ink)
  // Keyboard.
  p.box(26, 11, 11, 10, 2, 1, ["#c2b899", "#a99f81", "#8c836a"], false)
  p.flat(27, 11, 12, 8, 1, "#a99f81")

  // Lamp.
  p.box(39, 4, 11, 3, 3, 1, DARK_METAL, false)
  const [lx, ly] = [sx(40, 5), sy(40, 5, 12)]
  p.rect(lx, ly - 7, 1, 7, "#474b41")
  if (lampOn) {
    p.flat(38, 3, 22, 5, 5, "#ffe9b0")
    for (let i = 38; i < 43; i++) p.glow(sx(i, 7), sy(i, 7, 19) - 2, 1, 3, "#f8cf74")
    for (let j = 3; j < 8; j++) p.glow(sx(42, j), sy(42, j, 19) - 2, 1, 3, "#dfa844")
    p.flat(38, 3, 22, 5, 5, "#ffe9b0")
  } else {
    p.box(38, 3, 19, 5, 5, 3, METAL)
  }

  // The stool.
  p.shadow(28, 15, 5, 5, 2)
  p.box(28, 15, 0, 5, 5, 5, DARK_METAL)
}

function paintPot(p) {
  p.shadow(74, 2, 7, 7, 3)
  p.box(74, 2, 0, 7, 7, 6, ["#4f3423", "#a8603e", "#844a30"])
  p.lit(74, 8, 5, 7, 1, "#c27a55")
}

function paintBed(p) {
  const frame = ["#5b594f", "#4b4941", "#3a3832"]
  p.shadow(1, 27, 17, 38, 4)
  p.box(1, 26, 0, 17, 1, 12, frame)
  p.box(1, 27, 0, 17, 38, 4, frame, false)
  p.box(1, 27, 4, 17, 38, 3, ["#cfc2a2", "#b4a787", "#968a6c"], false)
  // Pillow, dented where a head goes.
  p.box(3, 28, 7, 13, 7, 2, [C.white, "#d3c9af", "#b4aa90"], false)
  p.flat(6, 30, 9, 7, 3, "#ded6c0")
  // An army blanket, with its folds.
  p.box(1, 37, 7, 17, 28, 2, ["#64744c", "#53623b", "#44502f"], false)
  p.flat(1, 37, 9, 17, 1, "#7f8d5e")
  p.flat(1, 39, 9, 17, 2, "#7f8d5e")
  p.flat(1, 61, 9, 17, 1, "#7f8d5e")
  p.flat(4, 46, 9, 9, 1, "#56653f")
  p.flat(8, 53, 9, 8, 1, "#56653f")
  p.lit(1, 64, 8, 17, 1, "#6f7f54")
  p.box(1, 65, 0, 17, 1, 9, frame)

  // A crate for a bedside table, and a radio that has seen better decades.
  p.shadow(20, 28, 8, 8, 3)
  p.box(20, 28, 0, 8, 8, 7, TIMBER)
  p.lit(20, 35, 3, 8, 1, C.woodDark)
  p.dim(27, 28, 3, 8, 1, "#49351f")
  p.box(21, 30, 7, 6, 4, 4, ["#8d7350", "#a78a5f", "#6f583b"], false)
  p.dim(26, 30, 8, 2, 2, "#3a2e20")
  p.dim(26, 33, 9, 1, 1, C.bone)
  const [ax, ay] = [sx(21, 30), sy(21, 30, 11)]
  p.rect(ax, ay - 6, 1, 6, C.steelLight)
}

function paintBin(p) {
  // A bin by the desk, for what does not make it to the floor.
  p.shadow(47, 3, 4, 4, 2)
  p.box(47, 3, 0, 4, 4, 5, DARK_METAL)
  p.flat(47, 3, 5, 4, 4, "#2f332c")
  p.flat(48, 4, 5, 2, 2, "#c4c0ae")
}

/** The whole flat, in one light. */
function paintRoom(c, { grade, sky, sun, lamp, grey }) {
  const p = painter(c, grader(grade))
  paintWalls(p)
  paintWindow(p, c, SKIES[sky], grey)
  paintPoster(p)
  paintFloor(p, sun)
  paintFridge(p)
  paintDesk(p, lamp)
  paintBin(p)
  paintPot(p)
  paintBed(p)
}

// One painting per light. The names starting with "_" are parts of the final scenes.
const LIGHTS = {
  morning: { grade: "morning", sky: "dawn", sun: 2, lamp: false },
  morning_rain: { grade: "rain", sky: "grey", sun: 0, lamp: false, grey: true },
  afternoon: { grade: "day", sky: "day", sun: 1, lamp: false },
  afternoon_rain: { grade: "rain", sky: "grey", sun: 0, lamp: false, grey: true },
}
for (const [name, light] of Object.entries(LIGHTS)) {
  scene("room_" + name, { w: W, h: H }, (c) => paintRoom(c, light))
}

// After dark the lamp is on. Its light falls off in steps: each step is the
// whole room painted a little darker, cut to a ring around the lamp, with a
// dithered rim so one step breaks into the next.
const LAMP = [sx(40, 5), sy(40, 5, 14)]
const DARK = {
  evening: { sky: "dusk", steps: [["evening1", 38], ["lamp", 24]] },
  night: { sky: "night", steps: [["night2", 43], ["night1", 32], ["lamp", 21]] },
}
for (const [name, { sky, steps }] of Object.entries(DARK)) {
  const painted = (grade) => {
    const id = `_room_${grade}_${sky}`
    scene(id, { w: W, h: H }, (c) => paintRoom(c, { grade, sky, sun: 0, lamp: true }))
    return id
  }
  const rings = []
  for (const [grade, radius] of steps) {
    const id = painted(grade)
    rings.push(
      layer(`rim_${grade}`, { density: 0.5 }, clip([LAMP[0], LAMP[1], radius + 3], stamp(id, 0, 0))),
      clip([LAMP[0], LAMP[1], radius], stamp(id, 0, 0)),
    )
  }
  scene("room_" + name, { w: W, h: H }, stamp(painted(name), 0, 0), ...rings)
}

// ---------------------------------------------------------------------------
// Things the game places in the room
// ---------------------------------------------------------------------------

/** A small sprite drawn with the room's painter, moved so its corner is at 0,0. */
function roomSprite(name, grade, [ox, oy, w, h], draw) {
  sprite(name, { w, h }, (c) => {
    const shifted = {
      px: (x, y, col) => c.px(x - ox, y - oy, col),
      rect: (x, y, rw, rh, col) => c.rect(x - ox, y - oy, rw, rh, col),
      get: (x, y) => c.get(x - ox, y - oy),
    }
    draw(painter(shifted, grade ? grader(grade) : (hx) => hx))
  })
}

// Where each of these sits on the room picture. The game reads the same numbers.
const PLACE = {
  chart: [28, 24, 28, 42],
  screen: [103, 44, 12, 14],
  plant: [151, 64, 18, 20],
  bowl: [98, 39, 10, 8],
}

for (const g of GRADES) {
  // The MRR bars on the wall chart, from empty (1) to the kebab line (8).
  for (let step = 1; step <= 8; step++) {
    roomSprite(`chart_${step}_${g}`, g, PLACE.chart, (p) => {
      const U = 33
      const V = 13
      const PW = 26
      const PH = 22
      const put = (a, b, w, h, col) => p.wallL(U + PW - a - w, V + PH - b - h, w, h, col)
      for (let i = 0; i < 7; i++) {
        const ramp = Math.pow((i + 1) / 7, 1.6)
        const h = Math.round(ramp * (step / 8) * 15)
        if (h > 0) put(2 + i * 3, PH - 3 - h, 2, h, step === 8 ? "#5f9a52" : "#4f6f8a")
      }
    })
  }

  // The plant lives and dies with your morale.
  roomSprite(`plant_lush_${g}`, g, PLACE.plant, (p) => {
    const [x, y] = [sx(77, 5), sy(77, 5, 6)]
    p.rect(x, y - 12, 2, 12, C.leafDark)
    p.rect(x - 5, y - 8, 5, 2, C.leaf)
    p.rect(x + 2, y - 10, 5, 2, C.leaf)
    p.rect(x - 3, y - 15, 7, 3, C.leaf)
    p.rect(x - 6, y - 4, 5, 2, C.leaf)
    p.rect(x + 2, y - 5, 4, 2, C.leaf)
    p.rect(x - 5, y - 8, 4, 1, C.leafLight)
    p.rect(x + 2, y - 10, 4, 1, C.leafLight)
    p.rect(x - 2, y - 15, 5, 1, C.leafLight)
    p.rect(x - 6, y - 4, 4, 1, C.leafLight)
    p.rect(x - 3, y - 13, 1, 1, C.leafDark)
    p.rect(x + 3, y - 13, 1, 1, C.leafDark)
  })
  roomSprite(`plant_wilting_${g}`, g, PLACE.plant, (p) => {
    const [x, y] = [sx(77, 5), sy(77, 5, 6)]
    p.rect(x, y - 8, 2, 8, "#7d8a4a")
    p.rect(x - 4, y - 5, 4, 2, "#a3a65a")
    p.rect(x + 2, y - 7, 4, 2, "#a3a65a")
    p.rect(x - 1, y - 10, 4, 2, "#a3a65a")
    p.rect(x - 5, y - 4, 1, 2, "#8a8d48")
    p.rect(x + 6, y - 6, 1, 2, "#8a8d48")
  })
  roomSprite(`plant_dead_${g}`, g, PLACE.plant, (p) => {
    const [x, y] = [sx(77, 5), sy(77, 5, 6)]
    p.rect(x, y - 6, 1, 6, "#7a5c36")
    p.rect(x + 1, y - 6, 3, 1, "#7a5c36")
    p.rect(x + 3, y - 5, 1, 2, "#7a5c36")
    p.rect(x - 2, y - 3, 2, 1, "#7a5c36")
    p.rect(x - 4, y, 2, 1, "#8a6a3a")
  })

  // A bowl of pasta: they pile up at the far end of the desk.
  roomSprite(`bowl_${g}`, g, PLACE.bowl, (p) => {
    p.box(15, 3, 11, 4, 4, 2, ["#efd98c", "#ddd5bf", "#bdb6a2"], false)
  })

  // A kebab wrapper on the floor.
  const tint = grader(g)
  sprite(`wrapper_${g}`, { w: 6, h: 4 }, (c) => {
    c.rect(0, 1, 5, 3, tint("#c4c0ae"))
    c.rect(1, 0, 3, 1, tint("#dedbcb"))
    c.rect(3, 2, 2, 1, tint(C.amber))
    c.rect(0, 3, 5, 1, tint("#a39f8e"))
  })
}

// What is on the terminal's screen. Screens give off their own light, so one set does for every hour.
const SCREEN = { bg: "#0b2012", bright: "#69e07c", dim: "#3fae55", bone: "#d8caa6", amber: "#e0a13c" }
const SCREENS = {
  code: (line, f) => {
    line(1, 1, 5, SCREEN.bright)
    line(2, 2, 6, SCREEN.dim)
    line(2, 3, 4, SCREEN.dim)
    line(1, 4, 7, SCREEN.bright)
    if (f === 0) line(1, 5, 1, SCREEN.bright)
  },
  ship: (line, f) => {
    line(1, 1, 8, SCREEN.amber)
    line(1, 3, f === 0 ? 4 : 8, SCREEN.bright)
    line(1, 5, 4, SCREEN.dim)
  },
  chat: (line, f) => {
    line(1, 1, 5, SCREEN.bone)
    line(4, 3, 5, SCREEN.bright)
    if (f === 0) line(1, 5, 3, SCREEN.bone)
  },
  invoice: (line) => {
    line(1, 1, 4, SCREEN.bone)
    line(6, 1, 3, SCREEN.bright)
    line(1, 3, 4, SCREEN.bone)
    line(6, 3, 3, SCREEN.bright)
    line(5, 5, 4, SCREEN.amber)
  },
}
for (const [kind, draw] of Object.entries(SCREENS)) {
  for (const f of [0, 1]) {
    roomSprite(`screen_${kind}_${f}`, null, PLACE.screen, (p) => {
      p.lit(26, 10, 13, 10, 7, SCREEN.bg)
      draw((a, b, w, col) => p.lit(26 + a, 10, 19 - b, w, 1, col), f)
    })
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * Everyone shares one body and an emoji-yellow face. The members are told
 * apart by a signature prop, not by a likeness: real portraits come later,
 * once each member has approved theirs.
 */
const BODY = {
  k: "#171411", // outline
  K: "#3a2a1f", // hair
  Z: "#2a1e16", // hair, in shade
  H: "#e6b950", // skin
  Y: "#c79a3c", // skin, in shade
  I: "#f3d27a", // skin, in light
  m: "#a8522f", // mouth
  Q: "#454d57", // denim
  U: "#333a43", // denim, in shade
  x: "#f1ead8", // white
  X: "#cfc8b4", // white, in shade
  a: "#e0a13c", // amber
  s: "#7c8376", // steel
  r: "#b5412f", // red
  R: "#8c2c22", // red, in shade
  e: "#d9553f", // headphone cups
  y: "#e3b548", // cap
  w: "#c9992f", // cap, in shade
}

const PEOPLE = {
  david: { shirt: "#3f8f86" },
  karl: { shirt: "#d8d2c0" },
  mickael: { shirt: "#c9762f" },
  christophe: { shirt: "#3f62a8" },
  matthys: { shirt: "#7a58b8" },
}

/** The half of the body that is the same on both sides, front and back. */
const FRONT = `
  ..KKKK
  .KKKKK
  .KKHHH
  .HHIkH
  .YHHHH
  .YHHHm
  ..YHHH
  ..cCCC
  .CCCCC
  cCCCCC
  cCCCCC
  HcCCCC
  ..UQQQ
  ..UQQ.
  ..UQQ.
  ..UQQ.
  ..UQQ.
  .kkkk.`
const BACK = `
  ..KKKK
  .KKKKK
  .ZKKKK
  .ZKKKK
  .ZKKKK
  .YZKKK
  ..YHHH
  ..cCCC
  .CCCCC
  cCCCCC
  cCCCCC
  HcCCCC
  ..UQQQ`
const ASLEEP = `
  ..KKKK
  .KKKKK
  .KKHHH
  .HHYYH
  .YHHHH
  .YHHHm
  ..YHHH`

/** What each member wears. Drawn over the body, before the outline. */
function props(who, back) {
  switch (who) {
    case "david": // headphones: he is the DJ
      return [rect(2, 0, 8, 1, "k"), rect(1, 1, 1, 2, "k"), rect(10, 1, 1, 2, "k"), rect(0, 3, 2, 3, "e"), rect(10, 3, 2, 3, "e")]
    case "karl": // mortarboard: he is the doctor
      return [rect(0, 0, 12, 1, "k"), rect(3, 1, 6, 1, "k"), rect(11, 1, 1, 3, "a")]
    case "mickael": // podcast headset
      return back
        ? [rect(2, 0, 8, 1, "s"), rect(1, 1, 1, 2, "s"), rect(0, 3, 2, 3, "k")]
        : [rect(2, 0, 8, 1, "s"), rect(1, 1, 1, 2, "s"), rect(0, 3, 2, 3, "k"), rect(1, 6, 3, 1, "k"), px(4, 6, "s")]
    case "christophe": // mask: he is the superhero
      return back ? [rect(2, 4, 8, 1, "R")] : [rect(2, 4, 8, 1, "R"), px(4, 4, "x"), px(7, 4, "x")]
    case "matthys": // cap and shades: he is the cool kid
      return back
        ? [rect(2, 0, 8, 2, "y"), rect(4, 2, 4, 1, "w")]
        : [rect(2, 0, 8, 2, "y"), rect(2, 1, 8, 1, "w"), rect(9, 2, 3, 1, "w"), rect(3, 4, 6, 1, "k")]
    default:
      return []
  }
}

for (const g of GRADES) {
  const tint = grader(g)
  const base = Object.fromEntries(Object.entries(BODY).map(([key, h]) => [key, tint(h)]))
  for (const [who, look] of Object.entries(PEOPLE)) {
    pal({ ...base, C: tint(look.shirt), c: tint(darken(look.shirt, 0.22)) })
    const cape = who === "christophe"

    // Standing, facing the room. The cape hangs behind the body.
    sprite(`_${who}_front_${g}`, { mx: true }, FRONT)
    sprite(
      `${who}_front_${g}`,
      { w: 12, h: 19, outline: "k" },
      ...(cape ? [rect(0, 9, 12, 7, "r"), rect(0, 9, 12, 1, "R")] : []),
      stamp(`_${who}_front_${g}`, 0, 1),
      layer("props", { y: 1 }, ...props(who, false)),
    )
    // One arm raised, to hold a phone or a kebab.
    sprite(
      `${who}_arm_${g}`,
      { w: 13, h: 19, outline: "k" },
      ...(cape ? [rect(0, 9, 12, 7, "r"), rect(0, 9, 12, 1, "R")] : []),
      stamp(`_${who}_front_${g}`, 0, 1),
      grid(11, 10, "_\n_\n_"),
      px(11, 9, "C"),
      px(11, 8, "C"),
      px(12, 7, "C"),
      px(12, 6, "H"),
      layer("props", { y: 1 }, ...props(who, false)),
    )
    // Seated at the terminal, seen from behind. The cape covers the back.
    sprite(`_${who}_back_${g}`, { mx: true }, BACK)
    sprite(
      `${who}_back_${g}`,
      { w: 12, h: 14, outline: "k" },
      stamp(`_${who}_back_${g}`, 0, 1),
      ...(cape ? [rect(1, 9, 10, 5, "r"), rect(2, 8, 8, 1, "R")] : []),
      layer("props", { y: 1 }, ...props(who, true)),
    )
    // Asleep: a head on the pillow.
    sprite(`_${who}_asleep_${g}`, { mx: true }, ASLEEP)
    sprite(
      `${who}_asleep_${g}`,
      { w: 12, h: 8, outline: "k" },
      stamp(`_${who}_asleep_${g}`, 0, 1),
      layer("props", { y: 1 }, ...props(who, false).filter((_, i) => who !== "matthys" || i < 3)),
    )
  }

  // What the raised hand holds.
  pal({ ...base, g: tint("#6c9450") })
  sprite(`phone_${g}`, { outline: "k" }, "QQ\nxx\nQQ")
  sprite(`kebab_${g}`, { outline: "k" }, ".ggg\nXxrx\nXxxx")
}

// Thought bubbles are the same at any hour.
pal({ k: "#171411", p: "#e6dcc0", P: "#bdb39a", r: "#b5412f", a: "#e0a13c", n: "#454d57" })
sprite("bubble_zzz", { outline: "k" }, `
  .ppppppp.
  ppnnnnnpp
  pppppnppp
  ppppnpppp
  pppnppppp
  ppnnnnnpp
  .ppppppp.
  ..pp.....
  .p.......`)
sprite("bubble_heart", { outline: "k" }, `
  .ppppppp.
  pprrprrpp
  prrrrrrrp
  pprrrrrpp
  ppprrrppp
  pppprpppp
  .ppppppp.
  ..pp.....
  .p.......`)
sprite("bubble_idea", { outline: "k" }, `
  .ppppppp.
  pppaaappp
  ppaaaaapp
  ppaaaaapp
  pppaaappp
  pppnnnppp
  .ppppppp.
  ..pp.....
  .p.......`)

// ---------------------------------------------------------------------------
// Portraits: a head and shoulders, 32 by 32
// ---------------------------------------------------------------------------

const BUST = `
  ..........KKKKKK
  ........KKKKKKKK
  .......KKKKKKKKK
  ......KKKKKKKKKK
  ......KKKKHHHHHH
  ......KKHHHHHHHH
  ......KHHHHHIIHH
  ......HHHHkkIHHH
  ......HHHHkkHHHH
  ......YHHHHHHHHH
  ......YHHHHHHHHY
  ......YYHHHHHmmm
  .......YHHHHHHHH
  ........YYHHHHHH
  ..........YYHHHH
  ..........YYYHHH
  ....cCCCCCCcYYHH
  ..cCCCCCCCCCcccC
  .cCCCCCCCCCCCCCC
  cCCCCCCCCCCCCCCC
  cCCCCCCCCCCCCCCC
  cCCCCCCCCCCCCCCC`

/** The same props as on the small figures, twice the size. */
function bustProps(who) {
  switch (who) {
    case "david":
      return [rect(8, 4, 16, 2, "k"), rect(5, 6, 3, 4, "k"), rect(24, 6, 3, 4, "k"), rect(3, 10, 4, 7, "e"), rect(25, 10, 4, 7, "e"), rect(3, 10, 1, 7, "R"), rect(28, 10, 1, 7, "R")]
    case "karl":
      return [rect(3, 4, 26, 2, "k"), rect(9, 6, 14, 2, "k"), rect(27, 6, 1, 8, "a"), rect(26, 13, 3, 3, "a")]
    case "mickael":
      return [rect(8, 4, 16, 2, "s"), rect(5, 6, 3, 4, "s"), rect(3, 10, 4, 7, "k"), rect(5, 17, 2, 3, "k"), rect(6, 19, 6, 2, "k"), rect(11, 18, 3, 3, "s")]
    case "christophe":
      return [rect(6, 11, 20, 3, "r"), rect(6, 13, 20, 1, "R"), rect(10, 11, 3, 2, "x"), rect(19, 11, 3, 2, "x")]
    case "matthys":
      return [rect(7, 3, 18, 5, "y"), rect(7, 6, 18, 2, "w"), rect(22, 8, 8, 2, "w"), rect(8, 11, 16, 3, "k"), rect(9, 11, 3, 1, "n"), rect(17, 11, 3, 1, "n")]
    case "chef":
      return [
        rect(8, 0, 16, 7, "x"), rect(6, 1, 20, 4, "x"), rect(8, 5, 16, 2, "X"), rect(8, 7, 16, 1, "x"),
        rect(11, 15, 10, 2, "Z"), rect(10, 16, 3, 2, "Z"), rect(19, 16, 3, 2, "Z"),
        rect(10, 21, 12, 5, "x"), rect(12, 20, 2, 2, "x"), rect(18, 20, 2, 2, "x"), rect(10, 25, 12, 1, "X"),
      ]
    default:
      return []
  }
}

const PORTRAITS = {
  david: { shirt: "#3f8f86", tile: "#2f5e59" },
  karl: { shirt: "#d8d2c0", tile: "#56594c" },
  mickael: { shirt: "#c9762f", tile: "#7a4a22" },
  christophe: { shirt: "#3f62a8", tile: "#2f4470" },
  matthys: { shirt: "#7a58b8", tile: "#4f3a78" },
  chef: { shirt: "#a8402e", tile: "#6e2a1e" },
}

for (const [who, look] of Object.entries(PORTRAITS)) {
  pal({ ...BODY, n: "#5a6470", C: look.shirt, c: darken(look.shirt, 0.22), T: look.tile, t: darken(look.tile, 0.14) })
  sprite(`_bust_${who}`, { mx: true }, BUST)
  sprite(
    `_figure_${who}`,
    { w: 32, h: 26, outline: "k" },
    ...(who === "christophe" ? [rect(0, 21, 32, 5, "r"), rect(0, 21, 32, 1, "R")] : []),
    stamp(`_bust_${who}`, 0, 4),
    ...bustProps(who),
  )
  // A height chart behind the sitter, as on an identity photo.
  sprite(
    `portrait_${who}`,
    { w: 32, h: 32 },
    rect(0, 0, 32, 32, "T"),
    rect(0, 6, 32, 1, "t"),
    rect(0, 14, 32, 1, "t"),
    rect(0, 22, 32, 1, "t"),
    rect(0, 30, 32, 1, "t"),
    stamp(`_figure_${who}`, -1, 5),
  )
}

// Everything the game places, on one sheet.
sheet(
  "sprites",
  ["chart_*", "plant_*", "bowl_*", "wrapper_*", "screen_*", "*_front_*", "*_arm_*", "*_back_*", "*_asleep_*", "phone_*", "kebab_*", "bubble_*"],
  { pad: 1 },
)
