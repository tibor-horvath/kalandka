import { GAME_IDS, WORLD_MANIFESTS, type GameId } from '../worlds';
import { creditPractice, creditTasks } from './pod';
import type { GameSave, Progress } from './progress';
import type { WorldId } from './worlds';

// Every Kalandka game in one list, in hub order, built from the worlds' manifests (see worlds/index.ts).
// Screens, ladders, stickers, notes and printable sheets read a game from here instead of listing the games again.

export { GAME_IDS, type GameId };

/** Games with a difficulty ladder: all but Számmagok, which walks the numbers in order. */
export type LadderGame = Exclude<GameId, 'learn'>;

export interface GameInfo {
  id: GameId;
  world: WorldId;
  name: string;
  /** Locsolás counts the plants in its garden instead of a solved count of its own. */
  solvedFromPlants: boolean;
}

export const GAMES = Object.fromEntries(
  WORLD_MANIFESTS.flatMap((w) =>
    w.games.map((g): [GameId, GameInfo] => [g.id, { id: g.id, world: w.id, name: g.name, solvedFromPlants: 'solvedFromPlants' in g && g.solvedFromPlants }])
  )
) as Record<GameId, GameInfo>;

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

/** Goes up when the child moves on to the next task; App keys the game's screen by it. */
export function roundOf(p: Progress, id: GameId): number {
  return p.games[id].round;
}

/** Tasks solved; Locsolás's is the plants in its garden. */
export function solvedOf(p: Progress, id: GameId): number {
  return GAMES[id].solvedFromPlants ? p.garden.length : p.games[id].solved;
}

export function withGame(p: Progress, id: GameId, change: Partial<GameSave>): Progress {
  return { ...p, games: { ...p.games, [id]: { ...p.games[id], ...change } } };
}

export function withRound(p: Progress, id: GameId, round: number): Progress {
  return withGame(p, id, { round });
}

export function nextRound(p: Progress, id: GameId): Progress {
  return withRound(p, id, roundOf(p, id) + 1);
}

/** A solved task: the game's count, and a part of its world's reward pod (see pod.ts); `practice` caps the day's pay. */
export function creditSolve(p: Progress, id: GameId, practice = false): Progress {
  const { world, solvedFromPlants } = GAMES[id];
  const paid = practice && isLadderGame(id) ? creditPractice(p, id, world) : creditTasks(p, world);
  return solvedFromPlants ? paid : withGame(paid, id, { solved: paid.games[id].solved + 1 });
}
