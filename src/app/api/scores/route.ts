import { createHash } from "node:crypto";
import { isSeed, seedFor } from "@/lib/seed";
import { scoreStore } from "@/server/store";
import { board, submit, underLimit } from "@/server/submit";

/** GET /api/scores?seed=YYYY-MM-DD: today's board and the all-time board. */
export async function GET(request: Request) {
  const asked = new URL(request.url).searchParams.get("seed");
  const seed = asked && isSeed(asked) ? asked : seedFor(new Date());
  const store = scoreStore();
  if (!store) return Response.json({ today: [], allTime: [], offline: true });
  return Response.json(await board(store, seed));
}

/**
 * Who is sending, for the submission limit. Vercel sets x-forwarded-for
 * itself, so a client cannot choose it. The address is hashed: the store
 * never holds it in clear.
 */
function sender(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  return createHash("sha256").update(address).digest("hex").slice(0, 16);
}

/** POST /api/scores: replays the run on the server and records the result. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const store = scoreStore();
  if (!store) return Response.json({ ok: false, error: "offline" }, { status: 503 });
  const now = new Date();
  if (!(await underLimit(store, sender(request), now))) {
    return Response.json({ ok: false, error: "busy" }, { status: 429 });
  }
  const result = await submit(store, body, now);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
