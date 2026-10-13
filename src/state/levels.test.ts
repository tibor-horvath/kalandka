import { describe, expect, it } from 'vitest';
import { buildAddRound } from '../games/add/logic';
import { buildFlashRound } from '../games/flash/logic';
import { buildLearnRound } from '../games/learn/logic';
import { buildRound } from '../games/patterns/logic';
import { plantForRound } from '../games/water/logic';
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
    expect(plantForRound(setting('water').apply(DEFAULT_PROGRESS, 9).waterRound).target).toBeGreaterThan(10);
    expect(buildRound(setting('patterns').apply(DEFAULT_PROGRESS, 1).patternRound).shape).toBe('ABC');
    const flash = setting('flash').apply(DEFAULT_PROGRESS, 3);
    expect(buildFlashRound(0, flash.flashSolved).count).toBeGreaterThanOrEqual(6);
    const add = setting('add').apply({ ...DEFAULT_PROGRESS, addStreak: 3 }, 9);
    expect(add.addStreak).toBe(0);
    expect(buildAddRound(0, add.addLevel).answer).toBeGreaterThan(20);
  });

  it('moves an older Méhecske save onto the new ladder once, and leaves fresh profiles at the start', () => {
    const old = { ...DEFAULT_PROGRESS, addLevelsVersion: 1 };
    expect(migrate({ ...old, addLevel: 0, addSolved: 7 }).addLevel).toBe(2);
    expect(migrate({ ...old, addLevel: 4, addSolved: 30 }).addLevel).toBe(7);
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
