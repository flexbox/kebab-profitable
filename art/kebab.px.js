// Kebab Profitable: all the pixel art, as code.
//
// Rendered with pxl (https://github.com/crsolver/claude-pxl). `pnpm art` builds
// this file and copies the PNGs the game uses into public/art.
//
// The look is the 16-bit role-playing game: a room seen from three-quarters
// above, with its back wall facing you, and outlined, shaded little people.
// It is finished the way the Neo Geo's artists finished theirs: ramps that
// change hue as they change value, outlines the colour of what they surround,
// and one light, from the top left, on everything.
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
// A ramp changes hue as it changes value: shadows lean towards violet, lights
// towards a warm white. Nothing is shaded with grey.
const SHADOW = [46, 30, 80]
const GLARE = [255, 244, 212]
const lighten = (h, t) => hex(mix(rgb(h), GLARE, t))
const darken = (h, t) => hex(mix(mul(rgb(h), [1 - t, 1 - t, 1 - t]), SHADOW, t * 0.3))

/** What a pixel read from the picture is made of. */
const parts = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255]

/** The outline around a colour: that colour, much darker, less so towards the light. */
function rimOf(col, ink, lit) {
  let v = mix(rgb(darken(hex(col), lit ? 0.48 : 0.64)), rgb(ink), 0.2)
  const cap = lit ? 118 : 88
  const top = Math.max(...v)
  if (top > cap) v = v.map((ch) => (ch * cap) / top)
  return hex(v)
}

/**
 * Finishes an outlined sprite. The outline, drawn in `ink`, takes the colour
 * of what it surrounds. Then the light, from the top left, catches one edge of
 * every shape, and the opposite edge falls into shade.
 */
function relight(c, ink) {
  const { w, h } = c
  const [ir, ig, ib] = rgb(ink)
  const px = new Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = c.get(x, y)
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : px[y * w + x])
  const clear = (x, y) => (at(x, y) & 255) === 0
  const inked = (x, y) => {
    const v = at(x, y)
    return (v & 255) !== 0 && v >>> 24 === ir && ((v >>> 16) & 255) === ig && ((v >>> 8) & 255) === ib
  }
  const AROUND = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
  const outline = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inked(x, y) && AROUND.some(([dx, dy]) => clear(x + dx, y + dy))) outline[y * w + x] = 1
    }
  }
  const edge = (x, y) => x >= 0 && y >= 0 && x < w && y < h && outline[y * w + x] === 1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (clear(x, y)) continue
      if (edge(x, y)) {
        const inner = AROUND.find(([dx, dy]) => !clear(x + dx, y + dy) && !edge(x + dx, y + dy))
        if (!inner) continue
        const lit = clear(x, y - 1) || clear(x - 1, y)
        c.px(x, y, rimOf(parts(at(x + inner[0], y + inner[1])), ink, lit))
      } else if (!inked(x, y)) {
        const open = (dx, dy) => clear(x + dx, y + dy) || edge(x + dx, y + dy)
        const lit = open(-1, 0) || open(0, -1)
        const shaded = open(1, 0) || open(0, 1)
        if (lit && !shaded) c.px(x, y, lighten(hex(parts(at(x, y))), 0.16))
        else if (shaded && !lit) c.px(x, y, darken(hex(parts(at(x, y))), 0.2))
      }
    }
  }
}

/** A sprite with an outline in the palette's `k`, finished by `relight`. */
function figure(name, { w, h }, ink, ...items) {
  sprite(`_${name}_flat`, { w, h, outline: "k" }, ...items)
  sprite(name, { w: w + 2, h: h + 2 }, stamp(`_${name}_flat`, 0, 0), (c) => relight(c, ink))
}

/** How each light changes a colour painted for a plain afternoon. */
const GRADE = {
  day: (c) => c,
  morning: (c) => mix(mul(c, [1.03, 1.0, 0.94]), [255, 214, 150], 0.07),
  rain: (c) => mix(mul(c, [0.86, 0.89, 0.94]), [150, 158, 165], 0.12),
  evening: (c) => mix(mul(c, [0.84, 0.72, 0.74]), [217, 130, 80], 0.1),
  night: (c) => mix(mul(c, [0.36, 0.42, 0.62]), [16, 26, 52], 0.22),
  lamp: (c) => mix(mul(c, [1.0, 0.93, 0.8]), [255, 214, 140], 0.08),
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

const C = {
  ink: "#2a1c18", // outlines: a dark brown, never pure black
  wallTop: "#3a2f2a",
  wallTopEdge: "#57483f",
  brick: "#9a4f3a",
  brickLight: "#ad5f45",
  brickDark: "#84412f",
  mortar: "#63301f",
  floorA: "#b0804f",
  floorB: "#a47545",
  floorC: "#ba8a58",
  seam: "#7d5632",
  wood: "#9a6c40",
  woodLight: "#c09058",
  woodDark: "#6e4a2a",
  metal: "#84907a",
  metalLight: "#a3ad92",
  metalDark: "#66705c",
  beige: "#d9cfae",
  beigeMid: "#bfb490",
  beigeDark: "#968c6c",
  white: "#f4eedd",
  whiteShade: "#d5ccb4",
  blanket: "#6f8a4c",
  blanketLight: "#8aa562",
  blanketDark: "#566c3a",
  rug: "#a8463a",
  rugDark: "#7d2f29",
  rugLight: "#c05e48",
  gold: "#e8b04a",
  pot: "#c0693f",
  potLight: "#d8845a",
  potDark: "#96502f",
  leaf: "#5fa04a",
  leafLight: "#8cc864",
  leafDark: "#3f7a38",
  paper: "#efe4c4",
  red: "#c0432f",
  steel: "#6d756b",
  steelLight: "#98a093",
}

// ---------------------------------------------------------------------------
// The room, seen from three-quarters above
// ---------------------------------------------------------------------------

const W = 192
const H = 128
/** The inside of the room: the back wall's face, then the floor. */
const WALL_Y = 4
const FLOOR_Y = 44
const LEFT = 6
const RIGHT = 186
const BOTTOM = 122

/** Drawing on the picture. Every colour goes through the light's grade. */
function painter(c, tint) {
  /** What a cast shadow does to a colour: darker, and towards violet. */
  const inShade = (px) => mix(mul(px, [0.72, 0.68, 0.78]), SHADOW, 0.05)
  const p = {
    /** A filled rectangle. */
    r: (x, y, w, h, hx) => c.rect(x, y, w, h, tint(hx)),
    /** The same, in a colour that gives off its own light. */
    e: (x, y, w, h, hx) => c.rect(x, y, w, h, hx),
    /** A filled rectangle inside an outline the colour of its own shadow. */
    box: (x, y, w, h, hx) => {
      c.rect(x - 1, y - 1, w + 2, h + 2, tint(rimOf(rgb(hx), C.ink, false)))
      c.rect(x, y, w, h, tint(hx))
    },
    /** A box lit from the top left: light along two edges, shade along the other two. */
    slab: (x, y, w, h, hx, depth = 0.14) => {
      p.box(x, y, w, h, hx)
      p.r(x, y + h - 1, w, 1, darken(hx, depth))
      p.r(x + w - 1, y, 1, h, darken(hx, depth))
      p.r(x, y, w, 1, lighten(hx, depth))
      p.r(x, y, 1, h - 1, lighten(hx, depth * 0.6))
    },
    /**
     * Something round or polished, seen from the front: strips of tone across
     * it. Each strip is [width, tone]: above 0 is lighter, below 0 darker.
     */
    strips: (x, y, h, hx, strips) => {
      let at = x
      for (const [w, tone] of strips) {
        p.r(at, y, w, h, tone > 0 ? lighten(hx, tone) : tone < 0 ? darken(hx, -tone) : hx)
        at += w
      }
    },
    /** From top to bottom through a list of colours, with the seams broken up. */
    fade: (x, y, w, h, colours, glows = false) => {
      const paint = glows ? p.e : p.r
      colours.forEach((colour, i) => {
        const y0 = y + Math.round((i * h) / colours.length)
        const y1 = y + Math.round(((i + 1) * h) / colours.length)
        paint(x, y0, w, y1 - y0, colour)
        if (i === 0) return
        for (let xx = x; xx < x + w; xx++) if (dithered(xx, y0 - 1, 0.5)) paint(xx, y0 - 1, 1, 1, colour)
      })
    },
    /** Rows of characters, each mapped to a colour. "." is skipped. */
    g: (x, y, rows, map) => {
      rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const hx = map[row[i]]
          if (hx) c.px(x + i, y + j, tint(hx))
        }
      })
    },
    text: (x, y, str, hx, opts) => c.text(x, y, str, tint(hx), opts),
    /** Changes the pixels already painted. */
    adjust: (x, y, w, h, fn, density = 1) => {
      for (let j = y; j < y + h; j++) {
        for (let i = x; i < x + w; i++) {
          if (density < 1 && !dithered(i, j, density)) continue
          const v = c.get(i, j)
          if ((v & 255) === 0) continue
          c.px(i, j, hex(fn(parts(v))))
        }
      }
    },
    /** A soft shadow on the floor: solid, then broken up at its edge. */
    shadow: (x, y, w, h) => {
      p.adjust(x, y, w, h - 1, inShade)
      p.adjust(x, y + h - 1, w, 1, inShade, 0.5)
    },
    /** Light on what is already painted: a glint, a reflection. */
    shine: (x, y, w, h, amount = 0.2, density = 1) =>
      p.adjust(x, y, w, h, (px) => mix(px, GLARE, amount), density),
    /** The reverse: a recess, a corner, the side away from the light. */
    dim: (x, y, w, h, amount = 0.16, density = 1) =>
      p.adjust(x, y, w, h, (px) => mix(mul(px, [1 - amount, 1 - amount, 1 - amount]), SHADOW, amount * 0.3), density),
  }
  return p
}

