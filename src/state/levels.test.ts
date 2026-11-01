import { describe, expect, it } from 'vitest';
import { buildAddRound } from '../games/add/logic';
import { ladderOf } from './ladder';
import { buildFlashRound } from '../games/flash/logic';
import { buildLearnRound } from '../games/learn/logic';
import { buildLevelRound } from '../games/patterns/logic';
import { plantForLevel } from '../games/water/logic';
import { LEVEL_SETTINGS } from './levels';
import { DEFAULT_PROGRESS, migrate } from './progress';

const setting = (id: string) => LEVEL_SETTINGS.find((s) => s.id === id)!;

describe('per-game level settings', () => {
  it('reads back every option it applies, for every game', () => {
    for (const s of LEVEL_SETTINGS) {
      for (const o of s.options) {
        expect(s.current(s.apply(DEFAULT_PROGRESS, o.value))).toBe(o.value);
      }
    }
  });

  it('starts at level one on a fresh profile', () => {
    for (const s of LEVEL_SETTINGS) expect(s.current(DEFAULT_PROGRESS)).toBe(s.options[0].value);
  });

  it('changes what the game actually serves', () => {
    expect(buildLearnRound(setting('learn').apply(DEFAULT_PROGRESS, 10).learnRound).count).toBe(11);
    expect(plantForLevel(ladderOf(setting('water').apply(DEFAULT_PROGRESS, 2), 'water').level, 0).target).toBeGreaterThan(10);
    expect(buildLevelRound(ladderOf(setting('patterns').apply(DEFAULT_PROGRESS, 1), 'patterns').level, 0).shape).toBe('ABC');
    expect(ladderOf(setting('trace').apply(DEFAULT_PROGRESS, 2), 'trace')).toMatchObject({ level: 2, floor: 2 });
    const flash = setting('flash').apply(DEFAULT_PROGRESS, 3);
    expect(buildFlashRound(0, ladderOf(flash, 'flash').level).count).toBeGreaterThanOrEqual(6);
    const add = setting('add').apply({ ...DEFAULT_PROGRESS, addStreak: 3 }, 12);
    expect(ladderOf(add, 'add')).toMatchObject({ level: 12, floor: 12, streak: 0 });
    expect(buildAddRound(0, ladderOf(add, 'add').level).answer).toBeGreaterThan(20);
  });

  it('moves an older Méhecske save onto the new ladder once, and leaves fresh profiles at the start', () => {
    const old = { ...DEFAULT_PROGRESS, addLevelsVersion: 1 };
    expect(migrate({ ...old, addLevel: 0, addSolved: 7 }).addLevel).toBe(2);
    expect(migrate({ ...old, addLevel: 4, addSolved: 30 }).addLevel).toBe(8);
    expect(migrate({ ...old, addLevelsVersion: 2, addLevel: 9, addSolved: 30 }).addLevel).toBe(12);
    expect(migrate({ ...old, addLevel: 0, addSolved: 0 }).addLevel).toBe(0);
    const once = migrate({ ...old, addLevel: 1, addSolved: 3 });
    expect(migrate(once)).toBe(once);
  });

  it('keeps other progress untouched', () => {
    const p = { ...DEFAULT_PROGRESS, seeds: 7, garden: ['tulipan'] };
    for (const s of LEVEL_SETTINGS) {
      const next = s.apply(p, s.options[s.options.length - 1].value);
      expect(next.seeds).toBe(7);
      expect(next.garden).toEqual(['tulipan']);
    }
  });
});
