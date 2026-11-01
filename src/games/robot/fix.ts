import type { Mood, Tone } from '../../lib/types';
import { rng } from '../flash/layout';
import { ARROWS, MAX_TIMES, TURNS, fold, routeCells, run, shortest, type Card, type Cell, type Cmd, type Course, type Dir, type PathLevel, type Pose } from './path';

// Hibakereső: the robot's program is already laid out, but it does not reach the battery. The child runs it,
// watches where it goes astray, taps the card that is to blame and puts it right, and the robot sets off again.
// First one arrow is wrong on a dotted way (for 5-year-olds), then the dots go, then a card is one too many,
// a card repeats the wrong number of times, a turn is wrong, and last two cards are wrong in one program.
// Nothing fails: a wrong tap gets a word on where to look, and after a second miss the card lights up.

export type FixKind = 'swap' | 'extra' | 'times' | 'two';

export interface FixLevel {
  /** Shown to parents. */
  name: string;
  kind: FixKind;
  moves: PathLevel['moves'];
  cols: number;
  rows: number;
  crates: [number, number];
  /** Length of the right program, in single steps. */
  steps: [number, number];
  /** The right way stays dotted on the floor. */
  dots: boolean;
  /** Tasks in one round. */
  tasks: number;
}

export const FIX_ROUNDS_PER_LEVEL = 5;

/** Misses on one card or one choice before the right one lights up. */
export const SHOW_FIX_AFTER = 2;

/**
 * Seven levels: one wrong arrow on a dotted way (5), a longer program, no dots among crates, a card too many (6),
 * the wrong number on a repeat, a wrong turn (6–7), and two wrong cards in one program (7).
 */
export const FIX_LEVELS: FixLevel[] = [
  { name: 'Rossz nyíl', kind: 'swap', moves: 'absolute', cols: 4, rows: 3, crates: [0, 0], steps: [2, 3], dots: true, tasks: 3 },
  { name: 'Hosszabb program', kind: 'swap', moves: 'absolute', cols: 5, rows: 4, crates: [1, 2], steps: [4, 5], dots: true, tasks: 3 },
  { name: 'Dobozok között', kind: 'swap', moves: 'absolute', cols: 5, rows: 5, crates: [3, 4], steps: [5, 7], dots: false, tasks: 3 },
  { name: 'Felesleges kártya', kind: 'extra', moves: 'absolute', cols: 5, rows: 4, crates: [1, 2], steps: [3, 5], dots: false, tasks: 3 },
  { name: 'Rossz szám', kind: 'times', moves: 'absolute', cols: 6, rows: 5, crates: [1, 3], steps: [5, 9], dots: false, tasks: 3 },
  { name: 'Fordulós hiba', kind: 'swap', moves: 'relative', cols: 5, rows: 4, crates: [0, 2], steps: [3, 6], dots: false, tasks: 3 },
  { name: 'Két hiba', kind: 'two', moves: 'absolute', cols: 6, rows: 5, crates: [3, 4], steps: [6, 8], dots: false, tasks: 2 }
];

/** A wrong card in the program and what belongs in its place; null when the card simply has to go. */
export interface Bug {
  at: number;
  want: Card | null;
}

export interface FixTask {
  level: FixLevel;
  course: Course;
  /** The program as the child finds it. */
  program: Card[];
  /** One wrong card, or two on Két hiba. */
  bugs: Bug[];
  /** The way the right program goes, start included. */
  route: Cell[];
}

export interface FixRound {
  level: FixLevel;
  tasks: FixTask[];
}

export const sameCard = (a: Card, b: Card) => a.cmd === b.cmd && a.times === b.times;

const cmdsOf = (moves: PathLevel['moves']) => (moves === 'absolute' ? ARROWS : TURNS);

/** The cards a wrong card can be swapped for: arrows or turns, or the numbers on a repeat. */
export function fixChoices(level: FixLevel, card: Card): Card[] {
  if (level.kind === 'times') return Array.from({ length: MAX_TIMES }, (_, i) => ({ cmd: card.cmd, times: i + 1 }));
  return cmdsOf(level.moves).map((cmd) => ({ cmd, times: 1 }));
}

const reaches = (c: Course, cards: Card[]) => run(c, cards).outcome === 'goal';
const put = (cards: Card[], at: number, card: Card) => cards.map((k, i) => (i === at ? card : k));
const without = (cards: Card[], at: number) => cards.filter((_, i) => i !== at);

/** Every single change to one card that gets the robot to the battery. */
export function singleFixes(c: Course, level: FixLevel, program: Card[]): Bug[] {
  if (level.kind === 'extra') return program.flatMap((_, at) => (reaches(c, without(program, at)) ? [{ at, want: null }] : []));
  return program.flatMap((card, at) => fixChoices(level, card).flatMap((want) => (!sameCard(want, card) && reaches(c, put(program, at, want)) ? [{ at, want }] : [])));
}

