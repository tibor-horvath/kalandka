import type { Progress } from './progress';
import { today } from './screenTime';

// What the parents' notes read: the last few solved tasks per game, each with its day and whether it needed help.
// Only for the parents' overview; nothing the child sees depends on it.

/** Games whose tasks can need help. Számvetés has no wrong answers, so it is not logged. */
export type LoggedGame = 'water' | 'patterns' | 'flash' | 'trace' | 'add' | 'pots' | 'path' | 'sort' | 'scale' | 'seq' | 'mirror';

/** One solved task: its day (YYYY-MM-DD) and 1 when it needed help. Kept short, as every save carries it. */
export interface TaskMark {
  d: string;
  h: 0 | 1;
}

export type TaskLog = Partial<Record<LoggedGame, TaskMark[]>>;

/** Marks kept per game. */
export const LOG_KEEP = 12;

/** Days the notes look back over, today included. */
export const LOG_DAYS = 7;

export function logTask(p: Progress, game: LoggedGame, helped: boolean, day = today()): Progress {
  const marks = [...(p.taskLog[game] ?? []), { d: day, h: helped ? 1 : 0 } as TaskMark].slice(-LOG_KEEP);
  return { ...p, taskLog: { ...p.taskLog, [game]: marks } };
}

/** The first day still inside the look-back window that ends on `day`. */
export function windowStart(day: string, days = LOG_DAYS): string {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d - (days - 1)));
}

/** This game's marks from the last LOG_DAYS days, oldest first. */
export function recentMarks(p: Progress, game: LoggedGame, day: string): TaskMark[] {
  const from = windowStart(day);
  return (p.taskLog[game] ?? []).filter((m) => m.d >= from && m.d <= day);
}

/**
 * Robot rounds hold several tasks; a round needed help when Csavar had to correct the child at least
 * this many times in it (one slip on a long belt is not help yet).
 */
export const ROUND_HELP_AFTER = 2;
