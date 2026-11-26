"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { character } from "@/game";
import { UI } from "@/i18n/strings";
import { fetchBoard, type Board, type BoardDay, type ScoreEntry } from "@/lib/api";
import { pseudoKey } from "@/lib/pseudo";
import { useLang } from "./lang";
import { Portrait } from "./Portrait";

/** The day a run of this week was played: "mer." or "Wed". */
function weekday(seed: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${seed}T12:00:00Z`));
}

type Tab = "week" | "allTime";
const TABS: Tab[] = ["week", "allTime"];

function Rows({ rows, tab, me }: { rows: ScoreEntry[]; tab: Tab; me: string | null }) {
  const { t, euro, lang } = useLang();
  if (rows.length === 0) return <p className="muted">{t(UI.noScores)}</p>;
  return (
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
                  and which day. It stays readable on a phone. */}
              <td>
                <span className="who-cell">
                  <Portrait who={row.character} className="portrait portrait-xs" />
                  <span className="who-text">
                    <span className="who-pseudo">{row.pseudo}</span>
                    <span className="who-meta">
                      {character(row.character).name.split(" ")[0]}
                      {` · ${tab === "allTime" ? row.seed : weekday(row.seed, lang)}`}
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
  );
}

export function Leaderboard({
  seed,
  board: given,
  day = "thisWeek",
  highlight,
}: {
  seed: string;
  /** A board already in hand (after submitting a score). */
  board?: Board;
  /** Which week the seed is in: Sunday's run finished after midnight shows last week's board. */
  day?: BoardDay;
  /** The name to highlight. */
  highlight?: string;
}) {
  const { t } = useLang();
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

  // "Karl" and "karl" are one player: the row may carry an older spelling.
  const me = highlight ? pseudoKey(highlight) : null;
  return (
    <Tabs className="board" defaultValue="week">
      <TabsList className="seg" aria-label={t(UI.leaderboard)}>
        <TabsIndicator className="seg-indicator" />
        {TABS.map((id) => (
          <TabsTab key={id} value={id}>
            {t(id === "allTime" ? UI.allTime : day === "thisWeek" ? UI.thisWeek : UI.lastWeek)}
          </TabsTab>
        ))}
      </TabsList>
      {TABS.map((id) => (
        <TabsPanel key={id} value={id} className="board-panel">
          <Rows rows={board[id]} tab={id} me={me} />
        </TabsPanel>
      ))}
    </Tabs>
  );
}
