import type { Mood, Tone } from '../../../lib/types';
import { article, capitalize, numberAttr } from '../../../lib/numbers';
import { rng } from '../../../lib/rng';
import { COLORS, COLOR_NAMES, type Color } from './sort';

// Tükörgép: a lamp board with a mirror across it. What shines on one side has to shine on the
// other, just as far from the mirror. First one lamp (for 5-year-olds), then several, then half a
// picture to finish, in one colour and then with paint pots; then the mirror lies flat; then
// telling a true reflection from a plain copy or a turned shape; last a board the machine got
// wrong in one place. Nothing fails: a wrong lamp blinks orange and goes out, Csavar counts the
// steps from the mirror, and after a second miss the pair to light glows.

/** v: the mirror stands between the left and the right half; h: it lies between the top and the bottom half. */
export type Axis = 'v' | 'h';

export interface Cell {
  r: number;
  c: number;
}

export interface Lamp extends Cell {
  color: Color;
}

export type MirrorKind = 'one' | 'many' | 'picture' | 'paint' | 'flat' | 'pick' | 'fix';

export interface MirrorLevel {
  /** Shown to parents. */
  name: string;
  kind: MirrorKind;
  /** Tasks in one round. */
  tasks: number;
}

export const MIRROR_ROUNDS_PER_LEVEL = 5;

/**
 * Seven levels: one lamp (4+), several lamps, half a picture (5+), a coloured picture with paint
 * pots, the mirror lying flat (6+), reflection or copy, and the board with one lamp wrong (7).
 */
export const MIRROR_LEVELS: MirrorLevel[] = [
  { name: 'Egy lámpa', kind: 'one', tasks: 3 },
  { name: 'Több lámpa', kind: 'many', tasks: 3 },
  { name: 'Fél kép', kind: 'picture', tasks: 2 },
  { name: 'Színes kép', kind: 'paint', tasks: 2 },
  { name: 'Fel-le tükör', kind: 'flat', tasks: 3 },
  { name: 'Tükör vagy másolat?', kind: 'pick', tasks: 3 },
  { name: 'Hibás tükör', kind: 'fix', tasks: 3 }
];

/** Five solved rounds per level, then the next level. */
export function mirrorLevelIndex(solved: number): number {
  return Math.min(MIRROR_LEVELS.length - 1, Math.floor(Math.max(0, solved) / MIRROR_ROUNDS_PER_LEVEL));
}

/** Light the reflections of the given lamps (with paint pots when `paint`). */
export interface LightTask {
  mode: 'light';
  axis: Axis;
  rows: number;
  cols: number;
  /** Lamps on the first half (left, or top). */
  given: Lamp[];
  /** Their reflections, still dark. */
  targets: Lamp[];
  /** The child picks the colour first. */
  paint: boolean;
  /** The picture's name when the lamps draw one ("szív"). */
  picture?: string;
}

/** Pick the true reflection of a shape from a copy and a turned shape. */
export interface PickTask {
  mode: 'pick';
  /** The shape's frame is size × size. */
  size: number;
  color: Color;
  shape: Cell[];
  choices: { cells: Cell[]; kind: 'mirror' | 'copy' | 'turn' }[];
}

/** The second half is lit, but one place is wrong: an extra lamp or a missing one. */
export interface FixTask {
  mode: 'fix';
  axis: Axis;
  rows: number;
  cols: number;
  given: Lamp[];
  /** The second half as the machine lit it. */
  shown: Lamp[];
  /** The place that is wrong; `lamp` is what belongs there (missing), or null (extra). */
  fault: Cell & { lamp: Lamp | null };
  picture?: string;
}

export type MirrorTask = LightTask | PickTask | FixTask;

export interface MirrorRound {
  level: MirrorLevel;
  tasks: MirrorTask[];
}

// ---------- the board ----------

export const key = (p: Cell) => `${p.r},${p.c}`;

/** The cell across the mirror. */
export function reflect(p: Cell, axis: Axis, rows: number, cols: number): Cell {
  return axis === 'v' ? { r: p.r, c: cols - 1 - p.c } : { r: rows - 1 - p.r, c: p.c };
}

