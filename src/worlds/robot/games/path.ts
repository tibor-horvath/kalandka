import { numberCount } from '../../../lib/numbers';
import type { Mood, Tone } from '../../../lib/types';
import { rng } from '../../../lib/rng';

// Robotút: guide the little robot across the workshop floor to its battery.
// First each arrow moves the robot at once; later the child lays out the whole program and presses play;
// then the robot turns and goes forward the way it faces; last, one card can repeat its step.
// Nothing fails: a bump stops the robot, Csavar points at the card, and the robot rolls back to the start.

/** 0 up, 1 right, 2 down, 3 left (clockwise, as the robot turns right). */
export type Dir = 0 | 1 | 2 | 3;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export interface Cell {
  x: number;
  y: number;
}

export interface Pose extends Cell {
  dir: Dir;
}

/** Arrows move the robot that way; the relative cards go forward or turn on the spot. */
export type Cmd = 'up' | 'right' | 'down' | 'left' | 'fwd' | 'turnL' | 'turnR';
export const ARROWS: Cmd[] = ['up', 'left', 'right', 'down'];
export const TURNS: Cmd[] = ['turnL', 'fwd', 'turnR'];
const ARROW_DIR: Partial<Record<Cmd, Dir>> = { up: 0, right: 1, down: 2, left: 3 };

export interface Card {
  cmd: Cmd;
  /** How many times the card runs (1 unless the level has repeats). */
  times: number;
}

export const MAX_TIMES = 3;

export interface PathLevel {
  /** Shown to parents. */
  name: string;
  /** step: each arrow moves at once; plan: lay out the cards, then play. */
  mode: 'step' | 'plan';
  /** absolute: up/down/left/right; relative: forward and turns. */
  moves: 'absolute' | 'relative';
  repeat: boolean;
  cols: number;
  rows: number;
  crates: [number, number];
  /** Length of the shortest program, in single steps. */
  steps: [number, number];
  /** Program slots (plan mode). */
  slots: number;
  /** The crates must stand in the way, so the straight route does not work. */
  detour?: boolean;
  /** Batteries to collect in one go (1 unless said). */
  batteries?: number;
  /**
   * The robot's charge on the advanced levels: the shortest way plus this many spare steps.
   * Every single step counts, turns too. Without it the charge never runs out.
   */
  charge?: number;
}

export const PATH_ROUNDS_PER_LEVEL = 5;

/**
 * Ten levels: stepping (4+), planning a program (5+), long courses, repeats with arrows,
 * turning the way the robot faces (6+), repeats with turns, and two batteries in one program (7).
 */
export const PATH_LEVELS: PathLevel[] = [
  { name: 'Lépésenként', mode: 'step', moves: 'absolute', repeat: false, cols: 4, rows: 4, crates: [0, 0], steps: [2, 4], slots: 0 },
  { name: 'Lépésenként, dobozokkal', mode: 'step', moves: 'absolute', repeat: false, cols: 5, rows: 4, crates: [2, 3], steps: [3, 6], slots: 0, detour: true },
  { name: 'Tervezz előre', mode: 'plan', moves: 'absolute', repeat: false, cols: 4, rows: 4, crates: [0, 1], steps: [2, 4], slots: 6 },
  { name: 'Tervezz, kerüld ki', mode: 'plan', moves: 'absolute', repeat: false, cols: 5, rows: 5, crates: [3, 4], steps: [4, 7], slots: 8, detour: true },
  { name: 'Hosszú út', mode: 'plan', moves: 'absolute', repeat: false, cols: 6, rows: 5, crates: [4, 6], steps: [7, 10], slots: 12, detour: true, charge: 2 },
  { name: 'Ismételd a nyilakat', mode: 'plan', moves: 'absolute', repeat: true, cols: 6, rows: 5, crates: [1, 3], steps: [6, 10], slots: 4 },
  { name: 'Fordulj!', mode: 'plan', moves: 'relative', repeat: false, cols: 5, rows: 4, crates: [0, 2], steps: [3, 6], slots: 8 },
  { name: 'Fordulj, kerüld ki', mode: 'plan', moves: 'relative', repeat: false, cols: 5, rows: 5, crates: [3, 4], steps: [6, 9], slots: 12, detour: true, charge: 2 },
  { name: 'Ismételd és fordulj', mode: 'plan', moves: 'relative', repeat: true, cols: 6, rows: 5, crates: [2, 4], steps: [6, 11], slots: 5, charge: 1 },
  { name: 'Két elem', mode: 'plan', moves: 'absolute', repeat: true, cols: 6, rows: 5, crates: [2, 4], steps: [7, 13], slots: 8, batteries: 2, charge: 2 }
];

