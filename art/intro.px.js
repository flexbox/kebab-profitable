// The intro, before a run: a street in Lille on the last evening of the year,
// then the owner of the kebab shop.
//
// Included at the end of kebab.px.js, whose colours and painter it uses. The
// street is much wider than the screen: the game pans along it, with the
// skyline behind moving more slowly.

const VIEW_W = 256
const VIEW_H = 144
const STREET_W = 560
const FAR_W = 384
/** Where the buildings meet the pavement, then the kerb. */
const PAVE_Y = 112
const KERB_Y = 128

// The street after dark, under a lamp, and in the cold light of an office lobby.
GRADE.street = (c) => mix(mul(c, [0.46, 0.5, 0.7]), [18, 26, 54], 0.2)
GRADE.street1 = between("lamp", "street", 0.5)
GRADE.lobby = (c) => mix(mul(c, [0.82, 0.92, 1.0]), [190, 215, 240], 0.12)
GRADE.lobby1 = between("lobby", "street", 0.5)

const GLASS_DARK = "#3a4d63"
const OFFICE_LIGHT = "#d6e8f0"
const LANTERN = "#ffe9a8"

// ---------------------------------------------------------------------------
// The sky and the skyline
// ---------------------------------------------------------------------------

// Overcast, with the glow of the town under the clouds. The sky goes from
// night overhead to that glow in many narrow bands, each melting into the next.
scene("intro_sky", { w: VIEW_W, h: VIEW_H }, (c) => {
  const stops = [[0, "#090e26"], [0.3, "#161c42"], [0.55, "#28295a"], [0.75, "#44376a"], [0.9, "#684a74"], [1, "#8a5a70"]]
  const at = (t) => {
    const i = Math.max(1, stops.findIndex(([edge]) => edge >= t))
    const [t0, a] = stops[i - 1]
    const [t1, b] = stops[i]
    return hex(mix(rgb(a), rgb(b), (t - t0) / (t1 - t0)))
  }
  const bands = 16
  const top = (i) => Math.round((i * PAVE_Y) / bands)
  for (let i = 0; i < bands; i++) {
    const band = at(i / (bands - 1))
    c.rect(0, top(i), VIEW_W, (i === bands - 1 ? VIEW_H : top(i + 1)) - top(i), band)
    if (i > 0) for (let x = 0; x < VIEW_W; x++) if (dithered(x, top(i) - 1, 0.5)) c.px(x, top(i) - 1, band)
  }
  // Long flat clouds, darker than the sky behind them, lit from below.
  const clouds = [[18, 14, 70], [120, 8, 96], [196, 22, 60], [60, 36, 110], [-10, 46, 50], [170, 44, 86], [30, 62, 64], [128, 66, 120]]
  for (const [x, y, w] of clouds) {
    const body = darken(at(y / PAVE_Y), 0.22)
    c.rect(x + 3, y, w - 6, 1, body)
    c.rect(x, y + 1, w, 2, body)
    c.rect(x + 5, y + 3, w - 12, 1, lighten(at(y / PAVE_Y), 0.12))
  }
})

const FAR = "#0d1126"
const FAR_EDGE = "#1a2040"
const FARTHER = "#1c2148"

// What stands behind the street: gables, the belfry, the big wheel of the
// Christmas market, and the towers by the station.
scene("intro_far", { w: FAR_W, h: VIEW_H }, (c) => {
  const lit = (x, y, w = 1, h = 2) => c.rect(x, y, w, h, WINDOW_LIGHT)

  // The towers by the station, furthest away.
  for (const [x, top, w] of [[300, 40, 22], [326, 54, 16], [346, 30, 18]]) {
    c.rect(x, top, w, VIEW_H - top, FARTHER)
    for (let y = top + 4; y < 104; y += 5) for (let i = x + 2; i < x + w - 2; i += 4) if ((i * 7 + y * 3) % 5 === 0) c.rect(i, y, 2, 2, "#8a8fa8")
  }
  // The slanted one.
  c.poly([346, 30, 364, 30, 364, 22, 352, 30], FARTHER)

  // The big wheel, with a light on every cabin.
  const [wx, wy, wr] = [232, 62, 30]
  c.ring(wx, wy, wr, FAR)
  c.ring(wx, wy, wr - 1, FAR)
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6
    const [ex, ey] = [Math.round(wx + Math.cos(a) * wr), Math.round(wy + Math.sin(a) * wr)]
    c.line(wx, wy, ex, ey, FAR)
    c.rect(ex - 1, ey - 1, 3, 3, FAR)
    c.px(ex, ey, k % 3 === 0 ? "#f08a5a" : WINDOW_LIGHT)
    // A string of bulbs between the cabins.
    const b = a + Math.PI / 12
    c.px(Math.round(wx + Math.cos(b) * wr), Math.round(wy + Math.sin(b) * wr), "#b98a4a")
  }
  c.poly([wx, wy, wx - 16, VIEW_H, wx - 12, VIEW_H], FAR)
  c.poly([wx, wy, wx + 16, VIEW_H, wx + 12, VIEW_H], FAR)
  c.rect(wx - 2, wy - 2, 5, 5, FAR)
  c.px(wx, wy, WINDOW_LIGHT)

  // A row of stepped gables, in two depths.
  const gable = (x, top, w, tone) => {
    c.rect(x, top, w, VIEW_H - top, tone)
    for (let s = 1; s <= 3; s++) c.rect(x + s * 2, top - s * 2, w - s * 4, 2, tone)
    c.rect(x + w - 1, top, 1, VIEW_H - top, FAR_EDGE)
  }
  const row = [
    [0, 84, 22], [22, 76, 18], [40, 88, 24], [64, 72, 20], [84, 82, 22], [118, 86, 18], [136, 78, 22],
    [158, 90, 20], [178, 80, 20], [264, 84, 20], [284, 76, 18], [360, 86, 24],
  ]
  for (const [x, top, w] of row) {
    gable(x, top, w, FAR)
    for (let y = top + 5; y < 108; y += 8) {
      for (let i = x + 3; i < x + w - 3; i += 5) if ((i * 3 + y) % 7 === 0) lit(i, y)
    }
  }

  // The belfry of the town hall: a tall brick shaft, a lantern at the top.
  const bx = 100
  c.rect(bx, 34, 14, VIEW_H - 34, FAR)
  c.rect(bx + 13, 34, 1, VIEW_H - 34, FAR_EDGE)
  c.rect(bx + 2, 26, 10, 8, FAR)
  c.rect(bx + 4, 16, 6, 10, FAR)
  c.rect(bx + 5, 10, 4, 6, FAR)
  c.rect(bx + 6, 2, 2, 8, FAR)
  c.rect(bx - 1, 33, 16, 1, FAR_EDGE)
  c.rect(bx + 1, 25, 12, 1, FAR_EDGE)
  c.rect(bx + 5, 18, 4, 4, LANTERN)
  c.px(bx + 6, 2, "#f08a5a")
  for (let y = 44; y < 100; y += 12) c.rect(bx + 6, y, 2, 4, "#2a3166")
})

