import { describe, expect, it } from 'vitest';
import { GAME_IDS, GAMES, LADDER_GAMES, creditSolve, gamesIn, isGameId, nextRound, roundOf, solvedOf, withRound, type GameId } from './games';
import { PRACTICE_PAY_PER_DAY, creditPractice, practicePaid, practiceRested } from './pod';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import { WORLDS } from './worlds';

const TASKS_PER_SEED = 2;
const TASKS_PER_REWARD = 4;

describe('game list', () => {
  it('lists every game once, under its own id', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length);
    for (const id of GAME_IDS) expect(GAMES[id].id).toBe(id);
  });

  it('gives every game and every world its own part of the save', () => {
    expect(Object.keys(DEFAULT_PROGRESS.games).sort()).toEqual([...GAME_IDS].sort());
    expect(Object.keys(DEFAULT_PROGRESS.worlds)).toEqual(WORLDS.map((w) => w.id));
  });

  it('lists each game in its own world', () => {
    for (const w of WORLDS) expect(gamesIn(w.id).map((g) => g.id)).toEqual(w.games.map((g) => g.id));
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
    expect(p.games.patterns.round).toBe(5);
    expect(roundOf(p, 'sort')).toBe(0);
  });

  it('fills its world’s reward pod: a seed in the garden for every two tasks and a bolt in the workshop for every four', () => {
    const solveN = (id: GameId, n: number) => Array.from({ length: n }).reduce<Progress>((p) => creditSolve(p, id), DEFAULT_PROGRESS);
    expect(solveN('flash', 1)).toMatchObject({ worlds: { garden: { tasks: 1, earned: 0 }, robot: { tasks: 0, earned: 0 } }, games: { flash: { solved: 1 } } });
    expect(solveN('flash', TASKS_PER_SEED)).toMatchObject({ worlds: { garden: { tasks: TASKS_PER_SEED, earned: 1 }, robot: { earned: 0 } } });
    expect(solveN('code', TASKS_PER_REWARD * 2 + 1)).toMatchObject({ worlds: { robot: { tasks: TASKS_PER_REWARD * 2 + 1, earned: 2 }, garden: { earned: 0 } }, games: { code: { solved: 9 } } });
  });

  it('counts Locsolás by its plants', () => {
    const p = creditSolve({ ...DEFAULT_PROGRESS, garden: ['tulipan', 'napraforgo'] }, 'water');
    expect(p.worlds.garden.tasks).toBe(1);
    expect(solvedOf(p, 'water')).toBe(2);
  });
});

describe('practice in a finished game', () => {
  const day = '2026-11-07';
  /** Solves `n` practice tasks of a game on one day. */
  const practise = (p: Progress, game: 'flash' | 'path', n: number, on = day) => {
    for (let i = 0; i < n; i++) p = creditPractice(p, game, game === 'path' ? 'robot' : 'garden', on);
    return p;
  };

  it('pays at most five seeds a day per game, then only moves the clock', () => {
    const p = practise(DEFAULT_PROGRESS, 'flash', TASKS_PER_REWARD * 8);
    expect(p.worlds.garden.earned).toBe(PRACTICE_PAY_PER_DAY);
    expect(p.worlds.garden.tasks).toBe(TASKS_PER_REWARD * 8);
    expect(practicePaid(p, 'flash', day)).toBe(PRACTICE_PAY_PER_DAY);
    expect(practiceRested(p, 'flash', day)).toBe(true);
  });

  it('counts each game on its own', () => {
    const p = practise(practise(DEFAULT_PROGRESS, 'flash', 40), 'path', 40);
    expect(p.worlds.garden.earned).toBe(PRACTICE_PAY_PER_DAY);
    expect(p.worlds.robot.earned).toBe(PRACTICE_PAY_PER_DAY);
    expect(practiceRested(p, 'patterns', day)).toBe(false);
  });

  it('starts again the next day', () => {
    const p = practise(practise(DEFAULT_PROGRESS, 'flash', 40), 'flash', 8, '2026-11-08');
    expect(p.worlds.garden.earned).toBe(PRACTICE_PAY_PER_DAY + 4);
    expect(practicePaid(p, 'flash', '2026-11-08')).toBe(4);
    expect(p.practicePay.paid).toEqual({ flash: 4 });
  });
});
