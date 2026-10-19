import { describe, expect, it } from 'vitest';
import { evenLevels, levelMeter } from './levelMeter';

const three = evenLevels(3, 5);

describe('in-game level meter', () => {
  it('starts empty on the first level', () => {
    expect(levelMeter(0, three, false)).toEqual({ level: 0, levels: 3, done: 0, rounds: 5, levelUp: false });
  });

  it('counts the current round once it is solved', () => {
    expect(levelMeter(7, three, false)).toMatchObject({ level: 1, done: 2 });
    expect(levelMeter(7, three, true)).toMatchObject({ level: 1, done: 3, levelUp: false });
  });

  it('stays on the round’s level when the win fills the row', () => {
    expect(levelMeter(9, three, true)).toMatchObject({ level: 1, done: 5, levelUp: true });
    expect(levelMeter(10, three, false)).toMatchObject({ level: 2, done: 0 });
  });

  it('refills the row on the top level without a level-up', () => {
    expect(levelMeter(14, three, true)).toMatchObject({ level: 2, done: 5, levelUp: false });
    expect(levelMeter(15, three, false)).toMatchObject({ level: 2, done: 0 });
    expect(levelMeter(23, three, true)).toMatchObject({ level: 2, done: 4 });
  });

  it('follows levels of different lengths', () => {
    // Locsolás: nine plants, then a row of five that keeps refilling.
    expect(levelMeter(8, [9, 5], true)).toMatchObject({ level: 0, done: 9, rounds: 9, levelUp: true });
    expect(levelMeter(9, [9, 5], false)).toMatchObject({ level: 1, done: 0, rounds: 5 });
    expect(levelMeter(16, [9, 5], false)).toMatchObject({ level: 1, done: 2 });
  });
});