// ---------------------------------------------------------------------------
// The street
// ---------------------------------------------------------------------------

/** A wall of brick in courses, with staggered joints. */
function brickWall(p, x, y, w, h, tone = C.brick) {
  p.r(x, y, w, h, tone)
  for (let row = 0; row * 4 < h; row++) {
    const yy = y + row * 4
    p.r(x, yy, w, 1, C.mortar)
    const tall = Math.min(3, y + h - yy - 1)
    if (tall <= 0) continue
    for (let xx = x + (row % 2) * 4 + 3; xx < x + w; xx += 8) p.r(xx, yy + 1, 1, tall, C.mortar)
    for (let k = 0; x + k * 8 < x + w; k++) {
      const bake = (row * 7 + k * 13) % 9
      const bx = x + k * 8 + (row % 2) * 4 + 4
      if (bake === 0 && bx + 7 <= x + w) p.r(bx, yy + 1, 7, tall, C.brickLight)
      if (bake === 4 && bx + 7 <= x + w) p.r(bx, yy + 1, 7, tall, C.brickDark)
    }
  }
}

/** A stepped gable on top of a wall: the Flemish kind. */
function steps(p, x, top, w, paint, count = 4, tread = 5, rise = 5) {
  for (let s = 1; s <= count; s++) {
    const sx = x + s * tread
    const sw = w - s * tread * 2
    if (sw <= 0) break
    paint(sx, top - s * rise, sw, rise)
    p.r(sx, top - s * rise, sw, 1, C.beigeDark)
    p.r(sx - 1, top - s * rise, 1, rise, C.ink)
    p.r(sx + sw, top - s * rise, 1, rise, C.ink)
  }
}

/** A window: frame, glass, glazing bars and a sill. Lit ones give off light. */
function windowAt(p, x, y, w, h, light) {
  p.box(x, y, w, h, C.woodDark)
  if (light) p.e(x + 1, y + 1, w - 2, h - 2, light)
  else {
    p.r(x + 1, y + 1, w - 2, h - 2, GLASS_DARK)
    p.r(x + 1, y + 1, w - 2, 1, lighten(GLASS_DARK, 0.2))
  }
  p.r(x + (w >> 1), y + 1, 1, h - 2, C.woodDark)
  p.r(x + 1, y + (h >> 1), w - 2, 1, C.woodDark)
  p.box(x - 1, y + h + 1, w + 2, 1, C.beige)
}

function lamppost(p, x) {
  const iron = "#2e343c"
  p.r(x, 64, 2, PAVE_Y - 64, iron)
  p.r(x - 1, PAVE_Y - 6, 4, 6, iron)
  p.r(x - 2, PAVE_Y - 1, 6, 1, iron)
  p.r(x - 1, 70, 4, 1, iron)
  // The lantern: a roof, four panes, a finial.
  p.r(x, 52, 2, 2, iron)
  p.r(x - 3, 54, 8, 2, iron)
  p.r(x - 2, 56, 6, 7, iron)
  p.e(x - 1, 57, 4, 5, LANTERN)
  p.e(x, 58, 2, 3, "#fff8dc")
  p.r(x - 3, 63, 8, 1, iron)
}

/** Where the lamps stand, and the shop window: each lights the street around it. */
const LAMPS = [152, 334, 474]
const SHOP = { x: 352, w: 58 }
/** The band over the shop, where the game hangs the neon. */
const SIGN_Y = 71

