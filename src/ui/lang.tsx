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

export function LangProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? "fr");

  // The homepage prerenders in French. Shared links specify their own language.
  useEffect(() => {
    if (initialLang) return;
    const saved = store.lang();
    const detected: Lang = navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(saved ?? detected);
  }, [initialLang]);

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

  return (
    <LangContext.Provider value={value}>
      {initialLang ? <div lang={lang}>{children}</div> : children}
    </LangContext.Provider>
  );
}

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error("useLang must be used inside LangProvider");
  return value;
}
