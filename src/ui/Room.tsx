"use client";

import { useCallback, useEffect, useState } from "react";
import { rand } from "@/game/rng";
import type { ActionId, GameState } from "@/game/types";
import { B, eventCard, mrrOf } from "@/game";
import { APERO, drawBar } from "./bar-pixels";
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
 * How far into something the room plays out it is, in milliseconds, or null
 * when there is nothing to play. `key` names the move that set it off:
 * another move ends it. With reduced motion it does not move: it holds the
 * moment `still` for as long as it would have lasted.
 */
function useSequence(key: number, length: number, still: number): number | null {
  const [now, setNow] = useState<{ key: number; t: number } | null>(null);
  useEffect(() => {
    if (!key) return;
    const frozen = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now() - start;
      if (t >= length) window.clearInterval(id);
      setNow({ key, t: t >= length ? length : frozen ? still : t });
    }, 30);
    return () => window.clearInterval(id);
  }, [key, length, still]);
  if (!key) return null;
  // The first tick has not come yet: it has just begun.
  if (now?.key !== key) return 0;
  return now.t >= length ? null : now.t;
}

/** Night falls: the evening dims, stays dark a moment, and the morning comes up. */
const NIGHT = { out: 380, hold: 140, in: 460, depth: 0.86 };

/**
 * The passage from one day to the next. For a moment the room goes on showing
 * the evening that has just ended, growing dark; then it shows the morning,
 * growing light. Returns the state to draw and how dark to draw it, from 0 to 1.
 */
function useNightfall(state: GameState, skip: boolean): { shown: GameState; dark: number } {
  const [seen, setSeen] = useState(state);
  const [evening, setEvening] = useState<GameState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // A new state has come in: was it a night going by?
  if (seen !== state) {
    setSeen(state);
    const nextDay =
      state.seed === seen.seed && state.character === seen.character && state.day === seen.day + 1;
    const still =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEvening(nextDay && !skip && !still ? seen : null);
    setElapsed(0);
  }
  useEffect(() => {
    if (!evening) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now() - start;
      if (t >= NIGHT.out + NIGHT.hold + NIGHT.in) {
        window.clearInterval(id);
        setEvening(null);
      } else setElapsed(t);
    }, 40);
    return () => window.clearInterval(id);
  }, [evening]);

  if (!evening) return { shown: state, dark: 0 };
  if (elapsed < NIGHT.out) return { shown: evening, dark: (NIGHT.depth * elapsed) / NIGHT.out };
  const rising = Math.max(0, elapsed - NIGHT.out - NIGHT.hold) / NIGHT.in;
  return { shown: state, dark: NIGHT.depth * (1 - rising) };
}

/** The action that has just ended the day, if it was one. */
function eveningAction(state: GameState): ActionId | null {
  const last = state.history[state.history.length - 1];
  return last?.t === "act" ? last.id : null;
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
  state: current,
  preview,
  fasting = false,
  cheer = 0,
  apero = 0,
  label,
}: {
  state: GameState;
  /** The action being hovered: the room shows it before you commit. */
  preview: ActionId | null;
  /** At lunch, pointing at "skip lunch": in the middle of the room, doubled over with hunger. */
  fasting?: boolean;
  /** The number of the move that won a customer, or 0: the founder celebrates it. */
  cheer?: number;
  /** The number of the move that went to the apéro, or 0: the room gives way to the bar. */
  apero?: number;
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

  // Between two days the room shows the evening going dark, then the morning.
  // A new customer or the end of a run is not kept waiting behind it.
  // Nor is an evening at the bar: it brings its own dark.
  const { shown: state, dark: nightfall } = useNightfall(
    current,
    cheer !== 0 || apero !== 0 || !!current.outcome,
  );
  const leaving = state !== current;
  // While the evening fades, what is shown is what ended it.
  const shown = leaving ? eveningAction(current) : (preview ?? lastAction(state));
  let pose: Pose = "idle";
  let screen: Screen = "off";
  if (state.phase === "meal") pose = fasting && !leaving ? "hungry" : "eat";
  // Something urgent: on your feet, whatever you were doing.
  else if (state.pendingEvent && eventCard(state.pendingEvent).urgent) pose = "alert";
  else if (state.phase === "idea") pose = "think";
  else if (state.phase === "won") pose = "feast";
  else if (shown) ({ pose, screen } = POSES[shown]);
  // A new customer comes before all of it, for two seconds. With reduced
  // motion there is no spin, flash or hop: the pose alone.
  const cheering = useSequence(cheer, CHEER.length, CHEER.spin + CHEER.hop);
  if (cheering !== null) pose = "cheer";

  // The apéro: the room gives way to the bar for the whole evening, then
  // comes back out of the dark, the next morning.
  const evening = useSequence(apero, APERO.length + NIGHT.in, APERO.settled);
  const morning = evening !== null && evening >= APERO.length;
  // Pointing at the apéro, or still out on a day with one more slot, shows
  // the evening already under way, and nothing ends it.
  const out = pose === "out";
  const bar = evening !== null && !morning ? evening : out ? APERO.settled : null;
  let dark = nightfall;
  if (evening !== null) {
    if (evening < APERO.rise) dark = NIGHT.depth * (1 - evening / APERO.rise);
    else if (out) dark = 0;
    else if (morning) dark = NIGHT.depth * (1 - (evening - APERO.length) / NIGHT.in);
    else dark = NIGHT.depth * Math.max(0, 1 - (APERO.length - evening) / APERO.fade);
  }

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
        dark,
        neon,
        seed: seedNumber,
      };
      if (!art) return;
      if (bar !== null) drawBar(ctx, art, { who, t: bar, frame, beat, dark });
      else drawRoom(ctx, art, scene);
    },
    [art, who, time, pose, screen, raining, moral, goal, kebabs, pates, cheering, bar, frame, beat, dark, neon, seedNumber],
  );

  return <PixelCanvas width={ROOM_W} height={ROOM_H} draw={draw} className="room" label={label} />;
}