function paintStreet(c, grade) {
  const p = painter(c, grader(grade))

  // --- The road and the pavement -------------------------------------------
  const slab = "#8f8c84"
  p.r(0, PAVE_Y, STREET_W, KERB_Y - PAVE_Y, slab)
  p.r(0, PAVE_Y, STREET_W, 1, darken(slab, 0.3))
  for (let y = PAVE_Y + 5; y < KERB_Y; y += 5) p.r(0, y, STREET_W, 1, darken(slab, 0.16))
  for (let k = 0; k * 14 < STREET_W; k++) {
    for (let row = 0; row < 3; row++) p.r(k * 14 + ((row * 7) % 14), PAVE_Y + 1 + row * 5, 1, 4, darken(slab, 0.16))
  }
  // The kerb, then the cobbles of the North.
  p.r(0, KERB_Y, STREET_W, 2, lighten(slab, 0.18))
  p.r(0, KERB_Y + 2, STREET_W, 1, C.ink)
  const stone = "#5d6068"
  p.r(0, KERB_Y + 3, STREET_W, VIEW_H - KERB_Y - 3, darken(stone, 0.35))
  for (let row = 0; KERB_Y + 3 + row * 4 < VIEW_H; row++) {
    for (let x = -6 + ((row * 3) % 6); x < STREET_W; x += 6) {
      const tone = (x * 5 + row * 11) % 4 === 0 ? lighten(stone, 0.1) : stone
      p.r(x, KERB_Y + 4 + row * 4, 5, 3, tone)
      p.r(x, KERB_Y + 4 + row * 4, 5, 1, lighten(tone, 0.14))
    }
  }

  // --- The office: glass, steel, and three letters over the door -----------
  const T = 8
  const TW = 112
  p.r(T, 0, TW, PAVE_Y, "#566373")
  p.r(T, 0, 1, PAVE_Y, C.ink)
  p.r(T + TW - 1, 0, 1, PAVE_Y, C.ink)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const x = T + 3 + col * 12
      const y = 1 + row * 9
      // Almost everyone has gone home. Not quite everyone.
      if ((row * 5 + col * 3 + 2) % 11 === 0) {
        p.e(x, y, 10, 7, OFFICE_LIGHT)
        p.e(x, y + 5, 10, 2, "#aac4d2")
      } else {
        p.r(x, y, 10, 7, GLASS_DARK)
        p.r(x, y, 10, 1, lighten(GLASS_DARK, 0.18))
        p.r(x + 6, y + 2, 3, 1, lighten(GLASS_DARK, 0.1))
      }
    }
  }
  // The lobby: a canopy, glass doors, light that never goes off.
  p.r(T + 1, 82, TW - 2, PAVE_Y - 82, "#465260")
  p.box(T + 24, 62, 64, 17, "#1f2933")
  c.text(T + 56, 66, "CDI", "#f4f8fb", { align: "c", scale: 2, gap: 2 })
  p.box(T + 18, 82, 76, 4, "#39434f")
  p.r(T + 18, 82, 76, 1, "#5a6878")
  p.box(T + 34, 88, 44, PAVE_Y - 88, "#2a323c")
  p.e(T + 36, 90, 19, PAVE_Y - 90, OFFICE_LIGHT)
  p.e(T + 57, 90, 19, PAVE_Y - 90, OFFICE_LIGHT)
  p.e(T + 36, 104, 40, PAVE_Y - 104, "#b9d0dc")
  p.r(T + 52, 98, 1, 6, "#2a323c")
  p.r(T + 59, 98, 1, 6, "#2a323c")
  for (const x of [T + 8, T + 96]) {
    p.box(x, 90, 10, PAVE_Y - 90, GLASS_DARK)
    p.r(x, 90, 10, 1, lighten(GLASS_DARK, 0.18))
  }
  // A shrub in a tub, as outside every office.
  p.box(T + 22, 104, 8, 8, "#3d4651")
  p.r(T + 21, 96, 10, 8, C.leafDark)
  p.r(T + 22, 94, 8, 3, C.leaf)
  p.r(T + 24, 93, 4, 1, C.leafLight)

  // --- A bare tree and a bench ---------------------------------------------
  const bark = "#4a3a30"
  p.r(183, 78, 3, PAVE_Y - 78, bark)
  p.r(182, PAVE_Y - 3, 5, 3, bark)
  for (const [x0, y0, x1, y1] of [[184, 80, 176, 62], [184, 78, 193, 58], [184, 86, 172, 76], [185, 84, 198, 72], [178, 66, 174, 54], [191, 62, 197, 50], [184, 70, 184, 52]]) {
    c.line(x0, y0, x1, y1, grader(grade)(bark))
  }
  p.box(164, 100, 16, 2, C.wood)
  p.r(165, 102, 1, 10, C.ink)
  p.r(178, 102, 1, 10, C.ink)
  p.box(164, 94, 16, 2, C.wood)

  // --- The estaminet: brick, a stepped gable, warm windows -----------------
  const E = 206
  const EW = 62
  const ET = 52
  brickWall(p, E, ET, EW, PAVE_Y - ET)
  steps(p, E, ET, EW, (x, y, w, h) => brickWall(p, x, y, w, h))
  p.r(E, ET, 1, PAVE_Y - ET, C.ink)
  p.r(E + EW - 1, ET, 1, PAVE_Y - ET, C.ink)
  p.r(E, ET, EW, 1, C.beigeDark)
  windowAt(p, E + 25, 38, 12, 10, null)
  windowAt(p, E + 8, 58, 12, 14, WINDOW_LIGHT)
  windowAt(p, E + 42, 58, 12, 14, null)
  // The front: dark wood, the name in gold, two bright windows and a door.
  p.box(E + 3, 80, EW - 6, PAVE_Y - 80, "#4a2e22")
  p.r(E + 3, 80, EW - 6, 9, "#33201a")
  p.text(E + 31, 82, "ESTAMINET", C.gold, { align: "c" })
  p.box(E + 7, 92, 18, 14, C.woodDark)
  p.e(E + 8, 93, 16, 12, WINDOW_LIGHT)
  p.e(E + 8, 101, 16, 4, "#e0a850")
  p.box(E + 37, 92, 18, 14, C.woodDark)
  p.e(E + 38, 93, 16, 12, WINDOW_LIGHT)
  p.e(E + 38, 101, 16, 4, "#e0a850")
  // People at the tables, against the light.
  for (const x of [E + 11, E + 18, E + 42, E + 49]) {
    p.e(x, 98, 3, 3, "#7a4a22")
    p.e(x - 1, 101, 5, 4, "#7a4a22")
  }
  p.box(E + 28, 92, 7, PAVE_Y - 92, "#6e4a2a")
  p.e(E + 29, 94, 5, 7, "#e0a850")
  p.r(E + 33, 103, 1, 2, C.gold)

  // --- The house to let: render, a gable, a shutter pulled down ------------
  const L = 270
  const LW = 54
  const LT = 60
  p.r(L, LT, LW, PAVE_Y - LT, C.beigeMid)
  p.r(L, LT, LW, 1, C.beigeDark)
  steps(p, L, LT, LW, (x, y, w, h) => p.r(x, y, w, h, C.beigeMid), 3, 6, 5)
  p.r(L, LT, 1, PAVE_Y - LT, C.ink)
  p.r(L + LW - 1, LT, 1, PAVE_Y - LT, C.ink)
  // Rain has run down the render under each sill.
  windowAt(p, L + 21, 49, 12, 9, null)
  windowAt(p, L + 8, 64, 12, 12, null)
  windowAt(p, L + 34, 64, 12, 12, null)
  for (const x of [L + 8, L + 19, L + 34, L + 45]) p.r(x, 79, 1, 5, C.beigeDark)
  p.box(L + 5, 86, LW - 10, PAVE_Y - 86, "#7d8a8a")
  for (let y = 88; y < PAVE_Y; y += 3) p.r(L + 5, y, LW - 10, 1, "#5f6c6c")
  p.box(L + 13, 92, 28, 9, C.paper)
  p.text(L + 27, 94, "A LOUER", C.red, { align: "c" })

  // --- Your building: the kebab shop below, your studio above --------------
  const K = 344
  const KW = 110
  const KT = 34
  brickWall(p, K, KT, KW, PAVE_Y - KT, "#8f4a37")
  p.r(K, KT, 1, PAVE_Y - KT, C.ink)
  p.r(K + KW - 1, KT, 1, PAVE_Y - KT, C.ink)
  // A cornice, and a roof line above it.
  p.box(K - 2, KT - 5, KW + 4, 5, C.beige)
  p.r(K - 2, KT - 1, KW + 4, 1, C.beigeDark)
  p.r(K + 2, KT - 12, KW - 4, 6, "#3c4250")
  p.r(K + 2, KT - 12, KW - 4, 1, "#525a6c")
  p.box(K + 84, KT - 20, 8, 8, "#7a4332")
  // Two floors of windows. One of them is yours: the sign is already on.
  for (const y of [39, 56]) {
    for (const [i, x] of [K + 10, K + 34, K + 62, K + 88].entries()) {
      const yours = y === 56 && i === 2
      const warm = y === 39 && i === 0
      windowAt(p, x, y, 13, 11, yours ? "#2c6f86" : warm ? WINDOW_LIGHT : null)
      if (yours) {
        p.e(x + 2, y + 2, 9, 3, "#61dafb")
        p.e(x + 3, y + 3, 7, 1, "#c8f3ff")
      }
    }
  }
  // The shop front: a band for the neon, an awning, the window, the door.
  p.box(K + 4, SIGN_Y, 76, 12, "#2a1c18")
  for (let i = 0; i < 20; i++) {
    const x = K + 2 + i * 4
    p.r(x, 85, 4, 5, i % 2 ? C.white : C.red)
    p.r(x, 89, 4, 1, i % 2 ? C.whiteShade : "#8c2c22")
    p.r(x + 1, 90, 2, 1, i % 2 ? C.white : C.red)
  }
  p.r(K + 2, 84, 80, 1, C.ink)
  p.box(SHOP.x, 93, SHOP.w, 17, "#5a3a26")
  p.e(SHOP.x + 1, 94, SHOP.w - 2, 15, WINDOW_LIGHT)
  p.e(SHOP.x + 1, 104, SHOP.w - 2, 5, "#e0a850")
  // In the window: the spit on its rod, and somebody in a tall hat.
  const shade = "#7a4a22"
  p.e(SHOP.x + 43, 94, 1, 15, "#5a3a26")
  p.e(SHOP.x + 39, 96, 9, 3, "#8a4a26")
  p.e(SHOP.x + 40, 99, 7, 4, "#8a4a26")
  p.e(SHOP.x + 41, 103, 5, 3, "#8a4a26")
  p.e(SHOP.x + 38, 107, 11, 2, "#5a3a26")
  p.e(SHOP.x + 14, 94, 7, 1, "#fff8dc")
  p.e(SHOP.x + 12, 95, 11, 2, "#fff8dc")
  p.e(SHOP.x + 14, 97, 7, 2, "#fff8dc")
  p.e(SHOP.x + 14, 98, 7, 1, "#e8dcb8")
  p.e(SHOP.x + 14, 99, 7, 4, shade)
  p.e(SHOP.x + 10, 103, 15, 6, shade)
  p.e(SHOP.x + 15, 101, 5, 1, "#33201a")
  p.e(SHOP.x + 14, 100, 1, 1, "#33201a")
  p.e(SHOP.x + 20, 100, 1, 1, "#33201a")
  // The counter, along the bottom of the glass.
  p.e(SHOP.x + 1, 108, SHOP.w - 2, 1, "#b8802e")
  p.box(K + 70, 93, 10, PAVE_Y - 93, "#5a3a26")
  p.e(K + 71, 94, 8, 12, WINDOW_LIGHT)
  p.r(K + 78, 102, 1, 2, C.gold)
  // The door to the flats, with its number.
  p.box(K + 90, 88, 13, PAVE_Y - 88, "#3f5a4a")
  p.r(K + 92, 91, 9, 8, "#324a3c")
  p.r(K + 92, 101, 9, 9, "#324a3c")
  p.r(K + 101, 100, 1, 2, C.gold)
  p.box(K + 93, 80, 7, 5, C.white)
  p.r(K + 95, 81, 3, 3, "#2a323c")

  // --- The end of the street: a wall, posters, the bins ---------------------
  brickWall(p, 454, 76, 106, PAVE_Y - 76, "#7d4130")
  p.box(454, 73, 106, 3, C.beigeDark)
  for (const [x, tone] of [[488, C.gold], [504, "#4a6fc0"], [520, C.paper]]) {
    p.box(x, 84, 12, 16, tone)
    p.r(x + 2, 87, 8, 1, C.ink)
    p.r(x + 2, 90, 6, 1, C.ink)
    p.r(x + 2, 94, 8, 3, darken(tone, 0.3))
  }
  p.box(536, 98, 9, 14, "#3d5a48")
  p.r(535, 97, 11, 2, "#2f4638")
  p.box(547, 100, 9, 12, "#5a5048")
  p.r(546, 99, 11, 2, "#463e38")

  for (const x of LAMPS) lamppost(p, x)

  // Puddles: the road is wet, and holds whatever light is over it.
  for (const [x, w] of [[40, 22], [120, 14], [150, 18], [236, 20], [320, 26], [372, 30], [470, 16]]) {
    p.adjust(x, KERB_Y + 6, w, 2, (px) => mix(px, [200, 210, 230], 0.3))
    p.adjust(x + 3, KERB_Y + 10, w - 6, 1, (px) => mix(px, [200, 210, 230], 0.2))
  }
  // Under each light, its reflection on the cobbles: broken up by the joints,
  // and fainter the further it runs.
  const reflect = (x, w, colour, strength) => {
    for (let y = KERB_Y + 4; y < VIEW_H; y += 2) {
      const fade = strength * (1 - (y - KERB_Y - 4) / (VIEW_H - KERB_Y))
      const sway = y % 4 === 0 ? 1 : 0
      p.adjust(x + sway, y, w, 1, (px) => mix(px, rgb(colour), fade))
    }
  }
  for (const x of LAMPS) reflect(x - 2, 6, LANTERN, 0.55)
  reflect(SHOP.x + 4, SHOP.w - 8, WINDOW_LIGHT, 0.32)
  reflect(46, 40, OFFICE_LIGHT, 0.3)
  // And the neon, red on the wet pavement in front of the shop.
  p.adjust(K + 8, PAVE_Y + 3, 68, 9, (px) => mix(px, rgb(KEBAB_NEON), 0.2), 0.5)
}