/** Whether a cell is on the first half (left, or top), where the given lamps are. */
export function onGivenSide(p: Cell, axis: Axis, rows: number, cols: number): boolean {
  return axis === 'v' ? p.c < cols / 2 : p.r < rows / 2;
}

/** Steps from the mirror: 1 for the cells right next to it. */
export function stepsFromMirror(p: Cell, axis: Axis, rows: number, cols: number): number {
  const at = axis === 'v' ? p.c : p.r;
  const n = axis === 'v' ? cols : rows;
  return at < n / 2 ? n / 2 - at : at - n / 2 + 1;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const mirrorLamps = (given: Lamp[], axis: Axis, rows: number, cols: number): Lamp[] =>
  given.map((l) => ({ ...reflect(l, axis, rows, cols), color: l.color }));

// ---------- pictures ----------

interface Picture {
  name: string;
  /** The left half, three columns by five rows: r red, b blue, y yellow, . dark. The right half is its reflection. */
  half: string[];
}

const CHAR_COLOR: Record<string, Color> = { r: 'red', b: 'blue', y: 'yellow' };

/** Six pictures, 6–9 lamps to light on the right half, each drawn so a child knows it when it is whole. */
export const PICTURES: Picture[] = [
  { name: 'szív', half: ['.r.', 'r.r', 'r..', '.r.', '..r'] },
  { name: 'robot', half: ['..y', '.bb', '.yb', '.bb', '.b.'] },
  { name: 'rakéta', half: ['..r', '.bb', '.yb', '.bb', 'r.y'] },
  { name: 'ház', half: ['..r', '.r.', 'r..', 'b.y', 'bbb'] },
  { name: 'pillangó', half: ['b..', 'bb.', '.by', 'bb.', 'b..'] },
  { name: 'virág', half: ['..r', '.ry', '..r', '..b', 'bb.'] }
];

export const PICTURE_ROWS = 5;
export const PICTURE_COLS = 6;

/** A picture's left-half lamps; in one colour (the picture's commonest) unless `colored`. */
export function pictureLamps(pic: Picture, colored: boolean): Lamp[] {
  const lamps: Lamp[] = [];
  pic.half.forEach((row, r) => [...row].forEach((ch, c) => ch !== '.' && lamps.push({ r, c, color: CHAR_COLOR[ch] })));
  if (colored) return lamps;
  const counts = COLORS.map((col) => lamps.filter((l) => l.color === col).length);
  const mono = COLORS[counts.indexOf(Math.max(...counts))];
  return lamps.map((l) => ({ ...l, color: mono }));
}

// ---------- making tasks ----------

/** k different lamps on the given half, one colour. */
function randomLamps(k: number, axis: Axis, rows: number, cols: number, color: Color, rand: () => number): Lamp[] {
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (onGivenSide({ r, c }, axis, rows, cols)) cells.push({ r, c });
  return shuffle(cells, rand)
    .slice(0, k)
    .map((p) => ({ ...p, color }));
}

function lightTask(axis: Axis, rows: number, cols: number, given: Lamp[], paint = false, picture?: string): LightTask {
  return { mode: 'light', axis, rows, cols, given, targets: mirrorLamps(given, axis, rows, cols), paint, picture };
}

const flip = (cells: Cell[], size: number) => cells.map((p) => ({ r: p.r, c: size - 1 - p.c }));
const turnQuarter = (cells: Cell[], size: number) => cells.map((p) => ({ r: p.c, c: size - 1 - p.r }));
const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((p) => b.some((q) => q.r === p.r && q.c === p.c));

function connected(cells: Cell[]): boolean {
  const seen = new Set([key(cells[0])]);
  const todo = [cells[0]];
  while (todo.length) {
    const p = todo.pop()!;
    for (const q of cells) {
      if (!seen.has(key(q)) && Math.abs(q.r - p.r) + Math.abs(q.c - p.c) === 1) {
        seen.add(key(q));
        todo.push(q);
      }
    }
  }
  return seen.size === cells.length;
}

const PICK_SIZE = 3;

/** A joined-up shape of 4–5 lamps whose reflection, copy and quarter turn all look different. */
function pickTask(t: number, rand: () => number): PickTask {
  const all: Cell[] = [];
  for (let r = 0; r < PICK_SIZE; r++) for (let c = 0; c < PICK_SIZE; c++) all.push({ r, c });
  const n = 4 + (t % 2);
  for (;;) {
    const shape = shuffle(all, rand).slice(0, n);
    const mirror = flip(shape, PICK_SIZE);
    const turned = turnQuarter(shape, PICK_SIZE);
    if (!connected(shape) || sameCells(shape, mirror) || sameCells(turned, shape) || sameCells(turned, mirror)) continue;
    return {
      mode: 'pick',
      size: PICK_SIZE,
      color: COLORS[Math.floor(rand() * COLORS.length)],
      shape,
      choices: shuffle(
        [
          { cells: mirror, kind: 'mirror' as const },
          { cells: shape, kind: 'copy' as const },
          { cells: turned, kind: 'turn' as const }
        ],
        rand
      )
    };
  }
}

/** A picture whose right half is lit with one lamp missing (even tasks) or one too many (odd tasks). */
function fixTask(pic: Picture, t: number, rand: () => number): FixTask {
  const rows = PICTURE_ROWS;
  const cols = PICTURE_COLS;
  const given = pictureLamps(pic, true);
  const right = mirrorLamps(given, 'v', rows, cols);
  if (t % 2 === 0) {
    const lamp = right[Math.floor(rand() * right.length)];
    return { mode: 'fix', axis: 'v', rows, cols, given, shown: right.filter((l) => l !== lamp), fault: { r: lamp.r, c: lamp.c, lamp }, picture: pic.name };
  }
  const empty: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = cols / 2; c < cols; c++) if (!right.some((l) => l.r === r && l.c === c)) empty.push({ r, c });
  const spot = empty[Math.floor(rand() * empty.length)];
  const extra: Lamp = { ...spot, color: given[0].color };
  return { mode: 'fix', axis: 'v', rows, cols, given, shown: [...right, extra], fault: { ...spot, lamp: null }, picture: pic.name };
}

