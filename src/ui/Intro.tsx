"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { UI } from "@/i18n/strings";
import { music, sfx } from "@/lib/sound";
import { Controls, type ChromeProps } from "./Chrome";
import {
  drawIntro,
  INTRO_H,
  INTRO_W,
  loadIntroArt,
  WALK_FROM,
  WALK_TO,
  type IntroArt,
  type IntroFrame,
} from "./intro-pixels";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";

/** One caption, and what the picture does while it is on screen. */
interface Beat {
  scene: "street" | "chef";
  text: string;
  /** How long the beat lasts when nobody presses anything, in milliseconds. */
  length: number;
  /** When the first letter is typed. */
  typeFrom: number;
  /** Street: where the walker is at the start and at the end. */
  from: number;
  to: number;
  /** Chef comes in on this beat. */
  entrance: boolean;
  dare: boolean;
}

/** One letter, then the time left to read it, then a pause at the end of a caption. */
const TYPE_MS = 30;
const READ_MS = 26;
const PAUSE_MS = 1300;
/** Chef comes in, lands, and only then speaks. */
const SLIDE_MS = 420;
const LAND_MS = 220;
const ENTRANCE_MS = 760;

function plan(street: string[], chef: { text: string; dare: boolean }[]): Beat[] {
  const time = (text: string) => text.length * (TYPE_MS + READ_MS) + PAUSE_MS;
  // The walk takes the whole of the first part, at one pace.
  const total = street.reduce((sum, text) => sum + time(text), 0);
  const at = (elapsed: number) => WALK_FROM + ((WALK_TO - WALK_FROM) * elapsed) / total;
  let elapsed = 0;
  const beats: Beat[] = street.map((text) => {
    const from = at(elapsed);
    elapsed += time(text);
    return { scene: "street", text, length: time(text), typeFrom: 0, from, to: at(elapsed), entrance: false, dare: false };
  });
  chef.forEach(({ text, dare }, i) => {
    const lead = i === 0 ? ENTRANCE_MS : 0;
    beats.push({ scene: "chef", text, length: lead + time(text), typeFrom: lead, from: 0, to: 0, entrance: i === 0, dare });
  });
  return beats;
}

/** How many letters of the caption are on screen. */
function typed(beat: Beat, t: number): number {
  return Math.max(0, Math.min(beat.text.length, Math.floor((t - beat.typeFrom) / TYPE_MS)));
}