// The street in each light it needs, then put together: dark, with a pool of
// warm light around each lamp and the shop, and a cold one at the lobby.
for (const g of ["street", "street1", "lamp", "lobby1", "lobby"]) {
  scene(`_street_${g}`, { w: STREET_W, h: VIEW_H }, (c) => paintStreet(c, g))
}
const pool = (grade, where, i) => [
  layer(`rim_${grade}_${i}`, { density: 0.5 }, clip([where[0], where[1], where[2] + 4], stamp(`_street_${grade}`, 0, 0))),
  clip(where, stamp(`_street_${grade}`, 0, 0)),
]
scene(
  "intro_street",
  { w: STREET_W, h: VIEW_H },
  stamp("_street_street", 0, 0),
  ...LAMPS.flatMap((x, i) => [...pool("street1", [x + 1, 92, 40], i), ...pool("lamp", [x + 1, 92, 24], i)]),
  ...pool("street1", [SHOP.x + 34, 112, 46], "shop"),
  ...pool("lamp", [SHOP.x + 34, 110, 30], "shop"),
  ...pool("lobby1", [64, 112, 40], "lobby"),
  ...pool("lobby", [64, 110, 24], "lobby"),
)

// ---------------------------------------------------------------------------
// Things the game places on the street
// ---------------------------------------------------------------------------