function buildTask(level: MirrorLevel, round: number, t: number, rand: () => number): MirrorTask {
  const color = COLORS[Math.floor(rand() * COLORS.length)];
  const pic = PICTURES[(round * level.tasks + t) % PICTURES.length];
  switch (level.kind) {
    case 'one':
      return lightTask('v', 3, 6, randomLamps(1, 'v', 3, 6, color, rand));
    case 'many':
      return lightTask('v', 4, 6, randomLamps(2 + t, 'v', 4, 6, color, rand));
    case 'picture':
      return lightTask('v', PICTURE_ROWS, PICTURE_COLS, pictureLamps(pic, false), false, pic.name);
    case 'paint': {
      // Only pictures with more than one colour need the paint pots.
      const colored = PICTURES.filter((p) => new Set(pictureLamps(p, true).map((l) => l.color)).size > 1);
      const cpic = colored[(round * level.tasks + t) % colored.length];
      return lightTask('v', PICTURE_ROWS, PICTURE_COLS, pictureLamps(cpic, true), true, cpic.name);
    }
    case 'flat':
      return lightTask('h', 6, 5, randomLamps(3 + Math.min(1, t), 'h', 6, 5, color, rand));
    case 'pick':
      return pickTask(t, rand);
    case 'fix':
      return fixTask(pic, t, rand);
  }
}

/** The same round every time for a level and round number. */
export function buildMirrorRound(levelIndex: number, round: number): MirrorRound {
  const level = MIRROR_LEVELS[Math.max(0, Math.min(MIRROR_LEVELS.length - 1, levelIndex))];
  const rand = rng(round * 37 + levelIndex * 1009 + 5);
  return { level, tasks: Array.from({ length: level.tasks }, (_, t) => buildTask(level, round, t, rand)) };
}

