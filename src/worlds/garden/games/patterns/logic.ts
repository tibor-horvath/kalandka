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
  AABB: [0, 0, 1, 1, 0, 0],
  ABAC: [0, 1, 0, 2, 0, 1],
  ABCB: [0, 1, 2, 1, 0, 1]
} as const;

export type ShapeKey = keyof typeof SHAPES;
/** The shapes of the first lap and of the mixed "missing flower" level; AABB has a level of its own after them. */
export const SHAPE_ORDER: ShapeKey[] = ['AB', 'ABC', 'AAB', 'ABB'];
/** Every shape, for the mixed levels at the top of the ladder. */
export const MIXED_SHAPES: ShapeKey[] = [...SHAPE_ORDER, 'AABB', 'ABAC', 'ABCB'];

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
  /** Index of the (first) hidden flower; the last index means "what comes next". */
  gap: number;
  answer: FlowerKind;
  /** Every hidden flower, left to right: one, or two on "Két hiányzó virág". */
  gaps: number[];
}

export function periodOf(shape: ShapeKey): number {
  return shape === 'AB' ? 2 : shape === 'ABC' || shape === 'AAB' || shape === 'ABB' ? 3 : 4;
}

function rowOf(shape: ShapeKey, kinds: FlowerKind[], gaps: number[], length = 6): PatternRound {
  const period = periodOf(shape);
  const sequence = Array.from({ length }, (_, i) => kinds[SHAPES[shape][i % period]]);
  const shown = sequence.map((k, i) => (gaps.includes(i) ? null : k));
  return { shape, sequence, shown, gap: gaps[0], answer: sequence[gaps[0]], gaps };
}

/** Starts of the whole repeats in a row, the first and the last one tried first. */
function repeatStarts(period: number, length: number): number[] {
  const last = length - period;
  const starts = Array.from({ length: Math.floor(length / period) }, (_, k) => k * period);
  return [0, last, ...starts.filter((s) => s !== 0 && s !== last)];
}

/** The first whole repeat no gap touches, so a hint can read it back. */
function freeRepeat(period: number, length: number, gaps: number[]): number | undefined {
  return repeatStarts(period, length).find((s) => gaps.every((g) => g < s || g >= s + period));
}

/**
 * The ways to hide `count` flowers inside a row: never the first or the last flower, every hidden flower
 * still shown somewhere else in the row, one whole repeat left untouched for the hint, and two hidden
 * flowers always of two different kinds.
 */
function gapChoices(shape: ShapeKey, length: number, count: 1 | 2): number[][] {
  const period = periodOf(shape);
  const slot = (i: number) => SHAPES[shape][i % period];
  const inner = Array.from({ length: length - 2 }, (_, i) => i + 1);
  const sets = count === 1 ? inner.map((g) => [g]) : inner.flatMap((a) => inner.filter((b) => b > a && slot(b) !== slot(a)).map((b) => [a, b]));
  const all = Array.from({ length }, (_, j) => j);
  return sets.filter(
    (gaps) =>
      freeRepeat(period, length, gaps) !== undefined && gaps.every((g) => all.some((j) => !gaps.includes(j) && slot(j) === slot(g)))
  );
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
  return rowOf(SHAPE_ORDER[r % SHAPE_ORDER.length], PERMUTATIONS[lap % PERMUTATIONS.length], [gap]);
}

export interface PatternLevel {
  /** Shown to parents. */
  name: string;
  shapes: readonly ShapeKey[];
  /** The missing flower is inside the row instead of at its end. */
  inside: boolean;
  /** Bunches that grow by this many flowers a step, in place of a row of flower kinds (see buildGrowRound). */
  grow?: 1 | 2;
  /** Rows hold two whole repeats (eight flowers for the repeats of four), so every flower has a twin in the row. */
  whole?: boolean;
  /** Flowers hidden inside the row; one unless set. */
  missing?: 2;
}