// The neon over the shop: its tubes and the light around them, see-through,
// like the sign in the flat. The game makes it flicker.
const KEBAB_NEON = "#ff5d3a"
sprite("intro_neon", { w: 76 + NEON_REACH * 2, h: 12 + NEON_REACH * 2 }, (c) => {
  c.text(NEON_REACH + 38, NEON_REACH + 1, "KEBAB", lighten(KEBAB_NEON, 0.55), { align: "c", scale: 2 })
  const tubes = []
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.get(x, y) & 255) tubes.push([x, y])
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.get(x, y) & 255) continue
      const far = Math.min(...tubes.map(([tx, ty]) => Math.hypot(tx - x, ty - y)))
      const step = NEON_FALLOFF.find(([reach]) => far <= reach)
      if (step) c.px(x, y, KEBAB_NEON + Math.round(step[1] * 255).toString(16).padStart(2, "0"))
    }
  }
})

// Whoever you are going to be, walking home with a box: a parka with the hood
// up, because nobody has chosen a founder yet, and because it rains.
{
  const tint = grader("street1")
  const look = {
    k: "#1c1a20",
    h: "#506078", j: "#6c7d98", d: "#3a475c", f: "#c2b28e",
    H: BODY.H, Y: BODY.Y,
    B: "#c09058", b: "#8f6638", t: "#e6cb92",
    g: "#6fb257", G: "#447f3c", x: "#f4eedd",
    Q: "#48526a", U: "#30384a", S: "#2a2422",
  }
  pal(Object.fromEntries(Object.entries(look).map(([key, h]) => [key, key === "k" ? h : tint(h)])))

  const TOP = `
    ....ddhhh.........
    ...dhhjjhh........
    ..dhhjhhhhf.......
    ..dhhhhhhfHH......
    ..dhhhhhhfkH....g.
    ..dhhhhhhfHHH..gg.
    ..ddhhhhhfHY..gGg.
    ...dhhhhhhfY..gG..
    ...dhhhhhhh..xgG..
    ..dhhhhjhhhh.xxG..
    ..dhhhhjjhhhBBBBBB
    ..dhhhhhjjjjHBtBBB
    ..dhhhhhhjjjHBtBBB
    ..dhhhhhhhhhBBtBBb
    ..dhhhhhhhhhBBBBBb
    ..dhhhhhhhhhbbbbbb
    ..dhhhhhhhh.......
    ..ddhhhhhhh.......`
  // Legs apart, the near one forward; legs together; legs apart, the far one forward.
  const STRIDE_NEAR = `
    ...UUQQQQ.........
    ..UUU.QQQQ........
    ..UU...QQQ........
    .UUU....QQQ.......
    .UU......QQ.......
    SSU......QQ.......
    SS.......SSS......
    .........SSSS.....`
  const TOGETHER = `
    ....UQQQQ.........
    ....UQQQQ.........
    ....UQQQ..........
    ....UQQQ..........
    ....UQQQ..........
    ....UQQQ..........
    ....UQQQ..........
    ....SSSS..........
    ....SSSSS.........`
  const STRIDE_FAR = `
    ...QQQUUU.........
    ..QQQ.UUUU........
    ..QQ...UUU........
    .QQQ....UUU.......
    .QQ......UU.......
    SSQ......UU.......
    SS.......SSS......
    .........SSSS.....`
  // The body drops a pixel when the legs are apart.
  const walk = [[STRIDE_NEAR, 1], [TOGETHER, 0], [STRIDE_FAR, 1], [TOGETHER, 0]]
  walk.forEach(([legs, drop], i) => {
    figure(`intro_walk_${i}`, { w: 18, h: 27 }, look.k, grid(0, drop, TOP), grid(0, 18 + drop, legs))
  })
}

