"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTIONS,
  B,
  MEALS,
  character,
  churnRate,
  dateOf,
  daysToApero,
  efficiencyNow,
  eventCard,
  eventChoices,
  idea,
  isLive,
  legalActions,
  mrrOf,
  potentialOf,
  slotsToday,
} from "@/game";
import { effectTone } from "@/game/engine";
import type { ActionId, GameState, L, Move } from "@/game/types";
import { monthName } from "@/i18n/format";
import { UI } from "@/i18n/strings";
import { Controls, type ChromeProps } from "./Chrome";
import { End } from "./End";
import type { Turn } from "./Game";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";
import { Room } from "./Room";

// ---------------------------------------------------------------------------
// Gauges
// ---------------------------------------------------------------------------

function Delta({ value, format }: { value: number; format?: (n: number) => string }) {
  if (!value) return null;
  const text = (value > 0 ? "+" : "−") + (format ? format(Math.abs(value)) : Math.abs(value));
  return <span className={value > 0 ? "delta delta-up" : "delta delta-down"}>{text}</span>;
}

function Gauge({
  label,
  value,
  delta,
  tone,
  turn,
}: {
  label: string;
  value: number;
  delta: number;
  tone: "faim" | "energie" | "moral";
  turn: number;
}) {
  const { t } = useLang();
  const level = value <= 0 ? "empty" : value < 25 ? "low" : "ok";
  return (
    <div className={`gauge gauge-${tone} gauge-${level}`}>
      <div className="gauge-head">
        <span className="gauge-label">
          {label}
          {level !== "ok" && (
            <span className="tag-low">{t(level === "empty" ? UI.empty : UI.low)}</span>
          )}
        </span>
        <span className="gauge-value">
          {Math.round(value)}
          <Delta key={turn} value={Math.round(delta)} />
        </span>
      </div>
      <div
        className="meter"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <div className="meter-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  turn,
  format,
  warn,
  kind,
}: {
  label: string;
  value: string;
  delta: number;
  turn: number;
  format?: (n: number) => string;
  warn?: boolean;
  /** Recurring revenue is shown as the green number. */
  kind?: "mrr";
}) {
  const { t } = useLang();
  const classes = ["stat", warn && "stat-warn", kind && `stat-${kind}`].filter(Boolean);
  return (
    <div className={classes.join(" ")}>
      <span className="stat-label">
        {label}
        {warn && <span className="tag-low">{t(UI.low)}</span>}
      </span>
      <span className="stat-value">
        {value}
        <Delta key={turn} value={Math.round(delta)} format={format} />
      </span>
    </div>
  );
}

function Gauges({ turn }: { turn: Turn }) {
  const { t, euro } = useLang();
  const s = turn.state;
  const p = turn.prev ?? s;
  const eff = Math.round(efficiencyNow(s) * 100);
  const why: L[] = [];
  if (s.faim <= 0) why.push(UI.effWhy.faim);
  if (s.energie < 50) why.push(UI.effWhy.energie);
  if (s.moral < 40) why.push(UI.effWhy.moral);
  if (s.slot === 1 && s.mealToday === "welsh") why.push(UI.effWhy.welsh);

  return (
    <section className="card gauges" aria-label="Gauges">
      <div className="gauge-row">
        <Gauge label={t(UI.faim)} value={s.faim} delta={s.faim - p.faim} tone="faim" turn={turn.n} />
        <Gauge
          label={t(UI.energie)}
          value={s.energie}
          delta={s.energie - p.energie}
          tone="energie"
          turn={turn.n}
        />
        <Gauge label={t(UI.moral)} value={s.moral} delta={s.moral - p.moral} tone="moral" turn={turn.n} />
      </div>
      <div className="stat-row">
        <Stat
          label={t(UI.cash)}
          value={euro(s.cash)}
          delta={s.cash - p.cash}
          turn={turn.n}
          format={(n) => euro(n)}
          warn={s.cash < 300}
        />
        <Stat
          label={t(UI.audience)}
          value={String(s.audience)}
          delta={s.audience - p.audience}
          turn={turn.n}
        />
        <Stat
          label={t(UI.mrr)}
          value={euro(mrrOf(s))}
          delta={mrrOf(s) - mrrOf(p)}
          turn={turn.n}
          format={(n) => euro(n)}
          kind="mrr"
        />
      </div>
      {eff < 100 && (
        <p className="eff">
          {t(UI.efficiency(eff))} ({why.map((w) => t(w)).join(", ")})
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

function Pips({ level }: { level: number }) {
  return (
    <span className="pips" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i <= level ? `pip pip-on pip-${level}` : "pip"} />
      ))}
    </span>
  );
}

