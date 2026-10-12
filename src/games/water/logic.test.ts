import { describe, expect, it } from 'vitest';
import { PLANTS, addDrop, feedback, growth, introSpeech, plantForRound, removeDrop, slotKinds, statusOf } from './logic';

const bluebell = PLANTS[0];

describe('watering game', () => {
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
});
