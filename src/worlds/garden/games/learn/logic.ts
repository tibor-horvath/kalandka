import { article, numberAttr, numberCount } from '../../../../lib/numbers';
import type { Mood, Tone } from '../../../../lib/types';
import { layoutSeeds, type SeedPos } from '../flash/layout';
import { rng } from '../../../../lib/rng';

// Számmagok: meet the numbers 1–20 in order. No timer: tap each seed, Csepi counts,
// then the numeral, its dots and its word appear. Five stages: 1–5, 6–10, 11–15, 16–20, and
// Vegyesen, where five numbers from 1–20 come mixed and the child finds the numeral after counting.

export const LEARN_MAX = 20;
/** Rounds in a stage: five numbers, and five mixed rounds in Vegyesen. */
export const LEARN_STAGE = 5;
/** Rounds of the Vegyesen stage, after 1–20. */
export const LEARN_MIX_ROUNDS = 5;
/** One lap: 1–20 in order, then the mixed rounds; then it starts again at 1. */
export const LEARN_CYCLE = LEARN_MAX + LEARN_MIX_ROUNDS;
/** Villámszem opens once the child has met 1–5 here. */
export const UNLOCK_FLASH_AFTER = 5;

export interface LearnRound {
  count: number;
  seeds: SeedPos[];
  /** Vegyesen: after counting, the child picks the numeral from these three, ascending. */
  choices?: number[];
}

/** The five numbers of a lap's Vegyesen stage: different each lap, never two the same. */
export function mixNumbers(lap: number): number[] {
  const rand = rng(Math.max(0, Math.floor(lap)) * 53 + 211);
  const pool = Array.from({ length: LEARN_MAX }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, LEARN_MIX_ROUNDS);
}

/** The right number and two close to it (one or two away), all within 1–20, ascending. */
export function mixChoices(count: number, round: number): number[] {
  const rand = rng(round * 17 + 5);
  const near = [count - 2, count - 1, count + 1, count + 2].filter((n) => n >= 1 && n <= LEARN_MAX);
  const picked: number[] = [];
  while (picked.length < 2) {
    const n = near[Math.floor(rand() * near.length)];
    if (!picked.includes(n)) picked.push(n);
  }
  return [count, ...picked].sort((a, b) => a - b);
}

/** Rounds go 1, 2, … 20, then five mixed numbers, and then start again at 1. */
export function buildLearnRound(round: number): LearnRound {
  const r = Math.max(0, Math.floor(round));
  const at = r % LEARN_CYCLE;
  if (at < LEARN_MAX) {
    const count = at + 1;
    return { count, seeds: layoutSeeds(count, 'dice', rng(r + 101)) };
  }
  const count = mixNumbers(Math.floor(r / LEARN_CYCLE))[at - LEARN_MAX];
  return { count, seeds: layoutSeeds(count, 'dice', rng(r + 101)), choices: mixChoices(count, r) };
}

export { article } from '../../../../lib/numbers';

export interface LearnFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export const LEARN_READY: LearnFeedback = {
  text: 'Koppints minden magra, és számoljuk meg együtt!',
  speech: 'Koppints minden magra, és számoljuk meg együtt!',
  mood: 'smile',
  tone: 'plain'
};

export const LEARN_MIX_READY: LearnFeedback = {
  text: 'Koppints minden magra, és számoljuk meg! Aztán keresd meg a számot.',
  speech: 'Koppints minden magra, és számoljuk meg együtt! Aztán keresd meg, melyik szám ez.',
  mood: 'smile',
  tone: 'plain'
};

/** Vegyesen, every seed counted: which numeral is it? */
export const LEARN_MIX_ASK: LearnFeedback = {
  text: 'Melyik szám ez? Koppints rá!',
  speech: 'Melyik szám ez? Koppints rá!',
  mood: 'think',
  tone: 'plain'
};

/** Vegyesen, a wrong numeral: name it, and say again how many seeds there were. */
export function mixWrongFeedback(picked: number, count: number): LearnFeedback {
  const word = numberCount(picked);
  return {
    text: `Ez ${article(word)} ${picked}. Mi ${count} magot számoltunk. Keresd meg!`,
    speech: `Ez ${article(word)} ${word}. Mi ${numberAttr(count)} magot számoltunk. Keresd meg!`,
    mood: 'think',
    tone: 'oops'
  };
}

/** After the child has tapped every seed: name the number. */
export function learnedFeedback(count: number): LearnFeedback {
  const word = numberCount(count); // "kettő": the number on its own
  const attr = numberAttr(count); // "két": before a noun
  const Attr = attr[0].toUpperCase() + attr.slice(1);
  return {
    text: `${count} mag. Ez ${article(word)} ${count}!`,
    speech: `${Attr} mag. Ez ${article(word)} ${word}!`,
    mood: 'cheer',
    tone: 'good'
  };
}

/** Csepi's line when the locked Villámszem card is tapped. */
export function flashLockedSpeech(learned: number): string {
  const left = Math.max(1, UNLOCK_FLASH_AFTER - learned);
  return `Ez a kertrész még alszik. Ismerj meg még ${numberAttr(left)} számot a Számmagokban, és kinyílik!`;
}