// ---------------------------------------------------------------------------
// Chef, as you meet him: arms crossed, the long knife in his fist
// ---------------------------------------------------------------------------

pal({
  ...BODY,
  C: "#b8452f", c: "#8c3423", D: "#d4604a",
  v: "#c9ced2", V: "#8f989e", W: "#eef3f5", // the blade
  q: "#4a3020", // the handle
})

// Everything that is the same on both sides: the hat, the head, the shoulders.
sprite("_chef_half", { w: 80, h: 104, mx: true }, (c) => {
  // Shoulders and chest, in the red shirt.
  c.poly([6, 104, 8, 76, 14, 68, 26, 63, 40, 62, 40, 104], "C")
  c.poly([6, 104, 8, 76, 10, 73, 10, 104], "c")
  // The neck, in the shade of the chin.
  c.rect(33, 56, 7, 8, "Y")
  // The apron: a bib and a strap over the shoulder.
  c.rect(27, 68, 13, 36, "x")
  c.rect(27, 68, 2, 36, "X")
  c.rect(30, 61, 3, 8, "x")
  c.rect(30, 61, 1, 8, "X")
  // The head: broad, with a heavy jaw.
  c.ellipse(40, 41, 16, 15, "H")
  c.rect(26, 40, 14, 12, "H")
  c.ellipse(40, 51, 13, 8, "H")
  c.rect(23, 39, 3, 7, "H")
  c.rect(23, 44, 3, 2, "Y")
  c.rect(26, 31, 3, 9, "Z")
  // The hat: a band, and a great pleated cloud on top of it.
  c.ellipse(40, 13, 21, 12, "x")
  c.ellipse(26, 16, 9, 9, "x")
  c.rect(24, 21, 16, 9, "x")
  c.rect(24, 28, 16, 2, "X")
  c.rect(24, 21, 16, 1, "X")
  for (const x of [29, 35]) c.rect(x, 22, 1, 6, "X")
  c.poly([22, 12, 26, 6, 30, 3, 30, 5, 27, 8, 24, 13], "X")
  // Brows like two awnings, eyes that have seen every start-up idea.
  c.rect(28, 34, 10, 3, "K")
  c.rect(28, 34, 4, 1, "L")
  c.rect(30, 39, 7, 3, "x")
  c.rect(32, 39, 3, 3, "k")
  c.rect(30, 42, 7, 1, "Y")
  // The nose.
  c.rect(38, 40, 2, 9, "H")
  c.rect(37, 46, 3, 3, "H")
  c.px(36, 48, "Y")
  // The moustache: wide, and turned up at the ends.
  c.rect(30, 49, 10, 4, "K")
  c.rect(27, 50, 4, 4, "K")
  c.rect(26, 48, 2, 3, "K")
  c.rect(31, 49, 8, 1, "L")
  c.rect(28, 53, 3, 1, "Z")
})

