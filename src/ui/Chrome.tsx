"use client";

import { UI } from "@/i18n/strings";
import { useLang } from "./lang";

export interface ChromeProps {
  muted: boolean;
  toggleMute: () => void;
}

/** Language and sound controls, shown on every screen. */
export function Controls({ muted, toggleMute }: ChromeProps) {
  const { lang, setLang, t } = useLang();
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
        className="icon-btn"
        onClick={toggleMute}
        aria-pressed={muted}
        aria-label={t(muted ? UI.unmute : UI.mute)}
        title={t(muted ? UI.unmute : UI.mute)}
      >
        <svg viewBox="0 0 12 12" width="18" height="18" aria-hidden="true" shapeRendering="crispEdges">
          <path d="M1 4h3l3-3v10L4 8H1z" fill="currentColor" />
          {muted ? (
            <path d="M8 4l3 4M11 4l-3 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          ) : (
            <path d="M8.5 4v4M10.5 2.5v7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          )}
        </svg>
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
