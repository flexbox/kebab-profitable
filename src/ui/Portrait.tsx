import type { PersonId } from "./pixels";

/**
 * A head and shoulders, 32 by 32, scaled up with hard pixels. The pictures are
 * painted in `art/kebab.px.js`. They are decoration: the name is always written
 * next to them, so they carry no alternative text.
 */
export function Portrait({ who, className }: { who: PersonId; className?: string }) {
  return (
    // A plain image on purpose: pixel art must not be resampled or re-encoded.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/portrait_${who}.png`}
      width={32}
      height={32}
      alt=""
      className={className ? `pixel ${className}` : "pixel"}
    />
  );
}