/** Five solved courses per level, then the next level. */
export function pathLevelIndex(solved: number): number {
  return Math.min(PATH_LEVELS.length - 1, Math.floor(Math.max(0, solved) / PATH_ROUNDS_PER_LEVEL));
}

export interface Puzzle {
  level: PathLevel;
  cols: number;
  rows: number;
  start: Pose;
  /** The batteries; the course is done when the robot has reached every one. */
  goals: Cell[];
  crates: Cell[];
  /** Single steps the robot's charge lasts for, or null when it does not run out (see PathLevel.charge). */
  energy: number | null;
  /** One shortest program, used for "Mutasd az utat!" and to check the course can be done. */
  solution: Card[];
}

/** What it takes to run a program: the floor, not the level it came from. */
export type Course = Pick<Puzzle, 'cols' | 'rows' | 'start' | 'goals' | 'crates' | 'energy'>;

const key = (c: Cell) => `${c.x},${c.y}`;
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export function turn(dir: Dir, by: 1 | -1): Dir {
  return (((dir + by) % 4) + 4) % 4 as Dir;
}

function inside(p: { cols: number; rows: number }, c: Cell): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < p.cols && c.y < p.rows;
}

/** What stops the robot from entering a cell. */
export type Block = 'wall' | 'crate' | null;

export function blockAt(p: Pick<Puzzle, 'cols' | 'rows' | 'crates'>, c: Cell): Block {
  if (!inside(p, c)) return 'wall';
  return p.crates.some((k) => same(k, c)) ? 'crate' : null;
}

export interface StepResult {
  pose: Pose;
  /** The robot tried to move but something was in the way; it stays where it was. */
  bumped: Block;
}

/** One single step of a command (a card with times > 1 runs this several times). */
export function step(p: Pick<Puzzle, 'cols' | 'rows' | 'crates'>, pose: Pose, cmd: Cmd): StepResult {
  if (cmd === 'turnL') return { pose: { ...pose, dir: turn(pose.dir, -1) }, bumped: null };
  if (cmd === 'turnR') return { pose: { ...pose, dir: turn(pose.dir, 1) }, bumped: null };
  // An arrow first faces the robot that way, so it always looks where it goes.
  const dir = cmd === 'fwd' ? pose.dir : ARROW_DIR[cmd]!;
  const next = { x: pose.x + DX[dir], y: pose.y + DY[dir] };
  const bumped = blockAt(p, next);
  return bumped ? { pose: { ...pose, dir }, bumped } : { pose: { ...next, dir }, bumped: null };
}

export interface RunFrame {
  pose: Pose;
  /** Which card this step belongs to. */
  card: number;
  bumped: Block;
  /** Batteries reached so far (indices into goals). */
  collected: number[];
}

export interface RunResult {
  frames: RunFrame[];
  /** empty: the charge ran out on the way. */
  outcome: 'goal' | 'bump' | 'short' | 'empty';
  /** The card where the robot bumped, for Csavar to point at. */
  card: number | null;
}

/** Batteries reached at a pose, added to those reached before. */
export function collect(goals: Cell[], at: Cell, before: number[]): number[] {
  const i = goals.findIndex((g, k) => same(g, at) && !before.includes(k));
  return i < 0 ? before : [...before, i];
}

