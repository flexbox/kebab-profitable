"use client";

import { useState } from "react";
import { character, mrrOf } from "@/game";
import type { GameState, L } from "@/game/types";
import { UI } from "@/i18n/strings";
import { submitScore, type Board } from "@/lib/api";
import { store } from "@/lib/storage";
import { useLang } from "./lang";
import { Leaderboard } from "./Leaderboard";
import { Portrait } from "./Portrait";

type Sent =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; rank: number; board: Board; pseudo: string }
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
  const { t, euro } = useLang();
  const outcome = state.outcome!;
  const won = outcome.result === "won";
  const who = character(state.character);
  const first = who.name.split(" ")[0];
  const [pseudo, setPseudo] = useState(() => store.pseudo());
  const [sent, setSent] = useState<Sent>({ status: "idle" });
  const [copied, setCopied] = useState(false);

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
    if (name.length < 2) return setSent({ status: "error", error: "pseudo" });
    setSent({ status: "sending" });
    store.setPseudo(name);
    const result = await submitScore(state, name, attempts);
    if (result.ok) setSent({ status: "done", rank: result.rank, board: result.board, pseudo: name });
    else setSent({ status: "error", error: result.error });
  }

  async function share() {
    const text = t(won ? UI.shareWon(outcome.day, first) : UI.shareLost(outcome.day, first));
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused: nothing to do, the button simply does not confirm.
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <div className={won ? "card end end-won" : "card end end-lost"}>
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

        {won && sent.status !== "done" && (
          <form className="submit" onSubmit={send}>
            <label htmlFor="pseudo">{t(UI.yourPseudo)}</label>
            <div className="submit-row">
              <input
                id="pseudo"
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
            {sent.status === "error" && <p className="error">{t(UI.errors[sent.error])}</p>}
          </form>
        )}

        {sent.status === "done" && (
          <>
            <p className="success">{t(UI.submitted(sent.rank))}</p>
            <Leaderboard seed={state.seed} board={sent.board} highlight={sent.pseudo} />
          </>
        )}

        <div className="end-actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            {t(UI.retry)}
          </button>
          <button type="button" className="btn" onClick={share}>
            {t(copied ? UI.copied : UI.share)}
          </button>
          <button type="button" className="btn" onClick={onHome}>
            {t(UI.back)}
          </button>
        </div>
      </div>
    </div>
  );
}
