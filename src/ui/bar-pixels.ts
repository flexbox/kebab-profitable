/**
 * Putting the apéro together: the back room of the bar, one long table, and
 * everyone arriving at it.
 *
 * The pictures are painted in `art/bar.px.js`. This file only places them for
 * a given moment of the evening. Nobody walks in: each one drops out of the
 * ceiling as a streak of light and is sitting there the moment after, the way
 * a hero arrives at the start of a stage. The founder comes last, every glass
 * goes up, and a phone comes out for the picture.
 */
import { CHARACTER_IDS } from "@/game";
import type { CharacterId } from "@/game/types";
import { CHEER, groundShadow, ROOM_H, ROOM_W, sprite, veil, type Art } from "./pixels";

type Ctx = CanvasRenderingContext2D;

/** The evening, in milliseconds from the moment the bar appears. */
export const APERO = {
  /** The bar comes up out of the dark. */
  rise: 240,
  /** The first to arrive, and the time from one arrival to the next. */
  first: 420,
  every: 105,
  /** A streak of light takes this long to come down, and its landing this long to take shape. */
  fall: 130,
  land: 110,
  /** The founder comes last, after a beat. */
  founder: 2350,
  /** Every glass goes up, and stays up this long. */
  toast: 2850,
  raised: 900,
  /** The phone comes out, and the picture is taken: a white flash, fading. */
  selfie: 3950,
  flash: 4400,
  flashed: 320,
  /** From here on it is an evening like any other: talk, and a sip now and then. */
  settled: 4950,
  /** The whole of it. It ends as it began, in the dark. */
  length: 7400,
  fade: 380,
};

interface Seat {
  x: number;
  y: number;
  /** Behind the table and facing you, or in front of it with their back to you. */
  row: "far" | "near";
  /** Someone from the crowd, or the place of one of the four members who are not the founder. */
  who: string | number;
}

/** The first seat is 34 across, and each takes 18. As in the art file. */
const seat = (row: Seat["row"]) => (who: Seat["who"], i: number): Seat => ({
  x: 34 + i * 18,
  y: row === "far" ? 49 : 88,
  row,
  who,
});
const SEATS: Seat[] = [
  ...["c1", "c2", 0, "c3", "c4", 1, "c5", "c6"].map(seat("far")),
  ...["c7", 2, "c8", "c9", "c10", "c11", 3, "c12"].map(seat("near")),
];
/** The order they arrive in: all over the table, not along it. */
const ORDER = [4, 11, 1, 14, 6, 9, 3, 12, 0, 15, 7, 10, 2, 13, 5, 8];
const TURN = SEATS.map((_, i) => ORDER.indexOf(i));

/** The table, which hides the knees of the far row. */
const TABLE = [32, 68] as const;
/** Where the founder stands: at the head of the table, on the left. */
const HEAD = [11, 74] as const;
/** Where glass meets glass during the toast: between two neighbours, at the rim. */
const CLINKS = [
  [51, 50], [87, 49], [123, 50], [159, 49], [69, 89], [105, 88], [141, 89],
] as const;

export interface BarScene {
  who: CharacterId;
  /** Milliseconds since the bar appeared. `APERO.settled` or more is the evening under way. */
  t: number;
  /** The room's clocks: see `RoomScene`. */
  frame: number;
  beat: number;
  dark: number;
}

/** Someone arriving: the streak coming down, then its landing in two shapes. True once they are there. */
function arrive(c: Ctx, art: Art, since: number, x: number, feet: number): boolean {
  if (since < 0) return false;
  if (since < APERO.fall) {
    // The streak is 26 tall: it comes down until its foot is on the spot.
    sprite(c, art, "bar_beam", x + 6, Math.round(-26 + feet * (since / APERO.fall)));
    return false;
  }
  if (since < APERO.fall + APERO.land / 2) {
    sprite(c, art, "bar_land_0", x + 1, feet - 5);
    return false;
  }
  if (since < APERO.fall + APERO.land) {
    sprite(c, art, "bar_land_1", x + 3, feet - 12);
    return false;
  }
  return true;
}