function ProjectCard({ state }: { state: GameState }) {
  const { t, euro } = useLang();
  const p = state.project;
  const mrr = mrrOf(state);
  const goal = Math.min(100, (mrr / B.kebabMrr) * 100);

  return (
    <section className="card project">
      <div className="goal">
        <div className="goal-head">
          <span>{t(UI.goal)}</span>
          <strong>
            {euro(mrr)} / {euro(B.kebabMrr)}
          </strong>
        </div>
        <div className="meter meter-goal" role="meter" aria-label={t(UI.goal)} aria-valuemin={0} aria-valuemax={B.kebabMrr} aria-valuenow={mrr}>
          <div className="meter-fill" style={{ width: `${goal}%` }} />
        </div>
      </div>

      {!p ? (
        <p className="muted">{t(UI.noProject)}</p>
      ) : (
        <>
          <h2 className="project-name">{t(idea(p.ideaId).name)}</h2>
          {!p.launched ? (
            <>
              <div className="goal-head">
                <span>{t(UI.mvp)}</span>
                <strong>
                  {p.built >= p.mvpSize
                    ? t(UI.readyToShip)
                    : `${Math.min(99, Math.floor((p.built / p.mvpSize) * 100))} %`}
                </strong>
              </div>
              <div className="meter meter-mvp">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.min(100, (p.built / p.mvpSize) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="goal-head">
                <span>{t(UI.quality)}</span>
                <strong>{p.quality} / 100</strong>
              </div>
              <div className="meter meter-quality">
                <div className="meter-fill" style={{ width: `${p.quality}%` }} />
              </div>
            </>
          )}
          <dl className="facts">
            <div>
              <dt>{t(UI.customers)}</dt>
              <dd>{p.customers}</dd>
            </div>
            <div>
              <dt>{t(UI.price)}</dt>
              <dd>
                {euro(p.price)}
                {t(UI.perMonth)}
              </dd>
            </div>
            <div>
              <dt>{t(UI.potential)}</dt>
              <dd>
                {p.potentialKnown ? (
                  <>
                    <Pips level={potentialOf(state.seed, p.ideaId)} />{" "}
                    {t(UI.potentials[potentialOf(state.seed, p.ideaId)])}
                  </>
                ) : (
                  "?"
                )}
              </dd>
            </div>
          </dl>
          {p.launched && !isLive(p) && <p className="note">{t(UI.awaiting)}</p>}
          {isLive(p) && (
            <p className="note">
              {t(UI.churn(Math.round(churnRate(state) * 100)))}
              {p.built >= B.updateMin && <> · {t(UI.updateReady)}</>}
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Panels: what the player is asked right now
// ---------------------------------------------------------------------------

function IdeaPanel({ state, play }: { state: GameState; play: (m: Move) => void }) {
  const { t, euro } = useLang();
  const who = character(state.character);
  return (
    <div className="panel-body">
      <h2 className="ask">{t(UI.askIdea)}</h2>
      <p className="muted">{t(UI.askIdeaSub)}</p>
      <div className="ideas">
        {state.offer.map((id, i) => {
          const def = idea(id);
          const price = Math.round(def.price * (who.mods.priceMult ?? 1));
          const slots = Math.ceil(def.mvp / (B.coderPoints * (who.mods.coderMult ?? 1)));
          const potential = potentialOf(state.seed, id);
          return (
            <button key={id} type="button" className="choice idea" onClick={() => play({ t: "idea", id })}>
              <span className="key">{i + 1}</span>
              <span className="choice-title">{t(def.name)}</span>
              {def.owner === state.character && <span className="badge badge-you">{t(UI.yours)}</span>}
              <span className="choice-desc">{t(def.pitch)}</span>
              <span className="idea-facts">
                <span>
                  {euro(price)}
                  {t(UI.perMonth)}
                </span>
                <span>{t(UI.ideaNeed(Math.ceil(B.kebabMrr / price)))}</span>
                <span>{t(UI.ideaMvp(slots))}</span>
              </span>
              <span className="idea-tags">
                {def.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {t(UI.tags[tag])}
                  </span>
                ))}
                {who.mods.seesHidden && (
                  <span className="badge badge-math">
                    <Pips level={potential} /> {t(UI.potentials[potential])}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotPanel({
  state,
  play,
  onPreview,
}: {
  state: GameState;
  play: (m: Move) => void;
  onPreview: (id: ActionId | null) => void;
}) {
  const { t } = useLang();
  const options = legalActions(state);
  return (
    <div className="panel-body">
      <h2 className="ask">{t(UI.askSlot[Math.min(3, state.slot)])}</h2>
      <div className="actions">
        {ACTIONS.map((def) => {
          const option = options.find((o) => o.id === def.id)!;
          return (
            <button
              key={def.id}
              type="button"
              className={`choice action action-${def.id}`}
              disabled={!option.enabled}
              onClick={() => {
                onPreview(null);
                play({ t: "act", id: def.id });
              }}
              onMouseEnter={() => option.enabled && onPreview(def.id)}
              onMouseLeave={() => onPreview(null)}
              onFocus={() => option.enabled && onPreview(def.id)}
              onBlur={() => onPreview(null)}
            >
              <span className="key">{def.key}</span>
              <span className="choice-title">{t(def.name)}</span>
              <span className="choice-desc">
                {!option.enabled && option.reason ? t(option.reason) : t(def.desc)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="muted hint">{t(UI.keyHint)}</p>
    </div>
  );
}

function MealPanel({ state, play }: { state: GameState; play: (m: Move) => void }) {
  const { t, euro } = useLang();
  return (
    <div className="panel-body">
      <h2 className="ask">{t(UI.askMeal)}</h2>
      <div className="meals">
        {MEALS.map((def, i) => (
          <button
            key={def.id}
            type="button"
            className={`choice meal meal-${def.id}`}
            disabled={state.cash < def.price}
            onClick={() => play({ t: "meal", id: def.id })}
          >
            <span className="key">{i + 1}</span>
            <span className="choice-title">{t(def.name)}</span>
            <span className="price">{def.price === 0 ? "0 €" : euro(def.price)}</span>
            <span className="choice-desc">{t(def.desc)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventPanel({ state, play }: { state: GameState; play: (m: Move) => void }) {
  const { t } = useLang();
  const ev = eventCard(state.pendingEvent!);
  const seesOdds = !!character(state.character).mods.seesHidden;
  return (
    <div className={`panel-body event event-${ev.kind}`}>
      <p className="event-kind">
        <span className={`badge badge-${ev.kind}`}>{t(UI.kinds[ev.kind])}</span>
        {ev.who && <span className="event-who">{ev.who}</span>}
      </p>
      <h2 className="ask">{t(ev.title)}</h2>
      <p className="event-text">{t(ev.text)}</p>
      <div className="event-choices">
        {eventChoices(state).map((choice) => (
          <button
            key={choice.index}
            type="button"
            className="choice"
            disabled={!choice.enabled}
            onClick={() => play({ t: "choice", id: choice.index })}
          >
            <span className="key">{choice.index + 1}</span>
            <span className="choice-title">{t(choice.label)}</span>
            {seesOdds && choice.odds.length > 1 && (
              <span className="odds">
                {choice.odds.map((o, i) => {
                  const tone = effectTone(o.effect);
                  return (
                    <span key={i} className={`odd tone-${tone}`}>
                      <span className="sr-only">{t(UI.oddsTone[tone])}, </span>
                      {t(UI.odds(Math.round(o.p * 100)))}
                    </span>
                  );
                })}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ state, onContinue }: { state: GameState; onContinue: () => void }) {
  const { t } = useLang();
  const result = state.eventResult!;
  const ev = eventCard(result.id);
  return (
    <div className={`panel-body event event-${ev.kind}`}>
      <p className="event-kind">
        <span className={`badge badge-${ev.kind}`}>{t(UI.kinds[ev.kind])}</span>
        {ev.who && <span className="event-who">{ev.who}</span>}
        {result.tone !== "neutral" && (
          <span className={`badge tone-${result.tone}`}>{t(UI.tones[result.tone])}</span>
        )}
      </p>
      <h2 className="ask">{t(ev.title)}</h2>
      <p className="event-text">{t(result.text)}</p>
      <button type="button" className="btn btn-primary" onClick={onContinue} autoFocus>
        {t(UI.continue)}
      </button>
    </div>
  );
}

function ReportPanel({ state, play }: { state: GameState; play: (m: Move) => void }) {
  const { t, euro, lang } = useLang();
  const r = state.report!;
  const line = (label: string, amount: number, sign: 1 | -1) => (
    <div className={sign > 0 ? "line line-in" : "line line-out"}>
      <dt>{label}</dt>
      <dd>
        {sign > 0 ? "+" : "−"}
        {euro(Math.abs(amount))}
      </dd>
    </div>
  );
  return (
    <div className="panel-body report">
      <h2 className="ask">{t(UI.reportTitle(monthName(r.month, lang)))}</h2>
      <dl className="ledger">
        {line(t(UI.revenue), r.revenue, 1)}
        {r.held > 0 && line(t(UI.held), r.held, -1)}
        {r.released > 0 && line(t(UI.released), r.released, 1)}
        {line(t(UI.urssaf), r.urssaf, -1)}
        {line(t(UI.rent), r.rent, -1)}
        <div className="line line-total">
          <dt>{t(UI.balance)}</dt>
          <dd>{euro(r.cashAfter)}</dd>
        </div>
      </dl>
      <p className="muted">
        {t(UI.reportSummary(r.newCustomers, r.churned, euro(r.mrr)))}
      </p>
      <button type="button" className="btn btn-primary" onClick={() => play({ t: "ok" })} autoFocus>
        {t(UI.nextMonth)}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The play screen
// ---------------------------------------------------------------------------

export function Play({
  turn,
  play,
  onQuit,
  onRetry,
  onHome,
  attempts,
  ...chrome
}: {
  turn: Turn;
  play: (move: Move) => void;
  onQuit: () => void;
  onRetry: () => void;
  onHome: () => void;
  attempts: number;
} & ChromeProps) {
  const { t, date, lang } = useLang();
  const state = turn.state;
  const [preview, setPreview] = useState<ActionId | null>(null);
  // The result of an event stays on screen until acknowledged.
  const [acked, setAcked] = useState(-1);
  const showResult = !!state.eventResult && acked !== turn.n;
  const over = !!state.outcome && !showResult;
  const ack = useCallback(() => setAcked(turn.n), [turn.n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const confirm = e.key === "Enter";
      const n = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
      if (showResult) {
        if (confirm) ack();
        return;
      }
      if (state.outcome) return;
      if (state.phase === "report" && confirm) return play({ t: "ok" });
      if (!n) return;
      if (state.phase === "slot") {
        const def = ACTIONS.find((a) => a.key === e.key);
        if (def && legalActions(state).find((o) => o.id === def.id)?.enabled) {
          play({ t: "act", id: def.id });
        }
      } else if (state.phase === "meal") {
        const def = MEALS[n - 1];
        if (def && state.cash >= def.price) play({ t: "meal", id: def.id });
      } else if (state.phase === "idea") {
        const id = state.offer[n - 1];
        if (id) play({ t: "idea", id });
      } else if (state.phase === "event") {
        const choice = eventChoices(state)[n - 1];
        if (choice?.enabled) play({ t: "choice", id: choice.index });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, showResult, ack, play]);

  const today = dateOf(state.day);
  const rentIn = today.daysInMonth - today.dayOfMonth;
  const aperoIn = daysToApero(state.day);
  const slots = slotsToday(state);
  const who = character(state.character);
  const latest = state.log[state.log.length - 1];
  const roomLabel =
    lang === "fr"
      ? `Le studio de ${who.name.split(" ")[0]}, à Lille`
      : `${who.name.split(" ")[0]}'s studio flat in Lille`;

  return (
    <div className="page play">
      <header className="bar">
        <div className="bar-left">
          <h1 className="brand">Kebab Profitable</h1>
          <span className="when">
            <strong>{t(UI.day(state.day))}</strong> · {date(state.day)}
          </span>
        </div>
        <div className="bar-right">
          <span className={rentIn <= 3 ? "chip chip-warn" : "chip"}>{t(UI.rentIn(rentIn))}</span>
          <span className={aperoIn === 0 ? "chip chip-good" : "chip"}>{t(UI.aperoIn(aperoIn))}</span>
          <Controls {...chrome} />
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              if (window.confirm(t(UI.quitConfirm))) onQuit();
            }}
          >
            {t(UI.quit)}
          </button>
        </div>
      </header>

      <main className="play-grid">
        {/* What just happened, announced once: the panel itself is not read out each turn. */}
        <p className="sr-only" role="status">
          {latest ? t(latest.text) : ""}
        </p>
        {/* On the left, what you do: the question, then the journal of what came of it. */}
        <section className="card panel">
          {showResult ? (
            <ResultPanel state={state} onContinue={ack} />
          ) : state.phase === "idea" ? (
            <IdeaPanel state={state} play={play} />
          ) : state.phase === "meal" ? (
            <MealPanel state={state} play={play} />
          ) : state.phase === "event" ? (
            <EventPanel state={state} play={play} />
          ) : state.phase === "report" ? (
            <ReportPanel state={state} play={play} />
          ) : state.phase === "slot" ? (
            <SlotPanel state={state} play={play} onPreview={setPreview} />
          ) : null}
        </section>

        {/* On the right, what you see: the room, then the numbers. */}
        <div className="col-side">
          <section className="scene">
            <ol className="slots" aria-label={t(UI.slotsLabel)}>
              {Array.from({ length: slots }, (_, i) => (
                <li
                  key={i}
                  aria-current={i === state.slot ? "step" : undefined}
                  className={
                    i < state.slot ? "slot slot-done" : i === state.slot ? "slot slot-now" : "slot"
                  }
                >
                  {t(UI.slots[i])}
                </li>
              ))}
            </ol>
            <Room state={state} preview={preview} label={roomLabel} />
          </section>

          {state.chef && (
            <aside className="chef">
              <Portrait who="chef" className="portrait portrait-md" />
              <p>
                <strong>Chef</strong> {t(state.chef)}
              </p>
            </aside>
          )}

          <Gauges turn={turn} />
          <ProjectCard state={state} />
        </div>

        <section className="card journal">
          <h2>{t(UI.journal)}</h2>
          <ol>
            {state.log
              .slice(-14)
              .reverse()
              .map((entry, i) => (
                <li key={`${state.log.length - i}`} className={`log log-${entry.tone}`}>
                  <span className="log-day">{t(UI.day(entry.day))}</span> {t(entry.text)}
                </li>
              ))}
          </ol>
        </section>
      </main>

      {over && <End state={state} attempts={attempts} onRetry={onRetry} onHome={onHome} />}
    </div>
  );
}
