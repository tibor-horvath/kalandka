import { describe, expect, it } from 'vitest';
import { GAMES } from './games';
import { ladderOf, withLadder } from './ladder';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import { REVIEW_TASKS, buildReview, reviewGames, reviewLevels, reviewOpen, reviewPlayed } from './review';

const played = (p: Progress, game: Parameters<typeof ladderOf>[1], level: number, solved: number[]): Progress =>
  withLadder(p, game, { ...ladderOf(p, game), level, reached: level, solvedTop: Math.max(...solved), solved });

describe('Vegyes kör', () => {
  it('draws only from the world’s open, levelled games', () => {
    expect(reviewGames(DEFAULT_PROGRESS, 'garden')).not.toContain('learn');
    // Villámszem, Méhkas and Cserépbarátok open with Számmagok.
    expect(reviewGames(DEFAULT_PROGRESS, 'garden')).not.toContain('flash');
    expect(reviewGames({ ...DEFAULT_PROGRESS, unlockAll: true }, 'garden')).toContain('flash');
    for (const w of ['garden', 'robot', 'tower'] as const) for (const g of reviewGames(DEFAULT_PROGRESS, w)) expect(GAMES[g].world).toBe(w);
  });

  it('asks a level the child has solved, never above their own', () => {
    const p = played(DEFAULT_PROGRESS, 'sort', 3, [0, 1, 2, 3, 5]);
    expect(reviewLevels(p, 'sort')).toEqual([0, 1, 2, 3]);
    expect(reviewLevels(DEFAULT_PROGRESS, 'sort')).toEqual([ladderOf(DEFAULT_PROGRESS, 'sort').level]);
  });

  it('opens once two of the world’s games were played, and only on that world’s games', () => {
    expect(reviewOpen(DEFAULT_PROGRESS, 'tower')).toBe(false);
    expect(buildReview(DEFAULT_PROGRESS, 'tower', 1)).toEqual([]);
    const one = played(DEFAULT_PROGRESS, 'day', 0, [0]);
    expect(reviewPlayed(one, 'tower')).toEqual(['day']);
    expect(reviewOpen(one, 'tower')).toBe(false);
    // Games played in another world do not count.
    expect(reviewOpen(played(played(one, 'path', 0, [0]), 'sort', 0, [0]), 'tower')).toBe(false);
    expect(reviewOpen(played(one, 'sand', 0, [0]), 'tower')).toBe(true);
  });

  it('prefers the games played so far, and never puts a game twice in a row', () => {
    let p = played(DEFAULT_PROGRESS, 'day', 2, [0, 1, 2]);
    p = played(p, 'sand', 1, [0, 1]);
    for (let seed = 1; seed < 40; seed++) {
      const tasks = buildReview(p, 'tower', seed);
      expect(tasks).toHaveLength(REVIEW_TASKS);
      expect(new Set(tasks.map((t) => t.game))).toEqual(new Set(['day', 'sand']));
      tasks.slice(1).forEach((t, i) => expect(t.game).not.toBe(tasks[i].game));
    }
  });

  it('draws the same round from the same seed', () => {
    const p = played(played(DEFAULT_PROGRESS, 'path', 1, [0, 1]), 'seq', 0, [0]);
    expect(buildReview(p, 'robot', 7)).toHaveLength(REVIEW_TASKS);
    expect(buildReview(p, 'robot', 7)).toEqual(buildReview(p, 'robot', 7));
  });
});
