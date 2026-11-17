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
 * apart by a signature prop, not by a likeness: real portraits come later,
 * once each member has approved theirs.
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

const PEOPLE = {
  david: { shirt: "#3f9a90" },
  karl: { shirt: "#e4decb" },
  mickael: { shirt: "#d98234" },
  christophe: { shirt: "#4a6fc0" },
  matthys: { shirt: "#8a62cc" },
}

/** Half of the body: it is the same on both sides. Fourteen wide once mirrored. */
const FRONT = `
  ...KKKK
  ..KLLKK
  .KKLLKK
  .KKKKLK
  .KKKKYY
  .KKHHHH
  .KHIkHH
  .ZHHkHH
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
  ..SOSS.
  .SSSSS.`
const BACK = `
  ...KKKK
  ..KLLKK
  .KKLLKK
  .KKKKLK
  .KKKKKK
  .KKKKKK
  .ZKKKKK
  .ZKKKKK
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
const ASLEEP = `
  ...KKKK
  ..KLLKK
  .KKLLKK
  .KKKKLK
  .KKKKYY
  .KKHHHH
  .KHHHHH
  .ZHYYHH
  .YHHHHH
  ..YHHHm
  ...YHHH`

/**
 * Sitting on the floor to eat, eyes shut with pleasure, mouth closed on a
 * mouthful. Half of it: sixteen wide once mirrored.
 */
const SIT = `
  ....KKKK
  ...KLLKK
  ..KKLLKK
  ..KKKKLK
  ..KKKKYY
  ..KKHHHH
  ..KHIkHH
  ..ZHkHkH
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

/** What each member wears, on the sprite: its body starts one row down. */
function props(who, back) {
  switch (who) {
    case "david": // headphones: he is the DJ
      return [rect(3, 0, 8, 1, "k"), rect(1, 1, 2, 1, "k"), rect(11, 1, 2, 1, "k"), rect(0, 2, 1, 4, "k"), rect(13, 2, 1, 4, "k"), rect(0, 6, 2, 4, "e"), rect(12, 6, 2, 4, "e"), px(0, 6, "R"), px(13, 6, "R")]
    case "karl": // mortarboard: he is the doctor
      return [rect(0, 1, 14, 1, "k"), rect(1, 0, 12, 1, "k"), rect(3, 2, 8, 1, "k"), rect(13, 2, 1, 4, "a"), px(13, 6, "a"), px(12, 6, "a")]
    case "mickael": // podcast headset
      return back
        ? [rect(3, 0, 8, 1, "s"), rect(1, 1, 2, 1, "s"), rect(0, 2, 1, 4, "s"), rect(0, 6, 2, 4, "k")]
        : [rect(3, 0, 8, 1, "s"), rect(1, 1, 2, 1, "s"), rect(0, 2, 1, 4, "s"), rect(0, 6, 2, 4, "k"), rect(1, 10, 3, 1, "k"), px(4, 10, "s")]
    case "christophe": // mask: he is the superhero
      return back
        ? [rect(1, 7, 12, 2, "r")]
        : [rect(1, 7, 12, 2, "r"), px(4, 7, "x"), px(9, 7, "x"), px(4, 8, "k"), px(9, 8, "k")]
    case "matthys": // cap and shades: he is the cool kid
      return back
        ? [rect(2, 1, 10, 3, "y"), rect(2, 3, 10, 1, "w"), rect(5, 4, 4, 1, "w")]
        : [rect(2, 1, 10, 3, "y"), rect(2, 3, 10, 1, "w"), rect(8, 4, 6, 1, "w"), rect(3, 7, 8, 2, "k"), px(4, 7, "s"), px(8, 7, "s")]
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
    })
    const cape = who === "christophe"
    const behind = cape ? [rect(1, 13, 12, 11, "r"), rect(1, 13, 12, 1, "R"), rect(1, 22, 12, 2, "R")] : []

    // Standing, facing the room. The cape hangs behind the body.
    sprite(`_${who}_front_${g}`, { mx: true }, FRONT)
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
    sprite(`_${who}_sit_${g}`, { mx: true }, SIT)
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
    // Seated at the terminal, seen from behind. The cape covers the back.
    sprite(`_${who}_back_${g}`, { mx: true }, BACK)
    figure(
      `${who}_back_${g}`,
      { w: 14, h: 19 },
      base.k,
      stamp(`_${who}_back_${g}`, 0, 1),
      ...(cape ? [rect(2, 13, 10, 6, "r"), rect(3, 12, 8, 1, "R")] : []),
      ...props(who, true),
    )
    // Asleep: a head on the pillow.
    sprite(`_${who}_asleep_${g}`, { mx: true }, ASLEEP)
    figure(
      `${who}_asleep_${g}`,
      { w: 14, h: 12 },
      base.k,
      stamp(`_${who}_asleep_${g}`, 0, 1),
      ...(who === "matthys" ? props(who, true) : who === "christophe" ? [rect(1, 7, 12, 2, "r")] : props(who, false)),
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

// ---------------------------------------------------------------------------
// Portraits: a head and shoulders, 32 by 32
// ---------------------------------------------------------------------------

const BUST = `
  ..........KKKKKK
  ........KKKLLKKK
  .......KKKLLKKKK
  ......KKKKLKKLKK
  ......KKKKYYYYYY
  ......KKHHHHHHHH
  ......KHHHHHIIHH
  ......ZHHHkkIHHH
  ......ZHHHkkHHHH
  ......YHHHHHHHHH
  ......YHHHHHHHHY
  ......YYHHHHHmmm
  .......YHHHHHHHH
  ........YYHHHHHH
  ..........YYYYYY
  ..........YYYHHH
  ....cCCCCCCcYYHH
  ..cCCDDCCCCCcccC
  .cCCDCCCCCCCCCCC
  cCCCCCCCCCCCCCCC
  cCCCCCCCCCCCCCCC
  cCCCCCCCCCCCCCCC`

/** The same props as on the small figures, at the portrait's size. */
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
      return [rect(7, 3, 18, 5, "y"), rect(7, 6, 18, 2, "w"), rect(22, 8, 8, 2, "w"), rect(8, 11, 16, 3, "k"), rect(9, 11, 3, 1, "s"), rect(17, 11, 3, 1, "s")]
    default:
      return []
  }
}

