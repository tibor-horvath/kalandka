import type { Mood, Tone } from '../../../lib/types';
import { rng } from '../../../lib/rng';

// Válogatógép: machine parts come down the belt and the child taps the box each one belongs in.
// First by colour (two boxes, then three), then by shape and by size; then the odd one out
// ("kakukktojás"), a box for parts that match two things at once, and last a hidden rule:
// Csavar puts one part in each box and the child works out why. Nothing fails: a part that
// goes to the wrong box comes back, Csavar names what to look at, and after a second try the
// right box lights up.

export type Color = 'red' | 'blue' | 'yellow';
export type Shape = 'round' | 'square' | 'triangle';
export type Size = 'big' | 'small';
export type Feature = 'color' | 'shape' | 'size';

export interface Part {
  color: Color;
  shape: Shape;
  size: Size;
}

/** Colours differ in lightness as well (light yellow, mid red, dark blue), for colour-blind children. */
export const COLORS: Color[] = ['red', 'blue', 'yellow'];
export const SHAPES: Shape[] = ['round', 'square', 'triangle'];
export const SIZES: Size[] = ['big', 'small'];
const VALUES: Record<Feature, readonly string[]> = { color: COLORS, shape: SHAPES, size: SIZES };

export const COLOR_NAMES: Record<Color, string> = { red: 'piros', blue: 'kék', yellow: 'sárga' };
export const SHAPE_NAMES: Record<Shape, string> = { round: 'kör', square: 'négyzet', triangle: 'háromszög' };
export const SIZE_NAMES: Record<Size, string> = { big: 'nagy', small: 'kicsi' };
/** "Melyik dobozba mennek a pirosak?" */
const PLURALS: Record<string, string> = {
  red: 'pirosak',
  blue: 'kékek',
  yellow: 'sárgák',
  round: 'körök',
  square: 'négyzetek',
  triangle: 'háromszögek',
  big: 'nagyok',
  small: 'kicsik'
};
/** "Figyeld a színeket!" */
const FEATURE_LOOK: Record<Feature, string> = { color: 'a színeket', shape: 'a formákat', size: 'a nagyságot' };
/** "Színek szerint válogattunk." */
const FEATURE_BY: Record<Feature, string> = { color: 'színek', shape: 'formák', size: 'nagyság' };

export function nameOf(f: Feature, value: string): string {
  if (f === 'color') return COLOR_NAMES[value as Color];
  if (f === 'shape') return SHAPE_NAMES[value as Shape];
  return SIZE_NAMES[value as Size];
}

/** "nagy piros kör" */
export function describe(p: Part): string {
  return `${SIZE_NAMES[p.size]} ${COLOR_NAMES[p.color]} ${SHAPE_NAMES[p.shape]}`;
}

export interface SortLevel {
  /** Shown to parents. */
  name: string;
  /** sort: tap the box for each part; odd: tap the one part of four that is different. */
  mode: 'sort' | 'odd';
  /** What the boxes sort by; 'both' is a box for one colour and shape together, and one for the rest. */
  rule: Feature | 'both' | 'any';
  /** Boxes on the machine (sort mode). */
  bins: number;
  /** Parts on the belt in one round (sort mode), or rows of four (odd mode). */
  items: number;
  /** The other features that change from part to part; the rest stay the same. */
  vary: Feature[];
  /** The boxes have no labels: Csavar sorts one part into each, the child finds the rule. */
  hidden?: boolean;
}

export const SORT_ROUNDS_PER_LEVEL = 5;

/**
 * Seven levels: two colours with nothing else changing (4+), three colours, shapes, sizes (5+),
 * the odd one out, one colour and shape together (6+), and a hidden rule (7).
 */
export const SORT_LEVELS: SortLevel[] = [
  { name: 'Két szín', mode: 'sort', rule: 'color', bins: 2, items: 4, vary: [] },
  { name: 'Három szín', mode: 'sort', rule: 'color', bins: 3, items: 6, vary: ['shape'] },
  { name: 'Formák', mode: 'sort', rule: 'shape', bins: 3, items: 6, vary: ['color'] },
  { name: 'Nagy és kicsi', mode: 'sort', rule: 'size', bins: 2, items: 6, vary: ['color', 'shape'] },
  { name: 'Kakukktojás', mode: 'odd', rule: 'any', bins: 0, items: 3, vary: [] },
  { name: 'Két szabály', mode: 'sort', rule: 'both', bins: 2, items: 6, vary: ['size'] },
  { name: 'Mi a szabály?', mode: 'sort', rule: 'any', bins: 2, items: 6, vary: ['color', 'shape', 'size'], hidden: true }
];

