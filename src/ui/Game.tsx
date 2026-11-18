"use client";

import { useCallback, useEffect, useState } from "react";
import { apply, createRun } from "@/game";
import type { CharacterId, GameState, Move } from "@/game/types";
import { seedFor } from "@/lib/seed";
import { setMuted as setSoundMuted, sfx } from "@/lib/sound";
import { store } from "@/lib/storage";
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

function GameInner() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [view, setView] = useState<View>("title");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [muted, setMuted] = useState(false);

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
      setBoot({ seed, saved: null, attempts, best: store.best(seed) });
      setTurn({ state: createRun(seed, who), prev: null, n: 0 });
      setView("play");
      sfx.pick();
    },
    [boot],
  );

  const resume = useCallback(() => {
    if (!boot?.saved) return;
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
        {...chrome}
      />
    );
  }
  // A new run opens on the intro; trying again after a run goes straight to the roster.
  if (view === "intro") {
    return <Intro onDone={() => setView("select")} {...chrome} />;
  }
  if (view === "select") {
    return <Select onPick={start} onBack={() => setView("title")} {...chrome} />;
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
