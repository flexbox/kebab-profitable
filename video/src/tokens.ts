/**
 * The film's tokens, read from the game: src/app/globals.css for the colours,
 * assets/fonts for the type, the art file for the light. Nothing else is
 * allowed on screen.
 */
export const COLOR = {
  /** --navy-950, the ground. */
  ground: "#081726",
  /** --navy-900, the panels. */
  panel: "#0e2439",
  /** --navy-700, borders and empty bar segments. */
  line: "#264663",
  /** --navy-500 */
  dim: "#4f7aa6",
  /** --navy-300, secondary text. */
  soft: "#b6cce2",
  /** --navy-100, body text. */
  text: "#e8eff7",
  /** --amber-400, the one accent: the goal, the MRR, the title. */
  accent: "#f2b441",
  /** --red-400, only ever next to a minus sign. */
  loss: "#ff8585",
} as const;

/** Silkscreen, the game's pixel face, in its two weights. */
export const FONT = { regular: "Silkscreen", bold: "Silkscreen Bold" } as const;

/** --ease-swap in the game: cubic-bezier(0.2, 0, 0, 1). Settles, never bounces. */
export const EASE: [number, number, number, number] = [0.2, 0, 0, 1];

/** Every format is drawn small, in art pixels, then scaled by a whole number. */
export const FORMATS = {
  "16x9": { w: 320, h: 180, scale: 6 },
  "9x16": { w: 216, h: 384, scale: 5 },
  "1x1": { w: 216, h: 216, scale: 5 },
} as const;
export type Format = keyof typeof FORMATS;
