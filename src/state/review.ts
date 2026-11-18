import { rng } from '../lib/rng';
import { LADDER_GAMES, GAMES, type LadderGame } from './games';
import { ladderOf, solvedLevels } from './ladder';
import type { Progress } from './progress';
import { isOpen } from './unlocks';
import type { WorldId } from './worlds';

// Vegyes kör: a short round of tasks from one world's games, each on a level the child has already solved there,
// so different skills come up side by side. It is practice: the ladder never moves, and nothing opens with it.
// It stands first on the island's trail and opens once the child has played REVIEW_NEEDS of that world's games, so
// there is something to mix; it waits on that world's own games only, never on another world's.

/** Tasks in one mixed round. */
export const REVIEW_TASKS = 5;
/** Games played (a task solved in each) in the world before its Vegyes kör opens. */
export const REVIEW_NEEDS = 2;

/** One task of a mixed round: which game, on which of its levels. */
export interface ReviewTask {
  game: LadderGame;
  level: number;
}

/** The world's games a mixed round draws from: the levelled ones that are open (Számmagok walks its own order). */
export function reviewGames(p: Progress, world: WorldId): LadderGame[] {
  return LADDER_GAMES.filter((g) => GAMES[g].world === world && isOpen(p, g));
}

/** The world's open games with a task solved in them. */
export function reviewPlayed(p: Progress, world: WorldId): LadderGame[] {
  return reviewGames(p, world).filter((g) => solvedLevels(ladderOf(p, g)).length > 0);
}

/** Vegyes kör is open: enough of the world's games were played to mix. */
export function reviewOpen(p: Progress, world: WorldId): boolean {
  return reviewPlayed(p, world).length >= REVIEW_NEEDS;
}

/** The levels a task of this game may come from: the ones solved up to the child's own (the child's own level before the first). */
export function reviewLevels(p: Progress, game: LadderGame): number[] {
  const l = ladderOf(p, game);
  const solved = solvedLevels(l).filter((x) => x <= l.level);
  return solved.length > 0 ? [...solved].sort((a, b) => a - b) : [l.level];
}

/**
 * A mixed round of REVIEW_TASKS tasks from the games played so far, drawn by `seed`; empty while Vegyes kör is still
 * closed. A game never comes twice in a row, and each comes once before any comes again.
 */
export function buildReview(p: Progress, world: WorldId, seed: number): ReviewTask[] {
  if (!reviewOpen(p, world)) return [];
  const pool = reviewPlayed(p, world);
  const r = rng(seed);
  const shuffled = (games: LadderGame[]) => {
    const a = [...games];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const games: LadderGame[] = [];
  while (games.length < REVIEW_TASKS) {
    let next = shuffled(pool);
    // A new pass never starts with the game the last one ended on.
    if (next.length > 1 && next[0] === games[games.length - 1]) next = [...next.slice(1), next[0]];
    games.push(...next);
  }
  return games.slice(0, REVIEW_TASKS).map((game) => {
    const levels = reviewLevels(p, game);
    return { game, level: levels[Math.floor(r() * levels.length)] };
  });
}
