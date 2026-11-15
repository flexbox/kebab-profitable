"use client";

import { useCallback } from "react";
import { PixelCanvas } from "./PixelCanvas";
import { drawPortrait, type PersonId } from "./pixels";

/** Faded identity-photo backdrops, one per person. */
const TILE: Record<PersonId, string> = {
  david: "#2f5e59",
  karl: "#56594c",
  mickael: "#7a4a22",
  christophe: "#2f4470",
  matthys: "#4f3a78",
  chef: "#6e2a1e",
};

export function Portrait({ who, className }: { who: PersonId; className?: string }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => drawPortrait(ctx, who, TILE[who]),
    [who],
  );
  return <PixelCanvas width={16} height={16} draw={draw} className={className} />;
}
