"use client";

import { useEffect, useState } from "react";
import type { L } from "@/game/types";
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
  // Back from paying: Chef says thank you, once, and the address is tidied.
  const [thanks, setThanks] = useState<L | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const bought = url.searchParams.get("merci");
    const line = bought === "kebab" ? UI.kebabThanks : bought === "fondateur" ? UI.founderThanks : null;
    if (!line) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThanks(line);
    url.searchParams.delete("merci");
    window.history.replaceState(null, "", url);
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
            <Portrait who="chef" className="portrait portrait-xl" />
          </div>
          {thanks && (
            <aside className="chef" role="status">
              <p>
                <strong>Chef</strong> {t(thanks)}
              </p>
            </aside>
          )}
          <h1 className="logo">
            Kebab
            <br />
            Profitable
          </h1>
          <p className="tagline">{t(UI.tagline)}</p>
          <p className="pitch">{t(UI.pitch)}</p>

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

        {seed && (
          <section className="card">
            <h2>{t(UI.leaderboard)}</h2>
            <Leaderboard seed={seed} />
          </section>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
