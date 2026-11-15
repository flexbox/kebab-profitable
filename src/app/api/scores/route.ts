import { isSeed, seedFor } from "@/lib/seed";
import { scoreStore } from "@/server/store";
import { board, submit } from "@/server/submit";

/** GET /api/scores?seed=YYYY-MM-DD: today's board and the all-time board. */
export async function GET(request: Request) {
  const asked = new URL(request.url).searchParams.get("seed");
  const seed = asked && isSeed(asked) ? asked : seedFor(new Date());
  return Response.json(await board(scoreStore(), seed));
}

/** POST /api/scores: replays the run on the server and records the result. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const result = await submit(scoreStore(), body, new Date());
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
