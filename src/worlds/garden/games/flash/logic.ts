import { numberAttr, numberCount } from '../../../../lib/numbers';
import type { Mood, Tone } from '../../../../lib/types';
import { rng } from '../../../../lib/rng';
import { frameCells, layoutSeeds, type Layout, type SeedPos } from './layout';

// Villámszem: seeds show for a few seconds, then the child says how many (subitizing).
// It opens once the child has met the numbers 1–5 in Számmagok.

export { FIELD_H, FIELD_W, diceFace, foldSeeds, frameCells } from './layout';

export interface Level {
  /** Shown to parents. */
  name: string;
  min: number;
  max: number;
  layout: Layout;
  /** How long the seeds stay uncovered. Long enough for 5-year-olds; the child can always peek again. */
  flashMs: number;
  /** Show dot pictures under the numerals on the answer buttons. */
  dotChoices: boolean;
}

export const LEVELS: Level[] = [
  { name: '1–3, kockaminta', min: 1, max: 3, layout: 'dice', flashMs: 3000, dotChoices: true },
  { name: '1–5, kockaminta', min: 1, max: 5, layout: 'dice', flashMs: 2500, dotChoices: true },
  { name: '1–5, szórva', min: 1, max: 5, layout: 'scatter', flashMs: 2500, dotChoices: false },
  { name: '6–10, csoportban', min: 6, max: 10, layout: 'groups', flashMs: 3000, dotChoices: false },
  { name: '6–10, tízes keretben', min: 6, max: 10, layout: 'frame', flashMs: 3000, dotChoices: false },
  { name: '11–20, tízes keretben', min: 11, max: 20, layout: 'frame', flashMs: 3000, dotChoices: false }
];

export const FLASH_ROUNDS_PER_LEVEL = 4;

/** Four solved rounds per level, then the next level. */
export function levelFor(solved: number): Level {
  return LEVELS[Math.min(LEVELS.length - 1, Math.floor(Math.max(0, solved) / FLASH_ROUNDS_PER_LEVEL))];
}

export interface FlashRound {
  count: number;
  level: Level;
  seeds: SeedPos[];
  /** Three distinct answers, ascending, one of them correct. */
  choices: number[];
  /** Frame levels: every space of the ten-frames, drawn empty under the seeds. */
  cells?: SeedPos[];
}

/** A round on this level (0-based; the level comes from the game's ladder, see state/ladder.ts). */
export function buildFlashRound(round: number, levelIndex: number): FlashRound {
  const level = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, levelIndex))];
  const rand = rng(round + 1);
  const count = level.min + Math.floor(rand() * (level.max - level.min + 1));
  const seeds = layoutSeeds(count, level.layout, rand);

  const candidates = [count - 2, count - 1, count + 1, count + 2].filter((n) => n >= Math.max(1, level.min - 1) && n <= level.max + 1);
  const picks: number[] = [];
  while (picks.length < 2 && candidates.length > 0) {
    picks.push(candidates.splice(Math.floor(rand() * candidates.length), 1)[0]);
  }
  const choices = [count, ...picks].sort((a, b) => a - b);

  return level.layout === 'frame' ? { count, level, seeds, choices, cells: frameCells(count) } : { count, level, seeds, choices };
}

export interface FlashFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export const READY: FlashFeedback = {
  text: 'Figyelj jól! Megmutatom a magokat, aztán eltakarom őket.',
  speech: 'Figyelj jól! Megmutatom a magokat, aztán eltakarom őket.',
  mood: 'smile',
  tone: 'plain'
};

export const ASK: FlashFeedback = {
  text: 'Hány magot láttál? Ha kell, megmutatom újra.',
  speech: 'Hány magot láttál?',
  mood: 'think',
  tone: 'plain'
};

export function rightFeedback(count: number): FlashFeedback {
  return {
    text: `Igen! ${count} magot láttál. Kikeltek!`,
    speech: `Igen! ${numberAttr(count)} magot láttál. Kikeltek!`,
    mood: 'cheer',
    tone: 'good'
  };
}

/**
 * A wrong answer uncovers the seeds and counts them together; no "wrong" word. In a ten-frame Csepi reads
 * its shape instead: a full row or a full ten, and how many more.
 */
export function revealFeedback(count: number, framed = false): FlashFeedback {
  if (framed && count > 5) {
    const ten = count > 10;
    const more = count - (ten ? 10 : 5);
    return {
      text: `Nézzük meg újra együtt! ${ten ? 'Egy teli tízes' : '5 az első sorban,'} meg még ${more}: ez ${count}.`,
      speech: `Nézzük meg újra együtt! ${ten ? 'Egy teli tízes' : 'Öt az első sorban,'} meg még ${numberAttr(more)}: ez ${numberCount(count)}.`,
      mood: 'oops',
      tone: 'oops'
    };
  }
  const counting = Array.from({ length: count }, (_, i) => numberCount(i + 1)).join(', ');
  return {
    text: 'Nézzük meg újra együtt! Számold meg a magokat.',
    speech: `Nézzük meg újra együtt! ${counting}.`,
    mood: 'oops',
    tone: 'oops'
  };
}
