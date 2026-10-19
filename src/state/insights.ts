import { ADD_LEVELS } from '../games/add/logic';
import { LEVELS as FLASH_LEVELS } from '../games/flash/logic';
import { LEARN_MAX } from '../games/learn/logic';
import { SHAPE_ORDER } from '../games/patterns/logic';
import { POTS_LEVELS } from '../games/pots/logic';
import { MIRROR_LEVELS } from '../games/robot/mirror';
import { PATH_LEVELS } from '../games/robot/path';
import { SCALE_LEVELS } from '../games/robot/scale';
import { SEQ_LEVELS } from '../games/robot/seq';
import { SORT_LEVELS } from '../games/robot/sort';
import { TRACE_ORDER } from '../games/trace/logic';
import { PLANTS } from '../games/water/logic';
import { LADDER_RULES, ladderOf, type LadderGame } from './ladder';
import type { Progress } from './progress';
import { recentMarks, type LoggedGame } from './taskLog';
import type { WorldId } from './worlds';

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
  world: WorldId;
  name: string;
  /** Where something happens ("A Virágsorban"), for the tip title. */
  where: string;
  /** What one solved task is called: feladat, kör, pálya… */
  unit: string;
  level: (p: Progress) => string;
  /** What needing help looks like in this game. */
  hard: string;
  home: string;
}

/** "a" or "az", as the level name is read aloud: az before a vowel, and before 1 (egy) and 5 (öt), not 10 or 11. */
export function article(word: string): 'a' | 'az' {
  return /^[aáeéiíoóöőuúüű]/i.test(word) || /^(1(?!\d)|5)/.test(word) ? 'az' : 'a';
}

const levelName = (levels: { name: string }[], i: number) => levels[Math.min(levels.length - 1, i)].name;

const GAMES: GameText[] = [
  {
    id: 'water', world: 'garden', name: 'Locsolás', where: 'A Locsolásban', unit: 'növény',
    level: (p) => (p.waterRound >= PLANTS.length ? '11–20 csepp' : '2–10 csepp'),
    hard: 'Többször is túlöntözte a növényt, mielőtt kijött a pontos szám.',
    home: 'Töltsetek egy pohárba pontosan annyi kanál vizet, amennyit kitaláltok.'
  },
  {
    id: 'patterns', world: 'garden', name: 'Virágsor', where: 'A Virágsorban', unit: 'sor',
    level: (p) => (p.patternRound >= SHAPE_ORDER.length ? 'Hiányzó virág' : 'Mi jön ezután?'),
    hard: 'A legutóbbi soroknál többször is mellényúlt, mielőtt megtalálta a jó virágot.',
    home: 'Rakjatok sort kanálból és villából, és kérdezd meg, mi jön ezután.'
  },
  {
    id: 'flash', world: 'garden', name: 'Magvillantás', where: 'A Magvillantásban', unit: 'feladat',
    level: (p) => levelName(FLASH_LEVELS, ladderOf(p, 'flash').level),
    hard: 'Gyakran kéri újra a magokat, vagy egyenként számolja meg őket.',
    home: 'Dobókockával: mondja meg, hány pötty van, számolás nélkül.'
  },
  {
    id: 'trace', world: 'garden', name: 'Mézút', where: 'A Mézútban', unit: 'számjegy',
    level: (p) => (p.traceRound >= TRACE_ORDER.length ? 'Halvány út' : 'Mézes út'),
    hard: 'Több számjegynél letért az útról, vagy megkérte Csepit, hogy mutassa meg.',
    home: 'Írjatok számokat ujjal lisztbe, homokba vagy a párás ablakra.'
  },
  {
    id: 'add', world: 'garden', name: 'Méhecske', where: 'A Méhecskében', unit: 'feladat',
    level: (p) => levelName(ADD_LEVELS, ladderOf(p, 'add').level),
    hard: 'Az utolsó feladatoknál többször kért segítséget.',
    home: 'Közös számolás az ujjakon vagy kanalakkal sokat segít.'
  },
  {
    id: 'pots', world: 'garden', name: 'Cserépbarátok', where: 'A Cserépbarátokban', unit: 'kör',
    level: (p) => levelName(POTS_LEVELS, ladderOf(p, 'pots').level),
    hard: 'Gyakran kellett, hogy Csepi együtt számolja vele az üres cserepeket.',
    home: 'Két kéz, tíz ujj: mutass fel néhányat, hány hiányzik a tízhez?'
  },
  {
    id: 'path', world: 'robot', name: 'Robotút', where: 'A Robotútban', unit: 'pálya',
    level: (p) => levelName(PATH_LEVELS, ladderOf(p, 'path').level),
    hard: 'A legutóbbi pályákon többször nekiment valaminek, vagy megnézte az utat.',
    home: 'Legyél te a robot: ő mondja el lépésenként, hogyan jutsz el az ajtótól a konyháig.'
  },
  {
    id: 'sort', world: 'robot', name: 'Válogatógép', where: 'A Válogatógépben', unit: 'kör',
    level: (p) => levelName(SORT_LEVELS, ladderOf(p, 'sort').level),
    hard: 'A legutóbbi körökben többször is rossz dobozba tette az alkatrészt.',
    home: 'Válogassátok szét a zoknikat előbb szín, aztán méret szerint.'
  },
  {
    id: 'scale', world: 'robot', name: 'Mérleg', where: 'A Mérlegnél', unit: 'kör',
    level: (p) => levelName(SCALE_LEVELS, ladderOf(p, 'scale').level),
    hard: 'Többször is Csavar segített megszámolni a két oldalt.',
    home: 'Egy vállfa két végére akasszatok zacskót, és tegyetek bele ugyanannyi kupakot.'
  },
  {
    id: 'seq', world: 'robot', name: 'Mintagép', where: 'A Mintagépben', unit: 'kör',
    level: (p) => levelName(SEQ_LEVELS, ladderOf(p, 'seq').level),
    hard: 'A legutóbbi körökben többször is rossz kártyát választott a hézagba.',
    home: 'Tapsoljatok mintát: taps, taps, dobbantás – és ő folytatja.'
  },
  {
    id: 'mirror', world: 'robot', name: 'Tükörgép', where: 'A Tükörgépben', unit: 'kör',
    level: (p) => levelName(MIRROR_LEVELS, ladderOf(p, 'mirror').level),
    hard: 'A legutóbbi körökben többször is rossz helyre tette a lámpát.',
    home: 'Tegyetek egy kézitükröt a rajz mellé: mi kerül a másik oldalra?'
  }
];

