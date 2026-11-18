import { guest } from "@/game/data/guests";
import type { GuestId } from "@/game/types";
import type { PersonId } from "./pixels";

/**
 * A face, 32 by 32, scaled up with hard pixels. The pictures are painted in
 * `art/faces.px.js` (Chef's is in `art/intro.px.js`). They are decoration: the
 * name is always written next to them, so they carry no alternative text.
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

/** Someone's handle on X, as a link to their profile. */
export function Handle({ handle }: { handle: string }) {
  return (
    <a
      className="handle"
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      @{handle}
    </a>
  );
}

/**
 * A guest on a cameo card: their pixel avatar, their name, and their handle on
 * X as a link. The picture is decoration, as the name is written beside it.
 */
export function Guest({ id }: { id: GuestId }) {
  const { name, handle } = guest(id);
  return (
    <p className="guest">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/art/guest_${id}.png`}
        width={32}
        height={32}
        alt=""
        className="pixel portrait portrait-md"
      />
      <span className="guest-text">
        <span className="guest-name">{name}</span>
        <Handle handle={handle} />
      </span>
    </p>
  );
}
