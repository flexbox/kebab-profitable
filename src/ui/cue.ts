import { eventCard, slotsToday } from "@/game";
import type { GameState } from "@/game/types";
import type { Turn } from "./Game";

/** What a move calls for: one sound, and for a new customer, a celebration in the room. */
export type Cue = "win" | "lose" | "alarm" | "customer" | "card" | "bad" | "bite" | "night" | "click";

const customers = (s: GameState) => s.project?.customers ?? 0;

/** The one thing to mark about the move just played, the most pressing first. */
export function cueOf({ state, prev }: Turn): Cue | null {
  if (!prev) return null;
  const last = state.history[state.history.length - 1];
  if (state.outcome) return state.outcome.result === "won" ? "win" : "lose";
  const dealt = state.pendingEvent && state.pendingEvent !== prev.pendingEvent;
  // The alarm comes first: the clock is already running.
  if (dealt && eventCard(state.pendingEvent!).urgent) return "alarm";
  if (customers(state) > customers(prev)) return "customer";
  if (dealt) return "card";
  if (state.eventResult?.tone === "bad") return "bad";
  if (last?.t === "meal" && last.id !== "skip") return "bite";
  // Bedtime: the day ends once its last slot is played (or the card that came
  // up after it is answered). A day cut short, by a pivot, a trip or a card
  // that eats the afternoon, is not a night in bed.
  const used = prev.slot + (last?.t === "act" ? 1 : 0);
  const bedtime = last?.t !== "idea" && used >= slotsToday(prev);
  if (state.day !== prev.day && bedtime) return "night";
  return "click";
}
