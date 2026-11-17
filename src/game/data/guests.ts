import type { GuestDef, GuestId } from "../types";

/**
 * The public figures who turn up on cameo cards, with their handle on X.
 *
 * Each one is drawn as a 32 by 32 pixel version of their X avatar, in
 * `art/kebab.px.js` (look for `GUESTS`). The avatars themselves are only a
 * reference: they stay in `reference/guests/`, which is never committed.
 */
export const GUESTS: Record<GuestId, GuestDef> = {
  levels: { name: "Pieter Levels", handle: "levelsio" },
  marc: { name: "Marc Lou", handle: "marclou" },
  tibo: { name: "Tibo Louis-Lucas", handle: "tibo_maker" },
  dago: { name: "Dagobert Renouf", handle: "dagorenouf" },
  nico: { name: "Nico Jeannen", handle: "nico_jeannen" },
  thomas: { name: "Thomas Sanlis", handle: "T_Zahil" },
  tony: { name: "Tony Dinh", handle: "tdinh_me" },
  danny: { name: "Danny Postma", handle: "dannypostma" },
  arvid: { name: "Arvid Kahl", handle: "arvidkahl" },
  benjamin: { name: "Benjamin Code", handle: "benjamincode" },
  flavie: { name: "Flavie Prévot", handle: "FlaviePrevot" },
};

export function guest(id: GuestId): GuestDef {
  return GUESTS[id];
}
