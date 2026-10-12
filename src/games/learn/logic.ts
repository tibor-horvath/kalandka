import { article, numberAttr, numberCount } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';
import { layoutSeeds, rng, type SeedPos } from '../flash/layout';

// Számvetés: meet the numbers 1–20 in order. No timer: tap each seed, Csepi counts,
// then the numeral, its dots and its word appear.

export const LEARN_MAX = 20;
/** Magvillantás opens once the child has met 1–5 here. */
export const UNLOCK_FLASH_AFTER = 5;

export interface LearnRound {
  count: number;
  seeds: SeedPos[];
}

/** Rounds go 1, 2, … 20 and then start again at 1. */
export function buildLearnRound(round: number): LearnRound {
  const r = Math.max(0, Math.floor(round));
  const count = (r % LEARN_MAX) + 1;
  return { count, seeds: layoutSeeds(count, 'dice', rng(r + 101)) };
}

export { article } from '../../lib/numbers';

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

/** Csepi's line when the locked Magvillantás card is tapped. */
export function flashLockedSpeech(learned: number): string {
  const left = Math.max(1, UNLOCK_FLASH_AFTER - learned);
  return `Ez a kertrész még alszik. Ismerj meg még ${numberAttr(left)} számot a Számvetésben, és kinyílik!`;
}
