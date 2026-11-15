"use client";

import { useEffect, useState } from "react";
import { character } from "@/game";
import { UI } from "@/i18n/strings";
import { fetchBoard, type Board, type ScoreEntry } from "@/lib/api";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";

type Tab = "today" | "allTime";

export function Leaderboard({
  seed,
  board: given,
  highlight,
}: {
  seed: string;
  /** A board already in hand (after submitting a score). */
  board?: Board;
  /** The name to highlight. */
  highlight?: string;
}) {
  const { t } = useLang();
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
  return (
    <div className="board">
      <div className="seg" role="tablist">
        {(["today", "allTime"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "seg-on" : ""}
            onClick={() => setTab(id)}
          >
            {t(id === "today" ? UI.today : UI.allTime)}
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
                <th>{t(UI.pseudo)}</th>
                <th>{t(UI.who)}</th>
                <th className="num">{t(UI.days)}</th>
                <th className="num">{t(UI.tries)}</th>
                {tab === "allTime" && <th>{t(UI.date)}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.seed}-${row.pseudo}`}
                  className={highlight && row.pseudo === highlight ? "me" : ""}
                >
                  <td className="num">{i + 1}</td>
                  <td>{row.pseudo}</td>
                  <td>
                    <span className="who-cell">
                      <Portrait who={row.character} className="portrait portrait-xs" />
                      {character(row.character).name.split(" ")[0]}
                    </span>
                  </td>
                  <td className="num">{row.days}</td>
                  <td className="num">{row.attempts}</td>
                  {tab === "allTime" && <td>{row.seed}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
