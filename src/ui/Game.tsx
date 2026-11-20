"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apply, createRun } from "@/game";
import type { CharacterId, GameState, Move } from "@/game/types";
import { seedFor } from "@/lib/seed";
import { setMuted as setSoundMuted, sfx } from "@/lib/sound";
import { store } from "@/lib/storage";
import { track } from "@/lib/track";
import { cueOf } from "./cue";
import { Intro } from "./Intro";
import { LangProvider } from "./lang";
import { Play } from "./Play";
import { Select } from "./Select";
import { Title } from "./Title";

type View = "title" | "intro" | "select" | "play";

/** The current state and the one before it, so the screen can show what changed. */
export interface Turn {
  state: GameState;
  prev: GameState | null;
  n: number;
}

interface Boot {
  seed: string;
  saved: GameState | null;
  attempts: number;
  best: number | null;
}

function playSounds(turn: Turn) {
  const cue = cueOf(turn);
  if (cue) sfx[cue]();
}

const customers = (s: GameState | null) => s?.project?.customers ?? 0;

/**
 * The steps of the first-run funnel this move went through, if any. `seen`
 * holds what this run has already sent: after a pivot the customers start
 * again from zero, but the first one only comes once.
 */
function trackSteps({ state, prev }: Turn, seen: Set<string>) {
  if (!prev) return;
  const props = { founder: state.character, day: state.day };
  if (!prev.project && state.project && state.stats.pivots === 0) track("Idea picked", props);
  if (!prev.project?.launched && state.project?.launched && state.stats.launches === 1) {
    track("MVP shipped", props);
  }
  if (customers(prev) === 0 && customers(state) > 0 && !seen.has("customer")) {
    seen.add("customer");
    track("First customer", props);
  }
  if (!prev.outcome && state.outcome) {
    track("Run ended", { ...props, result: state.outcome.result });
  }
}

function GameInner() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [view, setView] = useState<View>("title");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [muted, setMuted] = useState(false);
  // Chef's first-run tips, decided when a run starts.
  const [tips, setTips] = useState(false);
  const tracked = useRef(new Set<string>());

  // Browser-only state (the date in Lille, the saved run) is read after hydration.
  useEffect(() => {
    const seed = seedFor(new Date());
    const isMuted = store.muted();
    setSoundMuted(isMuted);
    /* eslint-disable react-hooks/set-state-in-effect */
    setMuted(isMuted);
    setBoot({
      seed,
      saved: store.run(),
      attempts: store.attempts(seed),
      best: store.best(seed),
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!turn) return;
    store.setRun(turn.state);
    if (turn.state.outcome?.result === "won") {
      store.setBest(turn.state.seed, turn.state.outcome.day);
    }
    playSounds(turn);
    trackSteps(turn, tracked.current);
    // A first customer: the tips have done their job. This run keeps them,
    // to mark the moment; the next one plays without.
    if (customers(turn.state) > 0) store.setTipsOff();
  }, [turn]);

  const play = useCallback((move: Move) => {
    setTurn((current) => {
      if (!current) return current;
      try {
        return { state: apply(current.state, move), prev: current.state, n: current.n + 1 };
      } catch {
        return current; // an illegal move is ignored
      }
    });
  }, []);

  const start = useCallback(
    (who: CharacterId) => {
      if (!boot) return;
      const seed = seedFor(new Date());
      const attempts = store.addAttempt(seed);
      const coached = store.tips();
      setBoot({ seed, saved: null, attempts, best: store.best(seed) });
      setTips(coached);
      tracked.current = new Set();
      setTurn({ state: createRun(seed, who), prev: null, n: 0 });
      track("Run started", { founder: who, attempt: attempts, coached });
      setView("play");
      sfx.pick();
    },
    [boot],
  );

  const resume = useCallback(() => {
    if (!boot?.saved) return;
    setTips(store.tips());
    tracked.current = new Set();
    setTurn({ state: boot.saved, prev: null, n: 0 });
    setView("play");
  }, [boot]);

  const toTitle = useCallback(() => {
    const seed = seedFor(new Date());
    const saved = store.run();
    setBoot({
      seed,
      saved: saved && !saved.outcome ? saved : null,
      attempts: store.attempts(seed),
      best: store.best(seed),
    });
    setTurn(null);
    setView("title");
  }, []);

  const quit = useCallback(() => {
    store.setRun(null);
    toTitle();
  }, [toTitle]);

  const toggleMute = useCallback(() => {
    setMuted((value) => {
      const next = !value;
      store.setMuted(next);
      setSoundMuted(next);
      return next;
    });
  }, []);

  const hideTips = useCallback(() => {
    store.setTipsOff();
    setTips(false);
    track("Tips hidden");
  }, []);

  const chrome = { muted, toggleMute };

  if (view === "play" && turn) {
    return (
      <Play
        turn={turn}
        play={play}
        onQuit={quit}
        onRetry={() => setView("select")}
        onHome={toTitle}
        attempts={store.attempts(turn.state.seed)}
        tips={tips}
        onHideTips={hideTips}
        {...chrome}
      />
    );
  }
  // A new run opens on the intro; trying again after a run goes straight to the roster.
  if (view === "intro") {
    return <Intro onDone={() => setView("select")} {...chrome} />;
  }
  if (view === "select") {
    return <Select onPick={start} onBack={() => setView("title")} newcomer={store.tips()} {...chrome} />;
  }
  return (
    <Title
      seed={boot?.seed ?? null}
      attempts={boot?.attempts ?? 0}
      best={boot?.best ?? null}
      canResume={!!boot?.saved && !boot.saved.outcome}
      onPlay={() => setView("intro")}
      onResume={resume}
      {...chrome}
    />
  );
}

export function Game() {
  return (
    <LangProvider>
      <GameInner />
    </LangProvider>
  );
}
