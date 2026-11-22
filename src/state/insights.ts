import { LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { LADDER_DEFS } from '../worlds/defs';
import { GAMES, LADDER_GAMES } from './games';
import { LADDER_LEVELS, LADDER_RULES, ladderOf } from './ladder';
import type { Progress } from './progress';
import { recentMarks, type LoggedGame } from './taskLog';
import { WORLD_IDS, type WorldId } from './worlds';

// Plain-language notes for parents on the overview page, one per game: what is going well, where a little
// help would pay off, or that there was too little play this week to say. Each comes with something to try
// at home, away from the screen. The notes say what the child does, never that they are "bad" at something.

export type InsightTone = 'tip' | 'good' | 'none';

export interface Insight {
  tone: InsightTone;
  title: string;
  text: string;
  /** A few words for the game's tile in the list under the notes. */
  short: string;
  /** Something to try together at home; absent on "too little play" notes. */
  home?: string;
  /** The game and world the note is about; absent on the fresh-profile note. */
  game?: string;
  world?: WorldId;
}

/** Fewer solved tasks than this in the last week: no opinion yet. */
export const MIN_TASKS = 3;
/** This many tasks in a row needing help make a tip, whatever came before. */
const HARD_RUN = 3;

interface GameText {
  id: LoggedGame;
  /** Where something happens ("A Virágsorban"), for the tip title. */
  where: string;
  /** What one solved task is called: feladat, kör, pálya… */
  unit: string;
  /** What needing help looks like in this game. */
  hard: string;
  home: string;
}

/** "a" or "az", as the level name is read aloud: az before a vowel, and before 1 (egy) and 5 (öt), not 10 or 11. */
export function article(word: string): 'a' | 'az' {
  return /^[aáeéiíoóöőuúüű]/i.test(word) || /^(1(?!\d)|5)/.test(word) ? 'az' : 'a';
}

const levelName = (levels: readonly { name: string }[], i: number) => levels[Math.min(levels.length - 1, i)].name;

/** Each levelled game's note texts, from its definition, in the order of the games on the home screens. */
const GAME_TEXTS: GameText[] = LADDER_GAMES.map((id) => ({ id, ...LADDER_DEFS[id].notes }));

function learnNote(p: Progress): Insight {
  const learned = Math.min(LEARN_MAX, p.games.learn.solved);
  const base = { game: GAMES.learn.name, world: GAMES.learn.world };
  if (learned === 0) {
    return { ...base, tone: 'none', title: 'Még nem kezdte el.', short: 'Még nem kezdte el.', text: 'Itt ismerkedik meg a számokkal 1-től 20-ig, időnyomás nélkül.' };
  }
  return {
    ...base,
    tone: 'good',
    short: learned >= LEARN_MAX ? 'Minden számot ismer.' : `${learned} számot ismer.`,
    title: learned >= LEARN_MAX ? 'Minden számot ismer 20-ig.' : `${learned} számot ismer 20-ig.`,
    text: learned >= LEARN_MAX ? 'A Számmagokban végigjárta a számokat 1-től 20-ig.' : `A Számmagokban a következő szám: ${learned + 1}.`,
    home: 'Számoljátok hangosan a lépcsőfokokat vagy a kanalakat a fiókban.'
  };
}

function gameNote(p: Progress, g: GameText, day: string): Insight {
  const marks = recentMarks(p, g.id, day);
  const { name, world } = GAMES[g.id];
  const base = { game: name, world };
  const ladder = ladderOf(p, g.id);
  const level = levelName(LADDER_LEVELS[g.id], ladder.level);

  // The game stepped back on its own a little while ago: say so, and that it climbs again by itself.
  if (ladder.lastChange === 'down' && ladder.sinceChange < 2 * LADDER_RULES[g.id].up) {
    return {
      ...base,
      tone: 'tip',
      title: `A ${name} visszalépett ${article(level)} „${level}” szintre.`,
      short: 'Visszalépett gyakorolni.',
      text: 'Néhány nehezebb feladat után a játék magától könnyebbet ad. Ha újra megy, magától lép vissza.',
      home: g.home
    };
  }

  if (marks.length < MIN_TASKS) {
    const ever = (p.taskLog[g.id] ?? []).length > 0;
    return { ...base, tone: 'none', title: ever ? 'Ezen a héten kevés játék.' : 'Még nincs elég játék.', short: ever ? 'Kevés játék a héten.' : 'Még kevés játék.', text: `Pár ${g.unit} után lesz mit mondani róla.` };
  }

  const helped = marks.filter((m) => m.h).length;
  const lastRun = marks.slice(-HARD_RUN);
  const hard = (lastRun.length === HARD_RUN && lastRun.every((m) => m.h)) || helped * 2 > marks.length;
  const art = article(level);
  if (hard) return { ...base, tone: 'tip', title: `${g.where} ${art} „${level}” még nehéz.`, short: 'Még nehéz, itt segíthetsz.', text: g.hard, home: g.home };

  return {
    ...base,
    tone: 'good',
    title: `${art === 'az' ? 'Az' : 'A'} „${level}” ${helped === 0 ? 'megy neki' : 'jól halad'}.`,
    short: `${marks.length - helped} / ${marks.length} segítség nélkül.`,
    text: `Ezen a héten ${marks.length - helped} ${g.unit} ment segítség nélkül, ${marks.length} közül.`,
    home: g.home
  };
}

/** One note per game, Számkertész first, in the order of the games on the home screens. */
export function gameNotes(p: Progress, day: string): Insight[] {
  return [learnNote(p), ...GAME_TEXTS.map((g) => gameNote(p, g, day))];
}

/**
 * The few notes worth reading first: where help pays off before what goes well, and one from each world
 * when both have something to say.
 */
export function insights(p: Progress, day: string, max = 4): Insight[] {
  // Számmagok only counts the numbers met; the other games say more, so its note comes last.
  const rank = (n: Insight) => (n.tone === 'tip' ? 0 : n.game === 'Számmagok' ? 2 : 1);
  const all = gameNotes(p, day).filter((n) => n.tone !== 'none');
  const ordered = all.map((n, i) => ({ n, i })).sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i).map((x) => x.n);

  const picked: Insight[] = [];
  for (const world of WORLD_IDS) {
    const first = ordered.find((n) => n.world === world);
    if (first && picked.length < max) picked.push(first);
  }
  for (const n of ordered) if (picked.length < max && !picked.includes(n)) picked.push(n);

  if (picked.length === 0) {
    return [{ tone: 'tip', title: 'Kezdjétek a Számmagokkal.', short: '', text: 'Ott ismerkedik meg a számokkal 1-től 20-ig, időnyomás nélkül.' }];
  }
  return picked.sort((a, b) => ordered.indexOf(a) - ordered.indexOf(b));
}

// Parents' gate: a multiplication 5–7 year olds cannot do yet. Two-digit answers, so a lucky tap rarely opens it.

export interface GateQuestion {
  a: number;
  b: number;
  answer: string;
}

const GATE_PAIRS: [number, number][] = [
  [6, 7], [7, 8], [8, 6], [9, 7], [6, 9], [8, 9], [7, 7], [9, 4]
];

export function gateQuestion(rand: () => number = Math.random): GateQuestion {
  const [a, b] = GATE_PAIRS[Math.floor(rand() * GATE_PAIRS.length) % GATE_PAIRS.length];
  return { a, b, answer: String(a * b) };
}