/** The face at rest, the same face talking, and the look that goes with a dare. */
const CHEF_FACES = [
  (c) => c.rect(37, 54, 6, 1, "m"),
  (c) => {
    c.rect(36, 53, 8, 4, "M")
    c.rect(37, 53, 6, 1, "x")
  },
  (c) => {
    // The brows come down in the middle, and the teeth show.
    c.rect(34, 36, 5, 2, "K")
    c.rect(41, 36, 5, 2, "K")
    c.rect(30, 39, 7, 1, "H")
    c.rect(43, 39, 7, 1, "H")
    c.rect(34, 53, 12, 3, "x")
    c.rect(34, 56, 12, 1, "M")
    for (const x of [37, 40, 43]) c.rect(x, 53, 1, 3, "X")
  },
]

CHEF_FACES.forEach((face, i) => {
  figure(
    `intro_chef_${i}`,
    { w: 80, h: 104 },
    BODY.k,
    stamp("_chef_half", 0, 0),
    (c) => {
      // Light comes from the left: the far side of the face and the hat is in shade.
      c.rect(52, 34, 3, 16, "Y")
      c.rect(50, 50, 3, 5, "Y")
      c.rect(41, 41, 1, 8, "Y")
      c.px(43, 48, "Y")
      c.poly([56, 6, 60, 12, 61, 20, 57, 22, 54, 12], "X")
      c.rect(51, 22, 5, 8, "X")
      c.rect(52, 68, 1, 36, "X")
      c.rect(70, 73, 3, 31, "c")
      // Sleeves rolled up over the arms.
      c.rect(7, 74, 14, 12, "C")
      c.rect(7, 85, 14, 2, "c")
      c.rect(59, 74, 14, 12, "C")
      c.rect(59, 85, 14, 2, "c")
      c.rect(9, 76, 3, 6, "D")
      // The arms, crossed: one forearm over the other.
      c.rect(14, 83, 52, 10, "H")
      c.rect(14, 91, 52, 2, "Y")
      c.rect(14, 83, 52, 1, "I")
      c.line(30, 83, 44, 92, "Y")
      c.line(31, 83, 45, 92, "Y")
      // A fist on the far arm, another around the handle.
      c.rect(11, 80, 10, 9, "H")
      c.rect(11, 87, 10, 2, "Y")
      for (const x of [13, 16, 19]) c.rect(x, 80, 1, 4, "Y")
      c.rect(58, 78, 10, 10, "H")
      c.rect(58, 86, 10, 2, "Y")
      for (const y of [80, 83]) c.rect(60, y, 8, 1, "Y")
      // The knife: long enough to shave a spit in one stroke.
      c.rect(61, 70, 5, 8, "q")
      c.rect(60, 69, 7, 2, "V")
      c.poly([61, 69, 66, 69, 70, 24, 68, 18, 64, 30], "v")
      c.poly([61, 69, 63, 69, 66, 30, 64, 30], "V")
      c.line(68, 22, 66, 66, "W")
      face(c)
    },
  )
})

// Chef's portrait, 32 by 32, as shown beside what he says. The picture above is
// the one to follow: the same hat, brows, moustache, apron and knife, at the
// size of the other portraits.
sprite("_chef_small_half", { w: 32, h: 32, mx: true }, (c) => {
  // The shoulders, the neck, the apron and its straps.
  c.poly([3, 32, 5, 28, 10, 26, 16, 26, 16, 32], "C")
  c.poly([3, 32, 5, 28, 6, 28, 5, 32], "c")
  c.rect(14, 25, 2, 2, "Y")
  c.rect(12, 28, 4, 4, "x")
  c.rect(12, 28, 1, 4, "X")
  c.rect(12, 26, 1, 2, "x")
  // The head, with its heavy jaw.
  c.ellipse(16, 18, 7, 5, "H")
  c.rect(10, 18, 6, 4, "H")
  c.ellipse(16, 22, 5, 3, "H")
  c.rect(8, 17, 1, 2, "H")
  c.px(8, 18, "Y")
  c.rect(10, 13, 1, 2, "Z")
  // The hat: the band, and the cloud on top of it.
  c.ellipse(16, 6, 8, 4, "x")
  c.ellipse(10, 8, 3, 3, "x")
  c.rect(10, 10, 6, 3, "x")
  c.rect(10, 10, 6, 1, "X")
  c.rect(12, 11, 1, 2, "X")
  c.px(8, 10, "X")
  // Brows, eyes, nose.
  c.rect(11, 15, 4, 1, "K")
  c.rect(11, 17, 3, 2, "x")
  c.rect(12, 17, 1, 2, "k")
  c.px(14, 21, "Y")
  // The moustache, turned up at the ends.
  c.rect(12, 22, 4, 2, "K")
  c.rect(10, 23, 2, 1, "K")
  c.rect(9, 21, 1, 2, "K")
  c.px(15, 25, "m")
})
figure(
  "_chef_small",
  { w: 32, h: 32 },
  BODY.k,
  stamp("_chef_small_half", 0, 0),
  (c) => {
    // The far side is in shade, as on the big picture.
    c.rect(22, 16, 1, 4, "Y")
    c.rect(21, 20, 1, 3, "Y")
    c.rect(16, 19, 1, 3, "Y")
    c.rect(21, 11, 1, 2, "X")
    c.poly([21, 3, 24, 6, 24, 9, 22, 10, 21, 6], "X")
    c.rect(19, 28, 1, 4, "X")
    c.poly([26, 32, 27, 28, 29, 32], "c")
    // The knife, held upright: only the blade is in the picture.
    c.rect(26, 14, 2, 18, "v")
    c.rect(27, 10, 1, 4, "v")
    c.rect(26, 14, 1, 18, "V")
    c.rect(27, 12, 1, 18, "W")
  },
)
// Behind him, the disc of the intro on its dark ground.
sprite("portrait_chef", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "#081726")
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const far = Math.hypot(x - 15.5, y - 14.5)
      if (far < 13.5) c.px(x, y, "#e8a53a")
      else if (far < 15) { if (dithered(x, y, 0.75)) c.px(x, y, "#e8a53a") }
      else if (far < 16.5) { if (dithered(x, y, 0.5)) c.px(x, y, "#c9812e") }
    }
  }
}, stamp("_chef_small", -1, -1))