/** The picture at a given moment of a beat. `still` shows where the beat ends. */
function frameAt(beat: Beat, t: number, clock: number, still: boolean): IntroFrame {
  const base = { walker: 0, walking: false, enter: 1, face: 0 as const, glint: false, shake: 0, flash: 0, clock };
  if (beat.scene === "street") {
    const done = still ? 1 : Math.min(1, t / beat.length);
    return { ...base, scene: "street", walker: beat.from + (beat.to - beat.from) * done, walking: done < 1 };
  }
  if (still) return { ...base, scene: "chef", face: beat.dare ? 2 : 0 };

  const talking = t >= beat.typeFrom && typed(beat, t) < beat.text.length;
  const mouth = Math.floor(t / 110) % 2 === 0;
  const rest = beat.dare ? 2 : 0;
  const frame: IntroFrame = { ...base, scene: "chef", face: talking && mouth ? 1 : rest, glint: beat.dare };
  if (beat.entrance) {
    // A flash covers the cut from the street; he slides in and lands.
    frame.enter = Math.min(1, t / SLIDE_MS);
    frame.flash = Math.max(0, 1 - t / 260);
    if (t >= SLIDE_MS && t < SLIDE_MS + LAND_MS) frame.shake = Math.floor(t / 45) % 2 ? 2 : -2;
  }
  if (beat.dare) {
    frame.flash = Math.max(0, 0.6 - t / 320);
    if (t < 180) frame.shake = Math.floor(t / 45) % 2 ? 1 : -1;
  }
  return frame;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Before a new run: the walk home from the office, then Chef and his dare.
 *
 * It plays by itself, a caption at a time. A press finishes the caption being
 * typed, another moves on, and it can be skipped at any moment. With reduced
 * motion, or with the clock on urgent cards switched off, nothing moves on by
 * itself: each caption waits for a press.
 */
export function Intro({ onDone, ...chrome }: { onDone: () => void } & ChromeProps) {
  const { t, lang } = useLang();
  const beats = useMemo(
    () =>
      plan(
        UI.intro.street.map((line) => line[lang]),
        UI.intro.chef.map((line) => ({ text: line.text[lang], dare: !!line.dare })),
      ),
    [lang],
  );

  const [art, setArt] = useState<IntroArt | null>(null);
  useEffect(() => {
    let wanted = true;
    loadIntroArt().then(
      (loaded) => wanted && setArt(loaded),
      () => undefined,
    );
    return () => {
      wanted = false;
    };
  }, []);

  // With reduced motion the pictures are stills and the captions come whole.
  const still = useReducedMotion();
  const auto = !still;

  const [index, setIndex] = useState(0);
  const [letters, setLetters] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  // The moment being shown. It lives outside React: it changes on every frame.
  const now = useRef({ index: 0, t: 0, clock: 0, held: false, letters: 0, cued: false });

  const goTo = useCallback((next: number) => {
    Object.assign(now.current, { index: next, t: 0, held: false, letters: 0, cued: false });
    setIndex(next);
    setLetters(0);
  }, []);

  const advance = useCallback(() => {
    const moment = now.current;
    const beat = beats[moment.index];
    const typing = moment.t < beat.typeFrom + beat.text.length * TYPE_MS;
    if (!still && !moment.held && typing) {
      // Everything on this beat lands at once, and waits to be read.
      moment.t = beat.length;
      moment.held = true;
      return;
    }
    if (moment.index === beats.length - 1) onDone();
    else goTo(moment.index + 1);
  }, [beats, still, onDone, goTo]);

  // The film: one frame at a time, for as long as motion is welcome.
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !art) return;
    ctx.imageSmoothingEnabled = false;
    if (still) {
      const beat = beats[index];
      drawIntro(ctx, art, frameAt(beat, beat.length, 0, true));
      if (beat.entrance) sfx.slam();
      if (beat.dare) sfx.dare();
      return;
    }
    let last = performance.now();
    let raf = 0;
    const tick = (time: number) => {
      const moment = now.current;
      const elapsed = Math.min(time - last, 64);
      last = time;
      // A hidden tab does not eat the film.
      if (!document.hidden) {
        moment.t += elapsed;
        moment.clock += elapsed;
      }
      let beat = beats[moment.index];
      if (auto && !moment.held && moment.t >= beat.length && moment.index < beats.length - 1) {
        goTo(moment.index + 1);
        beat = beats[moment.index];
      }

      // Sound: he lands with a thud, and the dare has its own four notes.
      if (!moment.cued && (beat.dare || (beat.entrance && moment.t >= SLIDE_MS))) {
        moment.cued = true;
        if (beat.dare) sfx.dare();
        else sfx.slam();
      }
      const shown = typed(beat, moment.t);
      if (shown !== moment.letters) {
        // One blip for every other letter that is not a space.
        if (shown > moment.letters && shown % 2 === 1 && beat.text[shown - 1] !== " ") {
          if (beat.scene === "chef") sfx.talk();
          else sfx.type();
        }
        moment.letters = shown;
        setLetters(shown);
      }

      drawIntro(ctx, art, frameAt(beat, moment.t, moment.clock, false));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [art, beats, still, auto, index, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return onDone();
      if (e.key !== "Enter" && e.key !== " " && e.key !== "ArrowRight") return;
      // A focused button answers the key by itself.
      if (e.target instanceof Element && e.target.closest("button, a, input, select, textarea")) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onDone]);

  const beat = beats[index];
  // The walk has its tune; Chef comes in with another, on the cut.
  const scene = beat.scene;
  useEffect(() => {
    music.play(scene === "street" ? "intro_walk" : "intro_dare");
  }, [scene]);
  useEffect(() => () => music.stop(), []);
  const shown = still ? beat.text.length : letters;
  const last = index === beats.length - 1;
  return (
    <div className="page intro-page">
      <header className="bar">
        <span className="brand-small">Kebab Profitable</span>
        <div className="bar-right">
          <Controls {...chrome} />
          <button type="button" className="btn btn-small" onClick={onDone}>
            {t(UI.intro.skip)}
          </button>
        </div>
      </header>

      <main className="intro">
        {/* A click on the picture moves on too; the button below does the same for keyboards. */}
        <div className="intro-stage" onClick={advance}>
          <canvas
            ref={canvas}
            width={INTRO_W}
            height={INTRO_H}
            className="pixel intro-screen"
            role="img"
            aria-label={t(beat.scene === "street" ? UI.intro.streetLabel : UI.intro.chefLabel)}
          />
        </div>

        <div className={beat.scene === "chef" ? "intro-box intro-box-chef" : "intro-box"}>
          {beat.scene === "chef" && (
            <div className="intro-who">
              <Portrait who="chef" className="portrait portrait-md" />
              <p>
                <strong>Chef</strong>
                <span>{t(UI.intro.chefRole)}</span>
              </p>
            </div>
          )}
          {/* The letters still to come keep their place, so the box never reflows. */}
          <p className="intro-text" aria-hidden="true">
            {beat.text.slice(0, shown)}
            <span className="intro-rest">{beat.text.slice(shown)}</span>
          </p>
          {/* Read out whole, once, instead of letter by letter. */}
          <p className="sr-only" role="status">
            {beat.scene === "chef" ? t(UI.intro.chefSays(beat.text)) : beat.text}
          </p>
        </div>

        <div className="intro-actions">
          <ol className="intro-dots" aria-hidden="true">
            {beats.map((_, i) => (
              <li key={i} className={i === index ? "intro-dot intro-dot-on" : i < index ? "intro-dot intro-dot-done" : "intro-dot"} />
            ))}
          </ol>
          <p className="muted hint">{t(UI.intro.hint)}</p>
          <button
            type="button"
            className={last ? "btn btn-primary" : "btn"}
            onClick={advance}
            autoFocus
          >
            {t(last ? UI.intro.accept : UI.intro.next)}
          </button>
        </div>
      </main>
    </div>
  );
}
