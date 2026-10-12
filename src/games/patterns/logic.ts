import type { Mood, Tone } from '../../lib/types';

export type FlowerKind = 'tulip' | 'sun' | 'star';

export const FLOWER_NAMES: Record<FlowerKind, string> = {
  tulip: 'tulipán',
  sun: 'napraforgó',
  star: 'nefelejcs'
};

export const FLOWER_LABELS: Record<FlowerKind, string> = {
  tulip: 'Tulipán',
  sun: 'Napraforgó',
  star: 'Nefelejcs'
};

export const CHOICES: FlowerKind[] = ['tulip', 'sun', 'star'];

/** Pattern shapes over slots a/b/c, each six long; the sixth item is the answer. */
export const SHAPES = {
  AB: [0, 1, 0, 1, 0, 1],
  ABC: [0, 1, 2, 0, 1, 2],
  AAB: [0, 0, 1, 0, 0, 1],
  ABB: [0, 1, 1, 0, 1, 1]
} as const;

export type ShapeKey = keyof typeof SHAPES;
export const SHAPE_ORDER: ShapeKey[] = ['AB', 'ABC', 'AAB', 'ABB'];

const PERMUTATIONS: FlowerKind[][] = [
  ['tulip', 'sun', 'star'],
  ['sun', 'star', 'tulip'],
  ['star', 'tulip', 'sun'],
  ['tulip', 'star', 'sun'],
  ['sun', 'tulip', 'star'],
  ['star', 'sun', 'tulip']
];

export interface PatternRound {
  shape: ShapeKey;
  sequence: FlowerKind[];
  shown: FlowerKind[];
  answer: FlowerKind;
}

/** Rounds cycle through the four shapes, and each full cycle swaps which flowers fill them. */
export function buildRound(round: number): PatternRound {
  const r = Math.max(0, Math.floor(round));
  const shape = SHAPE_ORDER[r % SHAPE_ORDER.length];
  const kinds = PERMUTATIONS[Math.floor(r / SHAPE_ORDER.length) % PERMUTATIONS.length];
  const sequence = SHAPES[shape].map((slot) => kinds[slot]);
  return { shape, sequence, shown: sequence.slice(0, 5), answer: sequence[5] };
}

export interface PatternFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function startFeedback(): PatternFeedback {
  const text = 'Mondd ki hangosan a sort, és válaszd ki a következő virágot!';
  return { text, speech: 'Melyik virág jön ezután? ' + text, mood: 'smile', tone: 'plain' };
}

export function solvedFeedback(): PatternFeedback {
  return { text: 'Ügyes vagy! Megtaláltad a mintát!', speech: 'Ügyes vagy! Megtaláltad a mintát!', mood: 'cheer', tone: 'good' };
}

/** A wrong pick: read the first three flowers back as a hint, never a "wrong" word. */
export function hintFeedback(round: PatternRound, misses: number): PatternFeedback {
  const firstThree = round.sequence.slice(0, 3).map((k) => FLOWER_NAMES[k]).join(', ');
  if (misses >= 2) {
    const text = `Segítek: ${round.shown.map((k) => FLOWER_NAMES[k]).join(', ')}… és most?`;
    return { text, speech: text, mood: 'think', tone: 'oops' };
  }
  const text = `Nézd csak: ${firstThree}… mi jön ezután?`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}
