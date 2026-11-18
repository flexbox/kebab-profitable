// The MVP gauge: a fighting game's super bar. A steel frame with a gold rivet
// in each corner, cut nine ways so CSS stretches it to any width
// (border-image-slice: 4). The charge inside it is painted by CSS, behind the
// frame, so it can grow pixel by pixel.
//
// Included from kebab.px.js. The game shows it twice as large.

pal({
  k: "#05070f", // outline
  s: "#dfe7f2", // steel, lit
  S: "#8a9ab3", // steel
  d: "#4a5770", // steel, in shade
  D: "#2c3549", // steel, deep shade
  i: "#0b1020", // the inner lip the charge sits in
  y: "#ffd25a", // rivet
  Y: "#b77a1c", // rivet, in shade
})

scene("meter_frame", { w: 16, h: 12 },
  rect(0, 0, 16, 12, "k"),
  rect(1, 1, 14, 10, "S"),
  hline(1, 1, 14, "s"), vline(1, 1, 10, "s"),
  hline(1, 10, 14, "D"), vline(14, 1, 10, "D"),
  hline(2, 9, 12, "d"), vline(13, 2, 8, "d"),
  // The lip around the charge.
  rect(3, 3, 10, 6, "i"),
  rect(4, 4, 8, 4, "_"),
  // A rivet in each corner, lit from the top left.
  ...[[2, 2], [12, 2], [2, 8], [12, 8]].flatMap(([x, y]) => [px(x, y, "y"), px(x + 1, y, "Y"), px(x, y + 1, "Y")]),
  // Rounded corners.
  px(0, 0, "_"), px(15, 0, "_"), px(0, 11, "_"), px(15, 11, "_"),
)
