import type { Mood, Tone } from '../../../lib/types';

// Helpers every Óratorony game shares: Kakuk's lines, the seeded shuffles and the "after two misses" rule.

/** Kakuk's line: what the bubble shows and the sentence read aloud. */
export interface Say {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export const say = (text: string, mood: Mood = 'smile', tone: Tone = 'plain', speech = text): Say => ({ text, speech, mood, tone });

/** After this many wrong picks on one question the right answer lights up. */
export const SHOW_AFTER = 2;

/** Praise after a right answer, in turn so it does not repeat. */
const PRAISE = ['Ügyes!', 'Kakukk! Ez az!', 'Pontosan!', 'Szép munka!', 'Igen, ez az!'];
export const praise = (i: number) => PRAISE[((i % PRAISE.length) + PRAISE.length) % PRAISE.length];

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

/** `n` different items, in a random order. */
export function sample<T>(items: readonly T[], n: number, rand: () => number): T[] {
  return shuffle(items, rand).slice(0, n);
}

/** A seed for one level's round, so every level draws its own tasks. */
export const seedOf = (game: number, level: number, round: number) => game * 100_003 + level * 7_919 + round * 31 + 1;