const SKIES = {
  dawn: { top: "#f0c890", bottom: "#c2d2c2", town: "#8a4c3a", lit: false, sun: [5, 12], cloud: "#fbe6c4" },
  day: { top: "#8fc0dc", bottom: "#d2e2d6", town: "#96533d", lit: false, sun: [5, 3], cloud: "#f4f8f2" },
  grey: { top: "#8d948f", bottom: "#aab0a6", town: "#6f5148", lit: false, sun: null, cloud: "#7f8782" },
  dusk: { top: "#5d4a7c", bottom: "#e08a52", town: "#4c2a33", lit: true, sun: [5, 15], cloud: "#8a5a86" },
  night: { top: "#10142a", bottom: "#222a48", town: "#161426", lit: true, sun: null, cloud: null },
}
const WINDOW_LIGHT = "#f8c868"
/** The sign on the wall: its board, and what it says. After dark it is a neon. */
const SIGN = { x: 66, y: 11, w: 35, h: 13, words: "WESHIPIT\n.TODAY" }
/** The glass of the window, on the picture. The game draws the rain on it. */
const GLASS = [150, 8, 32, 24]

function paintShell(p) {
  // The floor: boards laid across the room, with staggered joints. Each board
  // has its own tone, a lit edge, and a streak or two of grain.
  const boards = [C.floorA, C.floorB, C.floorC, darken(C.floorB, 0.07), lighten(C.floorA, 0.06)]
  for (let k = 0; FLOOR_Y + k * 6 < BOTTOM; k++) {
    const y = FLOOR_Y + k * 6
    const h = Math.min(6, BOTTOM - y)
    const joints = []
    for (let x = LEFT + 10 + ((k * 37) % 41); x < RIGHT; x += 47) joints.push(x)
    const ends = [LEFT, ...joints, RIGHT]
    for (let b = 0; b + 1 < ends.length; b++) {
      const x0 = ends[b]
      const x1 = ends[b + 1]
      const tone = boards[(k * 3 + b * 5 + 1) % boards.length]
      p.r(x0, y, x1 - x0, h, tone)
      p.r(x0, y + 1, x1 - x0, 1, lighten(tone, 0.1))
      if (h > 3) p.r(x0, y + h - 1, x1 - x0, 1, darken(tone, 0.07))
      for (let s = 0; s < 2 && h > 3; s++) {
        const length = 9 + ((k * 13 + b * 7 + s * 11) % 12)
        const room = x1 - x0 - length - 8
        if (room < 1 || (s === 1 && x1 - x0 < 40)) continue
        const gx = x0 + 4 + ((k * 29 + b * 17 + s * 23) % room)
        p.r(gx, y + 3 + ((k + b + s) % (h - 4)), length, 1, darken(tone, 0.06))
      }
    }
    p.r(LEFT, y, RIGHT - LEFT, 1, C.seam)
    for (const x of joints) p.r(x, y + 1, 1, h - 1, C.seam)
  }

  // The back wall: Lille brick, in courses, facing you. No two bricks came
  // out of the kiln alike; each is lit along its top and shaded along its bottom.
  const bricks = [C.brick, C.brickLight, C.brick, C.brickDark, C.brick, lighten(C.brick, 0.07), C.brick, darken(C.brick, 0.12), C.brick]
  p.r(LEFT, WALL_Y, RIGHT - LEFT, FLOOR_Y - WALL_Y, C.mortar)
  for (let row = 0; WALL_Y + row * 4 < FLOOR_Y - 4; row++) {
    const y = WALL_Y + row * 4
    for (let k = -1; k * 8 < RIGHT; k++) {
      const x = LEFT + k * 8 + (row % 2) * 4
      const x0 = Math.max(LEFT, x + 1)
      const x1 = Math.min(RIGHT, x + 8)
      if (x1 <= x0) continue
      const tone = bricks[(row * 7 + k * 13 + 60) % bricks.length]
      p.r(x0, y + 1, x1 - x0, 3, tone)
      p.r(x0, y + 1, x1 - x0, 1, lighten(tone, 0.12))
      p.r(x0, y + 3, x1 - x0, 1, darken(tone, 0.1))
    }
  }
  // The ceiling keeps the top of the wall in shade, step by step, and each
  // corner is darker than the middle.
  p.dim(LEFT, WALL_Y, RIGHT - LEFT, 3, 0.3)
  p.dim(LEFT, WALL_Y + 3, RIGHT - LEFT, 1, 0.3, 0.5)
  p.dim(LEFT, WALL_Y + 3, RIGHT - LEFT, 4, 0.14)
  p.dim(LEFT, WALL_Y + 7, RIGHT - LEFT, 1, 0.14, 0.5)
  for (const [inset, amount] of [[0, 0.18], [2, 0.09]]) {
    p.dim(LEFT + inset, WALL_Y, 2, FLOOR_Y - WALL_Y, amount)
    p.dim(RIGHT - 2 - inset, WALL_Y, 2, FLOOR_Y - WALL_Y, amount)
  }
  // Skirting board.
  p.r(LEFT, FLOOR_Y - 4, RIGHT - LEFT, 4, C.woodDark)
  p.r(LEFT, FLOOR_Y - 4, RIGHT - LEFT, 1, C.woodLight)
  p.r(LEFT, FLOOR_Y - 3, RIGHT - LEFT, 1, C.wood)
  p.r(LEFT, FLOOR_Y - 1, RIGHT - LEFT, 1, C.ink)
  // The wall throws a shadow on the first boards, and the room is darker
  // along its other three sides.
  p.shadow(LEFT, FLOOR_Y, RIGHT - LEFT, 4)
  for (const [inset, amount] of [[0, 0.16], [2, 0.08]]) {
    p.dim(LEFT + inset, FLOOR_Y, 2, BOTTOM - FLOOR_Y, amount)
    p.dim(RIGHT - 2 - inset, FLOOR_Y, 2, BOTTOM - FLOOR_Y, amount)
    p.dim(LEFT + 4, BOTTOM - 2 - inset, RIGHT - LEFT - 8, 2, amount)
  }

  // A heating pipe that has not been warm in years: round, so light along its
  // top, and a shadow on the brick under it. Rust under each bracket.
  p.r(LEFT, 6, 142, 2, C.steel)
  p.r(LEFT, 6, 142, 1, C.steelLight)
  p.dim(LEFT, 8, 142, 1, 0.3)
  p.dim(LEFT, 9, 142, 1, 0.3, 0.5)
  for (let x = 32; x < 146; x += 36) {
    p.r(x, 5, 2, 4, C.ink)
    p.r(x, 5, 1, 1, C.steel)
    p.r(x, 9, 1, 3, "#7a3a24")
  }

  // The tops of the walls, cut through: the room is a box with its lid off.
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
  // The door, at the bottom, and its mat: coir, woven.
  p.r(84, BOTTOM, 24, H - BOTTOM, C.floorB)
  p.r(84, BOTTOM, 24, 1, C.seam)
  p.slab(83, 113, 26, 8, "#6c7650")
  p.r(85, 115, 22, 4, "#7f8a5e")
  for (let y = 115; y < 119; y++) {
    for (let x = 85 + (y % 2) * 2; x < 107; x += 4) p.r(x, y, 2, 1, "#6c7650")
  }
}

function paintWindow(p, sky) {
  const [X, Y, GW, GH] = GLASS
  // Frame: light on its top and left, shade on the other two sides.
  p.box(X - 2, Y - 2, GW + 4, GH + 4, C.wood)
  p.r(X - 2, Y - 2, GW + 4, 1, C.woodLight)
  p.r(X - 2, Y - 2, 1, GH + 4, C.woodLight)
  p.r(X - 2, Y + GH + 1, GW + 4, 1, C.woodDark)
  p.r(X + GW + 1, Y - 1, 1, GH + 3, C.woodDark)
  p.r(X - 1, Y - 1, GW + 2, GH + 2, C.ink)
  // The sky, from its colour overhead to the one on the horizon.
  const steps = 6
  p.fade(X, Y, GW, GH, Array.from({ length: steps }, (_, i) => hex(mix(rgb(sky.top), rgb(sky.bottom), i / (steps - 1)))), true)
  if (sky === SKIES.night) {
    // The moon, with the sky a little lighter around it, and a few stars.
    p.adjust(X + 2, Y + 1, 8, 8, (px) => mix(px, [120, 130, 180], 0.16), 0.5)
    p.e(X + 4, Y + 3, 4, 4, "#e8e2c8")
    p.e(X + 4, Y + 3, 3, 1, "#fbf6e0")
    p.e(X + 6, Y + 3, 2, 2, sky.top)
    for (const [a, b] of [[12, 2], [19, 6], [27, 3], [29, 9], [15, 10]]) p.e(X + a, Y + b, 1, 1, "#e8e2c8")
    for (const [a, b] of [[23, 1], [10, 7], [30, 5]]) p.e(X + a, Y + b, 1, 1, "#8088b0")
  } else if (sky.sun) {
    const sun = sky === SKIES.dusk ? WINDOW_LIGHT : "#fbeeb8"
    p.adjust(X + sky.sun[0] - 2, Y + Math.max(0, sky.sun[1] - 2), 8, 8, (px) => mix(px, rgb(sun), 0.3), 0.5)
    p.e(X + sky.sun[0], Y + sky.sun[1], 4, 4, sun)
    p.e(X + sky.sun[0] + 1, Y + sky.sun[1] + 1, 2, 2, lighten(sun, 0.5))
  }
  if (sky.cloud) {
    // Flat clouds, lit along their tops.
    for (const [a, b, w] of [[14, 2, 8], [22, 6, 9], [1, 9, 7]]) {
      p.e(X + a + 1, Y + b, w - 2, 1, lighten(sky.cloud, 0.3))
      p.e(X + a, Y + b + 1, w, 1, sky.cloud)
    }
  }
  // The belfry and a row of stepped Flemish gables, the sun on their left.
  const town = sky.town
  const shade = darken(town, 0.22)
  const sunny = sky.lit ? town : lighten(town, 0.16)
  p.e(X + 22, Y + 3, 1, 3, town)
  p.e(X + 21, Y + 6, 3, 4, town)
  p.e(X + 20, Y + 10, 5, 14, town)
  p.e(X + 20, Y + 10, 1, 14, sunny)
  p.e(X + 24, Y + 10, 1, 14, shade)
  if (sky.lit) p.e(X + 22, Y + 8, 1, 1, WINDOW_LIGHT)
  const gables = [
    { a: 0, w: 7, h: 9 },
    { a: 8, w: 6, h: 7 },
    { a: 14, w: 6, h: 10 },
    { a: 26, w: 6, h: 8 },
  ]
  gables.forEach((g, i) => {
    p.e(X + g.a, Y + GH - g.h, g.w, g.h, town)
    p.e(X + g.a, Y + GH - g.h, 1, g.h, sunny)
    p.e(X + g.a + g.w - 1, Y + GH - g.h, 1, g.h, shade)
    p.e(X + g.a + 1, Y + GH - g.h - 1, g.w - 2, 1, town)
    p.e(X + g.a + 2, Y + GH - g.h - 2, g.w - 4, 1, town)
    p.e(X + g.a + 2, Y + GH - g.h + 2, 2, 2, sky.lit && i !== 1 ? WINDOW_LIGHT : shade)
    if (g.h > 8) p.e(X + g.a + 2, Y + GH - g.h + 6, 2, 2, sky.lit && i === 2 ? WINDOW_LIGHT : shade)
  })
  // The glass: light slides across each pane, from the top right.
  for (const px of [X, X + 17]) {
    for (const py of [Y, Y + 13]) {
      for (let i = 0; i < 6; i++) p.shine(px + 11 - i, py + 2 + i, 2, 1, 0.16)
      for (let i = 0; i < 3; i++) p.shine(px + 5 - i, py + 2 + i, 1, 1, 0.12)
    }
  }
  // Glazing bars, with the light catching one edge, and the sill.
  p.r(X + 15, Y, 2, GH, C.woodDark)
  p.r(X, Y + 11, GW, 2, C.woodDark)
  p.r(X + 15, Y, 1, GH, C.wood)
  p.r(X, Y + 11, GW, 1, C.wood)
  p.box(X - 4, Y + GH + 2, GW + 8, 2, C.woodLight)
  p.r(X - 4, Y + GH + 2, GW + 8, 1, lighten(C.woodLight, 0.2))
  // The sill's shadow on the brick, and where rain has run down from its ends.
  p.dim(X - 3, Y + GH + 5, GW + 6, 1, 0.26)
  p.dim(X - 3, Y + GH + 6, 1, 5, 0.2)
  p.dim(X + GW + 2, Y + GH + 6, 1, 4, 0.2)
}