/** The paint pots for a task: every colour its lamps use, in the usual order. */
export function paintColors(task: LightTask): Color[] {
  return COLORS.filter((c) => task.targets.some((l) => l.color === c));
}

/**
 * The target to point at after a miss on `tap`: a dark one in the same row (column, for a flat
 * mirror) if there is one, else the nearest dark one.
 */
export function nearestTarget(task: LightTask, lit: Set<string>, tap: Cell | null): Lamp | null {
  const dark = task.targets.filter((l) => !lit.has(key(l)));
  if (!dark.length) return null;
  if (!tap) return dark[0];
  const line = dark.filter((l) => (task.axis === 'v' ? l.r === tap.r : l.c === tap.c));
  const pool = line.length ? line : dark;
  return pool.reduce((best, l) => (Math.abs(l.r - tap.r) + Math.abs(l.c - tap.c) < Math.abs(best.r - tap.r) + Math.abs(best.c - tap.c) ? l : best));
}

// ---------- Csavar's lines ----------

export interface MirrorFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const plain = (text: string, speech = text): MirrorFeedback => ({ text, speech, mood: 'smile', tone: 'plain' });
const oops = (text: string, speech = text): MirrorFeedback => ({ text, speech, mood: 'oops', tone: 'oops' });

/** "két lépésre" */
const steps = (n: number) => `${numberAttr(n)} lépésre`;

export function startFeedback(level: MirrorLevel, first: boolean): MirrorFeedback {
  switch (level.kind) {
    case 'one':
      return plain(
        'Hol lesz a lámpa tükörképe?',
        `${first ? 'Ez a tükörgép. ' : ''}Ami a tükör egyik oldalán világít, annak a másik oldalon is világítania kell, ugyanolyan messze a tükörtől. Hol lesz a lámpa tükörképe?`
      );
    case 'many':
      return plain('Gyújtsd fel mind a tükörképüket!', 'Sok lámpa ég. Gyújtsd fel mindegyiknek a tükörképét a tükör másik oldalán!');
    case 'picture':
      return plain('Rajzold meg a kép másik felét!', 'Itt csak egy fél kép van. Rajzold meg a másik felét a tükörben! Mi lesz belőle?');
    case 'paint':
      return plain('Válassz színt, és rajzold meg a másik felét!', 'Most színes a kép! Válaszd ki a festéket, aztán koppints oda, ahol annak a színnek világítania kell.');
    case 'flat':
      return plain('A tükör most fekszik. Gyújtsd fel lent!', 'Most a tükör lefeküdt! Ami fent világít, annak lent is világítania kell, ugyanolyan messze a tükörtől.');
    case 'pick':
      return plain('Melyik a tükörképe?', 'Nézd meg a formát! Melyik a tükörképe? Vigyázz, a tükörben ami balra van, az jobbra kerül!');
    case 'fix':
      return plain('Egy lámpa rossz. Keresd meg!', 'Hoppá, a tükörgép tévedett! Egy helyen rossz a kép: ott valami hiányzik, vagy túl sok. Koppints oda!');
  }
}

/** The line at the start of a later task in the round: the short one. */
export function nextTaskFeedback(level: MirrorLevel): MirrorFeedback {
  const f = startFeedback(level, false);
  return { ...f, speech: f.text };
}

/** Tapping a lamp that is already lit. */
export function lampFeedback(p: Lamp, axis: Axis, rows: number, cols: number): MirrorFeedback {
  return plain(`Ez a ${COLOR_NAMES[p.color]} lámpa ${steps(stepsFromMirror(p, axis, rows, cols))} van a tükörtől.`);
}

/** Tapping a dark cell on the given side. */
export function givenSideFeedback(axis: Axis): MirrorFeedback {
  return plain(axis === 'v' ? 'Ezen az oldalon már minden kész. A tükör másik oldalán gyújts lámpát!' : 'Fent már minden kész. A tükör alatt gyújts lámpát!');
}

