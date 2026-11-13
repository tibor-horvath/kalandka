import { article, capitalize, numberAttr, numberCount } from '../../../../lib/numbers';
import type { Mood, Tone } from '../../../../lib/types';
import { rng } from '../../../../lib/rng';

// Cserépbarátok: a window box of five or ten pots, some already in bloom. How many more fill the box?
// The child finds the number friends of five, ten, six to nine and twenty ("3 and 7 make 10"); tapping the empty
// pots counts them. On the last level a cover hides the box, so the friends of ten come from memory.

/** Cserépbarátok opens once the child has met all ten numbers in Számmagok (or a parent opens everything). */
export const UNLOCK_POTS_AFTER = 10;
export const POTS_ROUNDS_PER_LEVEL = 5;

export interface PotsLevel {
  /** Shown to parents. */
  name: string;
  /** Pots in the box: the number both groups make together. */
  total: number;
  /** Boxes of several sizes, one after the other round by round (in place of `total`). */
  totals?: number[];
  /** Fewest pots already in bloom: on the twenty level the first ten are always full. */
  minHave?: number;
  /** Flowering pots fill the box in reading order, or stand anywhere. */
  scattered: boolean;
  /** Dot pictures under the numerals on the answer buttons. */
  dotChoices: boolean;
  /** A cover hides the box until a wrong pick or the right one: the friends come from memory, not counting. */
  hidden?: boolean;
}

export const POTS_LEVELS: PotsLevel[] = [
  { name: 'Ötös barátok', total: 5, scattered: false, dotChoices: true },
  { name: 'Tízes barátok, sorban', total: 10, scattered: false, dotChoices: true },
  { name: 'Tízes barátok, szórva', total: 10, scattered: true, dotChoices: false },
  { name: 'Hatos–kilences barátok', total: 9, totals: [6, 7, 8, 9], scattered: false, dotChoices: false },
  { name: 'Húszas barátok', total: 20, minHave: 11, scattered: false, dotChoices: false },
  { name: 'Tízes barátok, letakarva', total: 10, scattered: false, dotChoices: false, hidden: true }
];

/** Levels with a printed sheet: all but the last, as paper cannot hide a box. */
export const POTS_SHEET_LEVELS = 5;


/** Five solved rounds per level, then the next level. */
export function potsLevelFor(solved: number): PotsLevel {
  return POTS_LEVELS[Math.min(POTS_LEVELS.length - 1, Math.floor(Math.max(0, solved) / POTS_ROUNDS_PER_LEVEL))];
}

// The box: pots in rows of five, like a ten-frame.
export const POT_STEP = 128;
export const POT_ROW_H = 150;
const PAD_X = 24;
const PAD_Y = 14;
/** Space between the two ten-frames of the twenty box. */
const FRAME_GAP = 64;
const FRAME_W = 5 * POT_STEP + FRAME_GAP;

export interface PotCell {
  x: number;
  y: number;
}

/** Twenty pots stand as two ten-frames side by side, so the box stays two rows high and the tens show apart. */
function frames(total: number): number {
  return Math.ceil(total / 10);
}

export function boxSize(total: number): { width: number; height: number } {
  const rows = total > 10 ? 2 : Math.ceil(total / 5);
  return { width: PAD_X * 2 + frames(total) * FRAME_W - FRAME_GAP, height: PAD_Y * 2 + rows * POT_ROW_H };
}

/** Centre of each pot, row by row, one ten-frame after the other. */
export function potCells(total: number): PotCell[] {
  return Array.from({ length: total }, (_, i) => {
    const j = i % 10;
    return {
      x: PAD_X + Math.floor(i / 10) * FRAME_W + (j % 5) * POT_STEP + POT_STEP / 2,
      y: PAD_Y + Math.floor(j / 5) * POT_ROW_H + POT_ROW_H / 2
    };
  });
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
  const total = level.totals ? level.totals[Math.max(0, Math.floor(round)) % level.totals.length] : level.total;
  const rand = rng(round + 101);
  const least = level.minHave ?? 1;
  const have = least + Math.floor(rand() * (total - least));
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

const FRIENDS: Record<number, string> = { 5: 'ötös', 6: 'hatos', 7: 'hetes', 8: 'nyolcas', 9: 'kilences', 10: 'tízes', 20: 'húszas' };

/** "ötös barátok" / "tízes barátok" / "húszas barátok" */
function friends(total: number): string {
  return `${FRIENDS[total]} barátok`;
}

/** "mind az öt cserép" spoken, "mind az 5 cserép" written: the article follows the spoken word. */
function allPots(total: number, written: boolean): string {
  const w = numberAttr(total);
  return `mind ${article(w)} ${written ? total : w} cserép`;
}

export function askFeedback(r: PotsRound): PotsFeedback {
  if (r.level.hidden) {
    return {
      text: `A takaró alatt ${r.have} virág nyílik. Hány kell még, hogy ${allPots(r.total, true)} virágos legyen?`,
      speech: `A takaró alatt ${numberAttr(r.have)} virág nyílik. Hány virág kell még, hogy ${allPots(r.total, false)} virágos legyen?`,
      mood: 'smile',
      tone: 'plain'
    };
  }
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
  const lead = r.level.hidden ? 'Hoppá! Vegyük le a takarót, és számoljuk meg együtt az üres cserepeket!' : 'Hoppá! Számoljuk meg együtt az üres cserepeket!';
  return {
    text: lead,
    speech: `${lead} ${capitalize(counting)}.`,
    mood: 'oops',
    tone: 'oops'
  };
}

/** Csepi's line when the locked Cserépbarátok plot is tapped. */
export function potsLockedSpeech(learned: number): string {
  const left = Math.max(1, UNLOCK_POTS_AFTER - learned);
  return `Ez a kertrész még alszik. Ismerj meg még ${numberAttr(left)} számot a Számmagokban, és kinyílik!`;
}