function paintWallThings(p) {
  // The fridge, against the wall, clear of the bed: enamelled steel, with the
  // light sliding across it from the left.
  const F = 42
  p.shadow(F - 1, 48, 23, 3)
  p.box(F, 10, 20, 38, C.metal)
  p.strips(F, 10, 38, C.metal, [[1, 0.24], [2, 0.08], [2, 0.26], [1, 0.1], [6, 0], [4, -0.1], [3, -0.2], [1, -0.08]])
  // Its top, seen from above, and the door seals.
  p.r(F, 10, 20, 4, C.metalLight)
  p.r(F, 10, 20, 1, lighten(C.metalLight, 0.3))
  p.r(F + 17, 11, 3, 3, C.metal)
  p.r(F, 14, 20, 1, C.metalDark)
  p.r(F + 1, 25, 18, 1, C.ink)
  p.r(F + 1, 26, 18, 1, C.metalLight)
  for (const [y, h] of [[17, 6], [28, 9]]) {
    p.r(F + 15, y, 2, h, C.white)
    p.r(F + 15, y, 1, h - 1, "#ffffff")
    p.r(F + 16, y + h - 1, 1, 1, C.whiteShade)
    p.r(F + 17, y, 1, h + 1, C.ink)
  }
  // A kebab-shop magnet, and a note held under it.
  p.r(F + 4, 29, 3, 3, C.gold)
  p.r(F + 4, 29, 2, 1, lighten(C.gold, 0.4))
  p.r(F + 5, 30, 1, 1, C.red)
  p.r(F + 3, 33, 6, 7, C.paper)
  p.r(F + 3, 39, 6, 1, C.whiteShade)
  p.r(F + 8, 33, 1, 7, C.whiteShade)
  p.r(F + 4, 35, 4, 1, C.beigeDark)
  p.r(F + 4, 37, 3, 1, C.beigeDark)
  p.dim(F + 4, 40, 6, 1, 0.2)
  for (const y of [43, 45]) {
    p.r(F + 3, y, 12, 1, C.metalDark)
    p.r(F + 3, y + 1, 12, 1, C.metalLight)
  }
  p.r(F, 46, 3, 2, "#7a3a24")
  p.r(F + 1, 45, 1, 1, "#7a3a24")

  // The MRR chart, over the bed. The game draws the bars under the kebab line.
  const P = 9
  p.dim(P + 1, 35, 29, 1, 0.3)
  p.dim(P + 29, 12, 1, 23, 0.2)
  p.box(P, 10, 28, 24, C.paper)
  p.r(P, 10, 28, 1, lighten(C.paper, 0.4))
  p.r(P, 33, 28, 1, C.whiteShade)
  p.r(P + 27, 11, 1, 22, C.whiteShade)
  for (let x = P + 2; x < P + 26; x += 3) p.r(x, 15, 2, 1, C.gold)
  p.r(P + 2, 30, 24, 1, C.ink)
  for (const x of [P + 1, P + 26]) {
    p.r(x, 11, 1, 1, C.red)
    p.dim(x, 12, 1, 1, 0.2)
  }

  // The sign, on two lines, and under it a shelf of books that have all been started.
  p.slab(SIGN.x, SIGN.y, SIGN.w, SIGN.h, "#33261f", 0.2)
  p.text(SIGN.x + 17, SIGN.y + 1, SIGN.words, C.gold, { align: "c" })
  p.dim(70, 38, 23, 1, 0.3)
  p.box(70, 35, 23, 2, C.wood)
  p.r(70, 35, 23, 1, C.woodLight)
  const books = [["#c0432f", 7], ["#3f8f86", 6], [C.gold, 8], ["#4f6f8a", 7], ["#7a58b8", 6], [C.white, 8]]
  books.forEach(([col, h], i) => {
    const x = 72 + i * 3
    p.r(x, 35 - h, 2, h, col)
    p.r(x, 35 - h, 1, h, lighten(col, 0.22))
    p.r(x, 35 - h + 2, 2, 1, darken(col, 0.3))
    p.r(x + 2, 35 - h, 1, h, C.ink)
  })
}

function paintDesk(p, lampOn) {
  // Under the desk, the floor is in shade.
  p.shadow(97, 56, 46, 7)
  // Legs, then the drawers on the right: two fronts, each with its handle.
  p.box(97, 56, 3, 5, C.woodDark)
  p.r(97, 56, 1, 5, C.wood)
  p.box(127, 49, 16, 12, C.wood)
  p.r(127, 54, 16, 1, C.ink)
  for (const [y, h] of [[49, 5], [55, 6]]) {
    p.r(127, y, 16, 1, C.woodLight)
    p.r(127, y + h - 1, 16, 1, C.woodDark)
    p.r(142, y, 1, h, C.woodDark)
    p.r(133, y + 2, 4, 1, C.gold)
    p.r(133, y + 2, 1, 1, lighten(C.gold, 0.5))
    p.r(133, y + 3, 4, 1, darken(C.wood, 0.3))
  }
  // The top, seen from above: its grain, and its front edge.
  p.box(96, 36, 48, 12, C.woodLight)
  p.r(96, 46, 48, 1, C.wood)
  p.r(96, 47, 48, 1, C.woodDark)
  p.r(96, 36, 48, 1, lighten(C.woodLight, 0.2))
  for (const [x, y, w] of [[100, 40, 30], [98, 44, 22], [112, 38, 26], [121, 42, 20], [99, 42, 9]]) {
    p.r(x, y, w, 1, darken(C.woodLight, 0.09))
  }
  // The rail under it, in the shadow of the top.
  p.box(96, 49, 30, 6, C.wood)
  p.r(96, 49, 30, 1, C.woodDark)
  p.r(96, 50, 30, 1, C.woodLight)
  p.r(96, 54, 30, 1, C.woodDark)

  // A mug, gone cold.
  p.box(127, 39, 4, 4, C.white)
  p.r(128, 39, 2, 1, "#4a3020")
  p.r(130, 40, 1, 3, C.whiteShade)
  p.r(127, 40, 1, 2, "#ffffff")
  p.dim(127, 44, 5, 1, 0.14)

  // The terminal: you see what is on its screen.
  p.box(108, 20, 18, 20, C.beigeMid)
  p.r(108, 20, 18, 3, C.beige)
  p.r(108, 20, 18, 1, lighten(C.beige, 0.35))
  p.r(108, 23, 1, 17, C.beige)
  p.r(124, 23, 2, 17, C.beigeDark)
  p.r(108, 39, 18, 1, C.beigeDark)
  for (let x = 113; x < 123; x += 2) p.r(x, 21, 1, 1, C.beigeDark)
  // The tube: sunk into the case, and curved, so the room shows in one corner.
  p.box(110, 24, 14, 11, "#17211b")
  p.r(110, 24, 14, 1, "#0e1511")
  p.r(110, 24, 1, 11, "#0e1511")
  p.r(112, 26, 4, 1, "#33453a")
  p.r(112, 27, 2, 1, "#273529")
  p.r(123, 25, 1, 10, "#22302a")
  p.r(110, 37, 6, 1, C.beigeDark)
  p.r(110, 38, 6, 1, C.beige)
  p.r(122, 37, 1, 1, "#5fd070")
  // Keyboard.
  p.box(108, 42, 18, 4, C.beige)
  p.r(108, 42, 18, 1, lighten(C.beige, 0.3))
  for (let x = 109; x < 125; x += 2) {
    p.r(x, 43, 1, 1, C.beigeDark)
    p.r(x, 45, 1, 1, C.beigeDark)
  }
  p.dim(108, 47, 19, 1, 0.14)

  // Lamp.
  p.box(132, 42, 6, 2, C.metalDark)
  p.r(132, 42, 6, 1, C.metal)
  p.r(134, 31, 2, 11, C.ink)
  p.r(134, 31, 1, 11, C.metalLight)
  if (lampOn) {
    c_glowShade(p)
  } else {
    p.box(131, 26, 8, 2, C.metalLight)
    p.r(131, 26, 8, 1, lighten(C.metalLight, 0.3))
    p.box(130, 28, 10, 3, C.metal)
    p.strips(130, 28, 3, C.metal, [[1, 0.24], [2, 0.1], [4, 0], [3, -0.16]])
    p.r(130, 30, 10, 1, C.metalDark)
  }

  // The stool, pushed in.
  p.shadow(111, 66, 13, 3)
  for (const x of [113, 119]) {
    p.box(x, 62, 2, 5, C.steel)
    p.r(x, 62, 1, 5, C.steelLight)
  }
  p.box(111, 57, 12, 5, C.metal)
  p.r(111, 57, 12, 2, C.metalLight)
  p.r(111, 57, 12, 1, lighten(C.metalLight, 0.25))
  p.r(121, 59, 2, 3, C.metalDark)
  p.r(111, 61, 12, 1, C.metalDark)

  // A bin, for what does not make it to the floor: round, so lit down one side.
  p.shadow(146, 57, 9, 3)
  p.box(146, 47, 8, 10, C.metalDark)
  p.strips(146, 49, 8, C.metalDark, [[1, 0.3], [1, 0.12], [3, 0], [2, -0.16], [1, -0.05]])
  p.r(146, 47, 8, 2, "#2c3029")
  p.r(146, 47, 8, 1, C.metal)
  p.r(148, 47, 3, 1, C.paper)
  p.r(148, 48, 2, 1, C.whiteShade)
}