/** Runs a program from the start. The robot stops as soon as it has reached every battery, or when its charge is used up. */
export function run(p: Course, cards: Card[]): RunResult {
  let pose = p.start;
  let collected: number[] = [];
  const frames: RunFrame[] = [];
  for (let c = 0; c < cards.length; c++) {
    for (let t = 0; t < cards[c].times; t++) {
      if (p.energy !== null && frames.length >= p.energy) return { frames, outcome: 'empty', card: c };
      const r = step(p, pose, cards[c].cmd);
      pose = r.pose;
      if (!r.bumped) collected = collect(p.goals, pose, collected);
      frames.push({ pose, card: c, bumped: r.bumped, collected });
      if (r.bumped) return { frames, outcome: 'bump', card: c };
      if (collected.length === p.goals.length) return { frames, outcome: 'goal', card: null };
    }
  }
  return { frames, outcome: 'short', card: null };
}

/** Single steps a program takes when nothing is in the way. */
export function stepCount(cards: Card[]): number {
  return cards.reduce((n, c) => n + c.times, 0);
}

/** Runs of the same command fold into one card, up to MAX_TIMES each. */
export function fold(cmds: Cmd[]): Card[] {
  const out: Card[] = [];
  for (const cmd of cmds) {
    const last = out.at(-1);
    if (last && last.cmd === cmd && last.times < MAX_TIMES) last.times++;
    else out.push({ cmd, times: 1 });
  }
  return out;
}

/** Shortest command list that reaches every battery, or null if that cannot be done. */
export function shortest(p: Pick<Puzzle, 'cols' | 'rows' | 'crates' | 'start' | 'goals'>, moves: PathLevel['moves']): Cmd[] | null {
  const cmds: Cmd[] = moves === 'absolute' ? ['up', 'right', 'down', 'left'] : ['fwd', 'turnL', 'turnR'];
  // A state is where the robot is (and which way it faces, when that matters) plus which batteries it has.
  type State = { pose: Pose; got: number[] };
  const stateKey = (q: State) => `${moves === 'absolute' ? key(q.pose) : `${key(q.pose)},${q.pose.dir}`}|${[...q.got].sort().join(',')}`;
  const first: State = { pose: p.start, got: collect(p.goals, p.start, []) };
  const seen = new Map<string, { from: string | null; cmd: Cmd | null }>();
  seen.set(stateKey(first), { from: null, cmd: null });
  const queue: State[] = [first];
  while (queue.length) {
    const state = queue.shift()!;
    if (state.got.length === p.goals.length) {
      const out: Cmd[] = [];
      let k: string | null = stateKey(state);
      while (k) {
        const s: { from: string | null; cmd: Cmd | null } = seen.get(k)!;
        if (s.cmd) out.unshift(s.cmd);
        k = s.from;
      }
      return out;
    }
    for (const cmd of cmds) {
      const r = step(p, state.pose, cmd);
      if (r.bumped) continue;
      const next: State = { pose: r.pose, got: collect(p.goals, r.pose, state.got) };
      const k = stateKey(next);
      if (seen.has(k)) continue;
      seen.set(k, { from: stateKey(state), cmd });
      queue.push(next);
    }
  }
  return null;
}

/** Cells the robot passes through on a program, start included: the dotted way for "Mutasd az utat!". */
export function routeCells(p: Course, cards: Card[]): Cell[] {
  const cells: Cell[] = [p.start];
  for (const f of run(p, cards).frames) if (!same(f.pose, cells.at(-1)!)) cells.push({ x: f.pose.x, y: f.pose.y });
  return cells;
}

function pickInt(r: () => number, [lo, hi]: [number, number]): number {
  return lo + Math.floor(r() * (hi - lo + 1));
}

/** A small fixed course, only used if no random course fits (never seen in the tests). */
function fallback(level: PathLevel): Puzzle {
  const start: Pose = { x: 0, y: level.rows - 1, dir: 1 };
  const goals = Array.from({ length: level.batteries ?? 1 }, (_, i) => ({ x: Math.min(2 + i * 2, level.cols - 1), y: level.rows - 1 }));
  const base = { cols: level.cols, rows: level.rows, start, goals, crates: [] as Cell[] };
  return { ...base, level, energy: null, solution: fold(shortest(base, level.moves)!) };
}

