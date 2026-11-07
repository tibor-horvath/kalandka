import { numberAttr, numberCount } from '../../../../lib/numbers';
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
  ABB: [0, 1, 1, 0, 1, 1],
  AABB: [0, 0, 1, 1, 0, 0]
} as const;

export type ShapeKey = keyof typeof SHAPES;
/** The shapes of the first lap and of the mixed "missing flower" level; AABB has a level of its own after them. */
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
  return shape === 'AB' ? 2 : shape === 'AABB' ? 4 : 3;
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
  /** Bunches that grow by this many flowers a step, in place of a row of flower kinds (see buildGrowRound). */
  grow?: 1 | 2;
}

export const PATTERN_LEVELS: PatternLevel[] = [
  { name: 'Két virág', shapes: ['AB'], inside: false },
  { name: 'Három virág', shapes: ['ABC'], inside: false },
  { name: 'Kettő-egy, egy-kettő', shapes: ['AAB', 'ABB'], inside: false },
  { name: 'Hiányzó virág', shapes: SHAPE_ORDER, inside: true },
  { name: 'Kettő-kettő', shapes: ['AABB'], inside: false },
  { name: 'Eggyel több virág', shapes: [], inside: false, grow: 1 },
  { name: 'Kettővel több virág', shapes: [], inside: false, grow: 2 }
];

/** The printed sheets stop at the mixed level, so the codes on pages printed before AABB and the bunches still match. */
export const PATTERN_PRINT_TOP = 3;

/** The row of a round on a level of the ladder. */
export function buildLevelRound(level: number, round: number): PatternRound {
  const r = Math.max(0, Math.floor(round));
  const { shapes, inside } = PATTERN_LEVELS[level];
  if (inside) return buildRound(SHAPE_ORDER.length + r);
  return rowOf(shapes[r % shapes.length], PERMUTATIONS[r % PERMUTATIONS.length], 5);
}

// Growing bunches: each bunch has one (or two) more flowers than the one before. The pattern is a number
// rule now, the step from counting on to counting in twos; bunches stay at ten flowers or fewer.

export interface GrowRound {
  step: 1 | 2;
  /** Flowers in each bunch shown; the bunch after the last one is the answer. */
  counts: number[];
  answer: number;
  /** Three distinct bunch sizes, ascending, one of them correct. */
  choices: number[];
  flower: FlowerKind;
}

/** One more each step from 1, 2 or 3 (five bunches shown); two more from 1 or 2 (four shown). */
export function buildGrowRound(level: number, round: number): GrowRound {
  const r = Math.max(0, Math.floor(round));
  const step = PATTERN_LEVELS[level].grow ?? 1;
  const first = step === 1 ? 1 + (r % 3) : 1 + (r % 2);
  const shown = step === 1 ? 5 : 4;
  const counts = Array.from({ length: shown }, (_, i) => first + i * step);
  const answer = first + shown * step;
  // The two slips children make: the last bunch again, or one more instead of two (or two more instead of one).
  const slip = step === 1 ? answer + 1 : answer - 1;
  const other = r % 2 === 0 && answer + 1 <= 10 && slip !== answer + 1 ? answer + 1 : answer - step;
  return { step, counts, answer, choices: [answer, slip, other].sort((a, b) => a - b), flower: CHOICES[r % CHOICES.length] };
}

function more(step: 1 | 2): string {
  return step === 1 ? 'eggyel' : 'kettővel';
}

export function growStartFeedback(r: GrowRound): PatternFeedback {
  const text = `Minden csokorban ${more(r.step)} több virág van. Hány virág jön ezután?`;
  return { text, speech: `Számold meg a csokrokat! ${text}`, mood: 'smile', tone: 'plain' };
}

export function growSolvedFeedback(r: GrowRound): PatternFeedback {
  return {
    text: `Ügyes vagy! ${r.answer} virág jön: mindig ${more(r.step)} több.`,
    speech: `Ügyes vagy! ${numberAttr(r.answer)} virág jön: mindig ${more(r.step)} több.`,
    mood: 'cheer',
    tone: 'good'
  };
}

/** A wrong pick: first the counts read back, then the last bunch and the step. */
export function growHintFeedback(r: GrowRound, misses: number): PatternFeedback {
  const last = r.counts[r.counts.length - 1];
  if (misses >= 2) {
    return {
      text: `Segítek: az utolsó csokorban ${last} virág van. Ha ${more(r.step)} több jön, az hány?`,
      speech: `Segítek: az utolsó csokorban ${numberAttr(last)} virág van. Ha ${more(r.step)} több jön, az hány?`,
      mood: 'think',
      tone: 'oops'
    };
  }
  return {
    text: `Nézd csak: ${r.counts.join(', ')}… mi jön ezután?`,
    speech: `Nézd csak: ${r.counts.map(numberCount).join(', ')}… mi jön ezután?`,
    mood: 'oops',
    tone: 'oops'
  };
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
    const text = `Nézd csak: ${names(round.sequence.slice(0, Math.max(3, periodOf(round.shape))))}… mi jön ezután?`;
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
