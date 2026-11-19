"use client";

import { useEffect, useRef, useState } from "react";
import { character, mrrOf } from "@/game";
import type { GameState, L } from "@/game/types";
import { UI } from "@/i18n/strings";
import { submitScore, type Board, type BoardDay } from "@/lib/api";
import { seedFor } from "@/lib/seed";
import { KEBAB_LINK } from "@/lib/site";
import { postOnX, winPath } from "@/lib/share";
import { store } from "@/lib/storage";
import { useLang } from "./lang";
import { Leaderboard } from "./Leaderboard";
import { Portrait } from "./Portrait";

type Sent =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; rank: number; day: BoardDay; days: number; path: string; board: Board; pseudo: string }
  | { status: "error"; error: keyof typeof UI.errors };

export function End({
  state,
  attempts,
  onRetry,
  onHome,
}: {
  state: GameState;
  attempts: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  const { t, euro, lang } = useLang();
  const outcome = state.outcome!;
  const won = outcome.result === "won";
  const who = character(state.character);
  const first = who.name.split(" ")[0];
  const [pseudo, setPseudo] = useState(() => store.pseudo());
  const [sent, setSent] = useState<Sent>({ status: "idle" });
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const canSubmit = won && sent.status !== "done";
  // A lost run cannot enter the board, but the player can see who is on it this week.
  const [today] = useState(() => seedFor(new Date()));

  // A modal dialog: the page behind is inert, focus moves inside, and it
  // goes back to the page when the dialog closes.
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    return () => el?.close();
  }, []);

  const title = won ? UI.wonTitle : outcome.reason === "cdi" ? UI.lostCdiTitle : UI.lostCashTitle;
  const sub = won
    ? UI.wonSub(outcome.day, first)
    : outcome.reason === "cdi"
      ? UI.lostCdiSub(outcome.day)
      : UI.lostCashSub(outcome.day);

  const stats: [L, number][] = [
    [UI.stats.kebabs, state.stats.kebabs],
    [UI.stats.pates, state.stats.pates],
    [UI.stats.welshs, state.stats.welshs],
    [UI.stats.posts, state.stats.posts],
    [UI.stats.launches, state.stats.launches],
    [UI.stats.pivots, state.stats.pivots],
    [UI.stats.freelance, state.stats.freelance],
    [UI.stats.aperos, state.stats.aperos],
    [UI.stats.lostDays, state.stats.lostDays],
  ];

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const name = pseudo.trim();
    if (name.length < 2) {
      setSent({ status: "error", error: "pseudo" });
      input.current?.focus();
      return;
    }
    setSent({ status: "sending" });
    store.setPseudo(name);
    const result = await submitScore(state, name, attempts);
    if (result.ok) {
      setSent({
        status: "done",
        rank: result.rank,
        day: result.day,
        days: result.days,
        path: winPath(lang, state.seed, result.key, result.days),
        board: result.board,
        pseudo: name,
      });
    }
    else setSent({ status: "error", error: result.error });
  }

  // The post carries the rank once the score is on this week's board.
  const shareText = !won
    ? UI.shareLost(outcome.day, first)
    : sent.status === "done" && sent.day === "thisWeek"
      ? UI.shareRanked(sent.rank, outcome.day, first)
      : UI.shareWon(outcome.day, first);
  // A saved win is shared with its own address, and so its own picture.
  const shareUrl = postOnX(t(shareText), sent.status === "done" ? sent.path : "");

  return (
    <dialog
      ref={dialog}
      className={won ? "card end end-won" : "card end end-lost"}
      aria-labelledby="end-title"
      onCancel={(event) => {
        // Escape leaves the finished run, like the last button does.
        event.preventDefault();
        onHome();
      }}
    >
      <>
        <div className="end-head">
          <Portrait who={state.character} className="portrait portrait-lg" />
          <div>
            <h1 id="end-title">{t(title)}</h1>
            <p>{t(sub)}</p>
            {!won && <p className="muted">{t(UI.bestMrr(euro(mrrOf(state))))}</p>}
          </div>
        </div>

        {state.chef && (
          <aside className="chef">
            <Portrait who="chef" className="portrait portrait-md" />
            <p>
              <strong>Chef</strong> {t(state.chef)}
            </p>
          </aside>
        )}

        <dl className="end-stats">
          {stats
            .filter(([, value]) => value > 0)
            .map(([label, value]) => (
              <div key={label.en}>
                <dt>{t(label)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>

        {/* Asked once the run is won, right under the numbers that earned it. */}
        {won && KEBAB_LINK && (
          <aside className="invite end-kebab">
            <p>{t(UI.kebabOffer)}</p>
            <a
              className="btn btn-small btn-kebab"
              href={`${KEBAB_LINK}?locale=${lang}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(UI.kebabBuy)}
              <span className="sr-only"> {t(UI.newTab)}</span>
            </a>
          </aside>
        )}

        {won && sent.status !== "done" && (
          <form className="submit" onSubmit={send}>
            <label htmlFor="pseudo">{t(UI.yourPseudo)}</label>
            <p id="pseudo-hint" className="field-hint">
              {t(UI.pseudoHint)}
            </p>
            {/* The error sits right above the field it is about, where the eye already is. */}
            {sent.status === "error" && (
              <p id="pseudo-error" className="error" role="alert">
                {t(UI.errors[sent.error])}
              </p>
            )}
            <div className="submit-row">
              <input
                id="pseudo"
                ref={input}
                aria-invalid={sent.status === "error" && sent.error === "pseudo"}
                aria-describedby={
                  sent.status === "error" ? "pseudo-hint pseudo-error" : "pseudo-hint"
                }
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                maxLength={16}
                autoComplete="nickname"
                spellCheck={false}
              />
              <button type="submit" className="btn btn-primary" disabled={sent.status === "sending"}>
                {t(sent.status === "sending" ? UI.submitting : UI.submit)}
              </button>
            </div>
          </form>
        )}

        {sent.status === "done" && (
          <>
            <p className="success">{t(UI.submitted(sent.rank, sent.day))}</p>
            <Leaderboard
              seed={state.seed}
              board={sent.board}
              day={sent.day}
              highlight={sent.pseudo}
            />
          </>
        )}

        <div className="end-actions">
          {/* One filled button: submitting the score while that is still to do. */}
          <button type="button" className={canSubmit ? "btn" : "btn btn-primary"} onClick={onRetry}>
            {t(UI.retry)}
          </button>
          <a className="btn" href={shareUrl} target="_blank" rel="noopener noreferrer">
            {t(UI.share)}
            <span className="sr-only"> {t(UI.newTab)}</span>
          </a>
          <button type="button" className="btn" onClick={onHome}>
            {t(UI.home)}
          </button>
        </div>

        {/* Under the buttons: a long board never pushes "Play again" out of reach. */}
        {!won && (
          <section className="end-board" aria-labelledby="end-board-title">
            <h2 id="end-board-title">{t(UI.leaderboard)}</h2>
            <Leaderboard seed={today} />
          </section>
        )}
      </>
    </dialog>
  );
}
