import { track as send } from "@vercel/analytics";

/**
 * The steps of a first run, counted so we can see where new players stop:
 * a run started, an idea picked, a first launch, a first customer, the end.
 * Nothing that names the player is sent.
 */
export type Step =
  | "Run started"
  | "Idea picked"
  | "MVP shipped"
  | "First customer"
  | "Run ended"
  | "Tips hidden";

export function track(step: Step, props?: Record<string, string | number | boolean>) {
  try {
    send(step, props);
  } catch {
    // Analytics never stops the game.
  }
}