/** The lamp's shade when it is lit: it gives off its own light. */
function c_glowShade(p) {
  p.box(131, 26, 8, 2, "#fff0c0")
  p.box(130, 28, 10, 3, "#ffe090")
  p.e(131, 26, 8, 2, "#fff4cc")
  p.e(130, 28, 10, 3, "#ffdf8a")
  p.e(131, 28, 4, 1, "#fff6d8")
  p.e(130, 30, 10, 1, "#f0b850")
}

function paintBed(p) {
  // The bed runs along the left wall, its head towards the back.
  p.shadow(38, 58, 3, 52)
  p.shadow(8, 110, 31, 3)
  // Headboard: iron rails, each with the light on one edge.
  p.box(8, 48, 30, 9, "#4a4a44")
  p.r(8, 48, 30, 1, "#8a8a7e")
  p.r(8, 49, 30, 1, "#5e5e56")
  for (let x = 11; x < 37; x += 5) {
    p.r(x, 50, 2, 6, "#2a2a27")
    p.r(x + 2, 50, 1, 6, "#66665c")
  }
  // Sheet and pillow: the pillow is soft, so its edges turn away from the light.
  p.box(8, 57, 30, 46, C.white)
  p.r(36, 57, 2, 13, C.whiteShade)
  p.box(12, 59, 22, 9, "#fffaf0")
  p.r(12, 66, 22, 2, C.whiteShade)
  p.r(32, 60, 2, 6, C.whiteShade)
  p.r(18, 61, 10, 4, C.white)
  for (const [x, y] of [[12, 59], [33, 59], [12, 67], [33, 67]]) p.r(x, y, 1, 1, C.beigeMid)
  // An army blanket, turned down: two dark bands at each end, and its folds,
  // each a crease with the light on the ridge above it.
  p.r(8, 70, 30, 2, C.whiteShade)
  p.r(8, 72, 30, 31, C.blanket)
  p.r(8, 72, 30, 2, C.blanketLight)
  for (const y of [76, 78, 98, 100]) p.r(8, y, 30, 1, C.blanketDark)
  for (const [x, y, w] of [[13, 84, 14], [19, 90, 13], [11, 94, 9]]) {
    p.r(x, y, w, 1, C.blanketDark)
    p.r(x + 1, y - 1, w - 2, 1, C.blanketLight)
  }
  p.r(8, 72, 1, 31, C.blanketLight)
  p.dim(30, 74, 6, 29, 0.1)
  p.r(36, 72, 2, 31, C.blanketDark)
  p.r(8, 71, 30, 1, C.ink)
  // The foot of the bed.
  p.box(8, 103, 30, 6, C.blanketDark)
  p.r(8, 103, 30, 1, C.blanket)
  p.r(8, 108, 30, 1, darken(C.blanketDark, 0.2))
  for (const x of [8, 35]) {
    p.box(x, 109, 3, 2, "#2f2f2b")
    p.r(x, 109, 1, 1, "#66665c")
  }

  // A crate for a bedside table, and a radio that has seen better decades.
  p.shadow(42, 78, 14, 3)
  p.box(42, 66, 13, 5, C.woodLight)
  p.r(42, 66, 13, 1, lighten(C.woodLight, 0.2))
  p.r(42, 70, 13, 1, C.wood)
  p.box(42, 71, 13, 7, C.wood)
  for (const y of [73, 76]) {
    p.r(42, y, 13, 1, C.woodDark)
    p.r(42, y + 1, 13, 1, C.woodLight)
  }
  p.r(54, 71, 1, 7, C.woodDark)
  for (const [x, y] of [[43, 72], [53, 72], [43, 75], [53, 75]]) p.r(x, y, 1, 1, C.ink)
  p.box(44, 60, 9, 7, "#8d6a48")
  p.r(44, 60, 9, 1, "#b89468")
  p.r(52, 61, 1, 6, "#6e5036")
  p.r(45, 62, 3, 3, "#2e2118")
  p.r(46, 62, 1, 3, "#5a4430")
  p.r(50, 62, 2, 2, C.gold)
  p.r(50, 62, 1, 1, lighten(C.gold, 0.5))
  p.r(49, 65, 3, 1, "#6e5036")
  p.r(53, 54, 1, 6, C.steelLight)
  p.r(54, 52, 1, 3, C.steelLight)
  p.r(54, 52, 1, 1, "#ffffff")
}

function paintRug(p) {
  // A rug that was red once, with a fringe at each end. Its pile catches the
  // light along the top and the left of each band.
  p.box(68, 72, 72, 34, C.rugDark)
  p.r(70, 74, 68, 30, C.rug)
  p.r(73, 77, 62, 24, C.rugDark)
  p.r(75, 79, 58, 20, C.rug)
  p.r(70, 74, 68, 1, C.rugLight)
  p.r(70, 74, 1, 30, C.rugLight)
  p.r(70, 103, 68, 1, darken(C.rug, 0.14))
  p.r(137, 75, 1, 28, darken(C.rug, 0.14))
  p.r(75, 79, 58, 1, darken(C.rug, 0.14))
  p.r(75, 79, 1, 20, darken(C.rug, 0.14))
  p.r(76, 98, 57, 1, C.rugLight)
  p.r(132, 80, 1, 18, C.rugLight)
  // A gold square in each corner of the border, and lozenges down the middle.
  for (const [x, y] of [[71, 75], [135, 75], [71, 101], [135, 101]]) {
    p.r(x, y, 2, 2, C.gold)
    p.r(x, y, 1, 1, lighten(C.gold, 0.4))
  }
  for (let i = 0; i < 4; i++) {
    const x = 82 + i * 13
    p.g(x, 87, [".gg.", "gGGg", "gGGg", ".gg."], { g: C.gold, G: C.rugDark })
    p.r(x + 1, 87, 1, 1, lighten(C.gold, 0.4))
    p.r(x + 2, 90, 1, 1, darken(C.gold, 0.25))
  }
  for (let y = 73; y < 106; y += 2) {
    p.r(66, y, 2, 1, C.paper)
    p.r(140, y, 2, 1, C.paper)
    p.r(67, y, 1, 1, C.whiteShade)
    p.r(141, y, 1, 1, C.whiteShade)
  }
}

function paintPot(p) {
  // Terracotta, and round: lit down the left, in shade down the right.
  p.shadow(163, 61, 16, 3)
  p.box(165, 50, 12, 10, C.pot)
  p.strips(165, 51, 9, C.pot, [[1, 0.3], [2, 0.14], [5, 0], [2, -0.14], [2, -0.26]])
  p.box(164, 48, 14, 3, C.potLight)
  p.r(164, 48, 14, 1, lighten(C.potLight, 0.25))
  p.r(175, 49, 3, 2, C.pot)
  p.r(166, 49, 10, 1, "#4a3020")
  p.r(164, 50, 14, 1, C.potDark)
}

/** Daylight through the window, falling across the floor. */
function paintSun(p, reach) {
  const warm = (px) => mix(px, [255, 236, 190], 0.2)
  for (let j = 0; j < reach; j++) {
    const y = FLOOR_Y + 4 + j
    const x = 148 - Math.round(j * 0.7)
    const density = j >= reach - 3 ? 0.5 : 1
    // Two panes, so two patches, with the glazing bar's shadow between them.
    p.adjust(x, y, 14, 1, warm, density)
    p.adjust(x + 17, y, 14, 1, warm, density)
  }
}

/** The whole flat, in one light. */
function paintRoom(c, { grade, sky, sun, lamp }) {
  const p = painter(c, grader(grade))
  paintShell(p)
  paintWindow(p, SKIES[sky])
  paintRug(p)
  if (sun) paintSun(p, sun)
  paintWallThings(p)
  paintBed(p)
  paintDesk(p, lamp)
  paintPot(p)
}

// One painting per light. Names starting with "_" are parts of the final scenes.
const LIGHTS = {
  morning: { grade: "morning", sky: "dawn", sun: 46, lamp: false },
  morning_rain: { grade: "rain", sky: "grey", sun: 0, lamp: false },
  afternoon: { grade: "day", sky: "day", sun: 30, lamp: false },
  afternoon_rain: { grade: "rain", sky: "grey", sun: 0, lamp: false },
}
for (const [name, light] of Object.entries(LIGHTS)) {
  scene("room_" + name, { w: W, h: H }, (c) => paintRoom(c, light))
}