/** The course for a round: always the same for the same level and round, and always possible. */
export function buildPuzzle(levelIndex: number, round: number): Puzzle {
  const level = PATH_LEVELS[Math.max(0, Math.min(PATH_LEVELS.length - 1, levelIndex))];
  const r = rng(levelIndex * 7919 + Math.max(0, Math.floor(round)) * 104729 + 13);
  const cells: Cell[] = [];
  for (let y = 0; y < level.rows; y++) for (let x = 0; x < level.cols; x++) cells.push({ x, y });

  for (let attempt = 0; attempt < 800; attempt++) {
    const pool = [...cells];
    const take = () => pool.splice(Math.floor(r() * pool.length), 1)[0];
    const start: Pose = { ...take(), dir: Math.floor(r() * 4) as Dir };
    const goals = Array.from({ length: level.batteries ?? 1 }, take);
    const crates = Array.from({ length: pickInt(r, level.crates) }, take);
    const base = { cols: level.cols, rows: level.rows, start, goals, crates };
    const cmds = shortest(base, level.moves);
    if (!cmds || cmds.length < level.steps[0] || cmds.length > level.steps[1]) continue;
    const manhattan = Math.abs(start.x - goals[0].x) + Math.abs(start.y - goals[0].y);
    if (level.detour && shortest(base, 'absolute')!.length === manhattan) continue;
    // In plan mode the program has to fit the slots; with repeats it must need them, too.
    const solution = level.repeat ? fold(cmds) : cmds.map((cmd) => ({ cmd, times: 1 }));
    if (level.mode === 'plan' && solution.length > level.slots) continue;
    if (level.repeat && cmds.length <= level.slots) continue;
    const energy = level.charge === undefined ? null : cmds.length + level.charge;
    return { ...base, level, energy, solution };
  }
  return fallback(level);
}

// ---------- Csavar's words ----------

const ORDINALS = ['első', 'második', 'harmadik', 'negyedik', 'ötödik', 'hatodik', 'hetedik', 'nyolcadik', 'kilencedik', 'tizedik', 'tizenegyedik', 'tizenkettedik'];

/** "az első", "a harmadik": the n-th card (0-based) with its article. */
export function nthCard(i: number): string {
  const word = ORDINALS[i] ?? `${i + 1}.`;
  return `${/^[aeiouáéíóöőúüű]/i.test(word) ? 'az' : 'a'} ${word}`;
}

export const CMD_LABELS: Record<Cmd, string> = {
  up: 'Fel',
  down: 'Le',
  left: 'Balra',
  right: 'Jobbra',
  fwd: 'Előre',
  turnL: 'Fordulj balra',
  turnR: 'Fordulj jobbra'
};

export interface PathFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function startFeedback(level: PathLevel): PathFeedback {
  if ((level.batteries ?? 1) > 1) {
    const text = 'Két elem vár! Tervezz olyan utat, ami mindkettőhöz elviszi a robotot.';
    return { text, speech: 'Most két elemet kell összegyűjteni! Tervezz olyan utat, ami mindkettőhöz elviszi a robotot. Az ismétlés is segít!', mood: 'smile', tone: 'plain' };
  }
  if (level.mode === 'step') {
    const text = 'Vezesd el a robotot az elemhez! Koppints a nyilakra.';
    return { text, speech: 'Segíts a robotnak! Lemerült, és ott az elem. ' + text, mood: 'smile', tone: 'plain' };
  }
  if (level.repeat) {
    const text = 'Kevés a hely! Tegyél le egy kártyát, és nyomd meg a ×2 vagy ×3 gombot.';
    return { text, speech: 'Kevés a hely a sorban. Ha egy lépés többször is kell, tedd le a kártyát, és nyomd meg a kétszer vagy a háromszor gombot! Aztán indulhat a robot.', mood: 'smile', tone: 'plain' };
  }
  if (level.moves === 'relative') {
    const text = 'Most a robot arra megy, amerre néz. Előre, vagy fordulj balra, jobbra!';
    return { text, speech: 'Figyelj, most a robot arra megy, amerre néz! Az Előre kártyával megy, a fordulós kártyákkal helyben fordul. Rakd sorba, aztán indulhat!', mood: 'smile', tone: 'plain' };
  }
  const text = 'Rakd sorba a nyilakat, aztán nyomd meg az Indulás gombot!';
  return { text, speech: 'Most előre tervezünk! ' + text, mood: 'smile', tone: 'plain' };
}

