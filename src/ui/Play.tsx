"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
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
  shownChoices,
  guest,
  guestsMet,
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
import { postOnX } from "@/lib/share";
import { sfx } from "@/lib/sound";
import { Brand, Controls, type ChromeProps } from "./Chrome";
import { cueOf } from "./cue";
import { End } from "./End";
import type { Turn } from "./Game";
import { useLang } from "./lang";
import { Guest, Portrait } from "./Portrait";
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

/** Rolls the shown number from where it was to where it is now. */
function useCountTo(target: number, ms = 700) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const eased = 1 - Math.pow(1 - k, 3);
      const v = start + (target - start) * eased;
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return Math.round(shown);
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
  value: number;
  delta: number;
  turn: number;
  format?: (n: number) => string;
  warn?: boolean;
  /** Recurring revenue is shown as the green number. */
  kind?: "mrr";
}) {
  const { t } = useLang();
  const classes = ["stat", warn && "stat-warn", kind && `stat-${kind}`].filter(Boolean);
  const shown = useCountTo(value);
  const moved = Math.round(delta) !== 0;
  return (
    <div className={classes.join(" ")}>
      <span className="stat-label">
        {label}
        {warn && <span className="tag-low">{t(UI.low)}</span>}
      </span>
      <span className="stat-value">
        <span key={moved ? `num-${turn}` : "num"} className={moved ? "stat-num stat-bounce" : "stat-num"}>
          {format ? format(shown) : shown}
        </span>
        <Delta key={`delta-${turn}`} value={Math.round(delta)} format={format} />
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
          value={Math.round(s.cash)}
          delta={s.cash - p.cash}
          turn={turn.n}
          format={(n) => euro(n)}
          warn={s.cash < 300}
        />
        <Stat
          label={t(UI.audience)}
          value={s.audience}
          delta={s.audience - p.audience}
          turn={turn.n}
        />
        <Stat
          label={t(UI.mrr)}
          value={Math.round(mrrOf(s))}
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
              <div
                className={`super${p.built >= p.mvpSize ? " super-max" : ""}`}
                role="meter"
                aria-label={t(UI.mvp)}
                aria-valuemin={0}
                aria-valuemax={p.mvpSize}
                aria-valuenow={Math.min(p.built, p.mvpSize)}
              >
                <div
                  className="super-fill"
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
              <div
                className="super super-quality"
                role="meter"
                aria-label={t(UI.quality)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={p.quality}
              >
                <div className="super-fill" style={{ width: `${Math.min(100, p.quality)}%` }} />
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

function MealPanel({
  state,
  play,
  onFasting,
}: {
  state: GameState;
  play: (m: Move) => void;
  /** Pointing at "skip lunch": the room shows you not eating. */
  onFasting: (fasting: boolean) => void;
}) {
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
            onClick={() => {
              onFasting(false);
              play({ t: "meal", id: def.id });
            }}
            onMouseEnter={() => onFasting(def.id === "skip")}
            onMouseLeave={() => onFasting(false)}
            onFocus={() => onFasting(def.id === "skip")}
            onBlur={() => onFasting(false)}
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

/** How long a card ignores input after it lands, in milliseconds. */
const ARMING = 600;

/**
 * The clock on an urgent card. It only runs while the page is in view: a
 * hidden tab, an open dialog or a sleeping laptop does not eat the time.
 */
function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const { t } = useLang();
  const total = seconds * 1000;
  const [left, setLeft] = useState(total);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(now - last, 250);
      last = now;
      if (!document.hidden) setLeft((ms) => Math.max(0, ms - elapsed));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const secs = Math.ceil(left / 1000);
  useEffect(() => {
    if (left <= 0) onExpire();
  }, [left, onExpire]);
  useEffect(() => {
    if (secs > 0 && secs <= 3) sfx.tick();
  }, [secs]);

  // The bar drains smoothly, or one step a second when motion is reduced.
  const style = { "--left": left / total, "--left-step": secs / seconds } as React.CSSProperties;
  return (
    <div className={secs <= 3 ? "clock clock-last" : "clock"} role="timer" aria-label={t(UI.timeLeft)}>
      <div className="clock-track" aria-hidden="true">
        <div className="clock-fill" style={style} />
      </div>
      <span className="clock-count">{t(UI.seconds(secs))}</span>
    </div>
  );
}

function EventPanel({
  state,
  play,
  armed,
}: {
  state: GameState;
  play: (m: Move) => void;
  /** False for a moment after the card lands, so no stray click answers it. */
  armed: boolean;
}) {
  const { t } = useLang();
  const ev = eventCard(state.pendingEvent!);
  const seesOdds = !!character(state.character).mods.seesHidden;
  const onExpire = useCallback(() => play({ t: "miss" }), [play]);
  return (
    <div className={`panel-body event event-${ev.kind}`}>
      <p className="event-kind">
        <span className={`badge badge-${ev.kind}`}>{t(UI.kinds[ev.kind])}</span>
      </p>
      {ev.who && <Guest id={ev.who} />}
      {ev.urgent && (
        <>
          <Countdown seconds={ev.urgent.seconds} onExpire={onExpire} />
          <p className="sr-only" role="alert">
            {t(UI.urgentAlert(ev.urgent.seconds))}
          </p>
        </>
      )}
      <h2 className="ask">{t(ev.title)}</h2>
      <p className="event-text">{t(ev.text)}</p>
      <div className="event-choices">
        {shownChoices(state).map((choice, place) => (
          <button
            key={choice.index}
            type="button"
            className="choice"
            disabled={!choice.enabled}
            onClick={() => armed && play({ t: "choice", id: choice.index })}
          >
            <span className="key">{place + 1}</span>
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
        {result.missed ? (
          <span className="badge tone-bad">{t(UI.tooLate)}</span>
        ) : (
          result.tone !== "neutral" && (
            <span className={`badge tone-${result.tone}`}>{t(UI.tones[result.tone])}</span>
          )
        )}
      </p>
      {ev.who && <Guest id={ev.who} />}
      <h2 className="ask">{t(ev.title)}</h2>
      <p className="event-text">{t(result.text)}</p>
      <button type="button" className="btn btn-primary" onClick={onContinue} autoFocus>
        <span className="key">1</span>
        {t(UI.continue)}
      </button>
    </div>
  );
}

/** Where the real apéros of Indie Hackers Lille are announced. */
const LUMA = "https://luma.com/indiehackerslille";

/** How many guests a call for support names. */
const FORCE_TAGS = 2;

function ReportPanel({
  state,
  play,
  forceLink,
}: {
  state: GameState;
  play: (m: Move) => void;
  /** The link that asks X for support: the keyboard follows it too. */
  forceLink: RefObject<HTMLAnchorElement | null>;
}) {
  const { t, euro, lang } = useLang();
  const r = state.report!;
  // Asking for support thanks the guests met so far, by their handle: their
  // followers see the post. Two at most, the latest first, or it reads as spam.
  const handles = guestsMet(state)
    .slice(0, FORCE_TAGS)
    .map((who) => guest(who).handle);
  const forceUrl = postOnX(
    t(UI.forcePost(monthName(r.month, lang), euro(r.mrr), euro(r.cashAfter), handles)),
  );
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
      <div className="report-actions">
        <button type="button" className="btn btn-primary" onClick={() => play({ t: "ok" })} autoFocus>
          <span className="key">1</span>
          {t(UI.nextMonth)}
        </button>
        <a ref={forceLink} className="btn" href={forceUrl} target="_blank" rel="noopener noreferrer">
          <span className="key">2</span>
          {t(UI.askForce)}
          <span className="sr-only"> {t(UI.newTab)}</span>
        </a>
      </div>
    </div>
  );
}

/** How many lines of the journal are on show, right above the next question. */
const JOURNAL_LINES = 10;

/**
 * The last lines of the journal, right above the next question. The ones the
 * last move wrote are lit; the older ones are there for context.
 */
function JustNow({ turn }: { turn: Turn }) {
  const { t } = useLang();
  const { state, prev } = turn;
  // On a run just started or resumed, the last line counts as new.
  const written = Math.min(prev ? state.logCount - prev.logCount : 1, state.log.length);
  const fresh = state.log.slice(state.log.length - written);
  // With more news than room, keep what the move itself did and the latest ones.
  const lines =
    written > JOURNAL_LINES
      ? [fresh[0], ...fresh.slice(-(JOURNAL_LINES - 1))].map((entry) => ({ entry, isNew: true }))
      : state.log.slice(-JOURNAL_LINES).map((entry, i, shown) => ({
          entry,
          isNew: i >= shown.length - written,
        }));
  if (lines.length === 0) return null;
  return (
    <ul aria-label={t(UI.justNow)}>
      {lines.map(({ entry, isNew }, i) => (
        <li key={i} className={`log log-${entry.tone} ${isNew ? "log-new" : "log-old"}`}>
          {t(entry.text)}
        </li>
      ))}
    </ul>
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
  const [fasting, setFasting] = useState(false);
  // The result of an event stays on screen until acknowledged.
  const [acked, setAcked] = useState(-1);
  const showResult = !!state.eventResult && acked !== turn.n;
  const over = !!state.outcome && !showResult;
  const ack = useCallback(() => setAcked(turn.n), [turn.n]);
  const forceLink = useRef<HTMLAnchorElement>(null);

  // A card can land under a finger already on its way to a button. Its
  // choices open a moment after it appears, so it is never answered unread.
  const [armedFor, setArmedFor] = useState(-1);
  useEffect(() => {
    if (state.phase !== "event") return;
    const id = window.setTimeout(() => setArmedFor(turn.n), ARMING);
    return () => window.clearTimeout(id);
  }, [state.phase, turn.n]);
  const armed = armedFor === turn.n;
  const urgent = state.phase === "event" && !!eventCard(state.pendingEvent!).urgent && !showResult;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const confirm = e.key === "Enter";
      // A digit held down answers one question, not the ones that follow it.
      const n = /^[1-9]$/.test(e.key) && !e.repeat ? Number(e.key) : 0;
      // A single button is always 1, like the first of several.
      if (showResult) {
        if (confirm || n === 1) ack();
        return;
      }
      if (state.outcome) return;
      if (state.phase === "report") {
        // Enter on a link follows the link: it does not also close the month.
        if (confirm && target?.closest("a")) return;
        if (confirm || n === 1) play({ t: "ok" });
        else if (n === 2) forceLink.current?.click();
        return;
      }
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
        const choice = shownChoices(state)[n - 1];
        if (armed && choice?.enabled) play({ t: "choice", id: choice.index });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, showResult, ack, play, armed]);

  const today = dateOf(state.day);
  const rentIn = today.daysInMonth - today.dayOfMonth;
  const aperoIn = daysToApero(state.day);
  const slots = slotsToday(state);
  const who = character(state.character);
  const latest = state.log[state.log.length - 1];
  // The move just played was the apéro: the room shows the evening at the bar.
  const lastMove = state.history[state.history.length - 1];
  const wentOut = !!turn.prev && !state.outcome && lastMove?.t === "act" && lastMove.id === "apero";
  const roomLabel =
    lang === "fr"
      ? `Le studio de ${who.name.split(" ")[0]}, à Lille`
      : `${who.name.split(" ")[0]}'s studio flat in Lille`;

  return (
    <div className="page play">
      <header className="bar">
        <div className="bar-left">
          <Brand as="h1" />
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
        {/* On the left, what you do: what came of the last moves, then the question. */}
        {/* Each urgent card makes its own entrance, even right after another one. */}
        <section
          key={urgent ? `urgent-${turn.n}` : "panel"}
          className={urgent ? "card panel panel-urgent" : "card panel"}
        >
          {/* The space is kept even when empty, so the question does not jump. */}
          {/* Always on show, even over the result of a card. */}
          <div className="just-now">
            <JustNow key={turn.n} turn={turn} />
          </div>
          {showResult ? (
            <ResultPanel state={state} onContinue={ack} />
          ) : state.phase === "idea" ? (
            <IdeaPanel state={state} play={play} />
          ) : state.phase === "meal" ? (
            <MealPanel state={state} play={play} onFasting={setFasting} />
          ) : state.phase === "event" ? (
            <EventPanel
              key={turn.n}
              state={state}
              play={play}
              armed={armed}
            />
          ) : state.phase === "report" ? (
            <ReportPanel state={state} play={play} forceLink={forceLink} />
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
            <Room
              state={state}
              preview={preview}
              fasting={fasting && state.phase === "meal"}
              cheer={cueOf(turn) === "customer" ? turn.n : 0}
              apero={wentOut ? turn.n : 0}
              label={roomLabel}
            />
          </section>

          {state.chef && (
            <aside className="chef">
              <Portrait who="chef" className="portrait portrait-md" />
              <p>
                <strong>Chef</strong> {t(state.chef)}
              </p>
            </aside>
          )}

          {/* The day of the apéro, the real one is one click away. */}
          {aperoIn === 0 && !over && (
            <aside className="invite">
              <p>{t(UI.aperoReal)}</p>
              <a className="btn btn-small" href={LUMA} target="_blank" rel="noopener noreferrer">
                {t(UI.aperoJoin)}
                <span className="sr-only"> {t(UI.newTab)}</span>
              </a>
            </aside>
          )}

          <Gauges turn={turn} />
          <ProjectCard state={state} />
        </div>

      </main>

      {over && <End state={state} attempts={attempts} onRetry={onRetry} onHome={onHome} />}
    </div>
  );
}