function learnNote(p: Progress): Insight {
  const learned = Math.min(LEARN_MAX, p.learnSolved);
  const base = { game: 'Számvetés', world: 'garden' as const };
  if (learned === 0) {
    return { ...base, tone: 'none', title: 'Még nem kezdte el.', short: 'Még nem kezdte el.', text: 'Itt ismerkedik meg a számokkal 1-től 20-ig, időnyomás nélkül.' };
  }
  return {
    ...base,
    tone: 'good',
    short: learned >= LEARN_MAX ? 'Minden számot ismer.' : `${learned} számot ismer.`,
    title: learned >= LEARN_MAX ? 'Minden számot ismer 20-ig.' : `${learned} számot ismer 20-ig.`,
    text: learned >= LEARN_MAX ? 'A Számvetésben végigjárta a számokat 1-től 20-ig.' : `A Számvetésben a következő szám: ${learned + 1}.`,
    home: 'Számoljátok hangosan a lépcsőfokokat vagy a kanalakat a fiókban.'
  };
}

function gameNote(p: Progress, g: GameText, day: string): Insight {
  const marks = recentMarks(p, g.id, day);
  const base = { game: g.name, world: g.world };
  const level = g.level(p);
  const ladder = g.id in LADDER_RULES ? ladderOf(p, g.id as LadderGame) : null;

  // The game stepped back on its own a little while ago: say so, and that it climbs again by itself.
  if (ladder?.lastChange === 'down' && ladder.sinceChange < 2 * LADDER_RULES[g.id as LadderGame].up) {
    return {
      ...base,
      tone: 'tip',
      title: `A ${g.name} visszalépett ${article(level)} „${level}” szintre.`,
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
  return [learnNote(p), ...GAMES.map((g) => gameNote(p, g, day))];
}

/**
 * The few notes worth reading first: where help pays off before what goes well, and one from each world
 * when both have something to say.
 */
export function insights(p: Progress, day: string, max = 4): Insight[] {
  // Számvetés only counts the numbers met; the other games say more, so its note comes last.
  const rank = (n: Insight) => (n.tone === 'tip' ? 0 : n.game === 'Számvetés' ? 2 : 1);
  const all = gameNotes(p, day).filter((n) => n.tone !== 'none');
  const ordered = all.map((n, i) => ({ n, i })).sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i).map((x) => x.n);

  const picked: Insight[] = [];
  for (const world of ['garden', 'robot'] as WorldId[]) {
    const first = ordered.find((n) => n.world === world);
    if (first && picked.length < max) picked.push(first);
  }
  for (const n of ordered) if (picked.length < max && !picked.includes(n)) picked.push(n);

  if (picked.length === 0) {
    return [{ tone: 'tip', title: 'Kezdjétek a Számvetéssel.', short: '', text: 'Ott ismerkedik meg a számokkal 1-től 20-ig, időnyomás nélkül.' }];
  }
  return picked.sort((a, b) => ordered.indexOf(a) - ordered.indexOf(b));
}

// Parents' gate: a multiplication 4–7 year olds cannot do yet. Two-digit answers, so a lucky tap rarely opens it.

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
