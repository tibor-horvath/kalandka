import { describe, expect, it } from 'vitest';
import { buildAddRound } from '../worlds/garden/games/add/logic';
import { LADDER_RULES, ladderOf } from './ladder';
import { buildFlashRound } from '../worlds/garden/games/flash/logic';
import { buildLearnRound } from '../worlds/garden/games/learn/logic';
import { buildLevelRound } from '../worlds/garden/games/patterns/logic';
import { plantForLevel } from '../worlds/garden/games/water/logic';
import { LADDER_GAMES, type LadderGame } from './games';
import { LEVEL_SETTINGS, ladderHint, ladderStepLine } from './levels';
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

  it('moves an older Méhkas save onto the new ladder once, and leaves fresh profiles at the start', () => {
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

  it('says in its hint exactly how the ladder steps', () => {
    // The parents' corner read these before the hints came from LADDER_RULES; a changed rule changes its hint.
    const before: Record<LadderGame, string> = {
      water: '4 jó virág egymás után: nehezebb szint, 3 túlöntözött egymás után: könnyebb (kannával lehet túlönteni). Ez alá nem lép vissza.',
      patterns: '4 jó válasz egymás után (a vegyes szinteken 7): nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
      trace: '5 szám egymás után: nehezebb szint, 3 nehéz szám egymás után: könnyebb. Ez alá nem lép vissza.',
      flash: '4 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
      add: '5 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
      pots: '5 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
      path: 'Robotműhely. 4 jó pálya egymás után: nehezebb szint, 2 nehéz pálya egymás után: könnyebb. Ez alá nem lép vissza.',
      sort: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
      scale: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
      seq: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
      mirror: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
      code: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
      fix: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    };
    for (const game of LADDER_GAMES) expect(ladderHint(game)).toBe(before[game]);
  });

  it('names the step-up count the ladder really uses on the levels page', () => {
    expect(ladderStepLine('water')).toBe('4 jó virág után magától lép');
    expect(ladderStepLine('trace')).toBe('5 szám után magától lép');
    expect(ladderStepLine('path')).toBe('4 jó pálya után magától lép');
    expect(ladderStepLine('patterns')).toBe('4 jó válasz (a vegyes szinteken 7) után magától lép');
    for (const game of LADDER_GAMES) expect(ladderStepLine(game)).toMatch(new RegExp(`^${LADDER_RULES[game].up} `));
  });
});
