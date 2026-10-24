import type { Mood, Tone } from '../../lib/types';
import { capitalize, numberCount } from '../../lib/numbers';
import { rng } from '../flash/layout';
import { COLORS, COLOR_NAMES, SHAPES, SHAPE_NAMES, type Color, type Shape } from './sort';

// Mintagép: harder patterns than Virágsor. Parts ride the belt in a row that follows a rule and the
// child picks what comes next: two colours (for 5-year-olds), longer repeats, colour and shape on
// their own cycles, towers that grow, an arrow that turns, a row with one part out of place, and
// last the same rule told again in arrows. Nothing fails: a wrong pick sits in the gap a moment,
// Csavar reads the row aloud (the repeats bracketed under it), and after a second try the right
// part lights up.

/** Which way an arrow points: up, right, down, left (a quarter turn clockwise each). */
export type Dir = 0 | 1 | 2 | 3;

export type Item =
  | { kind: 'part'; color: Color; shape: Shape }
  | { kind: 'stack'; n: number }
  /** A plain arrow is drawn in the workshop's teal. */
  | { kind: 'arrow'; dir: Dir; color: Color | null };

export type SeqKind = 'two' | 'long' | 'both' | 'grow' | 'turn' | 'fix' | 'translate';

export interface SeqLevel {
  /** Shown to parents. */
  name: string;
  kind: SeqKind;
  /** Tasks in one round. */
  tasks: number;
}

export const SEQ_ROUNDS_PER_LEVEL = 5;

/**
 * Seven levels: two colours (4+), longer repeats, colour and shape together (5+), growing towers,
 * turning arrows (6+), finding the part out of place and translating a pattern into arrows (7).
 */
export const SEQ_LEVELS: SeqLevel[] = [
  { name: 'Két szín', kind: 'two', tasks: 4 },
  { name: 'Hosszabb ismétlés', kind: 'long', tasks: 4 },
  { name: 'Szín és forma', kind: 'both', tasks: 4 },
  { name: 'Növekvő sor', kind: 'grow', tasks: 4 },
  { name: 'Forgó sor', kind: 'turn', tasks: 4 },
  { name: 'Hibavadász', kind: 'fix', tasks: 3 },
  { name: 'Mintafordító', kind: 'translate', tasks: 3 }
];

/** Five solved rounds per level, then the next level. */
export function seqLevelIndex(solved: number): number {
  return Math.min(SEQ_LEVELS.length - 1, Math.floor(Math.max(0, solved) / SEQ_ROUNDS_PER_LEVEL));
}

export interface SeqTask {
  /** next: pick what fills the gap after the row; fix: tap the part out of place, then pick what belongs there. */
  mode: 'next' | 'fix';
  /** next: the parts before the gap; fix: the whole row, the wrong part included. */
  row: Item[];
  /** What belongs in the gap (fix: in the wrong part's place). */
  answer: Item;
  /** fix: index of the part out of place; next: -1. */
  wrong: number;
  /** Three choices, the answer among them once. */
  choices: Item[];
  /** Length of one repeat, for the brackets under the row; 0 when the rule is not a repeat (towers, arrows). */
  unit: number;
  /** Mintafordító: the same pattern in colours, shown above the arrows, longer than the row. */
  ref?: Item[];
}

export interface SeqRound {
  level: SeqLevel;
  tasks: SeqTask[];
}

