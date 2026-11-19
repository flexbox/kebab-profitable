"use client";

import { useEffect } from "react";
import { CHARACTERS, idea } from "@/game";
import type { CharacterId } from "@/game/types";
import { UI } from "@/i18n/strings";
import { FOUNDER_LINK } from "@/lib/site";
import { music } from "@/lib/sound";
import { Controls, Footer, type ChromeProps } from "./Chrome";
import { useLang } from "./lang";
import { Handle, Portrait } from "./Portrait";

export function Select({
  onPick,
  onBack,
  ...chrome
}: {
  onPick: (who: CharacterId) => void;
  onBack: () => void;
} & ChromeProps) {
  const { t, lang } = useLang();
  // The roster has its own tune, for as long as it is on screen.
  useEffect(() => {
    music.play("select");
    return () => music.stop();
  }, []);
  return (
    <div className="page">
      <header className="bar">
        <button type="button" className="btn btn-small btn-back" onClick={onBack}>
          ← {t(UI.back)}
        </button>
        <Controls {...chrome} />
      </header>
      <main>
        <h1 className="screen-title">{t(UI.chooseCharacter)}</h1>
        <ul className="roster">
          {CHARACTERS.map((c) => (
            <li key={c.id} className="card who">
              <div className="who-head">
                <Portrait who={c.id} className="portrait portrait-lg" />
                <div>
                  <h2>{c.name}</h2>
                  {c.handle && <Handle handle={c.handle} />}
                  <p className="muted">{t(c.role)}</p>
                </div>
              </div>
              <dl className="traits">
                <div className="trait trait-good">
                  <dt>
                    <span className="trait-kind">{t(UI.perk)}</span> {t(c.perk.name)}
                  </dt>
                  <dd>{t(c.perk.desc)}</dd>
                </div>
                <div className="trait trait-bad">
                  <dt>
                    <span className="trait-kind">{t(UI.flaw)}</span> {t(c.flaw.name)}
                  </dt>
                  <dd>{t(c.flaw.desc)}</dd>
                </div>
                <div className="trait">
                  <dt>
                    <span className="trait-kind">{t(UI.signature)}</span>{" "}
                    {t(idea(c.signatureIdea).name)}
                  </dt>
                </div>
              </dl>
              <button type="button" className="btn" onClick={() => onPick(c.id)}>
                {t(UI.playAs(c.name.split(" ")[0]))}
              </button>
            </li>
          ))}
          <li className="card who who-locked">
            <div className="who-head">
              <div className="portrait portrait-lg portrait-empty" aria-hidden="true">
                ?
              </div>
              <div>
                <h2>{t(UI.custom)}</h2>
                <p className="muted">{t(UI.customRole)}</p>
              </div>
            </div>
            {/* Laid out like the cards beside it: this is what one gets. */}
            <dl className="traits">
              <div className="trait trait-good">
                <dt>
                  <span className="trait-kind">{t(UI.perk)}</span>
                </dt>
                <dd>{t(UI.customPerk)}</dd>
              </div>
              <div className="trait trait-bad">
                <dt>
                  <span className="trait-kind">{t(UI.flaw)}</span>
                </dt>
                <dd>{t(UI.customFlaw)}</dd>
              </div>
              <div className="trait">
                <dt>
                  <span className="trait-kind">{t(UI.signature)}</span> {t(UI.customIdea)}
                </dt>
              </div>
            </dl>
            {FOUNDER_LINK && (
              <>
                <a
                  className="btn"
                  href={`${FOUNDER_LINK}?locale=${lang}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(UI.customBuy)}
                  <span className="sr-only"> {t(UI.newTab)}</span>
                </a>
                <p className="muted who-terms">{t(UI.customTerms)}</p>
              </>
            )}
          </li>
        </ul>
      </main>
      <Footer />
    </div>
  );
}
