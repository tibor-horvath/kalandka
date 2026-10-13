import type { Progress } from './progress';

// Daily screen-time limit and rest rules set in the parents' area.
// Only active play counts (app visible, parents' area closed); the count starts again each day.

/** Minutes per day; 0 means no limit. */
export const LIMIT_OPTIONS = [0, 10, 15, 20, 30, 45, 60];
/** Evening rest can start at these hours; it lasts until MORNING_HOUR. */
export const EVENING_OPTIONS = [18, 19, 20];
export const MORNING_HOUR = 7;
/** Show the "2 more minutes" warning from this many seconds left. */
export const WARN_SECONDS = 120;
/** After the limit, a child in the middle of a task gets this long to finish it. */
export const GRACE_SECONDS = 120;
/** How much the "+10 perc ma" button adds. */
export const BONUS_SECONDS = 600;
/** Days of play history kept for the weekly chart. */
export const HISTORY_DAYS = 14;

/** Local calendar day, e.g. "2026-10-12". */
export function today(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A new day starts from zero. */
export function rollDay(p: Progress, day: string): Progress {
  return p.playDate === day ? p : { ...p, playDate: day, playSeconds: 0, bonusSeconds: 0 };
}

/** Keeps the newest HISTORY_DAYS days. Day keys sort as dates. */
function prune(history: Record<string, number>): Record<string, number> {
  const keys = Object.keys(history).sort();
  return Object.fromEntries(keys.slice(-HISTORY_DAYS).map((k) => [k, history[k]]));
}

export function addPlay(p: Progress, seconds: number, day: string): Progress {
  const q = rollDay(p, day);
  const history = prune({ ...q.playHistory, [day]: (q.playHistory[day] ?? 0) + seconds });
  return { ...q, playSeconds: q.playSeconds + seconds, playHistory: history };
}

/** "+10 perc ma": more time today, and it lifts a "Pihenő most" set earlier today. */
export function addBonus(p: Progress, day: string): Progress {
  const q = rollDay(p, day);
  return { ...q, bonusSeconds: q.bonusSeconds + BONUS_SECONDS, restDay: q.restDay === day ? '' : q.restDay };
}

/** "Pihenő most": no more play today. */
export function restNow(p: Progress, day: string): Progress {
  return { ...p, restDay: day };
}

export function playedToday(p: Progress, day: string): number {
  return p.playDate === day ? p.playSeconds : 0;
}

/** Seconds of play left today; Infinity when there is no limit. "Pihenő most" makes it 0. */
export function remainingSeconds(p: Progress, day: string): number {
  if (p.restDay === day) return 0;
  if (!p.screenLimitMin) return Infinity;
  const bonus = p.playDate === day ? p.bonusSeconds : 0;
  return Math.max(0, p.screenLimitMin * 60 + bonus - playedToday(p, day));
}

/** Evening rest: from the chosen hour until 7 in the morning. */
export function isEveningRest(p: Progress, now = new Date()): boolean {
  if (!p.eveningRest) return false;
  const h = now.getHours();
  return h >= p.eveningFrom || h < MORNING_HOUR;
}

export interface DayPlay {
  day: string;
  /** Short Hungarian weekday: H, K, Sze, Cs, P, Szo, V. */
  label: string;
  minutes: number;
}

const WEEKDAYS = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

/** The last seven days, oldest first, today last. */
export function lastSevenDays(p: Progress, now = new Date()): DayPlay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = today(d);
    return { day: key, label: WEEKDAYS[d.getDay()], minutes: Math.round((p.playHistory[key] ?? 0) / 60) };
  });
}

/** "12 perc"; under a minute shows as "kevesebb mint 1 perc". */
export function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m < 1 ? 'kevesebb mint 1 perc' : `${m} perc`;
}

/** "ma", "tegnap", "5 napja" for the last day with play in the history; null if none is kept. */
export function lastPlayed(p: Progress, now = new Date()): string | null {
  const days = Object.keys(p.playHistory).filter((k) => p.playHistory[k] > 0).sort();
  const last = days.at(-1);
  if (!last) return null;
  const [y, m, d] = last.split('-').map(Number);
  const ago = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000);
  return ago <= 0 ? 'ma' : ago === 1 ? 'tegnap' : `${ago} napja`;
}
