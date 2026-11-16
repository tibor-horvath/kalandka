import { describe, expect, it } from 'vitest';
import { DAY_LEVELS } from './day';
import { SEASON_LEVELS } from './season';
import { DIGI_LEVELS, READ_LEVELS, SET_LEVELS } from './clock';
import { SLEEP_LEVELS } from './sleep';
import { SAND_LEVELS } from './sand';
import { ACTIVITIES } from './activities';
import { BY_LEVEL_FOR_TESTS, INTROS, introFor, opensByItself } from './intros';

const LEVELS = { day: DAY_LEVELS, season: SEASON_LEVELS, set: SET_LEVELS, read: READ_LEVELS, digi: DIGI_LEVELS, sleep: SLEEP_LEVELS, sand: SAND_LEVELS };

describe('szint-bemutató', () => {
  it('names only intros that exist, and never more levels than the game has', () => {
    for (const [game, ids] of Object.entries(BY_LEVEL_FOR_TESTS)) {
      expect(ids!.length).toBeLessThanOrEqual(LEVELS[game as keyof typeof LEVELS].length);
      for (const id of ids!) if (id) expect(INTROS[id]?.id).toBe(id);
    }
  });

  it('gives every tower game an intro from its first level, so the "?" button is always there', () => {
    for (const [game, levels] of Object.entries(LEVELS)) {
      levels.forEach((_, l) => expect(introFor(game as keyof typeof LEVELS, l)).not.toBeNull());
    }
  });

  it('replays the closest earlier intro on a level that brings nothing new', () => {
    expect(introFor('day', 2)).toEqual({ intro: INTROS.day, own: false });
    expect(introFor('set', 2)).toEqual({ intro: INTROS.half, own: true });
    expect(introFor('robot' as never, 0)).toBeNull();
  });

  it('opens by itself only on its own level, until seen once in any game', () => {
    expect(opensByItself('read', 2, [])).toBe(true);
    expect(opensByItself('read', 2, ['half'])).toBe(false);
    expect(opensByItself('day', 1, [])).toBe(false);
  });

  it('keeps every slide short and every picture valid', () => {
    for (const intro of Object.values(INTROS)) {
      expect(intro.slides.length).toBeGreaterThan(0);
      expect(intro.slides.length).toBeLessThanOrEqual(4);
      for (const s of intro.slides) {
        expect(s.text.length).toBeLessThan(130);
        if (s.art.kind === 'pics') for (const id of s.art.ids) expect(ACTIVITIES[id]).toBeDefined();
        if (s.art.kind === 'clock') expect(s.art.h).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
