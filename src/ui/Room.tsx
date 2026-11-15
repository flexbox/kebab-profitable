"use client";

import { useCallback, useEffect, useState } from "react";
import { rand } from "@/game/rng";
import type { ActionId, GameState } from "@/game/types";
import { B, mrrOf } from "@/game";
import { PixelCanvas } from "./PixelCanvas";
import { drawRoom, ROOM_H, ROOM_W, type Pose, type RoomScene, type Screen } from "./pixels";

const POSES: Record<ActionId, { pose: Pose; screen: Screen }> = {
  coder: { pose: "desk", screen: "code" },
  shipper: { pose: "desk", screen: "ship" },
  support: { pose: "desk", screen: "chat" },
  freelance: { pose: "desk", screen: "invoice" },
  poster: { pose: "phone", screen: "off" },
  demarcher: { pose: "phone", screen: "off" },
  repos: { pose: "bed", screen: "off" },
  pivoter: { pose: "think", screen: "off" },
  apero: { pose: "out", screen: "off" },
};

function lastAction(state: GameState): ActionId | null {
  // What was done in the previous slot of the same day, if anything.
  if (state.slot === 0) return null;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const move = state.history[i];
    if (move.t === "act") return move.id;
    if (move.t === "ok" || move.t === "choice") break;
  }
  return null;
}

/** The studio flat. It shows what you are doing and how you are doing. */
export function Room({
  state,
  preview,
  label,
}: {
  state: GameState;
  /** The action being hovered: the room shows it before you commit. */
  preview: ActionId | null;
  label: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => (f + 1) % 840), 420);
    return () => window.clearInterval(id);
  }, []);

  const shown = preview ?? lastAction(state);
  let pose: Pose = "idle";
  let screen: Screen = "off";
  if (state.phase === "meal") pose = "eat";
  else if (state.phase === "idea") pose = "think";
  else if (state.phase === "won") pose = "eat";
  else if (shown) ({ pose, screen } = POSES[shown]);

  // Lunch is always eaten in daylight, even on a day that a pivot swallowed.
  const time =
    state.phase === "lost" ? 3 : state.phase === "meal" ? 1 : Math.min(3, state.slot);
  const raining = rand(state.seed, "weather", state.day) < 0.38;
  const goal = Math.min(1, mrrOf(state) / B.kebabMrr);
  const who = state.character;
  const moral = state.moral;
  const kebabs = state.stats.kebabs;
  const pates = state.stats.pates;
  const seedNumber = state.day;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const scene: RoomScene = {
        who,
        time,
        pose,
        screen,
        raining,
        moral,
        goal,
        kebabs,
        pates,
        frame,
        seed: seedNumber,
      };
      drawRoom(ctx, scene);
    },
    [who, time, pose, screen, raining, moral, goal, kebabs, pates, frame, seedNumber],
  );

  return <PixelCanvas width={ROOM_W} height={ROOM_H} draw={draw} className="room" label={label} />;
}