// The spit: meat on a rod, turning in front of the grill.
const SPIT_FRAMES = 8
for (let f = 0; f < SPIT_FRAMES; f++) {
  figure(`intro_spit_${f}`, { w: 40, h: 88 }, BODY.k, (c) => {
    const steel = "#8f989e"
    const meat = ["#7a4526", "#93552c", "#b06a34", "#c98445"]
    // The grill, behind: its bars glow, and the glow moves.
    c.rect(27, 6, 11, 62, "#3c3432")
    for (let y = 9; y < 66; y += 4) {
      const hot = (y / 4 + f) % 4 < 2
      c.rect(29, y, 7, 2, hot ? "#ff9a3c" : "#e0582a")
      c.rect(30, y, 5, 1, hot ? "#ffd27a" : "#ff9a3c")
    }
    // The rod, the cap, the tray that catches the fat.
    c.rect(15, 0, 2, 78, steel)
    c.rect(13, 2, 6, 3, steel)
    c.rect(1, 68, 30, 3, steel)
    c.rect(1, 68, 30, 1, "#c9ced2")
    c.rect(4, 71, 24, 3, "#5d666c")
    c.rect(11, 74, 10, 12, "#5d666c")
    c.rect(6, 85, 20, 3, steel)
    // The meat: wider at the top, stacked in layers, browned as it turns.
    for (let y = 8; y < 68; y++) {
      const half = Math.round(14 - ((y - 8) / 60) * 7)
      const layer = Math.floor(y / 5)
      for (let x = 16 - half; x < 16 + half; x++) {
        // Where a point of the surface is on its way round.
        const round = (x - (16 - half)) / (half * 2)
        const turn = (round * 0.5 + f / SPIT_FRAMES + layer * 0.37) % 1
        let tone = turn < 0.18 ? 0 : turn < 0.55 ? 1 : turn < 0.8 ? 2 : 1
        // The side by the grill is lit by it; the other is in shade.
        if (round > 0.8) tone = Math.min(3, tone + 1)
        if (round < 0.12) tone = 0
        c.px(x, y, meat[tone])
      }
      if (y % 5 === 0) c.rect(16 - half, y, half * 2, 1, "#5f3319")
    }
    // A tomato on top, as it should be.
    c.ellipse(16, 6, 4, 3, "#c0432f")
    c.rect(14, 4, 2, 1, "#e0704f")
  })
}

// A glint along the blade, in four frames.
pal({ w: "#ffffff", y: "#ffe9a8" })
;[1, 3, 5, 3].forEach((arm, f) => {
  sprite(`intro_glint_${f}`, { w: 11, h: 11 }, (c) => {
    c.rect(5 - arm, 5, arm * 2 + 1, 1, "y")
    c.rect(5, 5 - arm, 1, arm * 2 + 1, "y")
    c.rect(5 - (arm >> 1), 5, (arm >> 1) * 2 + 1, 1, "w")
    c.rect(5, 5 - (arm >> 1), 1, (arm >> 1) * 2 + 1, "w")
    if (arm >= 3) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.px(5 + dx, 5 + dy, "y")
  })
})

// The disc behind him: the colour of the kebab, breaking up at its edge.
sprite("intro_halo", { w: 132, h: 132 }, (c) => {
  for (let y = 0; y < 132; y++) {
    for (let x = 0; x < 132; x++) {
      const far = Math.hypot(x - 65.5, y - 65.5)
      if (far < 50) c.px(x, y, "#e8a53a")
      else if (far < 56) { if (dithered(x, y, 0.75)) c.px(x, y, "#e8a53a") }
      else if (far < 61) { if (dithered(x, y, 0.5)) c.px(x, y, "#c9812e") }
      else if (far < 65) { if (dithered(x, y, 0.25)) c.px(x, y, "#c9812e") }
    }
  }
})

sheet("intro", ["intro_neon", "intro_walk_*", "intro_chef_*", "intro_spit_*", "intro_glint_*", "intro_halo"], { pad: 1 })