const PORTRAITS = {
  david: { shirt: "#3f9a90", tile: "#2f5e59" },
  karl: { shirt: "#e4decb", tile: "#56594c" },
  mickael: { shirt: "#d98234", tile: "#7a4a22" },
  christophe: { shirt: "#4a6fc0", tile: "#2f4470" },
  matthys: { shirt: "#8a62cc", tile: "#4f3a78" },
}
// Chef is not one of these busts: his portrait is in intro.px.js, next to the
// picture of him it is taken from.

for (const [who, look] of Object.entries(PORTRAITS)) {
  pal({
    ...BODY,
    C: look.shirt,
    c: darken(look.shirt, 0.24),
    D: lighten(look.shirt, 0.22),
    T: look.tile,
    t: darken(look.tile, 0.14),
  })
  sprite(`_bust_${who}`, { mx: true }, BUST)
  figure(
    `_figure_${who}`,
    { w: 32, h: 26 },
    BODY.k,
    ...(who === "christophe" ? [rect(0, 21, 32, 5, "r"), rect(0, 21, 32, 1, "R")] : []),
    stamp(`_bust_${who}`, 0, 4),
    ...bustProps(who),
  )
  // A height chart behind the sitter, as on an identity photo, under a light
  // that falls off towards the top of the wall.
  sprite(
    `portrait_${who}`,
    { w: 32, h: 32 },
    (c) => {
      const wall = [darken(look.tile, 0.24), darken(look.tile, 0.1), look.tile, lighten(look.tile, 0.1)]
      const edges = [0, 7, 15, 24, 32]
      wall.forEach((tone, i) => {
        c.rect(0, edges[i], 32, edges[i + 1] - edges[i], tone)
        if (i > 0) for (let x = 0; x < 32; x++) if (dithered(x, edges[i] - 1, 0.5)) c.px(x, edges[i] - 1, tone)
      })
      for (const [y, tone] of [[6, wall[0]], [14, wall[1]], [22, wall[2]], [30, wall[3]]]) c.rect(0, y, 32, 1, darken(tone, 0.16))
    },
    stamp(`_figure_${who}`, -1, 5),
  )
}

