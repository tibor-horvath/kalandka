import type { Mood, Tone } from '../../../../lib/types';

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

/** Pattern shapes over slots a/b/c, each six long; one of the six is hidden and is the answer. */
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

/** Where the gap sits once the first lap is done: inside the row, never the very first flower. */
const MIDDLE_GAPS = [3, 2, 4, 1];

export interface PatternRound {
  shape: ShapeKey;
  sequence: FlowerKind[];
  /** The row as shown, with null in the gap. */
  shown: (FlowerKind | null)[];
  /** Index of the hidden flower; 5 means "what comes next". */
  gap: number;
  answer: FlowerKind;
}

export function periodOf(shape: ShapeKey): number {
  return shape === 'AB' ? 2 : 3;
}

function rowOf(shape: ShapeKey, kinds: FlowerKind[], gap: number): PatternRound {
  const sequence = SHAPES[shape].map((slot) => kinds[slot]);
  const shown = sequence.map((k, i) => (i === gap ? null : k));
  return { shape, sequence, shown, gap, answer: sequence[gap] };
}

/**
 * Rounds cycle through the four shapes, and each full cycle swaps which flowers fill them.
 * The first lap asks what comes next; after that the missing flower moves into the row.
 * The printed sheets are built from this, so the same round must keep giving the same row.
 */
export function buildRound(round: number): PatternRound {
  const r = Math.max(0, Math.floor(round));
  const lap = Math.floor(r / SHAPE_ORDER.length);
  const gap = lap === 0 ? 5 : MIDDLE_GAPS[(r + lap) % MIDDLE_GAPS.length];
  return rowOf(SHAPE_ORDER[r % SHAPE_ORDER.length], PERMUTATIONS[lap % PERMUTATIONS.length], gap);
}

export interface PatternLevel {
  /** Shown to parents. */
  name: string;
  shapes: readonly ShapeKey[];
  /** The missing flower is inside the row instead of at its end. */
  inside: boolean;
}

export const PATTERN_LEVELS: PatternLevel[] = [
  { name: 'Két virág', shapes: ['AB'], inside: false },
  { name: 'Három virág', shapes: ['ABC'], inside: false },
  { name: 'Kettő-egy, egy-kettő', shapes: ['AAB', 'ABB'], inside: false },
  { name: 'Hiányzó virág', shapes: SHAPE_ORDER, inside: true }
];

/** The row of a round on a level of the ladder. */
export function buildLevelRound(level: number, round: number): PatternRound {
  const r = Math.max(0, Math.floor(round));
  const { shapes, inside } = PATTERN_LEVELS[level];
  if (inside) return buildRound(SHAPE_ORDER.length + r);
  return rowOf(shapes[r % shapes.length], PERMUTATIONS[r % PERMUTATIONS.length], 5);
}

export function isEndGap(round: PatternRound): boolean {
  return round.gap === 5;
}

export function screenTitle(round: PatternRound): string {
  return isEndGap(round) ? 'Melyik virág jön ezután?' : 'Melyik virág hiányzik?';
}

export interface PatternFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function startFeedback(round: PatternRound): PatternFeedback {
  if (!isEndGap(round)) {
    const text = 'Mondd ki hangosan a sort, és keresd meg, melyik virág hiányzik!';
    return { text, speech: 'Melyik virág hiányzik? ' + text, mood: 'smile', tone: 'plain' };
  }
  const text = 'Mondd ki hangosan a sort, és válaszd ki a következő virágot!';
  return { text, speech: 'Melyik virág jön ezután? ' + text, mood: 'smile', tone: 'plain' };
}

export function solvedFeedback(): PatternFeedback {
  return { text: 'Ügyes vagy! Megtaláltad a mintát!', speech: 'Ügyes vagy! Megtaláltad a mintát!', mood: 'cheer', tone: 'good' };
}

/**
 * A wrong pick: read part of the row back as a hint, never a "wrong" word.
 * For a gap inside the row, the first hint reads one whole repeat that the gap does not touch,
 * the second reads the whole row with a pause at the gap.
 */
export function hintFeedback(round: PatternRound, misses: number): PatternFeedback {
  const names = (kinds: FlowerKind[]) => kinds.map((k) => FLOWER_NAMES[k]).join(', ');
  if (isEndGap(round)) {
    const before = round.sequence.slice(0, 5);
    if (misses >= 2) {
      const text = `Segítek: ${names(before)}… és most?`;
      return { text, speech: text, mood: 'think', tone: 'oops' };
    }
    const text = `Nézd csak: ${names(round.sequence.slice(0, 3))}… mi jön ezután?`;
    return { text, speech: text, mood: 'oops', tone: 'oops' };
  }
  if (misses >= 2) {
    const row = round.shown.map((k) => (k ? FLOWER_NAMES[k] : '?')).join(', ');
    const spoken = round.shown.map((k) => (k ? FLOWER_NAMES[k] : 'kérdőjel')).join(', ');
    return { text: `Segítek: ${row}. Mi illik a kérdőjel helyére?`, speech: `Segítek: ${spoken}. Mi illik a kérdőjel helyére?`, mood: 'think', tone: 'oops' };
  }
  const period = periodOf(round.shape);
  const start = round.gap >= period ? 0 : 6 - period;
  const text = `Nézd csak: ${names(round.sequence.slice(start, start + period))}… mi hiányzik?`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}
