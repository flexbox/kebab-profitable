"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { L, Lang } from "@/game/types";
import { euro, gameDate, tr } from "@/i18n/format";
import { store } from "@/lib/storage";

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translates a bilingual text. */
  t: (text: L) => string;
  euro: (amount: number) => string;
  date: (day: number) => string;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // The game is French, whatever the browser speaks: English is only for
  // someone who picked it. That choice is applied right after mount, so the
  // first render matches the server.
  useEffect(() => {
    const saved = store.lang();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    store.setLang(next);
    setLangState(next);
  }, []);

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (text) => tr(text, lang),
      euro: (amount) => euro(amount, lang),
      date: (day) => gameDate(day, lang),
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error("useLang must be used inside LangProvider");
  return value;
}