// ---------------------------------------------------------------------------
// Guests: the public figures on the cameo cards, 32 by 32
// ---------------------------------------------------------------------------

/**
 * A guest is drawn after their avatar on X, so each one keeps its own skin,
 * hair, beard, glasses and background colour. Unlike the members, they are
 * likenesses: the face is larger, and nothing is emoji yellow.
 *
 * Half of the head, mirrored. `B` are the brows, `w` and `k` the eyes.
 */
const GHEAD = `
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ..........HHHHHH
  ........HHHHHHHH
  .......HHHHHHHHH
  ......IHHHHHHHHH
  ......IHHHHHHHHH
  ......HHHHHHHHHH
  ......HHHBBBBHHH
  .....YHHHHHHHHHH
  ....YYHHHwkkHHHH
  ....YYHHHwkkHHHH
  ....YHHHHHHHHHHH
  .....YHHHHHHHHHH
  .....YHHHHHHHHHH
  ......YHHHHHHHHH
  ......YHHHHHHHmm
  .......YHHHHHHHH
  ........YHHHHHHH
  .........YYHHHHH
  ...........YYYYY
  ...........YHHHH
  .......cCCCYHHHH
  ....cCCCDCCcYHHH
  ..cCCDDCCCCCcYYH
  .cCDDCCCCCCCCcYY
  cCCCCCCCCCCCCCcC`

/** A run of one colour on one row, from x0 to x1. */
const run = (y, x0, x1, key) => rect(x0, y, x1 - x0 + 1, 1, key)
/** The same run, and its mirror image on the other side of the face. */
const sym = (y, x0, x1, key) => [run(y, x0, x1, key), run(y, 31 - x1, 31 - x0, key)]
/** Several rows at once: [y, x0, x1] each, all mirrored. */
const syms = (key, rows) => rows.flatMap(([y, x0, x1]) => sym(y, x0, x1, key))
const runs = (key, rows) => rows.map(([y, x0, x1]) => run(y, x0, x1, key))

/** Light comes from the left: a shadow down the right of the nose. */
const NOSE = [px(17, 16, "Y"), px(17, 17, "Y"), run(18, 16, 17, "Y"), px(15, 18, "Y")]

const MOUTH = {
  smile: [run(21, 13, 18, "H"), px(13, 20, "m"), px(18, 20, "m"), run(21, 14, 17, "m")],
  grin: [run(20, 13, 18, "m"), run(21, 13, 18, "x"), px(13, 21, "m"), px(18, 21, "m"), run(22, 14, 17, "m")],
  smirk: [run(21, 13, 18, "H"), run(21, 14, 17, "m"), px(18, 20, "m")],
  flat: [],
}

/** Round, thin-rimmed glasses. */
const ROUND = [
  ...syms("g", [[14, 9, 11], [17, 9, 11]]),
  ...syms("g", [[15, 8, 8], [16, 8, 8], [15, 12, 12], [16, 12, 12]]),
  run(15, 13, 18, "g"),
]
/** Square glasses with a heavy top rim. */
const SQUARE = [
  ...syms("g", [[14, 8, 13], [17, 9, 12], [15, 8, 8], [16, 8, 8], [15, 13, 13], [16, 13, 13]]),
  run(15, 14, 17, "g"),
]

/** A full beard and moustache around the mouth, in `F`, shaded in `f`. */
const BEARD = [
  ...syms("F", [[17, 6, 6], [18, 5, 6], [19, 5, 7], [20, 6, 9], [21, 6, 13], [22, 7, 15], [23, 8, 15], [24, 9, 15], [25, 10, 15], [26, 12, 15]]),
  ...syms("F", [[19, 13, 15], [20, 12, 15]]),
  run(21, 14, 17, "m"),
  ...syms("f", [[24, 9, 10], [25, 10, 12], [26, 12, 15]]),
]
/** Short stubble on the jaw and the lip. */
const STUBBLE = syms("F", [[19, 6, 6], [20, 6, 7], [21, 6, 12], [22, 7, 15], [23, 8, 15], [24, 9, 15], [20, 13, 15]])

