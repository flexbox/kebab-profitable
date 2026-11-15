/** The in-game calendar. Day 1 is Friday 1 January 2027. */

const START_YEAR = 2027;

export interface GameDate {
  year: number;
  /** 1..12 */
  month: number;
  /** 1..31 */
  dayOfMonth: number;
  /** 0 = Monday .. 6 = Sunday */
  weekday: number;
  daysInMonth: number;
}

export function dateOf(day: number): GameDate {
  const d = new Date(Date.UTC(START_YEAR, 0, day));
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  return {
    year,
    month: month + 1,
    dayOfMonth: d.getUTCDate(),
    weekday: (d.getUTCDay() + 6) % 7,
    daysInMonth: new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
  };
}

export function isLastDayOfMonth(day: number): boolean {
  const d = dateOf(day);
  return d.dayOfMonth === d.daysInMonth;
}

/** The monthly apéro at Le Charlatan is held on the third Thursday. */
export function isAperoDay(day: number): boolean {
  const d = dateOf(day);
  return d.weekday === 3 && d.dayOfMonth >= 15 && d.dayOfMonth <= 21;
}

/** Days until the next apéro, 0 if it is today. */
export function daysToApero(day: number): number {
  for (let i = 0; i < 40; i++) if (isAperoDay(day + i)) return i;
  return -1;
}

export const SLOT_COUNT = 3;
