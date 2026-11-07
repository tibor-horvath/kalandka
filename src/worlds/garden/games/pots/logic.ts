import { article, capitalize, numberAttr, numberCount } from '../../../../lib/numbers';
import type { Mood, Tone } from '../../../../lib/types';
import { rng } from '../../../../lib/rng';

// Cserépbarátok: a window box of five or ten pots, some already in bloom. How many more fill the box?
// The child finds the number friends of five and ten ("3 and 7 make 10"); tapping the empty pots counts them.

/** Cserépbarátok opens once the child has met all ten numbers in Számmagok (or a parent opens everything). */
export const UNLOCK_POTS_AFTER = 10;
export const POTS_ROUNDS_PER_LEVEL = 5;

export interface PotsLevel {
  /** Shown to parents. */
  name: string;
  /** Pots in the box: the number both groups make together. */
  total: 5 | 10;
  /** Flowering pots fill the box in reading order, or stand anywhere. */
  scattered: boolean;
  /** Dot pictures under the numerals on the answer buttons. */
  dotChoices: boolean;
}

export const POTS_LEVELS: PotsLevel[] = [
  { name: 'Ötös barátok', total: 5, scattered: false, dotChoices: true },
  { name: 'Tízes barátok, sorban', total: 10, scattered: false, dotChoices: true },
  { name: 'Tízes barátok, szórva', total: 10, scattered: true, dotChoices: false }
];

/** Five solved rounds per level, then the next level. */
export function potsLevelFor(solved: number): PotsLevel {
  return POTS_LEVELS[Math.min(POTS_LEVELS.length - 1, Math.floor(Math.max(0, solved) / POTS_ROUNDS_PER_LEVEL))];
}

// The box: pots in rows of five, like a ten-frame.
export const POT_STEP = 128;
export const POT_ROW_H = 150;
const PAD_X = 24;
const PAD_Y = 14;

export interface PotCell {
  x: number;
  y: number;
}

export function boxSize(total: number): { width: number; height: number } {
  return { width: PAD_X * 2 + 5 * POT_STEP, height: PAD_Y * 2 + Math.ceil(total / 5) * POT_ROW_H };
}

/** Centre of each pot, row by row. */
export function potCells(total: number): PotCell[] {
  return Array.from({ length: total }, (_, i) => ({
    x: PAD_X + (i % 5) * POT_STEP + POT_STEP / 2,
    y: PAD_Y + Math.floor(i / 5) * POT_ROW_H + POT_ROW_H / 2
  }));
}

/** Petal colours for the flowers already there; the new friends bloom in the paired colour. */
const PETAL_PAIRS: [string, string][] = [
  ['#E8577D', '#FFC93C'],
  ['#B83D8F', '#FF9F43'],
  ['#9E2A4A', '#F8BBD0'],
  ['#FF7043', '#FFFFFF']
];

export interface PotsRound {
  level: PotsLevel;
  total: number;
  /** Pots already in bloom. */
  have: number;
  /** The answer: empty pots, have + need = total. */
  need: number;
  /** One flag per pot: true when it already flowers. */
  filled: boolean[];
  /** Three distinct answers, ascending, one of them correct. */
  choices: number[];
  petal: string;
  friendPetal: string;
}

/** A round on this level (0-based; the level comes from the game's ladder, see state/ladder.ts). */
export function buildPotsRound(round: number, levelIndex: number): PotsRound {
  const level = POTS_LEVELS[Math.max(0, Math.min(POTS_LEVELS.length - 1, levelIndex))];
  const total = level.total;
  const rand = rng(round + 101);
  const have = 1 + Math.floor(rand() * (total - 1));
  const need = total - have;

  let filled = Array.from({ length: total }, (_, i) => i < have);
  if (level.scattered) {
    const order = Array.from({ length: total }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const on = new Set(order.slice(0, have));
    filled = filled.map((_, i) => on.has(i));
  }

  const candidates = [need - 2, need - 1, need + 1, need + 2].filter((n) => n >= 1 && n <= total - 1);
  const picks: number[] = [];
  while (picks.length < 2 && candidates.length > 0) {
    picks.push(candidates.splice(Math.floor(rand() * candidates.length), 1)[0]);
  }
  const choices = [need, ...picks].sort((a, b) => a - b);
  const [petal, friendPetal] = PETAL_PAIRS[Math.max(0, Math.floor(round)) % PETAL_PAIRS.length];

  return { level, total, have, need, filled, choices, petal, friendPetal };
}

export interface PotsFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

/** "ötös barátok" / "tízes barátok" */
function friends(total: number): string {
  return total === 5 ? 'ötös barátok' : 'tízes barátok';
}

/** "mind az öt cserép" spoken, "mind az 5 cserép" written: the article follows the spoken word. */
function allPots(total: number, written: boolean): string {
  const w = numberAttr(total);
  return `mind ${article(w)} ${written ? total : w} cserép`;
}

export function askFeedback(r: PotsRound): PotsFeedback {
  return {
    text: `${r.have} virág már nyílik. Hány kell még, hogy ${allPots(r.total, true)} virágos legyen?`,
    speech: `${capitalize(numberAttr(r.have))} virág már nyílik. Hány virág kell még, hogy ${allPots(r.total, false)} virágos legyen? Ha kell, koppints az üres cserepekre, és megszámoljuk!`,
    mood: 'smile',
    tone: 'plain'
  };
}

/** Every empty pot is tapped and counted: now pick the number. */
export function countedFeedback(r: PotsRound): PotsFeedback {
  return {
    text: `Megszámoltad az üres cserepeket! Hány virág kell még?`,
    speech: `${capitalize(numberCount(r.need))}! Hány virág kell még?`,
    mood: 'think',
    tone: 'plain'
  };
}

export function rightFeedback(r: PotsRound): PotsFeedback {
  return {
    text: `Igen! ${r.have} + ${r.need} = ${r.total}. Ők ${friends(r.total)}!`,
    speech: `Igen! ${capitalize(numberCount(r.have))} meg ${numberCount(r.need)}, az ${numberCount(r.total)}. Ők ${friends(r.total)}!`,
    mood: 'cheer',
    tone: 'good'
  };
}

/** A wrong pick: Csepi counts the empty pots with the child; no "wrong" word. */
export function revealFeedback(r: PotsRound): PotsFeedback {
  const counting = Array.from({ length: r.need }, (_, i) => numberCount(i + 1)).join(', ');
  return {
    text: 'Hoppá! Számoljuk meg együtt az üres cserepeket!',
    speech: `Hoppá! Számoljuk meg együtt az üres cserepeket! ${capitalize(counting)}.`,
    mood: 'oops',
    tone: 'oops'
  };
}

/** Csepi's line when the locked Cserépbarátok plot is tapped. */
export function potsLockedSpeech(learned: number): string {
  const left = Math.max(1, UNLOCK_POTS_AFTER - learned);
  return `Ez a kertrész még alszik. Ismerj meg még ${numberAttr(left)} számot a Számmagokban, és kinyílik!`;
}