const GUESTS = {
  // Pieter Levels: his avatar is him lying in the sun with his laptop.
  levels: {
    look: { H: "#d9a074", Y: "#ad7448", I: "#ecbf96", K: "#8a6440", L: "#b38c5c", Z: "#5e4228", F: "#a07a58", f: "#8a6444", C: "#d9a074", c: "#ad7448", D: "#ecbf96", T: "#3f6a35", t: "#335a2b", s: "#c9ccd0", S: "#9a9ea6" },
    mouth: "smile",
    draw: [
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 6, 15], [8, 5, 15], [9, 5, 9], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      ...runs("L", [[6, 10, 13], [7, 8, 11], [8, 14, 18], [9, 20, 23]]),
      ...runs("K", [[9, 10, 12], [9, 18, 21]]),
      ...runs("Z", [[12, 26, 26], [13, 26, 26], [11, 25, 25]]),
      ...STUBBLE,
      // The laptop, held up in front of his chest.
      rect(5, 25, 22, 7, "s"), run(25, 5, 26, "S"), rect(5, 26, 1, 6, "S"), px(16, 28, "x"),
    ],
  },
  // Marc Lou: just his head, eyebrows up, a thin moustache.
  marc: {
    look: { H: "#ebb48c", Y: "#c98a62", I: "#f6cfac", K: "#5e3a20", L: "#86562e", Z: "#3e2614", F: "#5e3a20", f: "#3e2614", C: "#26283a", c: "#181a28", D: "#3a3e56", T: "#f4a14a", t: "#e08a34" },
    mouth: "flat",
    draw: [
      ...syms("K", [[3, 12, 15], [4, 9, 15], [5, 7, 15], [6, 6, 15], [7, 5, 15], [8, 5, 13], [9, 5, 9], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      ...runs("L", [[4, 11, 14], [5, 9, 12], [6, 17, 21], [7, 8, 10], [8, 18, 20]]),
      ...runs("Z", [[8, 14, 17], [9, 10, 12], [9, 19, 21]]),
      // Eyebrows raised high, eyes wide.
      ...syms("H", [[13, 9, 12]]), ...syms("B", [[12, 9, 9], [11, 10, 12]]),
      ...syms("x", [[14, 9, 11]]), px(9, 15, "x"), px(22, 15, "x"),
      // The moustache.
      run(20, 13, 18, "F"), px(12, 20, "F"), px(19, 20, "F"), run(21, 13, 18, "H"), run(22, 15, 16, "m"),
    ],
  },
  // Tibo Louis-Lucas: swept-up hair, short beard, a wide smile.
  tibo: {
    look: { H: "#e6ac86", Y: "#c0825c", I: "#f4c8a4", K: "#6a4a30", L: "#94704c", Z: "#46301e", F: "#9a6c4c", f: "#7a5038", C: "#2a2a30", c: "#18181e", D: "#3e3e48", T: "#f2b58e", t: "#e49f78" },
    mouth: "grin",
    draw: [
      ...syms("K", [[4, 12, 15], [5, 9, 15], [6, 7, 15], [7, 6, 15], [8, 5, 15], [9, 5, 8], [10, 5, 7], [11, 5, 6], [12, 5, 6], [13, 5, 5]]),
      ...runs("L", [[4, 13, 19], [5, 11, 15], [6, 9, 12], [6, 17, 22], [7, 20, 24]]),
      ...runs("K", [[9, 9, 12], [9, 21, 22]]),
      ...STUBBLE, run(20, 13, 18, "F"),
    ],
  },
  // Dagobert Renouf: short dark hair, beard, green leather jacket and a chain.
  dago: {
    look: { H: "#e0a482", Y: "#b87a58", I: "#f0c4a2", K: "#46301f", L: "#6a4a32", Z: "#2e1f14", F: "#5a3e2a", f: "#40291b", C: "#2f8f42", c: "#1e6a2e", D: "#58b65e", T: "#cbc4b2", t: "#b8b09c", a: "#e8c25a" },
    mouth: "grin",
    draw: [
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 6, 15], [8, 5, 15], [9, 5, 10], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      ...runs("L", [[6, 10, 14], [7, 18, 22]]),
      ...runs("K", [[9, 13, 18], [10, 15, 16]]),
      ...BEARD, run(21, 13, 18, "x"), run(20, 13, 18, "m"), px(13, 21, "m"), px(18, 21, "m"), run(22, 14, 17, "m"),
      // The chain, and a white tee under the open jacket.
      rect(13, 27, 6, 5, "x"), run(27, 12, 19, "a"), px(12, 28, "a"), px(19, 28, "a"), run(29, 13, 18, "a"),
      ...syms("c", [[27, 11, 11], [28, 11, 12], [29, 12, 12], [30, 12, 12], [31, 12, 12]]),
    ],
  },
  // Nico Jeannen: brushed-back hair, full beard, a half smile.
  nico: {
    look: { H: "#e4aa8a", Y: "#bd7f60", I: "#f2c6a8", K: "#6e4a2e", L: "#96704a", Z: "#4a301c", F: "#8e5c38", f: "#6e4228", C: "#2c2a28", c: "#1c1a18", D: "#403c38", T: "#5b5642", t: "#4c4836" },
    mouth: "smirk",
    draw: [
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 6, 15], [8, 5, 15], [9, 5, 9], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      ...runs("L", [[5, 12, 18], [6, 10, 14], [7, 17, 21]]),
      ...runs("K", [[9, 12, 13]]),
      ...BEARD, px(18, 20, "m"),
    ],
  },
  // Thomas Sanlis: his avatar is a black and white photo on orange.
  thomas: {
    look: { H: "#c8c4c0", Y: "#9a9692", I: "#e4e0dc", K: "#2a2826", L: "#4a4744", Z: "#161514", B: "#2a2826", m: "#6a6662", C: "#1e1d1c", c: "#121110", D: "#34322f", T: "#f4a676", t: "#e8925e" },
    mouth: "grin",
    draw: [
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 6, 15], [8, 5, 15], [9, 5, 9], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      // A side parting, swept to the right.
      ...runs("K", [[9, 16, 26], [10, 19, 26], [11, 23, 26], [4, 14, 22]]),
      ...runs("L", [[5, 15, 21], [6, 18, 23], [7, 21, 25]]),
      ...runs("H", [[9, 10, 12]]),
    ],
  },
  // Tony Dinh: black hair over the ears, a denim shirt, a yellow disc on pink.
  tony: {
    look: { H: "#e6b48c", Y: "#c08e66", I: "#f4cca8", K: "#1e1a1c", L: "#3a3236", Z: "#0e0c0d", C: "#4b6c8e", c: "#344e6a", D: "#6a8cae", T: "#ea2f86", t: "#f6c22c", b: "#c8d6e4" },
    mouth: "smile",
    draw: [
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 6, 15], [8, 5, 15], [9, 5, 15], [10, 5, 12], [11, 4, 9], [12, 4, 7], [13, 4, 6], [14, 4, 5], [15, 3, 4], [16, 3, 4], [17, 3, 4], [18, 4, 4]]),
      // Parted in the middle.
      ...runs("H", [[10, 15, 16], [11, 14, 17]]), ...runs("L", [[6, 11, 14], [6, 17, 20], [7, 9, 12], [8, 7, 8], [8, 23, 24]]),
      // Strands of the fringe over the brows.
      ...runs("K", [[11, 10, 10], [11, 21, 21], [12, 8, 8], [12, 23, 23]]), ...runs("Z", [[9, 13, 14], [9, 17, 18], [10, 14, 14], [10, 17, 17]]),
      // Collar and buttons.
      ...syms("b", [[27, 11, 12], [28, 12, 13]]), px(15, 29, "b"), px(15, 31, "b"),
    ],
  },
  // Danny Postma: hair up in a bun, round glasses, a full beard, a red shirt.
  danny: {
    look: { H: "#ebb898", Y: "#c48c6c", I: "#f6d0b4", K: "#8a4a26", L: "#b26a3a", Z: "#5e2e16", F: "#8a4a26", f: "#6a3418", C: "#c8352a", c: "#962218", D: "#e45c48", T: "#6fa4a8", t: "#5c9094", g: "#5a5450" },
    mouth: "smile",
    draw: [
      // The bun, then the hair pulled back.
      rect(13, 1, 6, 4, "K"), run(1, 14, 16, "L"), run(0, 14, 17, "K"),
      ...syms("K", [[5, 11, 15], [6, 8, 15], [7, 7, 15], [8, 6, 15], [9, 6, 8], [10, 6, 6], [11, 6, 6]]),
      ...runs("L", [[6, 10, 14], [7, 9, 12], [8, 8, 10], [6, 18, 20]]),
      ...runs("Z", [[5, 13, 18]]),
      ...BEARD, ...ROUND,
    ],
  },
  // Arvid Kahl: auburn hair and beard, round glasses, a red and gold hoodie.
  arvid: {
    look: { H: "#ebb698", Y: "#c48a6c", I: "#f6ceb2", K: "#8a5030", L: "#b0703e", Z: "#5e341c", F: "#9a5a32", f: "#74401f", C: "#9e2a22", c: "#701c16", D: "#c43c2e", T: "#3b3f3d", t: "#2f3331", g: "#a89a7a", a: "#e2b440" },
    mouth: "grin",
    draw: [
      ...syms("K", [[4, 11, 15], [5, 8, 15], [6, 6, 15], [7, 5, 15], [8, 5, 15], [9, 5, 9], [10, 5, 7], [11, 5, 6], [12, 5, 5], [13, 5, 5]]),
      ...runs("L", [[5, 10, 16], [6, 8, 11], [6, 18, 23], [7, 20, 25]]),
      ...runs("K", [[9, 11, 12], [9, 19, 20]]),
      ...BEARD, run(21, 13, 18, "x"), run(20, 13, 18, "m"), px(13, 21, "m"), px(18, 21, "m"), run(22, 14, 17, "m"),
      ...ROUND,
      // Gold stripes on the hood, a grey tee under it.
      rect(13, 27, 6, 5, "s"), ...syms("a", [[27, 9, 10], [28, 8, 9], [29, 7, 8], [30, 6, 7], [31, 5, 6]]),
    ],
  },
  // Benjamin Code: a dark cap, glasses, short beard, a white tee.
  benjamin: {
    look: { H: "#cfc9c4", Y: "#a39d98", I: "#e6e2de", K: "#3c3a38", L: "#5a5754", Z: "#242322", B: "#3c3a38", m: "#77716c", F: "#5e5a56", f: "#46433f", C: "#f0eeea", c: "#cfccc6", D: "#ffffff", T: "#dcdcdc", t: "#c8c8c8", g: "#2a2826", q: "#3a3a40", Q: "#26262a", r: "#d23a2a", a: "#e8c040" },
    mouth: "smile",
    draw: [
      // The cap: the crown, then the peak, with a little badge.
      ...syms("q", [[3, 11, 15], [4, 8, 15], [5, 7, 15], [6, 6, 15], [7, 6, 15], [8, 5, 15], [9, 5, 15], [10, 5, 7], [11, 5, 6], [12, 5, 5]]),
      ...runs("Q", [[10, 8, 23], [11, 7, 24]]), run(9, 6, 25, "Q"),
      rect(15, 5, 2, 2, "a"), px(15, 5, "r"),
      ...SQUARE, ...STUBBLE, run(20, 13, 18, "F"),
    ],
  },
}