// After dark the lamp is on. Its light falls off in steps: each step is the
// whole room painted a little darker, cut to a ring around the lamp, with a
// dithered rim so one step breaks into the next.
const LAMP = [135, 34]
const DARK = {
  evening: { sky: "dusk", steps: [["evening1", 46], ["lamp", 28]] },
  night: { sky: "night", steps: [["night2", 54], ["night1", 40], ["lamp", 26]] },
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

// The sign after dark: the tubes, lit, and the light they throw on the board
// and on the brick around it. It is one colour, and it is see-through, so it
// sits on the wall in whatever light the wall is in.
const NEON = "#61dafb"
const NEON_REACH = 5
/** How strong the light still is, by distance from a tube, in pixels. */
const NEON_FALLOFF = [[1.5, 0.3], [2.5, 0.2], [3.7, 0.12], [NEON_REACH, 0.06]]
sprite("neon", { w: SIGN.w + NEON_REACH * 2, h: SIGN.h + NEON_REACH * 2 }, (c) => {
  const w = SIGN.w + NEON_REACH * 2
  const h = SIGN.h + NEON_REACH * 2
  c.text(NEON_REACH + 17, NEON_REACH + 1, SIGN.words, lighten(NEON, 0.45), { align: "c" })
  const tubes = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (c.get(x, y) & 255) tubes.push([x, y])
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (c.get(x, y) & 255) continue
      const far = Math.min(...tubes.map(([tx, ty]) => Math.hypot(tx - x, ty - y)))
      const step = NEON_FALLOFF.find(([reach]) => far <= reach)
      if (step) c.px(x, y, NEON + Math.round(step[1] * 255).toString(16).padStart(2, "0"))
    }
  }
})

/** The same, seen from the side: the profile is ten wide and faces right. */
function sideProps(who) {
  switch (who) {
    case "david": // the band edge-on, one cup over the ear
      return [rect(3, 0, 2, 1, "k"), rect(3, 1, 1, 5, "k"), rect(2, 6, 3, 4, "e"), px(2, 6, "R")]
    case "karl": // the board, and the tassel at the back
      return [rect(0, 1, 9, 1, "W"), rect(1, 0, 7, 1, "W"), rect(2, 0, 5, 1, "w"), rect(2, 2, 5, 1, "k"), rect(0, 2, 1, 4, "a")]
    case "mickael": // one cup, and the microphone out in front
      return [rect(3, 0, 2, 1, "s"), rect(3, 1, 1, 5, "s"), rect(2, 6, 3, 4, "k"), rect(5, 10, 3, 1, "k"), px(8, 10, "s")]
    case "christophe": // the mask goes all the way round
      return [rect(0, 7, 8, 2, "r"), px(6, 7, "x"), px(6, 8, "k")]
    case "matthys": // the peak points where he looks
      return [rect(1, 1, 7, 3, "y"), rect(1, 3, 7, 1, "w"), rect(6, 4, 4, 1, "w"), rect(5, 7, 4, 2, "k"), px(6, 7, "s")]
    default:
      return []
  }
}

for (const g of GRADES) {
  const tint = grader(g)

  // The MRR bars on the wall chart, from one step to the kebab line (8).
  for (let step = 1; step <= 8; step++) {
    sprite(`chart_${step}_${g}`, { w: 24, h: 14 }, (c) => {
      for (let i = 0; i < 7; i++) {
        const ramp = Math.pow((i + 1) / 7, 1.6)
        const h = Math.round(ramp * (step / 8) * 14)
        if (h === 0) continue
        const col = step === 8 ? "#4f9a4a" : "#4f6f8a"
        c.rect(1 + i * 3, 14 - h, 2, h, tint(col))
        c.rect(1 + i * 3, 14 - h, 1, h, tint(lighten(col, 0.2)))
      }
    })
  }

  // The plant lives and dies with your morale.
  const leaf = (c, rows, map) =>
    rows.forEach((row, j) => [...row].forEach((ch, i) => map[ch] && c.px(i, j, tint(map[ch]))))
  const greens = { k: C.ink, d: C.leafDark, l: C.leaf, h: C.leafLight, s: "#7a5c36" }
  sprite(`plant_lush_${g}`, { w: 22, h: 24 }, (c) =>
    leaf(c, [
      "........kkk...........",
      ".......khhlk..........",
      "..kk..khllldk....kk...",
      ".khhk.klllddk..kkhhk..",
      "khllhkkldddk..khhllk..",
      "klllldkkdddk.khlllldk.",
      "kllldddkkdk.khllllddk.",
      ".kldddddkkkkklllldddk.",
      "..kkddddkdlkllldddkk..",
      "....kkkkkdlklddddk....",
      ".kkk....kdlkkkkkk.....",
      "khhhkk..kdlk...kkkk...",
      "khllllkkkdlk.kkhhhhk..",
      "klllllddkdlkkhhllllk..",
      ".kllddddkdlkhllllldk..",
      "..kkdddkkdlklllldddk..",
      "....kkk.kdlkkdddddk...",
      "........kdlk.kkkkk....",
      "........kdlk..........",
      "........kdlk..........",
      "........kdlk..........",
      "........kddk..........",
      "........kddk..........",
      ".........kk...........",
    ], greens), (c) => relight(c, tint(C.ink)))
  const tired = { k: C.ink, d: "#7d8a4a", l: "#a3a65a", h: "#c0c070", s: "#7a5c36" }
  sprite(`plant_wilting_${g}`, { w: 22, h: 24 }, (c) =>
    leaf(c, [
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      ".........kk...........",
      "........khlk..........",
      "........kllk..........",
      "..kkkk..kdlk..kkkk....",
      ".khlllkkkdlkkkllllk...",
      "kllldddkkdlkllldddlk..",
      "klddkkkkkdlkkkkkddlk..",
      "kldk....kdlk....kdlk..",
      ".kk.....kdlk....kldk..",
      "........kdlk.....kk...",
      "........kdlk..........",
      "........kdlk..........",
      "........kdlk..........",
      "........kdlk..........",
      "........kdlk..........",
      "........kddk..........",
      "........kddk..........",
      ".........kk...........",
    ], tired), (c) => relight(c, tint(C.ink)))
  sprite(`plant_dead_${g}`, { w: 22, h: 24 }, (c) =>
    leaf(c, [
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "......................",
      "...........kk.........",
      "..........kssk........",
      "......kk..ksk.........",
      ".....kssk.ksk..kk.....",
      "......kssksskkssk.....",
      ".......kssssssk.......",
      "........ksssk.........",
      "........kssk..........",
      "........kssk..........",
      "........kssk..........",
      "........kssk..........",
      ".....ks.kssk..........",
      "......k..kk...........",
    ], greens), (c) => relight(c, tint(C.ink)))

  // A bowl of pasta: they pile up at the end of the desk.
  sprite(`bowl_${g}`, { w: 9, h: 5 }, (c) =>
    leaf(c, [".kkkkkkk.", "kyyyyyyyk", "kwwwwwwwk", ".kwwwwwk.", "..kkkkk.."], {
      k: C.ink, y: "#f2da8a", w: C.white,
    }), (c) => relight(c, tint(C.ink)))

  // A kebab wrapper on the floor.
  sprite(`wrapper_${g}`, { w: 8, h: 6 }, (c) =>
    leaf(c, ["..kkkk..", ".kwwwwk.", "kwwwgwwk", "kwsswwwk", ".kssssk.", "..kkkk.."], {
      k: C.ink, w: "#e6e0cc", s: "#bdb6a2", g: C.gold,
    }), (c) => relight(c, tint(C.ink)))
}

