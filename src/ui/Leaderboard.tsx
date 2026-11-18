"use client";

import { useEffect, useState } from "react";
import { character } from "@/game";
import { UI } from "@/i18n/strings";
import { fetchBoard, type Board, type BoardDay, type ScoreEntry } from "@/lib/api";
import { pseudoKey } from "@/lib/pseudo";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";

type Tab = "today" | "allTime";

export function Leaderboard({
  seed,
  board: given,
  day = "today",
  highlight,
}: {
  seed: string;
  /** A board already in hand (after submitting a score). */
  board?: Board;
  /** Which day the seed is: a run finished after midnight shows yesterday's board. */
  day?: BoardDay;
  /** The name to highlight. */
  highlight?: string;
}) {
  const { t, euro } = useLang();
  const [tab, setTab] = useState<Tab>("today");
  const [loaded, setLoaded] = useState<{ seed: string; board: Board | "error" } | null>(null);

  useEffect(() => {
    if (given) return;
    let alive = true;
    fetchBoard(seed)
      .then((board) => alive && setLoaded({ seed, board }))
      .catch(() => alive && setLoaded({ seed, board: "error" }));
    return () => {
      alive = false;
    };
  }, [seed, given]);

  const board = given ?? (loaded?.seed === seed ? loaded.board : null);
  if (board === null) return <p className="muted">{t(UI.loadingScores)}</p>;
  if (board === "error") return <p className="muted">{t(UI.errors.network)}</p>;
  if (board.offline) return <p className="muted">{t(UI.errors.offline)}</p>;

  const rows: ScoreEntry[] = board[tab];
  // "Karl" and "karl" are one player: the row may carry an older spelling.
  const me = highlight ? pseudoKey(highlight) : null;
  return (
    <div className="board">
      <div className="seg" role="group" aria-label={t(UI.leaderboard)}>
        {(["today", "allTime"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className={tab === id ? "seg-on" : ""}
            onClick={() => setTab(id)}
          >
            {t(id === "allTime" ? UI.allTime : day === "today" ? UI.today : UI.yesterday)}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="muted">{t(UI.noScores)}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="num">{t(UI.rank)}</th>
                <th>{t(UI.player)}</th>
                <th className="num">{t(UI.days)}</th>
                <th className="num">{t(UI.cash)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.seed}-${row.pseudo}`}
                  className={me !== null && pseudoKey(row.pseudo) === me ? "me" : ""}
                >
                  <td className="num">{i + 1}</td>
                  {/* One cell for the player: the name they chose, then who they played
                      (and which day, on the all-time board). It stays readable on a phone. */}
                  <td>
                    <span className="who-cell">
                      <Portrait who={row.character} className="portrait portrait-xs" />
                      <span className="who-text">
                        <span className="who-pseudo">{row.pseudo}</span>
                        <span className="who-meta">
                          {character(row.character).name.split(" ")[0]}
                          {tab === "allTime" && ` · ${row.seed}`}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="num">{row.days}</td>
                  <td className="num">{euro(row.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
