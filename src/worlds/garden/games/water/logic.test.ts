import { describe, expect, it } from 'vitest';
import { PLANTS, WATER_LEVELS, maxDropsFor, addDrop, feedback, growth, introSpeech, plantForLevel, plantForRound, removeDrop, slotKinds, statusOf } from './logic';

const bluebell = PLANTS[0];

describe('watering game', () => {
  it('keeps every plant of a level within its drops, and gets to all nine plants', () => {
    WATER_LEVELS.forEach(({ min, max }, level) => {
      for (let round = 0; round < 40; round++) {
        const { target } = plantForLevel(level, round);
        expect(target).toBeGreaterThanOrEqual(min);
        expect(target).toBeLessThanOrEqual(max);
      }
    });
    const met = new Set([0, 1].flatMap((level) => Array.from({ length: 9 }, (_, round) => plantForLevel(level, round).id)));
    expect(met.size).toBe(PLANTS.length);
  });

  it('knows when the plant has enough water', () => {
    expect(statusOf(5, 6)).toBe('under');
    expect(statusOf(6, 6)).toBe('done');
    expect(statusOf(7, 6)).toBe('over');
  });

  it('speaks correct Hungarian forms', () => {
    expect(feedback(4, bluebell).speech).toBe('Még két csepp kell!');
    expect(feedback(8, bluebell).speech).toBe('Hoppá, ez túl sok víz! Vegyél el két cseppet.');
    expect(feedback(6, bluebell).speech).toBe('Hurrá! Pont hat csepp. Kivirágzott a harangvirág!');
    expect(introSpeech(bluebell)).toBe('A harangvirágnak hat csepp kell. Koppints a felhőre!');
  });

  it('shows digits in the bubble', () => {
    expect(feedback(4, bluebell).text).toBe('Még 2 csepp kell!');
  });

  it('never uses a failure mood', () => {
    expect(feedback(9, bluebell).mood).toBe('oops');
    expect(feedback(9, bluebell).tone).toBe('oops');
  });

  it('marks ten-frame slots', () => {
    expect(slotKinds(4, 3)).toEqual(['filled', 'filled', 'filled', 'extra', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty']);
    expect(slotKinds(1, 3).slice(0, 4)).toEqual(['filled', 'target', 'target', 'empty']);
  });

  it('keeps the drop count inside the ten-frames', () => {
    expect(addDrop(10, 6)).toBe(10);
    expect(addDrop(18, 15, 5)).toBe(20);
    expect(removeDrop(0)).toBe(0);
  });

  it('grows the plant from half to full size', () => {
    expect(growth(0, 6)).toBe(0.5);
    expect(growth(6, 6)).toBe(1);
    expect(growth(9, 6)).toBe(1);
  });

  it('keeps targets up to 10 on the first lap, then goes 11–20', () => {
    expect(plantForRound(PLANTS.length).id).toBe(PLANTS[0].id);
    for (const p of PLANTS) expect(p.target).toBeLessThanOrEqual(10);
    const later = Array.from({ length: 30 }, (_, i) => plantForRound(PLANTS.length + i).target);
    expect(Math.min(...later)).toBe(11);
    expect(Math.max(...later)).toBe(20);
  });

  it('uses two ten-frames above 10', () => {
    expect(slotKinds(3, 15)).toHaveLength(20);
    expect(slotKinds(3, 6)).toHaveLength(10);
    expect(feedback(13, { ...bluebell, target: 15 }).speech).toBe('Még két csepp kell!');
    expect(feedback(15, { ...bluebell, target: 15 }).speech).toBe('Hurrá! Pont tizenöt csepp. Kivirágzott a harangvirág!');
  });
  const roundsOf = (kind: string) => {
    const level = WATER_LEVELS.findIndex((l) => l.kind === kind);
    return Array.from({ length: 60 }, (_, round) => plantForLevel(level, round));
  };

  it('counts on from the drops already there, without crossing ten', () => {
    for (const { target, given = 0 } of roundsOf('on')) {
      expect(target - given).toBeGreaterThanOrEqual(2);
      expect(target - given).toBeLessThanOrEqual(6);
      expect(given > 10 || target <= 10 || given === 10).toBe(true);
    }
  });

  it('crosses ten from six to nine drops', () => {
    for (const { target, given = 0 } of roundsOf('cross')) {
      expect(given).toBeGreaterThanOrEqual(6);
      expect(given).toBeLessThanOrEqual(9);
      expect(target).toBeGreaterThan(10);
      expect(maxDropsFor(target)).toBe(20);
    }
  });

  it('counts in twos to an even number', () => {
    for (const plant of roundsOf('twos')) {
      expect(plant.step).toBe(2);
      expect(plant.target % 2).toBe(0);
      expect(plant.given).toBeUndefined();
    }
  });

  it('says what is already there and how to count', () => {
    expect(introSpeech({ ...bluebell, target: 12, given: 7 })).toBe('A harangvirágnak tizenkét csepp kell. Hét csepp már ott van. Számolj tovább, és koppints a felhőre!');
    expect(introSpeech({ ...bluebell, target: 8, step: 2 })).toBe('A harangvirágnak nyolc csepp kell. A felhő most kettesével csepeg: számolj kettesével!');
  });

  it('keeps the drops that were already there', () => {
    expect(slotKinds(8, 12, 7).slice(0, 9)).toEqual(['given', 'given', 'given', 'given', 'given', 'given', 'given', 'filled', 'target']);
    expect(removeDrop(7, 7)).toBe(7);
    expect(removeDrop(9, 7)).toBe(8);
    expect(removeDrop(10, 0, 2)).toBe(8);
  });
});