// What is on the terminal's screen. Screens give off their own light, so one
// set does for every hour.
const SCREEN = {
  bg: "#0d2416", dark: "#0a1d12", halo: "#16361f", glint: "#2f5a3c",
  bright: "#74f08a", dim: "#3fae55", bone: "#e8dcb8", amber: "#f0a93c",
}
const SCREENS = {
  code: (line, f) => {
    line(1, 1, 6, SCREEN.bright)
    line(3, 3, 8, SCREEN.dim)
    line(3, 5, 5, SCREEN.dim)
    line(1, 7, 9, SCREEN.bright)
    if (f === 0) line(1, 9, 2, SCREEN.bright)
  },
  ship: (line, f) => {
    line(1, 1, 12, SCREEN.amber)
    line(1, 4, f === 0 ? 5 : 11, SCREEN.bright)
    line(1, 5, f === 0 ? 5 : 11, SCREEN.bright)
    line(1, 8, 6, SCREEN.dim)
  },
  chat: (line, f) => {
    line(1, 1, 7, SCREEN.bone)
    line(1, 2, 5, SCREEN.bone)
    line(5, 5, 8, SCREEN.bright)
    if (f === 0) line(1, 8, 4, SCREEN.bone)
  },
  invoice: (line) => {
    line(1, 1, 6, SCREEN.bone)
    line(9, 1, 4, SCREEN.bright)
    line(1, 4, 6, SCREEN.bone)
    line(9, 4, 4, SCREEN.bright)
    line(1, 6, 12, SCREEN.dim)
    line(7, 8, 6, SCREEN.amber)
  },
}
for (const [kind, draw] of Object.entries(SCREENS)) {
  for (const f of [0, 1]) {
    sprite(`screen_${kind}_${f}`, { w: 14, h: 11 }, (c) => {
      c.rect(0, 0, 14, 11, SCREEN.bg)
      // A tube: every other line is a little darker, and the phosphor glows
      // around whatever is lit.
      for (let y = 1; y < 11; y += 2) c.rect(0, y, 14, 1, SCREEN.dark)
      draw((x, y, w, col) => {
        c.rect(Math.max(0, x - 1), y, Math.min(14, x + w + 1) - Math.max(0, x - 1), 1, SCREEN.halo)
        c.rect(x, y, w, 1, col)
      }, f)
      c.rect(11, 1, 2, 1, SCREEN.glint)
      c.px(12, 2, SCREEN.glint)
    })
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * Everyone shares one body and an emoji-yellow face. The members are told
 * apart by a signature prop, by how their hair falls and by what they wear,
 * not by a likeness: real portraits come later, once each member has approved
 * theirs. They are drawn the way a 16-bit role-playing game draws its party:
 * a large head, eyes two pixels tall, and a costume you can read at a glance.
 * The faces in faces.px.js are the same five people, close up.
 */
const BODY = {
  k: "#2a1c18", // outline
  K: "#4a3020", // hair
  L: "#6e4a30", // hair, in light
  Z: "#33201a", // hair, in shade
  H: "#f2c24f", // skin
  Y: "#d09a36", // skin, in shade
  I: "#fbe08a", // skin, in light
  m: "#a8522f", // mouth
  M: "#5c2014", // mouth, wide open
  n: "#8a5230", // grilled meat
  b: "#dba56c", // bread
  Q: "#4a5568", // trousers
  U: "#343c4c", // trousers, in shade
  q: "#627089", // trousers, where the light catches a crease
  S: "#3a2a20", // shoes
  O: "#5e4636", // shoes, in light
  o: "#7a5c40", // their soles
  x: "#f4eedd", // white
  X: "#d5ccb4", // white, in shade
  a: "#e8b04a", // gold
  s: "#98a093", // steel
  r: "#c0432f", // red
  R: "#8c2c22", // red, in shade
  e: "#e0583f", // headphone cups
  y: "#f0c050", // cap
  w: "#c9952e", // cap, in shade
  g: "#5fa04a", // salad
}

/** The shirt, then trousers and shoes: `wear` replaces colours of the shared body. */
const PEOPLE = {
  // A hoodie, dark jeans, and trainers as red as his headphones.
  david: { shirt: "#3f9a90", wear: { S: "#8c2c22", O: "#e0583f" } },
  // A shirt and tie, chinos, brown shoes.
  karl: { shirt: "#e4decb", wear: { Q: "#8f7d5c", U: "#6c5c42", q: "#a8966e", S: "#4a3020", O: "#6e4a30" } },
  // Grey trousers, white trainers.
  mickael: { shirt: "#d98234", wear: { Q: "#5a5a66", U: "#40404c", q: "#74747f", S: "#b8b0a0", O: "#f4eedd" } },
  // Tights and red boots, as the trade requires.
  christophe: { shirt: "#4a6fc0", wear: { Q: "#34477a", U: "#26345c", q: "#4a5f98", S: "#8c2c22", O: "#c0432f" } },
  // Black joggers, and trainers as yellow as his cap.
  matthys: { shirt: "#8a62cc", wear: { Q: "#3c3644", U: "#2a2630", q: "#544c5e", S: "#c9952e", O: "#f0c050" } },
}

/** Half of the body: it is the same on both sides. Fourteen wide once mirrored. */
const FRONT = `
  ..KKKKK
  .KLLKKK
  KKLLKKK
  KLLKKLK
  KKKKKYY
  KKZHHHH
  KHHxkHH
  ZHHxkHH
  .YHHHHH
  ..YHHHm
  ...YYYY
  ...cCCC
  ..cCDDC
  .cCcCCC
  .cCcCCC
  .cCcCCC
  .HccCCC
  ..cCCCC
  ..UUUUU
  ..UQqQQ
  ..UQqQ.
  ..UQqQ.
  ..UQQQ.
  ..UQQQ.
  ..SOOS.
  .SSSSS.`
const BACK = `
  ..KKKKK
  .KLLKKK
  KKLLKKK
  KLLKKLK
  KKKKKKK
  KKKKKKK
  ZKKKKKK
  ZKKKKKK
  .ZZKKKK
  ..YZZKK
  ...YYYY
  ...cCCC
  ..cCDDC
  .cCcCCC
  .cCcCCC
  .cCcCCC
  .HccCCC
  ..cCCCC`
/**
 * Doubled over with hunger, the way a role-playing hero drops to one knee
 * when hurt: head down, brows knit, eyes screwed shut, mouth open, both hands pressed
 * to the stomach, knees giving way. Half of it: fourteen wide once mirrored.
 */
const HUNCH = `
  .......
  .......
  ..KKKKK
  .KLLKKK
  KKLLKKK
  KLLKKLK
  KKKKKYY
  KKZHHHK
  KHHHKKH
  ZHHkHHH
  .YHHkHH
  ..YkHmM
  ...YYYY
  ..cCCCC
  .cCcDDC
  .cCcCCC
  .cccHHH
  .ccHHHH
  ..cCCCC
  ..UUUUU
  ..UQqQQ
  ..UQQ..
  .UQQ...
  .UQQ...
  .SOS...
  SSSS...`
/** Seen from the side, facing right: one frame of a spin. Not mirrored. */
const SIDE = `
  ..KKKKK..
  .KLLKKKK.
  .KLLKKKK.
  KKKKLKKK.
  KKKKKYYY.
  KKKKHHHH.
  KZKHHxkH.
  KZKHHxkHH
  .ZYHHHHH.
  ..YYHHHm.
  ...YYYY..
  ...cCCC..
  ..cCCDC..
  ..cCcCC..
  ..cCcCC..
  ..cCcCC..
  ..cCHCC..
  ..cCCCC..
  ..UUUUU..
  ..UQqQQ..
  ..UQqQQ..
  ..UQqQ...
  ..UQQQ...
  ..UQQQ...
  ..SOSS...
  ..SSSSSS.`
/** Seen from behind and standing: the back of the seated figure, on the legs of the standing one. */
const rows = (grid) => grid.trim().split("\n").map((row) => row.trim())
const AWAY = [...rows(BACK), ...rows(FRONT).slice(18)].join("\n")
const ASLEEP = `
  ..KKKKK
  .KLLKKK
  KKLLKKK
  KLLKKLK
  KKKKKYY
  KKZHHHH
  KHHHHHH
  ZHHYYHH
  .YHHHHH
  ..YHHHm
  ...YHHH`

/**
 * Sitting on the floor to eat, eyes shut with pleasure, mouth closed on a
 * mouthful. Half of it: sixteen wide once mirrored.
 */
const SIT = `
  ...KKKKK
  ..KLLKKK
  .KKLLKKK
  .KLLKKLK
  .KKKKKYY
  .KKZHHHH
  .KHHHkHH
  .ZHHkHkH
  ..YHHHHH
  ...YHHmm
  ....YYYY
  ....cCCC
  ...cCDDC
  ..cCcCCC
  ..cCcCCC
  ..cCcCCC
  ..ccCCCC
  ...cCCCC
  ..UQqQQQ
  .UQQQQQ.
  .SOSSSS.
  .ooooo..`
/**
 * The kebab, held in both hands: the filling, the bread, and the paper it is
 * wrapped in. Whole, then with a bite out of it.
 */
const KEBAB = `
  .kkkkkkkk.
  kgngrngngk
  kbbbbbbbbk
  HHxxxxxxHH
  HYXXXXXXYH
  .kkkkkkkk.`
const KEBAB_BITTEN = `
  .kkk..kkk.
  kgnk..kngk
  kbbbkkbbbk
  HHxxxxxxHH
  HYXXXXXXYH
  .kkkkkkkk.`

/**
 * How each one's hair falls, over the top six rows of the head: from the
 * front, from the side (facing right) and from behind. Karl and Matthys wear
 * hats, and keep the plain head.
 */
const HAIR = {
  // Spikes, with three locks of fringe down to the eyes.
  david: {
    front: `
      ..K.KKKK.KK...
      .KKKKLLKKKKK.K
      KKLLKLKKLLKKKK
      KKLKKKKKLKKKKK
      KKKKKKKKKKKKKK
      KKKZHKZHHKZKKK`,
    side: `
      .K.KKK.K.
      KKKLLKKKK
      KLLKLKKKK
      KKLKKKLKK
      KKKKKKKZK
      KKKKHZHZ.`,
    back: `
      ..K.KKKK.KK...
      .KKKKLLKKKKK.K
      KKLLKLKKLLKKKK
      KKLKKKKKLKKKKK
      KKKKKKKKKKKKKK
      KKKKKKKKKKKKKK`,
  },
  // Swept across in one wave.
  mickael: {
    front: `
      ...KKKKKKKK...
      .KKLLLKKKKKKK.
      KKLLKKLLLKKKKK
      KLLKKLLKKKKKKK
      KKKKLKKKKKKZKK
      KKKKKKKZZHHKKK`,
    side: `
      ..KKKKKK.
      .KLLLKKKK
      KLLKKLLKK
      KLKKLKKKK
      KKKKKKKZ.
      KKKKHZZH.`,
    back: `
      ...KKKKKKKK...
      .KKLLLKKKKKKK.
      KKLLKKLLLKKKKK
      KLLKKLLKKKKKKK
      KKKKLKKKKKKKKK
      KKKKKKKKKKKKKK`,
  },
  // Brushed up and back: a quiff.
  christophe: {
    front: `
      ..KKKKKKKKKK..
      .KLLKLLKLLKKK.
      KKLKKLKKLKKKKK
      KKKKKKKKKKKKKK
      KKKZKKZKKZKKKK
      KKZHHHHHHHHZKK`,
    side: `
      ..KKKKKKK
      .KLLKLLKK
      .KLKKLKKK
      KKKKKKKKK
      KKKKKZKK.
      KKKZHHHH.`,
    back: `
      ..KKKKKKKKKK..
      .KLLKLLKLLKKK.
      KKLKKLKKLKKKKK
      KKKKKKKKKKKKKK
      KKKKKKKKKKKKKK
      KKKKKKKKKKKKKK`,
  },
}
const hair = (who, view, x = 0, y = 0) => (HAIR[who] ? [grid(x, y, HAIR[who][view])] : [])

/** What is on the chest, from the front: the body's top-left corner is at x, y. */
function chest(who, x = 0, y = 0) {
  switch (who) {
    case "david": // the cords of the hood, and the pocket
      return [grid(x + 5, y + 12, "x..x\nx..x"), grid(x + 4, y + 15, "cccccc")]
    case "karl": // a collar and a tie
      return [grid(x + 5, y + 11, "xrrx\n.rr.\n.RR.\n.RR."), ]
    case "mickael": // a sound wave across the front
      return [grid(x + 4, y + 13, ".x..x.\nx.xx.x")]
    case "christophe": // his emblem, and a gold belt
      return [grid(x + 6, y + 13, "aa\naa"), grid(x + 3, y + 18, "aaaaaaaa")]
    case "matthys": // a chain
      return [grid(x + 5, y + 12, "a..a\n.aa.")]
    default:
      return []
  }
}
/** And on the back: David's hood, down. */
const nape = (who) => (who === "david" ? [grid(4, 11, "cCCCCc\n.cCCc.\n..cc..")] : [])

/** One view of the body, with the hair and clothes of whoever it is: the bare body is the same for all. */
function body(name, opts, size, bare, ...over) {
  sprite(`${name}_bare`, opts, bare)
  sprite(name, size, stamp(`${name}_bare`, 0, 0), ...over)
}

/** Eyes shut in a smile: an arch where each eye was. They take the body's top-left corner. */
const gladEyes = (x, y) => [grid(x + 3, y + 5, ".k.\nkHk\nHH."), grid(x + 8, y + 5, ".k.\nkHk\n.HH")]

/** What each member wears, on the sprite: its body starts one row down. */
function props(who, back) {
  switch (who) {
    case "david": // headphones: he is the DJ
      // The spikes stand up through the band.
      return [rect(3, 0, 8, 1, "k"), rect(1, 1, 2, 1, "k"), rect(11, 1, 2, 1, "k"), rect(0, 2, 1, 4, "k"), rect(13, 2, 1, 4, "k"), px(4, 0, "K"), px(7, 0, "L"), px(8, 0, "K"), rect(0, 6, 2, 4, "e"), rect(12, 6, 2, 4, "e"), px(0, 6, "R"), px(13, 6, "R")]
    case "karl": // mortarboard: he is the doctor
      return [rect(0, 1, 14, 1, "W"), rect(1, 0, 12, 1, "W"), rect(2, 0, 10, 1, "w"), rect(3, 2, 8, 1, "k"), rect(6, 0, 2, 1, "a"), rect(13, 2, 1, 4, "a"), px(13, 6, "a"), px(12, 6, "a")]
    case "mickael": // podcast headset
      return back
        ? [rect(3, 0, 8, 1, "s"), rect(1, 1, 2, 1, "s"), rect(0, 2, 1, 4, "s"), rect(0, 6, 2, 4, "k")]
        : [rect(3, 0, 8, 1, "s"), rect(1, 1, 2, 1, "s"), rect(0, 2, 1, 4, "s"), rect(0, 6, 2, 4, "k"), rect(1, 10, 3, 1, "k"), px(4, 10, "s")]
    case "christophe": // mask: he is the superhero
      return back
        ? [rect(0, 7, 14, 2, "r")]
        : [rect(0, 7, 14, 2, "r"), px(4, 7, "x"), px(9, 7, "x"), px(4, 8, "k"), px(9, 8, "k")]
    case "matthys": // cap and shades: he is the cool kid
      return back
        ? [rect(2, 0, 10, 1, "y"), rect(1, 1, 12, 3, "y"), rect(1, 3, 12, 1, "w"), rect(5, 4, 4, 1, "w")]
        : [rect(2, 0, 10, 1, "y"), rect(1, 1, 12, 3, "y"), rect(1, 3, 12, 1, "w"), rect(8, 4, 6, 1, "w"), rect(3, 7, 8, 2, "k"), px(4, 7, "s"), px(8, 7, "s")]
    default:
      return []
  }
}

for (const g of GRADES) {
  const tint = grader(g)
  const base = Object.fromEntries(Object.entries(BODY).map(([key, h]) => [key, tint(h)]))
  for (const [who, look] of Object.entries(PEOPLE)) {
    pal({
      ...base,
      C: tint(look.shirt),
      c: tint(darken(look.shirt, 0.24)),
      D: tint(lighten(look.shirt, 0.22)),
      ...Object.fromEntries(Object.entries(look.wear).map(([key, h]) => [key, tint(h)])),
      // Karl's board is his alone; Matthys's cap keeps `y` and `w`.
      ...(who === "karl" ? { W: tint("#2c2834"), w: tint("#514a60") } : {}),
    })
    const cape = who === "christophe"
    const behind = cape ? [rect(1, 13, 12, 11, "r"), rect(1, 13, 12, 1, "R"), rect(1, 22, 12, 2, "R")] : []

    // Standing, facing the room. The cape hangs behind the body.
    body(`_${who}_front_${g}`, { mx: true }, { w: 14, h: 26 }, FRONT, ...hair(who, "front"), ...chest(who))
    figure(
      `${who}_front_${g}`,
      { w: 14, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      ...props(who, false),
    )
    // One arm raised, to hold a phone.
    figure(
      `${who}_arm_${g}`,
      { w: 16, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      grid(12, 14, "__\n__\n__\n__"),
      grid(12, 10, ".H\n.C\nCC\nC."),
      ...props(who, false),
    )
    // Sitting down to eat, in two frames: a big bite, then chewing with the
    // kebab lowered. What they wear sits one column in: this body is wider.
    body(`_${who}_sit_${g}`, { mx: true }, { w: 16, h: 22 }, SIT, ...hair(who, "front", 1), ...chest(who, 1))
    sprite(`_${who}_worn_${g}`, { w: 14, h: 12 }, ...props(who, false))
    const seated = [
      ...(cape ? [rect(1, 14, 14, 8, "r"), rect(1, 21, 14, 1, "R")] : []),
      stamp(`_${who}_sit_${g}`, 0, 1),
      stamp(`_${who}_worn_${g}`, 1, 0),
      // The mask has eyes of its own: shut them too.
      ...(cape ? [grid(4, 7, ".k....k.\nkrk..krk")] : []),
    ]
    figure(
      `${who}_eat_0_${g}`,
      { w: 16, h: 23 },
      base.k,
      ...seated,
      grid(5, 9, "mMMMMm\n.mrrm."),
      grid(3, 11, KEBAB),
    )
    figure(`${who}_eat_1_${g}`, { w: 16, h: 23 }, base.k, ...seated, grid(3, 13, KEBAB_BITTEN))
    // Hungry: doubled over, in two frames. The second is the pang itself,
    // flushed red, as a hero flashes when hit.
    body(`_${who}_hunch_${g}`, { mx: true }, { w: 14, h: 26 }, HUNCH, ...hair(who, "front", 0, 2), clip([0, 0, 14, 16], ...chest(who, 0, 2)))
    figure(
      `${who}_hungry_0_${g}`,
      { w: 14, h: 27 },
      base.k,
      ...(cape ? [rect(1, 15, 12, 9, "r"), rect(1, 15, 12, 1, "R"), rect(1, 23, 12, 1, "R")] : []),
      stamp(`_${who}_hunch_${g}`, 0, 1),
      stamp(`_${who}_worn_${g}`, 0, 2),
      // The mask has eyes of its own: screw them shut too.
      ...(cape ? [grid(4, 9, "k....k")] : []),
    )
    sprite(`${who}_hungry_1_${g}`, { w: 16, h: 29 }, stamp(`${who}_hungry_0_${g}`, 0, 0), (c) => {
      for (let y = 0; y < c.h; y++) {
        for (let x = 0; x < c.w; x++) {
          const v = c.get(x, y)
          if ((v & 255) === 0) continue
          c.px(x, y, hex(mix(parts(v), [236, 70, 56], 0.32)))
        }
      }
    })
    // A new customer: a spin, then a fist in the air, as a hero does over a
    // fallen boss. The spin borrows the front view and adds a profile and a
    // back; the profile is flipped by the game for the fourth quarter.
    body(`_${who}_side_${g}`, {}, { w: 9, h: 26 }, SIDE, ...hair(who, "side"))
    figure(
      `${who}_side_${g}`,
      { w: 10, h: 27 },
      base.k,
      ...(cape ? [rect(0, 13, 3, 11, "r"), rect(0, 13, 3, 1, "R"), rect(0, 22, 3, 2, "R")] : []),
      stamp(`_${who}_side_${g}`, 0, 1),
      ...sideProps(who),
    )
    body(`_${who}_away_${g}`, { mx: true }, { w: 14, h: 26 }, AWAY, ...hair(who, "back"), ...nape(who))
    figure(
      `${who}_away_${g}`,
      { w: 14, h: 27 },
      base.k,
      stamp(`_${who}_away_${g}`, 0, 1),
      ...(cape ? [rect(1, 13, 12, 11, "r"), rect(3, 12, 8, 1, "R"), rect(1, 22, 12, 2, "R")] : []),
      ...props(who, true),
    )
    // The pose: two rows taller and two columns wider than the standing
    // figure, for the arm. Eyes shut in a smile, mouth wide open, one hand
    // on the hip and the other fist as high as it goes.
    figure(
      `${who}_cheer_0_${g}`,
      { w: 16, h: 29 },
      base.k,
      ...(cape ? [rect(1, 15, 12, 11, "r"), rect(1, 15, 12, 1, "R"), rect(1, 24, 12, 2, "R")] : []),
      stamp(`_${who}_front_${g}`, 0, 3),
      // The face. Shades hide the eyes, and the mask has its own.
      ...(who === "matthys" || cape ? [] : gladEyes(0, 3)),
      grid(5, 11, "MxxM\n.MM."),
      stamp(`_${who}_worn_${g}`, 0, 2),
      ...(cape ? [grid(3, 9, ".k....k.\nkrk..krk")] : []),
      // A hand on the hip: the elbow sticks out.
      grid(0, 16, "_cC\ncCc\ncCc\n_cH"),
      // The other arm, straight up, and the fist over the head.
      grid(12, 16, "_\n_\n_\n_"),
      grid(12, 15, "CC"),
      rect(13, 3, 1, 12, "C"),
      rect(14, 3, 1, 12, "c"),
      grid(12, 0, "IHH\nHHH\nYHH"),
    )
    // The first instant of the pose is a flash: the same, washed out to white.
    sprite(`${who}_cheer_1_${g}`, { w: 18, h: 31 }, stamp(`${who}_cheer_0_${g}`, 0, 0), (c) => {
      for (let y = 0; y < c.h; y++) {
        for (let x = 0; x < c.w; x++) {
          const v = c.get(x, y)
          if ((v & 255) === 0) continue
          c.px(x, y, hex(mix(parts(v), [255, 250, 232], 0.86)))
        }
      }
    })
    // --- One pose for each thing a founder does --------------------------
    // All of them are the standing figure with a few pixels changed: a face,
    // an arm. The cape hangs behind whatever the body does.
    const shades = who === "matthys"
    const smiling = [
      ...(shades || cape ? [] : gladEyes(0, 1)),
      grid(5, 9, "MxxM\n.MM."),
    ]
    const maskSmiling = cape ? [grid(3, 7, ".k....k.\nkrk..krk")] : []

    // Idle: a blink. Shades do not blink; the mask's eyes do.
    figure(
      `${who}_blink_${g}`,
      { w: 14, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      ...(shades || cape ? [] : [grid(3, 7, "HH\nkk"), grid(9, 7, "HH\nkk")]),
      ...props(who, false),
      ...(cape ? [px(4, 7, "r"), px(9, 7, "r")] : []),
    )

    // Posting: the phone held up, and the face of someone being liked.
    figure(
      `${who}_post_${g}`,
      { w: 16, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      ...smiling,
      grid(12, 14, "__\n__\n__\n__"),
      grid(12, 10, ".H\n.C\nCC\nC."),
      ...props(who, false),
      ...maskSmiling,
    )

    // Cold outreach: the phone at the ear. Listening, then talking, with the
    // free hand joining in.
    const atTheEar = [grid(12, 14, "_\n_\n_\n_"), grid(12, 6, "QQ.\nQQ.\nQHH\nQHH\n.Cc\n.Cc\n.Cc\nCCc")]
    figure(
      `${who}_call_0_${g}`,
      { w: 16, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      ...props(who, false),
      ...atTheEar,
    )
    figure(
      `${who}_call_1_${g}`,
      { w: 16, h: 27 },
      base.k,
      ...behind,
      stamp(`_${who}_front_${g}`, 0, 1),
      grid(6, 10, "MM"),
      ...props(who, false),
      ...atTheEar,
      grid(1, 14, "_\n_\n_\n_"),
      grid(0, 10, "H.\nC.\nCC\n.C"),
    )

    // A pivot is thought over in front of the wall chart, in profile: a hand
    // on the chin, then a finger pointing at the curve.
    const profile = [
      ...(cape ? [rect(0, 13, 3, 11, "r"), rect(0, 13, 3, 1, "R"), rect(0, 22, 3, 2, "R")] : []),
      stamp(`_${who}_side_${g}`, 0, 1),
      ...sideProps(who),
      px(4, 17, "C"),
    ]
    figure(`${who}_ponder_0_${g}`, { w: 10, h: 27 }, base.k, ...profile, grid(5, 11, ".HH\n.Cc\n.Cc\nCCc\nCc."))
    figure(`${who}_ponder_1_${g}`, { w: 10, h: 27 }, base.k, ...profile, grid(5, 13, "CCCCH\ncccc."))

    // Something urgent: both hands in the air, eyes wide, mouth open. The
    // body sits one column in, to leave room for the arms.
    sprite(`_${who}_handsup_${g}`, { mx: true }, `
      HI......
      HH......
      cC......
      cC......
      cC......
      cC......
      .cC.....`)
    figure(
      `${who}_alarm_${g}`,
      { w: 16, h: 27 },
      base.k,
      ...(cape ? [rect(2, 13, 12, 11, "r"), rect(2, 13, 12, 1, "R"), rect(2, 22, 12, 2, "R")] : []),
      stamp(`_${who}_front_${g}`, 1, 1),
      ...(shades || cape ? [] : [grid(4, 7, "xx\nxk"), grid(10, 7, "xx\nkx")]),
      grid(7, 10, "MM\nMM"),
      stamp(`_${who}_worn_${g}`, 1, 0),
      grid(2, 14, "_\n_\n_\n_"),
      grid(13, 14, "_\n_\n_\n_"),
      stamp(`_${who}_handsup_${g}`, 0, 7),
    )
    // Seated at the terminal, seen from behind. The cape covers the back.
    body(`_${who}_back_${g}`, { mx: true }, { w: 14, h: 18 }, BACK, ...hair(who, "back"), ...nape(who))
    figure(
      `${who}_back_${g}`,
      { w: 14, h: 19 },
      base.k,
      stamp(`_${who}_back_${g}`, 0, 1),
      ...(cape ? [rect(2, 13, 10, 6, "r"), rect(3, 12, 8, 1, "R")] : []),
      ...props(who, true),
    )
    // Typing: the same back, elbows out and hands gone forward to the keys.
    figure(
      `${who}_type_${g}`,
      { w: 14, h: 19 },
      base.k,
      stamp(`_${who}_back_${g}`, 0, 1),
      grid(0, 14, "c\nc"),
      grid(13, 14, "c\nc"),
      px(1, 17, "c"),
      px(12, 17, "c"),
      ...(cape ? [rect(2, 13, 10, 6, "r"), rect(3, 12, 8, 1, "R")] : []),
      ...props(who, true),
    )
    // Asleep: a head on the pillow.
    body(`_${who}_asleep_${g}`, { mx: true }, { w: 14, h: 11 }, ASLEEP, ...hair(who, "front"))
    figure(
      `${who}_asleep_${g}`,
      { w: 14, h: 12 },
      base.k,
      stamp(`_${who}_asleep_${g}`, 0, 1),
      ...(who === "matthys" ? props(who, true) : who === "christophe" ? [rect(0, 7, 14, 2, "r")] : props(who, false)),
    )
  }

  // What the raised hand holds.
  pal(base)
  figure(`phone_${g}`, { w: 3, h: 4 }, base.k, "QQQ\nxxx\nxxx\nQQQ")
}

// Thought bubbles are the same at any hour.
pal({ k: "#2a1c18", p: "#f4eedd", r: "#c0432f", a: "#e8b04a", n: "#4a5568" })
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
// An empty stomach, growling: a jagged line, like a wound in a battle menu.
sprite("bubble_growl", { outline: "k" }, `
  .ppppppp.
  ppppppppp
  prppprppp
  pprprprpr
  ppprpppr.
  ppppppppp
  .ppppppp.
  ..pp.....
  .p.......`)
// What rises from a phone when a post is liked: a heart, then a smaller one.
pal({ k: "#2a1c18", r: "#e0483f", R: "#a8322c", x: "#fffaf0", z: "#dfe8f4", Z: "#9fb3c8" })
sprite("heart_0", { outline: "k" }, `
  rx.rr
  rrrrr
  .rrR.
  ..R..`)
sprite("heart_1", { outline: "k" }, `
  r.r
  rrR
  .R.`)
// What rises from someone asleep: a z, in three sizes.
sprite("zed_0", `
  zz
  zZ`)
sprite("zed_1", { outline: "k" }, `
  zzz
  .z.
  zzZ`)
sprite("zed_2", { outline: "k" }, `
  zzzz
  ..z.
  .z..
  zzzZ`)
pal({ k: "#2a1c18", p: "#f4eedd", r: "#c0432f", a: "#e8b04a", n: "#4a5568" })
// Talking on the phone: one dot, two, three.
for (const [i, dots] of ["pnppppp", "pnpnppp", "pnpnpnp"].entries()) {
  sprite(`bubble_talk_${i}`, { outline: "k" }, `
  .ppppppp.
  ppppppppp
  ppppppppp
  p${dots}p
  ppppppppp
  ppppppppp
  .ppppppp.
  ..pp.....
  .p.......`)
}
// A doubt.
sprite("bubble_what", { outline: "k" }, `
  .ppppppp.
  pppnnnppp
  ppnpppnpp
  pppppnppp
  ppppnpppp
  ppppppppp
  .pppnppp.
  ..pp.....
  .p.......`)
// What flies off a fist held high: a big sparkle and a small one.
pal({ a: "#f6c453", x: "#fffaf0" })
sprite("sparkle_0", `
  ..x..
  ..a..
  xaxax
  ..a..
  ..x..`)
sprite("sparkle_1", `
  .a.
  axa
  .a.`)
// A drop of sweat, for the pang.
pal({ k: "#2a1c18", s: "#bfe6f8", S: "#7fb8d8" })
sprite("sweat", { outline: "k" }, `
  .s.
  sss
  sSs
  .S.`)
pal({ k: "#2a1c18", p: "#f4eedd", r: "#c0432f", a: "#e8b04a", n: "#4a5568" })
// Something urgent: the clock is running.
sprite("bubble_alert", { outline: "k" }, `
  .ppppppp.
  ppprrrppp
  ppprrrppp
  pppprpppp
  ppppppppp
  pppprpppp
  .ppppppp.
  ..pp.....
  .p.......`)

// The members' portraits and the guests' avatars have a file of their own.
include("faces.px.js")

// ---------------------------------------------------------------------------
// The picture a link to the game is shared with
// ---------------------------------------------------------------------------
//
// 200 by 105, built six times larger (1200 by 630, what social networks ask
// for): the title, the goal, Chef, and the five founders with a fist in the
// air, on the rug.
pal({ n: "#0e2439", N: "#0a1b2c", a: "#f2b43c", x: "#f4eedd", g: "#9fb3c8", r: "#a8322c", R: "#7e2420", o: "#d9a441", f: "#6e4a30", F: "#5a3a24", e: "#8a6040" })
scene("og", { w: 200, h: 105, bg: "n" },
  // The floor: boards, then the rug with its border.
  layer("floor", rect(0, 84, 200, 21, "f"), rect(0, 84, 200, 1, "e"), rect(0, 94, 200, 1, "F"),
    rect(8, 88, 184, 17, "r"), rect(8, 88, 184, 1, "R"), rect(10, 90, 180, 1, "o")),
  layer("title",
    text(12, 9, "KEBAB", "a", { scale: 4 }),
    text(12, 33, "PROFITABLE", "x", { scale: 3 }),
    text(12, 53, "OBJECTIF : UN KEBAB PAR JOUR.", "g"),
    text(12, 61, "LE JEU DES INDIE HACKERS LILLE", "g")),
  layer("people",
    stamp("portrait_chef", 156, 12),
    ...["david", "karl", "mickael", "christophe", "matthys"].map((who, i) => stamp(`${who}_cheer_0_day`, 24 + i * 34, 70))),
)

// Everything the game places, on one sheet.
// The intro has its own pictures, and its own sheet.
include("intro.px.js")
// So has the apéro: the bar, and everyone at the table.
include("bar.px.js")

sheet(
  "sprites",
  ["chart_*", "plant_*", "bowl_*", "wrapper_*", "screen_*", "*_front_*", "*_arm_*", "*_back_*", "*_asleep_*", "*_eat_*", "*_hungry_*", "*_side_*", "*_away_*", "*_cheer_*", "*_blink_*", "*_post_*", "*_call_*", "*_ponder_*", "*_alarm_*", "*_type_*", "phone_*", "bubble_*", "sweat", "sparkle_*", "heart_*", "zed_*", "neon", "bar_*"],
  { pad: 1 },
)