export function bumpFeedback(block: Block, card: number | null): PathFeedback {
  if (card === null) {
    const text = `Hoppá! Ott ${block === 'crate' ? 'egy doboz' : 'fal'} van. Próbáld másfelé!`;
    return { text, speech: text, mood: 'oops', tone: 'oops' };
  }
  const nth = nthCard(card);
  const at = `Hoppá! ${nth.charAt(0).toUpperCase() + nth.slice(1)} kártyánál a robot nekiment ${block === 'crate' ? 'egy doboznak' : 'a falnak'}.`;
  return {
    text: `${at} Cseréld ki azt a kártyát!`,
    speech: `${at} Koppints rá, hogy kivegyem, és tegyél be másikat!`,
    mood: 'oops',
    tone: 'oops'
  };
}

/** The program ended after one battery, with another still waiting. */
export const ONE_MORE_FEEDBACK: PathFeedback = {
  text: 'Az egyik elem megvan! A másik még vár. Folytasd a sort!',
  speech: 'Szuper, az egyik elem megvan! A másik még vár. Tegyél még kártyát a sor végére!',
  mood: 'think',
  tone: 'oops'
};

/** The charge ran out before the battery: say how many steps were missing, and to look for a shorter way. */
export function emptyChargeFeedback(missing: number): PathFeedback {
  const more = missing > 0 ? ` Még ${missing} lépés kellett volna.` : '';
  const spoken = missing > 0 ? ` Még ${numberCount(missing)} lépés kellett volna.` : '';
  return {
    text: `Hoppá, elfogyott az energia!${more} Keress rövidebb utat!`,
    speech: `Hoppá, a robot energiája elfogyott, mielőtt odaért!${spoken} Keress rövidebb utat!`,
    mood: 'oops',
    tone: 'oops'
  };
}

/** The program is longer than the charge, before it even runs. */
export const TOO_LONG_FEEDBACK: PathFeedback = {
  text: 'Ez az út hosszabb, mint a robot energiája. Keress rövidebbet!',
  speech: 'Figyelj, ez az út hosszabb, mint amennyi energiája van a robotnak. Próbálj rövidebb utat!',
  mood: 'think',
  tone: 'oops'
};

export const SHORT_FEEDBACK: PathFeedback = {
  text: 'Majdnem! Még nem ért oda. Tegyél még kártyát a sor végére!',
  speech: 'Majdnem! A robot még nem érte el az elemet. Tegyél még kártyát a sor végére, és indítsd újra!',
  mood: 'think',
  tone: 'oops'
};

export const FULL_FEEDBACK: PathFeedback = {
  text: 'Megtelt a sor. Koppints egy kártyára, hogy kivedd!',
  speech: 'Megtelt a sor. Ha valamelyik kártya nem kell, koppints rá, és kiveszem.',
  mood: 'think',
  tone: 'plain'
};

export const EMPTY_FEEDBACK: PathFeedback = {
  text: 'Előbb tegyél kártyákat a sorba!',
  speech: 'Még nincs kártya a sorban. Koppints a nyilakra, és rakd ki az utat!',
  mood: 'think',
  tone: 'plain'
};

export const ROUTE_FEEDBACK: PathFeedback = {
  text: 'Nézd, erre van az út!',
  speech: 'Nézd, megmutatom, merre van az út!',
  mood: 'smile',
  tone: 'plain'
};

/** After a couple of tries Csavar offers to show the way, never says "wrong". */
export const OFFER_FEEDBACK: PathFeedback = {
  text: 'Megmutassam az utat? Koppints a Mutasd az utat! gombra.',
  speech: 'Ez egy nehéz pálya. Ha szeretnéd, megmutatom az utat: koppints a Mutasd az utat gombra!',
  mood: 'think',
  tone: 'plain'
};

export function solvedFeedback(level: PathLevel): PathFeedback {
  const text = level.mode === 'plan' ? 'Ügyes vagy! Jól megtervezted, a robot feltöltődött!' : 'Ügyes vagy! A robot feltöltődött!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}