const RIGHT = ['Úgy van!', 'Pontosan!', 'Ügyes!', 'Ez az!'];

/** A lamp lit in the right place. */
export function lampRightFeedback(n: number): MirrorFeedback {
  const text = RIGHT[n % RIGHT.length];
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** A dark cell tapped that is not a reflection: Csavar counts the steps of the lamp to mirror. */
export function lampWrongFeedback(task: LightTask, target: Lamp | null): MirrorFeedback {
  if (!target) return oops('Hoppá! Ide nem kell lámpa.');
  const src = { ...reflect(target, task.axis, task.rows, task.cols), color: target.color };
  const d = steps(stepsFromMirror(src, task.axis, task.rows, task.cols));
  const line = task.axis === 'v' ? 'ugyanabban a sorban' : 'ugyanabban az oszlopban';
  return oops(`Hoppá! Ez a ${COLOR_NAMES[src.color]} lámpa ${d} van a tükörtől. A tükörképe is ${d} lesz, ${line}.`);
}

/** The right place, but with the wrong paint. */
export function wrongPaintFeedback(target: Lamp): MirrorFeedback {
  return oops(`Hoppá! Jó helyen vagy, de ide ${COLOR_NAMES[target.color]} lámpa kell. Válaszd a ${COLOR_NAMES[target.color]} festéket!`);
}

/** Choosing a paint pot. */
export function paintFeedback(color: Color): MirrorFeedback {
  return plain(`${capitalize(COLOR_NAMES[color])} festék. Hova kell ${COLOR_NAMES[color]} lámpa?`);
}

/** A board finished: "Kész a szív!" for a picture. */
export function boardDoneFeedback(n: number, picture?: string): MirrorFeedback {
  const word = RIGHT[n % RIGHT.length];
  const text = picture ? `${word} Kész ${article(picture)} ${picture}!` : `${word} Minden lámpának ott a tükörképe!`;
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** Misses on one task before the next pair (or the right card, or the wrong lamp) glows. */
export const SHOW_AFTER = 2;
export const SHOW_FAULT_AFTER = 3;

export function pickWrongFeedback(kind: 'copy' | 'turn'): MirrorFeedback {
  return kind === 'copy'
    ? oops('Hoppá! Ez csak másolat. A tükörben ami balra van, az jobbra kerül.')
    : oops('Hoppá! Ez el van fordítva. A tükörkép nem fordul, csak átfordul a tükörben.');
}

export function pickRightFeedback(n: number): MirrorFeedback {
  const text = `${RIGHT[n % RIGHT.length]} Ez a tükörképe!`;
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** Hibás tükör: a place that is right was tapped. */
export function fixMissFeedback(task: FixTask, p: Cell, misses: number): MirrorFeedback {
  if (onGivenSide(p, task.axis, task.rows, task.cols)) return oops('Ezen az oldalon minden jó. A tükör másik oldalán keresd a hibát!');
  const lit = task.shown.some((l) => l.r === p.r && l.c === p.c);
  const base = lit ? 'Ez a lámpa jó helyen van: a párja ott ég a tükör másik oldalán.' : 'Itt jó, hogy sötét: a párja helyén sincs lámpa.';
  return oops(misses >= 2 ? `${base} Nézd meg soronként, mindkét oldalon!` : base);
}

export function fixFoundFeedback(task: FixTask): MirrorFeedback {
  const text = task.fault.lamp ? 'Megtaláltad! Itt hiányzott egy lámpa.' : 'Megtaláltad! Ez a lámpa fölösleges volt.';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

export function solvedFeedback(level: MirrorLevel): MirrorFeedback {
  const text = level.kind === 'fix' ? 'Ügyes vagy! A tükörgép újra jól működik!' : 'Ügyes vagy! Minden tükörképet megtaláltál!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** For screen readers. */
export function cellLabel(p: Cell, lamp: Lamp | undefined): string {
  return `${p.r + 1}. sor, ${p.c + 1}. oszlop${lamp ? `: ${COLOR_NAMES[lamp.color]} lámpa` : ''}`;
}
