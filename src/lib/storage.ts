import type { GameState, Lang } from "@/game/types";

/** Everything is kept in the browser. There are no accounts. */
const KEY = {
  lang: "kp.lang",
  mute: "kp.mute",
  pseudo: "kp.pseudo",
  run: "kp.run",
  tips: "kp.tips",
  attempts: (seed: string) => `kp.attempts.${seed}`,
  best: (seed: string) => `kp.best.${seed}`,
};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or a full disk: the game still plays, it just forgets.
  }
}

export const store = {
  lang: (): Lang | null => {
    const v = read(KEY.lang);
    return v === "fr" || v === "en" ? v : null;
  },
  setLang: (lang: Lang) => write(KEY.lang, lang),

  muted: () => read(KEY.mute) === "1",
  setMuted: (muted: boolean) => write(KEY.mute, muted ? "1" : null),

  pseudo: () => read(KEY.pseudo) ?? "",
  setPseudo: (pseudo: string) => write(KEY.pseudo, pseudo),

  run: (): GameState | null => {
    const raw = read(KEY.run);
    if (!raw) return null;
    try {
      const state = JSON.parse(raw) as GameState;
      // A run saved under older rules cannot be replayed, so it is dropped.
      return state && state.v === 4 && Array.isArray(state.history) ? state : null;
    } catch {
      return null;
    }
  },
  setRun: (state: GameState | null) =>
    write(KEY.run, state ? JSON.stringify(state) : null),

  /**
   * Chef's first-run tips: on until a first customer signs, or until hidden.
   * Someone who has already won somewhere does not need them either.
   */
  tips: (): boolean => {
    if (read(KEY.tips) === "off") return false;
    try {
      return !Object.keys(window.localStorage).some((k) => k.startsWith("kp.best."));
    } catch {
      return true;
    }
  },
  setTipsOff: () => write(KEY.tips, "off"),

  attempts: (seed: string) => Number(read(KEY.attempts(seed)) ?? 0) || 0,
  addAttempt: (seed: string) => {
    const n = store.attempts(seed) + 1;
    write(KEY.attempts(seed), String(n));
    return n;
  },

  best: (seed: string): number | null => {
    const v = Number(read(KEY.best(seed)));
    return Number.isFinite(v) && v > 0 ? v : null;
  },
  setBest: (seed: string, day: number) => {
    const current = store.best(seed);
    if (current === null || day < current) write(KEY.best(seed), String(day));
  },
};
