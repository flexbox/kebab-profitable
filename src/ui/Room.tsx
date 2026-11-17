"use client";

import { useCallback, useEffect, useState } from "react";
import { rand } from "@/game/rng";
import type { ActionId, GameState } from "@/game/types";
import { B, eventCard, mrrOf } from "@/game";
import { PixelCanvas } from "./PixelCanvas";
import {
  CHEER,
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
  poster: { pose: "post", screen: "off" },
  demarcher: { pose: "call", screen: "off" },
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

/**
 * How far into the celebration of a new customer the room is, in
 * milliseconds, or null when there is none. `key` names the move being
 * celebrated: another move ends it.
 */
function useCheer(key: number): number | null {
  const [elapsed, setElapsed] = useState<number | null>(null);
  useEffect(() => {
    if (!key) return;
    // With reduced motion there is no spin, flash or hop: the pose alone.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now() - start;
      if (t >= CHEER.length) {
        window.clearInterval(id);
        setElapsed(null);
      } else setElapsed(still ? CHEER.spin + CHEER.hop : t);
    }, 30);
    return () => {
      window.clearInterval(id);
      setElapsed(null);
    };
  }, [key]);
  return key ? elapsed : null;
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
  cheer = 0,
  label,
}: {
  state: GameState;
  /** The action being hovered: the room shows it before you commit. */
  preview: ActionId | null;
  /** At lunch, pointing at "skip lunch": in the middle of the room, doubled over with hunger. */
  fasting?: boolean;
  /** The number of the move that won a customer, or 0: the founder celebrates it. */
  cheer?: number;
  label: string;
}) {
  // The room's clock: one beat is the pace of the founder's movements, and
  // three of them make a frame, the pace of everything else.
  const [beat, setBeat] = useState(0);
  const frame = Math.floor(beat / 3);
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
    const id = window.setInterval(() => setBeat((b) => (b + 1) % 2520), 140);
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
  // A new customer comes before all of it, for two seconds.
  const cheering = useCheer(cheer);
  if (cheering !== null) pose = "cheer";

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
        cheer: cheering ?? 0,
        frame,
        beat,
        neon,
        seed: seedNumber,
      };
      if (art) drawRoom(ctx, art, scene);
    },
    [art, who, time, pose, screen, raining, moral, goal, kebabs, pates, cheering, frame, beat, neon, seedNumber],
  );

  return <PixelCanvas width={ROOM_W} height={ROOM_H} draw={draw} className="room" label={label} />;
}
