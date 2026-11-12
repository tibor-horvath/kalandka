import { LEARN_CYCLE, LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { GAMES, LADDER_GAMES, type GameId, type LadderGame } from './games';
import { LADDER_LEVELS, LADDER_RULES, ladderOf, startAt, withLadder } from './ladder';
import type { Progress } from './progress';
import { WORLDS, type WorldId } from './worlds';

// Per-game level settings for the parents' corner.
// Each setting reads the game's current level from progress and writes a new starting point;
// from there every game keeps progressing on its own.

export interface LevelOption {
  value: number;
  label: string;
}

export interface LevelSetting {
  id: GameId;
  world: WorldId;
  game: string;
  hint: string;
  options: LevelOption[];
  current: (p: Progress) => number;
  apply: (p: Progress, value: number) => Progress;
}

const LEARN_STARTS: LevelOption[] = [
  { value: 0, label: '1-től' },
  { value: 5, label: '6-tól' },
  { value: 10, label: '11-től' },
  { value: 15, label: '16-tól' },
  { value: LEARN_MAX, label: 'Vegyesen' }
];

const learn: LevelSetting = {
  id: 'learn',
  world: GAMES.learn.world,
  game: GAMES.learn.name,
  hint: 'Innen tanulja sorban a számokat 20-ig, aztán vegyesen ismétli őket.',
  options: LEARN_STARTS,
  current: (p) => {
    const r = p.learnRound % LEARN_CYCLE;
    return [...LEARN_STARTS].reverse().find((o) => r >= o.value)!.value;
  },
  apply: (p, v) => ({ ...p, learnRound: v })
};

/** How the hint names a task the child solved alone, and one that needed help. */
interface StepWords {
  good: string;
  hard: string;
  /** Explains what "needing help" means where it is not obvious. */
  note?: string;
  /** Names the levels that want a longer row (the rule's `upAt`), as in "a vegyes szinteken". */
  longer?: string;
}

const STEP_WORDS: Record<LadderGame, StepWords> = {
  water: { good: 'jó virág', hard: 'túlöntözött', note: 'kannával lehet túlönteni' },
  patterns: { good: 'jó válasz', hard: 'nehéz feladat', longer: 'a vegyes szinteken' },
  trace: { good: 'szám', hard: 'nehéz szám' },
  flash: { good: 'jó válasz', hard: 'nehéz feladat' },
  add: { good: 'jó válasz', hard: 'nehéz feladat' },
  pots: { good: 'jó válasz', hard: 'nehéz feladat' },
  path: { good: 'jó pálya', hard: 'nehéz pálya' },
  sort: { good: 'jó kör', hard: 'nehéz kör' },
  scale: { good: 'jó kör', hard: 'nehéz kör' },
  seq: { good: 'jó kör', hard: 'nehéz kör' },
  mirror: { good: 'jó kör', hard: 'nehéz kör' },
  code: { good: 'jó kör', hard: 'nehéz kör' },
  fix: { good: 'jó kör', hard: 'nehéz kör' }
};

/** The ladder's own numbers, so the hint never drifts from what the game does. Workshop hints name their world. */
export function ladderHint(game: LadderGame): string {
  const { up, down } = LADDER_RULES[game];
  const words = STEP_WORDS[game];
  const world = GAMES[game].world === 'robot' ? `${WORLDS.find((w) => w.id === 'robot')!.name}. ` : '';
  const note = words.note ? ` (${words.note})` : '';
  return `${world}${up} ${words.good} egymás után${longerRow(game)}: nehezebb szint, ${down} ${words.hard} egymás után: könnyebb${note}. Ez alá nem lép vissza.`;
}

/** The longer row some levels want, as " (a vegyes szinteken 7)"; empty where every level wants the same. */
function longerRow(game: LadderGame): string {
  const longest = Math.max(0, ...Object.values(LADDER_RULES[game].upAt ?? {}).map((n) => n ?? 0));
  const where = STEP_WORDS[game].longer;
  return longest > LADDER_RULES[game].up && where ? ` (${where} ${longest})` : '';
}

/** The short line under the game's name: how many tasks without help step it up. */
export function ladderStepLine(game: LadderGame): string {
  return `${LADDER_RULES[game].up} ${STEP_WORDS[game].good}${longerRow(game)} után magától lép`;
}

function ladderSetting(game: LadderGame): LevelSetting {
  return {
    id: game,
    world: GAMES[game].world,
    game: GAMES[game].name,
    hint: ladderHint(game),
    options: LADDER_LEVELS[game].map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, game).level,
    apply: (p, v) => withLadder(p, game, startAt(ladderOf(p, game), v))
  };
}

export const LEVEL_SETTINGS: LevelSetting[] = [learn, ...LADDER_GAMES.map(ladderSetting)];
