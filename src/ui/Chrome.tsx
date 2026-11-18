"use client";

import { useState, type ReactNode } from "react";
import icon from "@/app/icon.svg";
import { UI } from "@/i18n/strings";
import { useLang } from "./lang";

export interface ChromeProps {
  muted: boolean;
  toggleMute: () => void;
}

/**
 * The name at the top left of a screen: the game's, behind its mark, unless
 * another is given. The mark is the favicon itself (`src/app/icon.svg`), so
 * the two cannot differ. It is decoration: the name is written next to it.
 */
export function Brand({
  as: Tag = "span",
  mark = true,
  children = "Kebab Profitable",
}: {
  as?: "span" | "h1";
  mark?: boolean;
  children?: ReactNode;
}) {
  return (
    <Tag className="brand">
      {mark && (
        // A plain image on purpose: pixel art must not be resampled or re-encoded.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon.src} width={32} height={32} alt="" className="brand-mark" />
      )}
      {children}
    </Tag>
  );
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

/** Language and sound controls, shown on every screen. */
export function Controls({ muted, toggleMute }: ChromeProps) {
  const { lang, setLang, t } = useLang();
  // The icons cross-fade only once the player has used the switch, so the
  // saved setting does not animate in when the page loads.
  const [live, setLive] = useState(false);
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