/** Five solved rounds per level, then the next level. */
export function sortLevelIndex(solved: number): number {
  return Math.min(SORT_LEVELS.length - 1, Math.floor(Math.max(0, solved) / SORT_ROUNDS_PER_LEVEL));
}

/**
 * A box takes the parts that match every feature it names; a box with no features takes the rest
 * (every part no other box takes).
 */
export interface Bin {
  match: Partial<Part>;
}

export interface SortRound {
  level: SortLevel;
  /** The feature the boxes sort by ('both' for colour and shape together). */
  rule: Feature | 'both';
  bins: Bin[];
  /** Parts in belt order. */
  parts: Part[];
  /** Parts Csavar has already put away at the start (hidden rule: one per box). */
  preset: number;
}

export interface OddRow {
  parts: Part[];
  /** Index of the part that is different. */
  odd: number;
  /** What makes it different. */
  feature: Feature;
}

export interface OddRound {
  level: SortLevel;
  rows: OddRow[];
}

/** Which box a part belongs in. */
export function binFor(bins: Bin[], part: Part): number {
  const i = bins.findIndex((b) => {
    const keys = Object.keys(b.match) as Feature[];
    return keys.length > 0 && keys.every((k) => b.match[k] === part[k]);
  });
  return i >= 0 ? i : bins.findIndex((b) => Object.keys(b.match).length === 0);
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

function partWith(base: Part, f: Feature, value: string): Part {
  return { ...base, [f]: value } as Part;
}

/** A part whose varying features are random and the rest fixed to `base`. */
function randomPart(base: Part, vary: Feature[], rand: () => number): Part {
  let p = base;
  for (const f of vary) p = partWith(p, f, pick(VALUES[f], rand));
  return p;
}

const BASE: Part = { color: 'blue', shape: 'round', size: 'big' };
const HIDDEN_RULES: Feature[] = ['color', 'shape', 'size'];
const ODD_RULES: Feature[] = ['color', 'shape', 'size'];

function sameParts(a: Part, b: Part): boolean {
  return a.color === b.color && a.shape === b.shape && a.size === b.size;
}

/** No two neighbours on the belt look exactly the same, so every part reads as a new one. */
function spread(parts: Part[], rand: () => number): Part[] {
  let out = shuffle(parts, rand);
  for (let tries = 0; tries < 20 && out.some((p, i) => i > 0 && sameParts(p, out[i - 1])); tries++) out = shuffle(parts, rand);
  return out;
}

function buildSortRound(level: SortLevel, round: number, rand: () => number): SortRound {
  if (level.rule === 'both') {
    // One box for one colour and shape together, one for everything else. The rest always
    // holds near misses: the right colour in another shape, and the right shape in another colour.
    const color = pick(COLORS, rand);
    const shape = pick(SHAPES, rand);
    const otherColor = pick(COLORS.filter((c) => c !== color), rand);
    const otherShape = pick(SHAPES.filter((s) => s !== shape), rand);
    const size = () => pick(SIZES, rand);
    const target = (): Part => ({ color, shape, size: size() });
    const parts = [
      target(),
      target(),
      target(),
      { color, shape: otherShape, size: size() },
      { color: otherColor, shape, size: size() },
      { color: otherColor, shape: otherShape, size: size() }
    ];
    return { level, rule: 'both', bins: [{ match: { color, shape } }, { match: {} }], parts: spread(parts, rand), preset: 0 };
  }

  const rule: Feature = level.rule === 'any' ? HIDDEN_RULES[round % HIDDEN_RULES.length] : level.rule;
  const values = shuffle([...VALUES[rule]], rand).slice(0, level.bins);
  const vary = level.vary.filter((f) => f !== rule);
  // Fixed features take a value none of the boxes is about: on the two-colour level every part is a big circle.
  const base: Part = { ...BASE, color: rule === 'color' ? BASE.color : pick(COLORS, rand) };
  // Hidden rule: Csavar's examples come first, one for each box in box order. They differ in the
  // rule's feature only, so comparing the two boxes shows the rule.
  const example = randomPart(base, vary, rand);
  const preset = level.hidden ? values.map((v) => partWith(example, rule, v)) : [];
  // An even share for every box, then shuffled along the belt.
  const rest = Array.from({ length: level.items - preset.length }, (_, i) => partWith(randomPart(base, vary, rand), rule, values[i % values.length]));
  const parts = [...preset, ...spread(rest, rand)];
  return { level, rule, bins: values.map((v) => ({ match: { [rule]: v } as Partial<Part> })), parts, preset: preset.length };
}

/** Four parts: three share a value of the rule's feature, one does not. Exactly one other feature changes, two and two, so it never singles out a part. */
function buildOddRow(feature: Feature, rand: () => number): OddRow {
  const [common, different] = shuffle([...VALUES[feature]], rand);
  const others = (['color', 'shape', 'size'] as Feature[]).filter((f) => f !== feature);
  const varying = pick(others, rand);
  const fixed = others.find((f) => f !== varying)!;
  const [va, vb] = shuffle([...VALUES[varying]], rand);
  let base: Part = partWith(BASE, fixed, pick(VALUES[fixed], rand));
  base = partWith(base, feature, common);
  const parts = [va, va, vb, vb].map((v) => partWith(base, varying, v));
  const odd = Math.floor(rand() * 4) % 4;
  parts[odd] = partWith(parts[odd], feature, different);
  const order = shuffle([0, 1, 2, 3], rand);
  return { parts: order.map((i) => parts[i]), odd: order.indexOf(odd), feature };
}

function buildOddRound(level: SortLevel, round: number, rand: () => number): OddRound {
  const start = round % ODD_RULES.length;
  return { level, rows: Array.from({ length: level.items }, (_, i) => buildOddRow(ODD_RULES[(start + i) % ODD_RULES.length], rand)) };
}

export type Round = SortRound | OddRound;

export function isOdd(r: Round): r is OddRound {
  return r.level.mode === 'odd';
}

/** The same round every time for a level and round number. */
export function buildRound(levelIndex: number, round: number): Round {
  const level = SORT_LEVELS[Math.max(0, Math.min(SORT_LEVELS.length - 1, levelIndex))];
  const rand = rng(round * 31 + levelIndex * 977 + 5);
  return level.mode === 'odd' ? buildOddRound(level, round, rand) : buildSortRound(level, round, rand);
}

/** How a box is named in speech: "a pirosak", "a piros körök", "a többi". */
export function binName(bin: Bin): string {
  const { color, shape, size } = bin.match;
  if (color && shape) return `a ${COLOR_NAMES[color]} ${PLURALS[shape]}`;
  const v = color ?? shape ?? size;
  return v ? `a ${PLURALS[v]}` : 'a többi';
}

// ---------- Csavar's lines ----------

export interface SortFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const TAP_TIP = ' Ha megérintesz egy darabot, megmondom, milyen.';

export function startFeedback(r: Round): SortFeedback {
  if (isOdd(r)) {
    const text = 'Három darab hasonló, egy más. Melyik a kakukktojás?';
    return { text, speech: `${text} Koppints rá!`, mood: 'smile', tone: 'plain' };
  }
  if (r.level.hidden) {
    const text = 'Én már betettem egy darabot mindkét dobozba. Mi a szabály? Folytasd!';
    return { text, speech: 'Nézd, én már betettem egy darabot mindkét dobozba. Kitalálod, mi a szabály? Folytasd a válogatást!', mood: 'smile', tone: 'plain' };
  }
  if (r.rule === 'both') {
    const name = binName(r.bins[0]);
    const text = `Az első dobozba csak ${name} mennek. Minden más a többi közé!`;
    return { text, speech: `Figyelj! Az első dobozba csak ${name} mennek. Minden más a másik dobozba, a többi közé!`, mood: 'smile', tone: 'plain' };
  }
  const by = r.rule === 'size' ? 'nagyság szerint' : `${FEATURE_BY[r.rule]} szerint`;
  const text = `Válogasd szét a darabokat ${by}! Koppints a jó dobozra.`;
  const first = r.level === SORT_LEVELS[0] ? 'Segíts a válogatógépnek! ' : '';
  return { text, speech: `${first}Válogasd szét a darabokat ${by}! Koppints arra a dobozra, ahova a darab való.${TAP_TIP}`, mood: 'smile', tone: 'plain' };
}

/** Tapping a part on the belt: Csavar says what it is. */
export function partFeedback(p: Part): SortFeedback {
  const text = `Ez egy ${describe(p)}.`;
  return { text, speech: text, mood: 'smile', tone: 'plain' };
}

/** A part in the right box: a short word, varied so it does not ring the same each time. */
const RIGHT = ['Úgy van!', 'Jó helyre tetted!', 'Ügyes!', 'Pontosan!'];
export function rightFeedback(n: number): SortFeedback {
  const text = RIGHT[n % RIGHT.length];
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/**
 * A part tapped into the wrong box. The first time Csavar names what to look at; from the second
 * try on the right box lights up as well (see SHOW_BIN_AFTER).
 */
export function wrongFeedback(r: SortRound, part: Part, misses: number): SortFeedback {
  const right = r.bins[binFor(r.bins, part)];
  if (r.level.hidden && misses < SHOW_BIN_AFTER) {
    const text = 'Hoppá! Nézd meg, mi van már a dobozokban. Miben hasonlítanak?';
    return { text, speech: text, mood: 'oops', tone: 'oops' };
  }
  if (r.rule === 'both') {
    const want = r.bins[0].match;
    if (Object.keys(right.match).length > 0) {
      const text = `Hoppá! Ez ${COLOR_NAMES[part.color]} ${SHAPE_NAMES[part.shape]}, az első dobozba megy.`;
      return { text, speech: `Hoppá! Nézd csak: ez ${COLOR_NAMES[part.color]}, és ${SHAPE_NAMES[part.shape]} is. Ez az első dobozba megy!`, mood: 'oops', tone: 'oops' };
    }
    const why = part.color !== want.color ? `ez ${COLOR_NAMES[part.color]}, nem ${COLOR_NAMES[want.color!]}` : `ez ${SHAPE_NAMES[part.shape]}, nem ${SHAPE_NAMES[want.shape!]}`;
    const text = `Hoppá! Nézd csak: ${why}. A többi közé megy.`;
    return { text, speech: text, mood: 'oops', tone: 'oops' };
  }
  const rule = r.rule;
  const value = part[rule];
  const text = `Hoppá! Ez a darab ${nameOf(rule, value)}. Melyik dobozba mennek ${binName(right)}?`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}

/** Misses on one part before its box lights up. */
export const SHOW_BIN_AFTER = 2;

export function sortSolvedFeedback(r: SortRound): SortFeedback {
  if (r.level.hidden && r.rule !== 'both') {
    const text = `Ügyes vagy! Kitaláltad: ${r.rule === 'size' ? 'nagyság' : FEATURE_BY[r.rule]} szerint válogattunk!`;
    return { text, speech: text, mood: 'cheer', tone: 'good' };
  }
  const text = 'Ügyes vagy! Minden darab a helyén van!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** The odd one was found: say why it is different. */
export function oddRightFeedback(row: OddRow, last: boolean): SortFeedback {
  const odd = row.parts[row.odd];
  const other = row.parts[(row.odd + 1) % row.parts.length];
  const why =
    row.feature === 'size'
      ? `Ez ${SIZE_NAMES[odd.size]}, a többi ${SIZE_NAMES[other.size]}.`
      : row.feature === 'color'
        ? `Ez ${COLOR_NAMES[odd.color]}, a többi ${COLOR_NAMES[other.color]}.`
        : `Ez ${SHAPE_NAMES[odd.shape]}, a többi ${SHAPE_NAMES[other.shape]}.`;
  const text = last ? `Ez az! ${why} Ügyes vagy!` : `Ez az! ${why}`;
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** A part like the others was tapped: first a nudge, then what to look at; after that the odd one lights up. */
export function oddWrongFeedback(row: OddRow, misses: number): SortFeedback {
  const text = misses <= 1 ? 'Hoppá! Ez olyan, mint még kettő. Keresd azt, amelyik egyedül van!' : `Hoppá! Figyeld ${FEATURE_LOOK[row.feature]}!`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}

/** Misses on one row before the odd part lights up. */
export const SHOW_ODD_AFTER = 3;