export function sameItem(a: Item, b: Item): boolean {
  if (a.kind === 'part' && b.kind === 'part') return a.color === b.color && a.shape === b.shape;
  if (a.kind === 'stack' && b.kind === 'stack') return a.n === b.n;
  if (a.kind === 'arrow' && b.kind === 'arrow') return a.dir === b.dir && a.color === b.color;
  return false;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const part = (color: Color, shape: Shape = 'round'): Item => ({ kind: 'part', color, shape });
const turn = (d: number, by: number): Dir => ((((d + by) % 4) + 4) % 4) as Dir;

/** Repeats as positions in a list of values: AB, ABC, AAB, ABB, AABB. */
const AB = [0, 1];
const ABC = [0, 1, 2];
const AAB = [0, 0, 1];
const ABB = [0, 1, 1];
const AABB = [0, 0, 1, 1];
const LONG_UNITS = [ABC, AAB, ABB, AABB];
const FIX_UNITS = [AB, ABC, AAB, ABB];
const TRANSLATE_UNITS = [AB, ABB, AAB, ABC];

/** How many parts stand before the gap: at least two whole repeats, the gap moving through the repeat. */
function rowLength(unit: number, t: number): number {
  let n = 2 * unit + (t % unit);
  while (n < 5) n += unit;
  return Math.min(n, 9);
}

function repeatTask(unit: number[], colors: Color[], t: number, rand: () => number): SeqTask {
  const at = (i: number) => part(colors[unit[i % unit.length]]);
  const n = rowLength(unit.length, t);
  const answer = at(n);
  // Every colour in the repeat, and a colour from outside it when the repeat has only two.
  const used = [...new Set(unit)].map((v) => colors[v]);
  const extra = COLORS.filter((c) => !used.includes(c));
  const choices = [...used, ...extra].slice(0, 3).map((c) => part(c));
  return { mode: 'next', row: Array.from({ length: n }, (_, i) => at(i)), answer, wrong: -1, choices: shuffle(choices, rand), unit: unit.length };
}

/** Colour and shape on cycles of two and three (in turn), so each has to be followed on its own. */
function bothTask(t: number, rand: () => number): SeqTask {
  const [a, b] = t % 2 === 0 ? [2, 3] : [3, 2];
  const colors = shuffle(COLORS, rand).slice(0, a);
  const shapes = shuffle(SHAPES, rand).slice(0, b);
  const at = (i: number) => part(colors[i % a], shapes[i % b]);
  const n = 6 + (t % 2);
  const answer = at(n);
  // Each wrong choice is off by exactly one feature.
  const otherColor = part(colors[(n + 1) % a], shapes[n % b]);
  const otherShape = part(colors[n % a], shapes[(n + 1) % b]);
  return { mode: 'next', row: Array.from({ length: n }, (_, i) => at(i)), answer, wrong: -1, choices: shuffle([answer, otherColor, otherShape], rand), unit: 0 };
}

/** Towers that grow by one (the first two tasks), then by two. */
function growTask(t: number, rand: () => number): SeqTask {
  const step = t < 2 ? 1 : 2;
  const start = 1 + Math.floor(rand() * 2);
  const shown = step === 1 ? 4 : 3;
  const stack = (n: number): Item => ({ kind: 'stack', n });
  const n = start + shown * step;
  return {
    mode: 'next',
    row: Array.from({ length: shown }, (_, i) => stack(start + i * step)),
    answer: stack(n),
    wrong: -1,
    choices: shuffle([stack(n), stack(n - 1), stack(n + 1)], rand),
    unit: 0
  };
}

/** An arrow turning a quarter each step, clockwise or back; in the last two tasks its colour changes too. */
function turnTask(t: number, rand: () => number): SeqTask {
  const by = t % 2 === 0 ? 1 : -1;
  const start = Math.floor(rand() * 4) as Dir;
  const colors = t >= 2 ? shuffle(COLORS, rand).slice(0, 2) : null;
  const n = 5;
  const at = (i: number): Item => ({ kind: 'arrow', dir: turn(start, i * by), color: colors ? colors[i % 2] : null });
  const answer = at(n) as Extract<Item, { kind: 'arrow' }>;
  const back = turn(answer.dir, -2 * by);
  const choices: Item[] = colors
    ? [answer, { ...answer, color: colors[(n + 1) % 2] }, { ...answer, dir: back }]
    : [answer, { ...answer, dir: turn(answer.dir, -by) }, { ...answer, dir: back }];
  return { mode: 'next', row: Array.from({ length: n }, (_, i) => at(i)), answer, wrong: -1, choices: shuffle(choices, rand), unit: 0 };
}

/** Two whole repeats, then one part out of place in the three after them. */
function fixTask(unit: number[], colors: Color[], rand: () => number): SeqTask {
  const u = unit.length;
  const n = 2 * u + 3;
  const row = Array.from({ length: n }, (_, i) => part(colors[unit[i % u]]));
  const wrong = 2 * u + Math.floor(rand() * 3);
  const answer = row[wrong];
  const values = [...new Set(unit)].map((v) => colors[v]).filter((c) => answer.kind === 'part' && c !== answer.color);
  row[wrong] = part(values[Math.floor(rand() * values.length)]);
  return { mode: 'fix', row, answer, wrong, choices: shuffle(COLORS.map((c) => part(c)), rand), unit: u };
}

/** The pattern in colours above, the same pattern in arrows below: one colour, one arrow. */
function translateTask(unit: number[], colors: Color[], t: number, rand: () => number): SeqTask {
  const u = unit.length;
  const dirs = shuffle([0, 1, 2, 3] as Dir[], rand);
  const arrow = (i: number): Item => ({ kind: 'arrow', dir: dirs[unit[i % u]], color: null });
  const n = u + 1 + (t % u);
  const refLength = Math.max(n + 2, 2 * u + 2);
  const used = [...new Set(unit)].map((v) => dirs[v]);
  const choiceDirs = [...used, ...dirs.filter((d) => !used.includes(d))].slice(0, 3);
  return {
    mode: 'next',
    row: Array.from({ length: n }, (_, i) => arrow(i)),
    answer: arrow(n),
    wrong: -1,
    choices: shuffle(
      choiceDirs.map((dir): Item => ({ kind: 'arrow', dir, color: null })),
      rand
    ),
    unit: u,
    ref: Array.from({ length: refLength }, (_, i) => part(colors[unit[i % u]]))
  };
}

function buildTask(level: SeqLevel, round: number, t: number, rand: () => number): SeqTask {
  const colors = shuffle(COLORS, rand);
  const pickUnit = (units: number[][]) => units[(round + t) % units.length];
  switch (level.kind) {
    case 'two':
      return repeatTask(AB, colors, t + round, rand);
    case 'long':
      return repeatTask(pickUnit(LONG_UNITS), colors, t + round, rand);
    case 'both':
      return bothTask(t, rand);
    case 'grow':
      return growTask(t, rand);
    case 'turn':
      return turnTask(t, rand);
    case 'fix':
      return fixTask(pickUnit(FIX_UNITS), colors, rand);
    case 'translate':
      return translateTask(pickUnit(TRANSLATE_UNITS), colors, t + round, rand);
  }
}

/** The same round every time for a level and round number. */
export function buildSeqRound(levelIndex: number, round: number): SeqRound {
  const level = SEQ_LEVELS[Math.max(0, Math.min(SEQ_LEVELS.length - 1, levelIndex))];
  const rand = rng(round * 31 + levelIndex * 977 + 11);
  return { level, tasks: Array.from({ length: level.tasks }, (_, t) => buildTask(level, round, t, rand)) };
}

// ---------- naming ----------

const DIR_NAMES = ['fel', 'jobbra', 'le', 'balra'];
const DIR_POINTS = ['felfelé', 'jobbra', 'lefelé', 'balra'];

/**
 * An item's name when the row is read aloud: just the colour when every part in the row has the same
 * shape ("piros"), else colour and shape ("piros kör"); a tower by its count, an arrow by its way.
 */
export function readName(item: Item, row: Item[]): string {
  if (item.kind === 'stack') return numberCount(item.n);
  if (item.kind === 'arrow') return item.color ? `${COLOR_NAMES[item.color]} ${DIR_NAMES[item.dir]}` : DIR_NAMES[item.dir];
  const oneShape = row.every((p) => p.kind !== 'part' || p.shape === item.shape);
  return oneShape ? COLOR_NAMES[item.color] : `${COLOR_NAMES[item.color]} ${SHAPE_NAMES[item.shape]}`;
}

/** Tapping an item: Csavar says what it is. */
export function tapName(item: Item): string {
  if (item.kind === 'stack') return `Ebben a toronyban ${numberCount(item.n)} kocka van.`;
  if (item.kind === 'arrow') return item.color ? `Ez a ${COLOR_NAMES[item.color]} nyíl ${DIR_POINTS[item.dir]} mutat.` : `Ez a nyíl ${DIR_POINTS[item.dir]} mutat.`;
  return `Ez egy ${COLOR_NAMES[item.color]} ${SHAPE_NAMES[item.shape]}.`;
}

/** For screen readers: "piros kör", "négy kocka", "nyíl jobbra". */
export function label(item: Item): string {
  if (item.kind === 'stack') return `${numberCount(item.n)} kocka`;
  if (item.kind === 'arrow') return `${item.color ? `${COLOR_NAMES[item.color]} ` : ''}nyíl ${DIR_POINTS[item.dir]}`;
  return `${COLOR_NAMES[item.color]} ${SHAPE_NAMES[item.shape]}`;
}

/**
 * The row read aloud, a pause after each repeat: "Piros, kék… piros, kék… piros". Rows that are not
 * repeats are read straight through.
 */
export function readRow(row: Item[], unit: number): string {
  const names = row.map((it) => readName(it, row));
  if (!unit) return capitalize(names.join(', '));
  const groups: string[] = [];
  for (let i = 0; i < names.length; i += unit) groups.push(names.slice(i, i + unit).join(', '));
  return capitalize(groups.join('… '));
}

// ---------- Csavar's lines ----------

export interface SeqFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const plain = (text: string, speech = text): SeqFeedback => ({ text, speech, mood: 'smile', tone: 'plain' });

export function startFeedback(level: SeqLevel, task: SeqTask, first: boolean): SeqFeedback {
  switch (level.kind) {
    case 'two':
    case 'long':
      return plain('Mi jön a sorban?', `${first ? 'Segíts a mintagépnek! ' : ''}Nézd a sort, és mondd ki hangosan! Mi jön utána?`);
    case 'both':
      return plain('Milyen színű, és milyen alakú jön?', 'Figyeld a színeket, és figyeld a formákat is! Milyen darab jön a sorban?');
    case 'grow':
      return plain('A torony mindig nő. Melyik jön?', 'A torony mindig nő. Melyik torony jön utána? Ha megérintesz egy tornyot, megszámolom.');
    case 'turn':
      return plain('A nyíl mindig fordul egyet. Merre néz majd?', 'Nézd, a nyíl mindig fordul egyet. Merre néz majd a következő?');
    case 'fix':
      return task.mode === 'fix'
        ? plain('Valami elcsúszott! Melyik nem illik a sorba?', 'Hoppá, a gép elcsúszott! Egy darab nem illik a sorba. Mondd ki a sort, és koppints arra, amelyik nem illik!')
        : plain('Mi jön a sorban?');
    case 'translate':
      return plain('Ugyanaz a minta, nyilakkal! Melyik nyíl jön?', 'Nézd a felső sort! Az alsó sorban ugyanaz a minta van, csak nyilakkal. Melyik nyíl jön?');
  }
}

/** Tapping an item in the row. */
export function itemFeedback(item: Item): SeqFeedback {
  return plain(tapName(item));
}

/** The part out of place was found. */
export function foundFeedback(): SeqFeedback {
  const text = 'Megtaláltad a hibát! Melyik darab kell a helyére?';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

const RIGHT = ['Úgy van!', 'Pontosan!', 'Ügyes!', 'Ez az!'];

/** The right pick: a short word, and for repeats, towers and arrows the whole row read once more. */
export function rightFeedback(task: SeqTask, n: number): SeqFeedback {
  const word = RIGHT[n % RIGHT.length];
  const full = task.mode === 'fix' ? task.row.map((it, i) => (i === task.wrong ? task.answer : it)) : [...task.row, task.answer];
  const reads = task.unit > 0 || full[0].kind !== 'part';
  return { text: word, speech: reads ? `${word} ${readRow(full, task.unit)}!` : word, mood: 'cheer', tone: 'good' };
}

/** Misses on one gap before the right choice lights up. */
export const SHOW_ANSWER_AFTER = 2;
/** Misses on one row before the part out of place lights up. */
export const SHOW_WRONG_AFTER = 3;

/** A wrong pick for the gap: Csavar reads the row up to the gap, so the child hears where it leads. */
export function wrongFeedback(level: SeqLevel, task: SeqTask): SeqFeedback {
  const oops = (text: string, speech = text): SeqFeedback => ({ text, speech, mood: 'oops', tone: 'oops' });
  const before = task.mode === 'fix' ? task.row.slice(0, task.wrong) : task.row;
  if (level.kind === 'both') return oops('Hoppá! Figyeld külön a színeket, és külön a formákat!');
  if (level.kind === 'translate' && task.ref) {
    const over = task.ref[task.row.length];
    const color = over.kind === 'part' ? COLOR_NAMES[over.color] : '';
    return oops(`Hoppá! Fölötte ${color} van. Milyen nyíl van a többi ${color} alatt?`);
  }
  const read = readRow(before, task.unit);
  const tail = level.kind === 'turn' ? '… és utána merre?' : '… és utána?';
  return oops(`Hoppá! ${read}${tail}`);
}

/** A part that is in its right place was tapped while looking for the one out of place. */
export function fixMissFeedback(task: SeqTask, misses: number): SeqFeedback {
  if (misses <= 1) {
    const text = 'Ez a darab jó helyen van. Mondd ki a sort, és figyeld, hol akad meg!';
    return { text, speech: text, mood: 'oops', tone: 'oops' };
  }
  const text = `Hallgasd: ${readRow(task.row, task.unit)}. Hol akad meg?`;
  return { text, speech: text, mood: 'oops', tone: 'oops' };
}

export function solvedFeedback(level: SeqLevel): SeqFeedback {
  const text = level.kind === 'fix' ? 'Ügyes vagy! A gép újra jól működik!' : 'Ügyes vagy! Minden sort folytattál!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}