export const PATTERN_LEVELS: PatternLevel[] = [
  { name: 'Két virág', shapes: ['AB'], inside: false },
  { name: 'Három virág', shapes: ['ABC'], inside: false },
  { name: 'Kettő-egy, egy-kettő', shapes: ['AAB', 'ABB'], inside: false },
  { name: 'Hiányzó virág', shapes: SHAPE_ORDER, inside: true },
  { name: 'Kettő-kettő', shapes: ['AABB'], inside: false },
  { name: 'Eggyel több virág', shapes: [], inside: false, grow: 1 },
  { name: 'Kettővel több virág', shapes: [], inside: false, grow: 2 },
  { name: 'Négyes minta', shapes: ['ABAC', 'ABCB'], inside: false, whole: true },
  { name: 'Vegyes hiányzó virág', shapes: MIXED_SHAPES, inside: true, whole: true },
  { name: 'Két hiányzó virág', shapes: MIXED_SHAPES, inside: true, whole: true, missing: 2 }
];


/** The row of a round on a level of the ladder. */
export function buildLevelRound(level: number, round: number): PatternRound {
  const r = Math.max(0, Math.floor(round));
  const { shapes, inside, whole, missing } = PATTERN_LEVELS[level];
  if (!whole) {
    if (inside) return buildRound(SHAPE_ORDER.length + r);
    return rowOf(shapes[r % shapes.length], PERMUTATIONS[r % PERMUTATIONS.length], [5]);
  }
  const shape = shapes[r % shapes.length];
  const length = Math.max(6, 2 * periodOf(shape));
  const kinds = PERMUTATIONS[r % PERMUTATIONS.length];
  if (!inside) return rowOf(shape, kinds, [length - 1], length);
  const choices = gapChoices(shape, length, missing ?? 1);
  // Each lap through the shapes moves every shape's gap on, so a shape never hides the same flower twice running.
  const lap = Math.floor(r / shapes.length);
  return rowOf(shape, kinds, choices[(lap + 2 * (r % shapes.length)) % choices.length], length);
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
  return round.gap === round.sequence.length - 1;
}

export function screenTitle(round: PatternRound): string {
  if (round.gaps.length > 1) return 'Melyik két virág hiányzik?';
  return isEndGap(round) ? 'Melyik virág jön ezután?' : 'Melyik virág hiányzik?';
}

export interface PatternFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function startFeedback(round: PatternRound): PatternFeedback {
  if (round.gaps.length > 1) {
    const text = 'Két virág hiányzik. Mondd ki hangosan a sort, és ültesd el őket sorban!';
    return { text, speech: 'Melyik két virág hiányzik? ' + text, mood: 'smile', tone: 'plain' };
  }
  if (!isEndGap(round)) {
    const text = 'Mondd ki hangosan a sort, és keresd meg, melyik virág hiányzik!';
    return { text, speech: 'Melyik virág hiányzik? ' + text, mood: 'smile', tone: 'plain' };
  }
  const text = 'Mondd ki hangosan a sort, és válaszd ki a következő virágot!';
  return { text, speech: 'Melyik virág jön ezután? ' + text, mood: 'smile', tone: 'plain' };
}

/** The first of two hidden flowers is in its place. */
export function halfwayFeedback(): PatternFeedback {
  const text = 'Ez az! Most jön a másik kérdőjel.';
  return { text, speech: text, mood: 'smile', tone: 'good' };
}

export function solvedFeedback(): PatternFeedback {
  return { text: 'Ügyes vagy! Megtaláltad a mintát!', speech: 'Ügyes vagy! Megtaláltad a mintát!', mood: 'cheer', tone: 'good' };
}

/**
 * A wrong pick: read part of the row back as a hint, never a "wrong" word.
 * For a gap inside the row, the first hint reads one whole repeat that no gap touches,
 * the second reads the whole row with a pause at each open gap. With two gaps the screen passes
 * the row as it stands, so a flower already planted is read back too.
 */
export function hintFeedback(round: PatternRound, misses: number): PatternFeedback {
  const names = (kinds: FlowerKind[]) => kinds.map((k) => FLOWER_NAMES[k]).join(', ');
  const length = round.sequence.length;
  if (isEndGap(round)) {
    const before = round.sequence.slice(0, length - 1);
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
    const which = round.shown.filter((k) => k === null).length > 1 ? 'az első kérdőjel' : 'a kérdőjel';
    return { text: `Segítek: ${row}. Mi illik ${which} helyére?`, speech: `Segítek: ${spoken}. Mi illik ${which} helyére?`, mood: 'think', tone: 'oops' };
  }
  const period = periodOf(round.shape);
  const start = freeRepeat(period, length, round.gaps) ?? 0;
  const text = `Nézd csak: ${names(round.sequence.slice(start, start + period))}… mi hiányzik?`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}
