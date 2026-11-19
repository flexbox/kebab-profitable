"use client";

import { useEffect } from "react";
import { UI } from "@/i18n/strings";
import { music } from "@/lib/sound";
import { Brand, Controls, Footer, type ChromeProps } from "./Chrome";
import { Leaderboard } from "./Leaderboard";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";

export function Title({
  seed,
  attempts,
  best,
  canResume,
  onPlay,
  onResume,
  ...chrome
}: {
  seed: string | null;
  attempts: number;
  best: number | null;
  canResume: boolean;
  onPlay: () => void;
  onResume: () => void;
} & ChromeProps) {
  const { t } = useLang();
  // The intro opens on music: fetch it while the player reads the title.
  useEffect(() => {
    const id = window.setTimeout(() => music.preload("intro_walk", "intro_dare", "select"), 1200);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="page title-page">
      <header className="bar">
        <Brand mark={false}>Indie Hackers Lille</Brand>
        <Controls {...chrome} />
      </header>

      <main className="title-main">
        <section className="hero">
          <div className="hero-chef">
            <Portrait who="chef" className="portrait portrait-xl" alt={t(UI.chefPortrait)} />
          </div>
          <h1 className="logo">
            Kebab
            <br />
            Profitable
          </h1>
          <p className="tagline">{t(UI.tagline)}</p>
          <p className="pitch">{t(UI.gameType)} {t(UI.pitch)}</p>

          <div className="hero-actions">
            {canResume && (
              <button type="button" className="btn btn-primary" onClick={onResume}>
                {t(UI.resume)}
              </button>
            )}
            <button
              type="button"
              className={canResume ? "btn" : "btn btn-primary"}
              onClick={onPlay}
              disabled={!seed}
            >
              {t(canResume ? UI.newRun : UI.playToday)}
            </button>
          </div>
          <p className="muted">
            {t(UI.sameRun)}
            {seed && (
              <>
                {" "}
                {t(UI.attemptsToday(attempts))}
                {best !== null && <> {t(UI.bestToday(best))}</>}
              </>
            )}
          </p>
        </section>

        <div className="title-side">
          <section className="card how">
            <h2>{t(UI.howTitle)}</h2>
            <ol>
              {UI.how.map((line, i) => (
                <li key={i}>{t(line)}</li>
              ))}
            </ol>
          </section>

          <section className="card" id="classement">
            <h2>{t(UI.leaderboard)}</h2>
            {seed ? <Leaderboard seed={seed} /> : <p className="muted">{t(UI.loadingScores)}</p>}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