/** Every change to two cards that gets the robot to the battery. */
export function doubleFixes(c: Course, level: FixLevel, program: Card[]): Bug[][] {
  const out: Bug[][] = [];
  program.forEach((a, i) => {
    program.slice(i + 1).forEach((b, k) => {
      const j = i + 1 + k;
      for (const wa of fixChoices(level, a)) {
        for (const wb of fixChoices(level, b)) {
          if (sameCard(wa, a) || sameCard(wb, b)) continue;
          if (reaches(c, put(put(program, i, wa), j, wb))) out.push([{ at: i, want: wa }, { at: j, want: wb }]);
        }
      }
    });
  });
  return out;
}

const sameBug = (a: Bug, b: Bug) => a.at === b.at && (a.want === null || b.want === null ? a.want === b.want : sameCard(a.want, b.want));

function pickInt(r: () => number, [lo, hi]: [number, number]): number {
  return lo + Math.floor(r() * (hi - lo + 1));
}

/** Places on the floor where the right program is as long as the level asks. */
function randomCourse(level: FixLevel, r: () => number): { course: Course; good: Card[] } | null {
  const pool: Cell[] = [];
  for (let y = 0; y < level.rows; y++) for (let x = 0; x < level.cols; x++) pool.push({ x, y });
  const take = () => pool.splice(Math.floor(r() * pool.length), 1)[0];
  const start: Pose = { ...take(), dir: Math.floor(r() * 4) as Dir };
  const goals = [take()];
  const crates = Array.from({ length: pickInt(r, level.crates) }, take);
  const course: Course = { cols: level.cols, rows: level.rows, start, goals, crates, energy: null };
  const cmds = shortest(course, level.moves);
  if (!cmds || cmds.length < level.steps[0] || cmds.length > level.steps[1]) return null;
  return { course, good: level.kind === 'times' ? fold(cmds) : cmds.map((cmd) => ({ cmd, times: 1 })) };
}

const otherCmd = (level: FixLevel, cmd: Cmd, r: () => number): Cmd => {
  const others = cmdsOf(level.moves).filter((c) => c !== cmd);
  return others[Math.floor(r() * others.length)];
};

/** The right program with its mistakes put in, or null when this try does not work out. */
function breakProgram(level: FixLevel, good: Card[], r: () => number): { program: Card[]; bugs: Bug[] } | null {
  const spot = () => Math.floor(r() * good.length);
  const swapped = (at: number): Card => ({ cmd: otherCmd(level, good[at].cmd, r), times: 1 });
  switch (level.kind) {
    case 'extra': {
      const at = Math.floor(r() * (good.length + 1));
      const extra: Card = { cmd: cmdsOf(level.moves)[Math.floor(r() * 4)], times: 1 };
      return { program: [...good.slice(0, at), extra, ...good.slice(at)], bugs: [{ at, want: null }] };
    }
    case 'times': {
      const repeats = good.flatMap((c, i) => (c.times > 1 ? [i] : []));
      if (repeats.length === 0) return null;
      const at = repeats[Math.floor(r() * repeats.length)];
      const others = fixChoices(level, good[at]).filter((c) => !sameCard(c, good[at]));
      return { program: put(good, at, others[Math.floor(r() * others.length)]), bugs: [{ at, want: good[at] }] };
    }
    case 'two': {
      const [i, j] = [spot(), spot()].sort((a, b) => a - b);
      if (i === j) return null;
      return { program: put(put(good, i, swapped(i)), j, swapped(j)), bugs: [{ at: i, want: good[i] }, { at: j, want: good[j] }] };
    }
    default: {
      const at = spot();
      return { program: put(good, at, swapped(at)), bugs: [{ at, want: good[at] }] };
    }
  }
}

/** One way only to put it right, so the card the child looks for is the card the game means. */
function oneWayOnly(level: FixLevel, course: Course, program: Card[], bugs: Bug[]): boolean {
  if (reaches(course, program)) return false;
  const single = singleFixes(course, level, program);
  if (level.kind !== 'two') return single.length === 1 && sameBug(single[0], bugs[0]);
  if (single.length > 0) return false;
  const double = doubleFixes(course, level, program);
  return double.length === 1 && double[0].every((b, i) => sameBug(b, bugs[i]));
}

function buildTask(level: FixLevel, r: () => number, before: FixTask[]): FixTask {
  // Tries are cheap and most of them work, so this always ends soon; the tests run every level through it.
  for (;;) {
    const placed = randomCourse(level, r);
    if (!placed) continue;
    const { course, good } = placed;
    const broken = breakProgram(level, good, r);
    if (!broken || !oneWayOnly(level, course, broken.program, broken.bugs)) continue;
    const task: FixTask = { level, course, ...broken, route: routeCells(course, good) };
    if (before.some((t) => JSON.stringify(t.program) === JSON.stringify(task.program) && JSON.stringify(t.course) === JSON.stringify(course))) continue;
    return task;
  }
}

/** The tasks of a round: always the same for the same level and round. */
export function buildFixRound(levelIndex: number, round: number): FixRound {
  const level = FIX_LEVELS[Math.max(0, Math.min(FIX_LEVELS.length - 1, levelIndex))];
  const r = rng(levelIndex * 7919 + Math.max(0, Math.floor(round)) * 104729 + 29);
  const tasks: FixTask[] = [];
  while (tasks.length < level.tasks) tasks.push(buildTask(level, r, tasks));
  return { level, tasks };
}

