import { rng } from '../../../lib/rng';
import { durationWords, minutesBetween, timeWords, type ClockTime } from '../../../lib/time';
import { capital } from './activities';
import { SHOW_AFTER, say, seedOf, shuffle, type Say } from './common';

// Kakuk alszik: how much time went by. Kakuk lay down at one time and woke at another; the child says how
// long he slept. One to three hours first, then up to five, then over the twelve, then half hours.

export interface SleepLevel {
  name: string;
  /** Whole hours slept, smallest and largest. */
  min: number;
  max: number;
  /** The nap may run over twelve o'clock. */
  overTwelve: boolean;
  /** Half hours: the times and the answer move in half hours. */
  halves?: boolean;
}

export const SLEEP_LEVELS: SleepLevel[] = [
  { name: 'Egy-három óra', min: 1, max: 3, overTwelve: false },
  { name: 'Ötig', min: 2, max: 5, overTwelve: false },
  { name: 'Át a tizenkettőn', min: 2, max: 5, overTwelve: true },
  { name: 'Fél órák', min: 1, max: 4, overTwelve: false, halves: true }
];

export interface SleepRound {
  level: SleepLevel;
  from: ClockTime;
  to: ClockTime;
  /** Minutes slept. */
  minutes: number;
  /** The cards, as minutes; `answer` is the right one's index. */
  choices: number[];
  answer: number;
}

export function buildSleepRound(level: number, round: number): SleepRound {
  const l = SLEEP_LEVELS[Math.max(0, Math.min(SLEEP_LEVELS.length - 1, level))];
  const rand = rng(seedOf(6, level, round));
  const step = l.halves ? 30 : 60;
  const spans: number[] = [];
  for (let m = l.min * 60; m <= l.max * 60; m += step) if (!l.halves || m % 60 !== 0 || rand() < 0.4) spans.push(m);
  const minutes = spans[Math.floor(rand() * spans.length)];
  // The start: a whole (or half) hour from which the nap does, or does not, run over twelve.
  const starts: ClockTime[] = [];
  for (let h = 1; h <= 12; h++) {
    for (const m of l.halves ? [0, 30] : [0]) {
      const startMin = (h % 12) * 60 + m;
      const over = startMin + minutes > 720;
      if (over === l.overTwelve) starts.push({ h, m });
    }
  }
  const from = starts[Math.floor(rand() * starts.length)];
  const end = ((from.h % 12) * 60 + from.m + minutes) % 720;
  const to: ClockTime = { h: Math.floor(end / 60) || 12, m: end % 60 };
  const near = [minutes - step, minutes + step, minutes + 2 * step].filter((m) => m > 0 && m !== minutes);
  const cards = shuffle([minutes, ...shuffle(near, rand).slice(0, 2)], rand);
  return { level: l, from, to, minutes, choices: cards, answer: cards.indexOf(minutes) };
}

/** A card: "2 óra", "másfél óra". */
export function cardText(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} óra` : durationWords(minutes);
}

export function sleepStart(r: SleepRound): Say {
  return say(`${capital(timeWords(r.from))}kor lefeküdtem, ${timeWords(r.to)}kor felébredtem. Mennyit aludtam?`);
}

export function sleepWrong(r: SleepRound, wrong: number, misses: number): Say {
  if (misses >= SHOW_AFTER) return say(`Hoppá! ${capital(durationWords(r.minutes))} volt. Nézd, világít.`, 'think', 'oops');
  const more = r.choices[wrong] > r.minutes;
  const hint = r.level.halves ? 'Lépkedj a kis mutatóval egész órákat, a végén a fél órát is számold!' : 'Lépkedj a kis mutatóval a számlapon egyesével, és számold a lépéseket!';
  return say(`Hoppá! ${more ? 'Ennyit nem aludtam.' : 'Ennél többet aludtam.'} ${hint}`, 'think', 'oops');
}

export function sleepSolved(r: SleepRound): Say {
  return say(`Kakukk! ${capital(durationWords(r.minutes))} aludtam. Kipihentem magam!`, 'cheer', 'good');
}

/** The hours the hour hand steps over, one number each, from the start to the end (for "Mutasd!"). */
export function hourSteps(r: SleepRound): number[] {
  const hours = Math.floor(minutesBetween({ h: r.from.h, m: 0 }, { h: r.to.h, m: 0 }) / 60);
  return Array.from({ length: hours }, (_, i) => (((r.from.h + i) % 12) + 1));
}

