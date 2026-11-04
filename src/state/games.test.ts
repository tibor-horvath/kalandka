import { describe, expect, it } from 'vitest';
import { GAME_IDS, GAMES, LADDER_GAMES, creditSolve, gamesIn, isGameId, nextRound, roundOf, solvedOf, withRound, type GameId } from './games';
import { TASKS_PER_REWARD } from './pod';
import { DEFAULT_PROGRESS, type Progress } from './progress';

describe('game list', () => {
  it('lists every game once, under its own id', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length);
    for (const id of GAME_IDS) expect(GAMES[id].id).toBe(id);
  });

  it('points every game at its own save fields', () => {
    const keys = GAME_IDS.flatMap((id) => [GAMES[id].roundKey, GAMES[id].solvedKey].filter(Boolean));
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(typeof DEFAULT_PROGRESS[key!]).toBe('number');
  });

  it('keeps the hub order within each world', () => {
    expect(gamesIn('garden').map((g) => g.id)).toEqual(['learn', 'water', 'patterns', 'flash', 'add', 'trace', 'pots']);
    expect(gamesIn('robot').map((g) => g.id)).toEqual(['path', 'sort', 'scale', 'seq', 'mirror', 'code', 'fix']);
    expect(LADDER_GAMES).not.toContain('learn');
  });

  it('tells game screens from the others', () => {
    expect(isGameId('sort')).toBe(true);
    expect(isGameId('workshop')).toBe(false);
  });
});

describe('game counters', () => {
  it('moves a game on by one round, and only that game', () => {
    const p = nextRound(withRound(DEFAULT_PROGRESS, 'patterns', 4), 'patterns');
    expect(roundOf(p, 'patterns')).toBe(5);
    expect(p.patternRound).toBe(5);
    expect(roundOf(p, 'sort')).toBe(0);
  });

  it('fills its world’s reward pod: a seed in the garden and a bolt in the workshop for every four tasks', () => {
    const solveN = (id: GameId, n: number) => Array.from({ length: n }).reduce<Progress>((p) => creditSolve(p, id), DEFAULT_PROGRESS);
    expect(solveN('flash', 1)).toMatchObject({ gardenTasks: 1, seeds: 0, robotTasks: 0, bolts: 0, flashSolved: 1 });
    expect(solveN('flash', TASKS_PER_REWARD)).toMatchObject({ gardenTasks: TASKS_PER_REWARD, seeds: 1, bolts: 0 });
    expect(solveN('code', TASKS_PER_REWARD * 2 + 1)).toMatchObject({ robotTasks: TASKS_PER_REWARD * 2 + 1, bolts: 2, seeds: 0, codeSolved: 9 });
  });

  it('counts Locsolás by its plants', () => {
    const p = creditSolve({ ...DEFAULT_PROGRESS, garden: ['tulipan', 'napraforgo'] }, 'water');
    expect(p.gardenTasks).toBe(1);
    expect(solvedOf(p, 'water')).toBe(2);
  });
});
