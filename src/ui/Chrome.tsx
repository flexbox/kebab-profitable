"use client";

import { useState } from "react";
import { UI } from "@/i18n/strings";
import { useLang } from "./lang";

export interface ChromeProps {
  muted: boolean;
  toggleMute: () => void;
  /** Urgent cards run against the clock. */
  timed: boolean;
  toggleTimed: () => void;
}

/** The speaker, with either sound waves or a cross beside it. */
function SpeakerIcon({ hidden, waves }: { hidden: boolean; waves: string }) {
  return (
    <svg
      className={hidden ? "icon-layer icon-layer-off" : "icon-layer"}
      viewBox="0 0 12 12"
      width="18"
      height="18"
      shapeRendering="crispEdges"
    >
      <path d="M1 4h3l3-3v10L4 8H1z" fill="currentColor" />
      {/* 1.33 units paint as 2px at this size, the weight of the labels next to it. */}
      <path d={waves} stroke="currentColor" strokeWidth="1.33" fill="none" />
    </svg>
  );
}

/** A stopwatch, crossed out when the clock is switched off. */
function ClockIcon({ hidden, crossed }: { hidden: boolean; crossed: boolean }) {
  return (
    <svg
      className={hidden ? "icon-layer icon-layer-off" : "icon-layer"}
      viewBox="0 0 12 12"
      width="18"
      height="18"
      shapeRendering="crispEdges"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.33"
    >
      <path d="M4.5 1h3M6 1v1.5" />
      <path d="M3.5 3h5v1h1v5h-1v1h-5V9h-1V4h1z" />
      <path d="M6 4.5v2.5h1.5" />
      {crossed && <path d="M1 1l10 10" />}
    </svg>
  );
}

/** Language, sound and clock controls, shown on every screen. */
export function Controls({ muted, toggleMute, timed, toggleTimed }: ChromeProps) {
  const { lang, setLang, t } = useLang();
  // The icons cross-fade only once the player has used the switch, so the
  // saved setting does not animate in when the page loads.
  const [live, setLive] = useState(false);
  const [clockLive, setClockLive] = useState(false);
  return (
    <div className="controls">
      <div className="seg" role="group" aria-label={t(UI.language)}>
        <button
          type="button"
          className={lang === "fr" ? "seg-on" : ""}
          aria-pressed={lang === "fr"}
          onClick={() => setLang("fr")}
        >
          FR
        </button>
        <button
          type="button"
          className={lang === "en" ? "seg-on" : ""}
          aria-pressed={lang === "en"}
          onClick={() => setLang("en")}
        >
          EN
        </button>
      </div>
      <button
        type="button"
        className={muted ? "icon-btn icon-btn-off" : "icon-btn"}
        onClick={() => {
          setLive(true);
          toggleMute();
        }}
        aria-label={t(muted ? UI.unmute : UI.mute)}
        title={t(muted ? UI.unmute : UI.mute)}
      >
        <span className={live ? "icon-swap icon-swap-live" : "icon-swap"} aria-hidden="true">
          <SpeakerIcon hidden={muted} waves="M8.5 4v4M10.5 2.5v7" />
          <SpeakerIcon hidden={!muted} waves="M8 4l3 4M11 4l-3 4" />
        </span>
      </button>
      <button
        type="button"
        className={timed ? "icon-btn" : "icon-btn icon-btn-off"}
        onClick={() => {
          setClockLive(true);
          toggleTimed();
        }}
        aria-label={t(timed ? UI.clockOff : UI.clockOn)}
        title={t(timed ? UI.clockOff : UI.clockOn)}
      >
        <span className={clockLive ? "icon-swap icon-swap-live" : "icon-swap"} aria-hidden="true">
          <ClockIcon hidden={!timed} crossed={false} />
          <ClockIcon hidden={timed} crossed />
        </span>
      </button>
    </div>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <p>{t(UI.disclaimer)}</p>
      <p>
        {t(UI.madeBy)}{" "}
        <a href="https://github.com/flexbox/kebab-profitable" target="_blank" rel="noreferrer">
          github.com/flexbox/kebab-profitable
        </a>
        {" · "}
        <a href="https://luma.com/indiehackerslille" target="_blank" rel="noreferrer">
          Indie Hackers Lille
        </a>
      </p>
    </footer>
  );
}