for (const [who, guest] of Object.entries(GUESTS)) {
  pal({ ...BODY, B: guest.look.Z, x: "#f6f2ea", w: "#f6f2ea", s: "#9aa0a6", ...guest.look })
  sprite(`_ghead_${who}`, { mx: true }, GHEAD)
  figure(
    `_guest_${who}`,
    { w: 32, h: 32 },
    guest.look.k ?? BODY.k,
    stamp(`_ghead_${who}`, 0, 0),
    ...NOSE,
    ...MOUTH[guest.mouth],
    ...guest.draw,
  )
  sprite(
    `guest_${who}`,
    { w: 32, h: 32 },
    rect(0, 0, 32, 32, "T"),
    ...(who === "tony" ? [circ(16, 15, 13, "t")] : [rect(0, 31, 32, 1, "t")]),
    stamp(`_guest_${who}`, -1, -1),
  )
}

// Everything the game places, on one sheet.
// The intro has its own pictures, and its own sheet.
include("intro.px.js")

sheet(
  "sprites",
  ["chart_*", "plant_*", "bowl_*", "wrapper_*", "screen_*", "*_front_*", "*_arm_*", "*_back_*", "*_asleep_*", "*_eat_*", "phone_*", "bubble_*", "neon"],
  { pad: 1 },
)