// ---------- Csavar's words ----------

export interface FixFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const plain = (text: string, speech = text, mood: Mood = 'smile'): FixFeedback => ({ text, speech, mood, tone: 'plain' });
const oops = (text: string, speech = text): FixFeedback => ({ text, speech, mood: 'oops', tone: 'oops' });

export function startFeedback(level: FixLevel): FixFeedback {
  if (level.kind === 'extra') {
    const text = 'Egy kártya felesleges! Nyomd meg az Indulást, és figyeld a robotot.';
    return plain(text, 'Ebben a programban van egy kártya, ami nem kell. Nyomd meg az Indulást, és figyeld, mit csinál a robot!');
  }
  if (level.kind === 'times') {
    const text = 'Az egyik kártyán rossz a szám! Nyomd meg az Indulást, és számold a lépéseket.';
    return plain(text, 'Az egyik kártyán rossz szám van, a robot túl sokszor vagy túl kevésszer lép. Nyomd meg az Indulást, és számold a lépéseket!');
  }
  if (level.kind === 'two') {
    const text = 'Most két kártya hibás! Nyomd meg az Indulást, és figyeld a robotot.';
    return plain(text, 'Ebben a programban két kártya is hibás. Nyomd meg az Indulást, és figyeld, hol téved el a robot!');
  }
  if (level.moves === 'relative') {
    const text = 'Egy kártya hibás! A robot arra megy, amerre néz. Nyomd meg az Indulást!';
    return plain(text, 'Egy kártya hibás. Figyelj, a robot arra megy, amerre néz! Nyomd meg az Indulást, és nézd, hol téved el.');
  }
  if (level.dots) {
    const text = 'Egy kártya hibás! A pöttyök mutatják az utat. Nyomd meg az Indulást!';
    return plain(text, 'Valaki összekevert egy kártyát, és a robot nem jut el az elemhez. A pöttyök mutatják a jó utat. Nyomd meg az Indulást, és figyeld, hol tér le róla!');
  }
  const text = 'Egy kártya hibás! Nyomd meg az Indulást, és figyeld a robotot.';
  return plain(text, 'Valaki összekevert egy kártyát, és a robot nem jut el az elemhez. Nyomd meg az Indulást, és figyeld, hol téved el!');
}

/** The robot ran the broken program: not the child's slip, so no "Hoppá". */
export function ranFeedback(level: FixLevel): FixFeedback {
  const ask = level.kind === 'extra' ? 'Melyik kártya nem kell? Koppints rá!' : level.kind === 'times' ? 'Melyik kártyán rossz a szám? Koppints rá!' : 'Melyik kártya hibás? Koppints rá!';
  return plain(`A robot nem jutott el az elemhez. ${ask}`, `A robot nem jutott el az elemhez. ${ask}`, 'think');
}

/** A card that is fine: say which way to look, never that the child was wrong. */
export function goodCardFeedback(tapped: number, bugs: Bug[]): FixFeedback {
  if (bugs.every((b) => tapped < b.at)) {
    const text = 'Hoppá! Ez a kártya jó, idáig jól ment a robot. Nézd a következőket!';
    return oops(text);
  }
  return oops('Hoppá! Ez a kártya jó. A hiba előbb van, nézd a korábbiakat!');
}

export function foundFeedback(level: FixLevel): FixFeedback {
  if (level.kind === 'extra') return plain('Megvan! Ez a kártya nem kell. Nézzük, most odaér-e!');
  if (level.kind === 'times') return plain('Megvan a hiba! Hányszor lépjen? Válassz számot!');
  return plain('Megvan a hiba! Mi kell a helyére? Válassz kártyát!');
}

export function wrongPickFeedback(level: FixLevel): FixFeedback {
  return oops(`Hoppá! Így sem ért oda. Próbálj másik ${level.kind === 'times' ? 'számot' : 'kártyát'}!`);
}

/** Két hiba: one card put right, the robot got further, and one is still wrong. */
export const ONE_MORE_FEEDBACK = plain('Már jobb! De még egy kártya hibás. Koppints rá!', 'Már jobb, a robot messzebb jutott! De még egy kártya hibás. Koppints rá!', 'think');

export const SHOW_CARD_FEEDBACK = plain('Nézd, ez a kártya a hibás!', 'Nézd, megmutatom, melyik kártya a hibás. Koppints rá!', 'think');
export const SHOW_CHOICE_FEEDBACK = plain('Nézd, ez kell a helyére!', 'Nézd, megmutatom, mi kell a helyére.', 'think');

const PRAISE = ['Ügyes vagy! Megjavítottad a programot!', 'Szép munka! A robot odaért az elemhez!', 'Ügyes! Megtaláltad a hibát!'];

export function fixedFeedback(n: number): FixFeedback {
  const text = PRAISE[n % PRAISE.length];
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

export function solvedFeedback(): FixFeedback {
  const text = 'Minden programot megjavítottál!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}