export function drawBar(c: Ctx, art: Art, s: BarScene) {
  c.clearRect(0, 0, ROOM_W, ROOM_H);
  c.drawImage(art.bar, 0, 0);
  // The match goes on, whoever is watching.
  sprite(c, art, `bar_match_${s.frame % 4}`, 71, 7);

  const settled = s.t >= APERO.settled;
  const toasting = s.t >= APERO.toast && s.t < APERO.toast + APERO.raised;
  // For the picture, every glass is up again.
  const posing = s.t >= APERO.flash - 200 && s.t < APERO.flash + APERO.flashed + 150;
  // Once the evening is under way, one of them holds forth at a time.
  const round = Math.floor(s.beat / 14);
  const speaker = settled && s.beat % 14 < 9 ? (round * 5 + 2) % (SEATS.length + 1) : -1;

  const others = CHARACTER_IDS.filter((id) => id !== s.who);
  const landings: (() => void)[] = [];
  const glasses: [number, number][] = [];
  const near: (() => void)[] = [];
  SEATS.forEach((place, i) => {
    const since = s.t - APERO.first - TURN[i] * APERO.every;
    const here = since >= APERO.fall + APERO.land;
    if (!here) {
      landings.push(() => arrive(c, art, since, place.x, place.y + 19));
      return;
    }
    // A sip now and then, each in their own time; whoever is talking nods.
    const sip = settled && i !== speaker && (s.beat + i * 9) % 46 < 6;
    const up = toasting || posing || sip;
    const lift =
      toasting && s.t - APERO.toast < 140
        ? 1
        : i === speaker
          ? Math.floor(s.beat / 2) % 2
          : settled && (s.beat + i * 7) % 23 < 2
            ? 1
            : 0;
    const name =
      typeof place.who === "number"
        ? `bar_${others[place.who]}_${place.row === "far" ? "f" : "b"}`
        : `bar_${place.who}`;
    const draw = () => sprite(c, art, `${name}_${up ? 1 : 0}`, place.x, place.y - lift);
    if (place.row === "far") draw();
    else near.push(draw);
    // The glass is on the table whenever it is not in the air.
    if (!up) glasses.push(place.row === "far" ? [place.x + 10, 70] : [place.x + 2, 81]);
  });

  sprite(c, art, "bar_table", TABLE[0], TABLE[1]);
  for (const [x, y] of glasses) sprite(c, art, "bar_pint", x, y);
  for (const draw of near) draw();

  // The founder, at the head of the table.
  const [x, y] = HEAD;
  const since = s.t - APERO.founder;
  if (since >= APERO.fall + APERO.land) {
    groundShadow(c, x + 8, y + 27, 14);
    if (toasting) {
      // The pose of a new customer, with a glass in the fist.
      const held = s.t - APERO.toast;
      const hop = held < CHEER.hop / 2 ? 3 : held < CHEER.hop ? 1 : 0;
      sprite(c, art, `${s.who}_cheer_${held < CHEER.flash ? 1 : 0}_lamp`, x, y - 2 - hop);
      if (held >= CHEER.flash) sprite(c, art, "bar_pint", x + 12, y - 7 - hop);
    } else if (s.t >= APERO.selfie && !settled) {
      // The phone, at arm's length, and the smile that goes with it.
      sprite(c, art, `${s.who}_post_lamp`, x, y);
      sprite(c, art, "phone_lamp", x + 12, y + 6);
    } else if (settled && (s.beat + 20) % 46 < 6) {
      sprite(c, art, `${s.who}_arm_lamp`, x, y);
      sprite(c, art, "bar_pint", x + 12, y + 5);
    } else {
      const talking = speaker === SEATS.length;
      const blink = settled && s.beat % 24 === 23;
      sprite(c, art, `${s.who}_${blink ? "blink" : "front"}_lamp`, x, y - (talking ? Math.floor(s.beat / 2) % 2 : 0));
    }
  } else landings.push(() => arrive(c, art, since, x, y + 29));

  for (const draw of landings) draw();

  if (toasting) {
    // Glass against glass: each clink is big, then small, then gone.
    const step = Math.floor((s.t - APERO.toast) / 140);
    CLINKS.forEach(([cx, cy], i) => {
      const size = (step + i) % 3;
      if (size === 0) sprite(c, art, "sparkle_0", cx - 1, cy - 1);
      else if (size === 1) sprite(c, art, "sparkle_1", cx, cy);
    });
  }
  if (speaker >= 0) {
    // Mostly talk. Every fourth turn, somebody has an idea, or is told theirs is a good one.
    const [bx, by] = speaker === SEATS.length ? [x + 13, y - 10] : [SEATS[speaker].x + 12, SEATS[speaker].y - 9];
    const bubble =
      round % 4 === 3 ? (round % 8 === 3 ? "bubble_idea" : "bubble_heart") : `bubble_talk_${Math.floor(s.beat / 2) % 3}`;
    sprite(c, art, bubble, bx, by - (s.beat % 14 < 2 ? 1 : 0));
  }

  // The picture being taken: everything white, then less so, in steps.
  const flashed = s.t - APERO.flash;
  if (flashed >= 0 && flashed < APERO.flashed) {
    const left = 0.92 * (1 - Math.floor((flashed / APERO.flashed) * 4) / 4);
    c.fillStyle = `rgba(255,248,232,${left})`;
    c.fillRect(0, 0, ROOM_W, ROOM_H);
  }
  veil(c, s.dark);
}
