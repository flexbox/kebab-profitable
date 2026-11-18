import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { character } from "@/game";
import type { Lang } from "@/game/types";
import { isSeed } from "@/lib/seed";
import type { ScoreEntry } from "./scores";
import { scoreStore } from "./store";
import { placeOf } from "./submit";

/**
 * The picture a saved win is shared with: the founder who won on the rug, and
 * the score written by the server from what the board holds. Nothing on it
 * comes from the link itself, so a link cannot claim a score nobody made.
 *
 * The backgrounds are painted by `pnpm art` into assets/og, one per founder.
 */
export const CARD_SIZE = { width: 1200, height: 630 };

const NAVY = "#0e2439";
const GOLD = "#f2b43c";
const CREAM = "#f4eedd";
const GREY = "#9fb3c8";

const asset = (...parts: string[]) => readFile(join(process.cwd(), "assets", ...parts));

export interface SharedScore {
  entry: ScoreEntry;
  rank: number;
}

/**
 * The score a share link points to, or null: no database, a bad link, or a
 * removed score. `key` is the name key as the address carries it.
 */
export async function sharedScore(seed: string, key: string): Promise<SharedScore | null> {
  const store = scoreStore();
  if (!store || !isSeed(seed)) return null;
  try {
    // A name key made of letters outside a-z arrives percent-encoded.
    return await placeOf(store, seed, decodeURIComponent(key));
  } catch {
    return null;
  }
}

export function cardLang(value: string): Lang {
  return value === "en" ? "en" : "fr";
}

/** The seed's date, as the card writes it: 18 NOV. 2026. */
function dayOf(seed: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${seed}T12:00:00Z`));
}

/** What the card says, also used for the page's title and description. */
export function cardWords({ entry, rank }: SharedScore, lang: Lang) {
  const first = character(entry.character).name.split(" ")[0];
  return lang === "fr"
    ? {
        rank: `${rank === 1 ? "1er" : `${rank}e`} du jour`,
        days: String(entry.days),
        unit: "jours",
        who: entry.pseudo,
        withWhom: `avec ${first}`,
        dare: "À toi de battre ça",
        date: dayOf(entry.seed, lang),
        title: `${entry.pseudo} : kebab profitable en ${entry.days} jours`,
      }
    : {
        rank: `#${rank} of the day`,
        days: String(entry.days),
        unit: "days",
        who: entry.pseudo,
        withWhom: `with ${first}`,
        dare: "Your turn to beat it",
        date: dayOf(entry.seed, lang),
        title: `${entry.pseudo}: kebab profitable in ${entry.days} days`,
      };
}

/** The game's own picture, for a link whose score is not on the board. */
export async function siteCard(): Promise<Response> {
  return new Response(new Uint8Array(await asset("og", "site.png")), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=300" },
  });
}

export async function winCard(score: SharedScore, lang: Lang): Promise<Response> {
  const words = cardWords(score, lang);
  const [background, regular, bold] = await Promise.all([
    asset("og", `win_${score.entry.character}.png`),
    asset("fonts", "Silkscreen-Regular.ttf"),
    asset("fonts", "Silkscreen-Bold.ttf"),
  ]);
  // The type sits on the art's grid: one pixel of the font is 6, 12 or 18 px
  // wide, as one pixel of the painting is 6. A score of three digits steps
  // down a size to stay on the card.
  const daysSize = words.days.length > 2 ? 96 : 144;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Silkscreen",
          textTransform: "uppercase",
          color: CREAM,
          backgroundColor: NAVY,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={`data:image/png;base64,${background.toString("base64")}`}
          width={CARD_SIZE.width}
          height={CARD_SIZE.height}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
        <div style={{ position: "absolute", right: 72, top: 54, fontSize: 32, color: GREY }}>
          {words.date}
        </div>
        <div
          style={{
            position: "absolute",
            left: 348,
            top: 138,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "0 18px 6px",
              fontSize: 48,
              color: NAVY,
              backgroundColor: GOLD,
            }}
          >
            {words.rank}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              marginTop: 18,
              lineHeight: 1,
              color: GOLD,
            }}
          >
            {/* The bold digits fill in at this size: a 4 is no longer a 4. */}
            <span style={{ fontSize: daysSize }}>{words.days}</span>
            <span
              style={{
                marginLeft: 30,
                // The smaller word is lifted onto the baseline of the larger digits.
                marginBottom: daysSize > 96 ? 12 : 0,
                fontSize: 96,
                fontWeight: 700,
              }}
            >
              {words.unit}
            </span>
          </div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 48 }}>{words.who}</div>
          <div style={{ display: "flex", fontSize: 32, color: GREY }}>{words.withWhom}</div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 224,
            bottom: 42,
            fontSize: 32,
            color: CREAM,
          }}
        >
          {words.dare}
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts: [
        { name: "Silkscreen", data: regular, weight: 400, style: "normal" },
        { name: "Silkscreen", data: bold, weight: 700, style: "normal" },
      ],
      // The rank can still move during the day: the picture is not kept for long.
      headers: { "cache-control": "public, max-age=300" },
    },
  );
}
