import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SAVE_VERSION, migrateSave } from './migrations';
import { DEFAULT_PROGRESS, readProgress } from './progress';

// A save as the 1.11 release wrote it: flat round and solved fields, rewards and clocks per world, no version.
const V1_11 = {
  seeds: 14, seedsSpent: 6, gardenTasks: 31, bolts: 5, boltsSpent: 2, robotTasks: 22, bells: 3, bellsSpent: 1, towerTasks: 7,
  learnRound: 12, learnSolved: 10, waterRound: 4, patternRound: 9, patternsSolved: 8, pathRound: 6, pathSolved: 5,
  setRound: 3, setSolved: 2, robotWelcomed: true, robotOpened: ['path', 'sort'], towerWelcomed: false, towerOpened: ['day'],
  addLevelsVersion: 3, limitDefaulted: true, plotBeds: 15, screenLimitMin: 0, garden: ['tulipan'], beds: [], stickersSeen: []
};

describe('save migrations', () => {
  it('numbers its steps one after another, up to the current version', () => {
    expect(MIGRATIONS.map((m) => m.to)).toEqual(MIGRATIONS.map((_, i) => i + 1));
    expect(DEFAULT_PROGRESS.version).toBe(SAVE_VERSION);
  });

  it('moves a 1.11 save into games and worlds, keeping every count', () => {
    const p = readProgress(V1_11);
    expect(p.version).toBe(SAVE_VERSION);
    expect(p.worlds).toEqual({
      garden: { tasks: 31, earned: 14, spent: 6, welcomed: false, opened: [] },
      robot: { tasks: 22, earned: 5, spent: 2, welcomed: true, opened: ['path', 'sort'] },
      tower: { tasks: 7, earned: 3, spent: 1, welcomed: false, opened: ['day'] }
    });
    expect(p.games.learn).toEqual({ round: 12, solved: 10 });
    expect(p.games.patterns).toEqual({ round: 9, solved: 8 });
    expect(p.games.water.round).toBe(4);
    expect(p.games.path).toEqual({ round: 6, solved: 5 });
    expect(p.games.set).toEqual({ round: 3, solved: 2 });
    expect(p.games.fix).toEqual({ round: 0, solved: 0 });
    // A parent's "no limit" from 1.11 stays.
    expect(p.screenLimitMin).toBe(0);
  });

  it('drops the fields it moved', () => {
    const raw = migrateSave(V1_11);
    for (const k of ['seeds', 'gardenTasks', 'learnRound', 'patternsSolved', 'robotWelcomed', 'towerOpened', 'addLevelsVersion', 'limitDefaulted', 'plotBeds']) expect(raw).not.toHaveProperty(k);
  });

  it('reads a current save as it is, and a read save again the same', () => {
    const p = readProgress(V1_11);
    expect(readProgress(p)).toEqual(p);
    expect(readProgress(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('fills in a game or world the save does not have yet', () => {
    const { games, ...rest } = readProgress(V1_11);
    const { fix: _, ...withoutFix } = games;
    expect(readProgress({ ...rest, games: withoutFix }).games.fix).toEqual({ round: 0, solved: 0 });
  });

  it('leaves a save from a newer app alone', () => {
    const newer = { version: SAVE_VERSION + 1, seeds: 99 };
    expect(migrateSave(newer)).toBe(newer);
  });
});
