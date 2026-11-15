import { dateOf } from "@/game/calendar";
import type { L, Lang } from "@/game/types";

/** French typography: non-breaking spaces before high punctuation and units. */
export function typo(text: string, lang: Lang): string {
  if (lang !== "fr") return text;
  return text
    .replace(/ ([?!;])/g, " $1")
    .replace(/ :/g, " :")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »")
    .replace(/(\d) (€|%|k€|j\b)/g, "$1 $2");
}

export function tr(text: L, lang: Lang): string {
  return typo(text[lang], lang);
}

export function euro(amount: number, lang: Lang): string {
  const n = Math.round(amount);
  const digits = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, lang === "fr" ? " " : ",");
  const sign = n < 0 ? "-" : "";
  return lang === "fr" ? `${sign}${digits} €` : `${sign}€${digits}`;
}

const WEEKDAYS: Record<Lang, string[]> = {
  fr: ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
const MONTHS: Record<Lang, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const MONTHS_LONG: Record<Lang, string[]> = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function gameDate(day: number, lang: Lang): string {
  const d = dateOf(day);
  const dom = lang === "fr" && d.dayOfMonth === 1 ? "1er" : String(d.dayOfMonth);
  return `${WEEKDAYS[lang][d.weekday]} ${dom} ${MONTHS[lang][d.month - 1]}`;
}

export function monthName(month: number, lang: Lang): string {
  return MONTHS_LONG[lang][month - 1];
}
