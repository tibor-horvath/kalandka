import { creditTasks } from './pod';
import type { Progress } from './progress';
import type { WorldId } from './worlds';

// Every Kalandka game in one list, in hub order: its id, world, name and the save fields that count its rounds.
// Screens, ladders, stickers, notes and printable sheets read a game from here instead of listing the games again.

export const GAME_IDS = ['learn', 'water', 'patterns', 'flash', 'add', 'trace', 'pots', 'path', 'sort', 'scale', 'seq', 'mirror', 'code', 'fix'] as const;

export type GameId = (typeof GAME_IDS)[number];

/** Games with a difficulty ladder: all but Számmagok, which walks the numbers in order. */
export type LadderGame = Exclude<GameId, 'learn'>;

/** Number fields of a save. */
type CounterKey = { [K in keyof Progress]: Progress[K] extends number ? K : never }[keyof Progress];

export interface GameInfo {
  id: GameId;
  world: WorldId;
  name: string;
  /** Goes up when the child moves on to the next task; App keys the game's screen by it. */
  roundKey: CounterKey;
  /** Tasks solved; null for Locsolás, which counts the plants in its garden instead. */
  solvedKey: CounterKey | null;
}

// The save keeps its older field names (patternRound next to patternsSolved), so saves and sheets keep working.
export const GAMES: Record<GameId, GameInfo> = {
  learn: { id: 'learn', world: 'garden', name: 'Számmagok', roundKey: 'learnRound', solvedKey: 'learnSolved' },
  water: { id: 'water', world: 'garden', name: 'Locsolás', roundKey: 'waterRound', solvedKey: null },
  patterns: { id: 'patterns', world: 'garden', name: 'Virágsor', roundKey: 'patternRound', solvedKey: 'patternsSolved' },
  flash: { id: 'flash', world: 'garden', name: 'Villámszem', roundKey: 'flashRound', solvedKey: 'flashSolved' },
  add: { id: 'add', world: 'garden', name: 'Méhkas', roundKey: 'addRound', solvedKey: 'addSolved' },
  trace: { id: 'trace', world: 'garden', name: 'Mézút', roundKey: 'traceRound', solvedKey: 'traceSolved' },
  pots: { id: 'pots', world: 'garden', name: 'Cserépbarátok', roundKey: 'potsRound', solvedKey: 'potsSolved' },
  path: { id: 'path', world: 'robot', name: 'Robotút', roundKey: 'pathRound', solvedKey: 'pathSolved' },
  sort: { id: 'sort', world: 'robot', name: 'Válogatógép', roundKey: 'sortRound', solvedKey: 'sortSolved' },
  scale: { id: 'scale', world: 'robot', name: 'Mérleg', roundKey: 'scaleRound', solvedKey: 'scaleSolved' },
  seq: { id: 'seq', world: 'robot', name: 'Mintagép', roundKey: 'seqRound', solvedKey: 'seqSolved' },
  mirror: { id: 'mirror', world: 'robot', name: 'Tükörgép', roundKey: 'mirrorRound', solvedKey: 'mirrorSolved' },
  code: { id: 'code', world: 'robot', name: 'Kódzár', roundKey: 'codeRound', solvedKey: 'codeSolved' },
  fix: { id: 'fix', world: 'robot', name: 'Hibavadász', roundKey: 'fixRound', solvedKey: 'fixSolved' }
};

export function isLadderGame(id: GameId): id is LadderGame {
  return id !== 'learn';
}

export const LADDER_GAMES: LadderGame[] = GAME_IDS.filter(isLadderGame);

export function isGameId(s: string): s is GameId {
  return s in GAMES;
}

export function gameName(id: GameId): string {
  return GAMES[id].name;
}

export function gamesIn(world: WorldId): GameInfo[] {
  return GAME_IDS.map((id) => GAMES[id]).filter((g) => g.world === world);
}

export function roundOf(p: Progress, id: GameId): number {
  return p[GAMES[id].roundKey];
}

export function solvedOf(p: Progress, id: GameId): number {
  const key = GAMES[id].solvedKey;
  return key ? p[key] : p.garden.length;
}

export function withRound(p: Progress, id: GameId, round: number): Progress {
  return { ...p, [GAMES[id].roundKey]: round };
}

export function nextRound(p: Progress, id: GameId): Progress {
  return withRound(p, id, roundOf(p, id) + 1);
}

/** A solved task: the game's count, and a quarter of its world's reward pod (see pod.ts). */
export function creditSolve(p: Progress, id: GameId): Progress {
  const { world, solvedKey } = GAMES[id];
  const paid = creditTasks(p, world);
  return solvedKey ? { ...paid, [solvedKey]: paid[solvedKey] + 1 } : paid;
}
