"use client";

import { useCallback } from "react";
import { PixelCanvas } from "./PixelCanvas";
import { drawPortrait, type PersonId } from "./pixels";

const TILE: Record<PersonId, string> = {
  david: "#1f5f5c",
  karl: "#4a5568",
  mickael: "#8a4a1c",
  christophe: "#1f3f7a",
  matthys: "#4c2f91",
  chef: "#7a2419",
};

export function Portrait({ who, className }: { who: PersonId; className?: string }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => drawPortrait(ctx, who, TILE[who]),
    [who],
  );
  return <PixelCanvas width={16} height={16} draw={draw} className={className} />;
}
