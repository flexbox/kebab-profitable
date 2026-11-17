"use client";

import { useCallback, useEffect, useState } from "react";
import { rand } from "@/game/rng";
import type { ActionId, GameState } from "@/game/types";
import { B, eventCard, mrrOf } from "@/game";
import { PixelCanvas } from "./PixelCanvas";
import {
  drawRoom,
  loadArt,
  ROOM_H,
  ROOM_W,
  type Art,
  type Pose,
  type RoomScene,
  type Screen,
} from "./pixels";

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

/** One flicker of the neon sign: how bright, then for how long, in milliseconds. */
const FLICKER: [level: number, ms: number][] = [
  [0.3, 90],
  [1, 70],
  [0.5, 60],
];

/**
 * How bright the neon sign is. It is off by day and steady after dark, apart
 * from one short flicker as it comes on and another every ten seconds or so.
 */
function useNeon(lit: boolean): number {
  const [level, setLevel] = useState(1);
  useEffect(() => {
    // With reduced motion the sign simply stays on.
    if (!lit || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const flicker = (i: number) => {
      if (i < FLICKER.length) {
        setLevel(FLICKER[i][0]);
        timer = window.setTimeout(() => flicker(i + 1), FLICKER[i][1]);
      } else {
        setLevel(1);
        timer = window.setTimeout(() => flicker(0), 8000 + Math.random() * 8000);
      }
    };
    timer = window.setTimeout(() => flicker(0), 150);
    return () => {
      window.clearTimeout(timer);
      setLevel(1);
    };
  }, [lit]);
  return lit ? level : 0;
}

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
  fasting = false,
  label,
}: {
  state: GameState;
  /** The action being hovered: the room shows it before you commit. */
  preview: ActionId | null;
  /** At lunch, pointing at "skip lunch": in the middle of the room, doubled over with hunger. */
  fasting?: boolean;
  label: string;
}) {
  const [frame, setFrame] = useState(0);
  // The pictures load once; until then the frame stays empty.
  const [art, setArt] = useState<Art | null>(null);
  useEffect(() => {
    let wanted = true;
    loadArt().then(
      (loaded) => wanted && setArt(loaded),
      () => undefined,
    );
    return () => {
      wanted = false;
    };
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => (f + 1) % 840), 420);
    return () => window.clearInterval(id);
  }, []);

  const shown = preview ?? lastAction(state);
  let pose: Pose = "idle";
  let screen: Screen = "off";
  if (state.phase === "meal") pose = fasting ? "hungry" : "eat";
  // Something urgent: on your feet, whatever you were doing.
  else if (state.pendingEvent && eventCard(state.pendingEvent).urgent) pose = "alert";
  else if (state.phase === "idea") pose = "think";
  else if (state.phase === "won") pose = "feast";
  else if (shown) ({ pose, screen } = POSES[shown]);

  // Lunch is always eaten in daylight, even on a day that a pivot swallowed.
  const time =
    state.phase === "lost" ? 3 : state.phase === "meal" ? 1 : Math.min(3, state.slot);
  // The sign is a neon: it comes on with the lamp, at the end of the afternoon.
  const neon = useNeon(time >= 2);
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
        neon,
        seed: seedNumber,
      };
      if (art) drawRoom(ctx, art, scene);
    },
    [art, who, time, pose, screen, raining, moral, goal, kebabs, pates, frame, neon, seedNumber],
  );

  return <PixelCanvas width={ROOM_W} height={ROOM_H} draw={draw} className="room" label={label} />;
}
