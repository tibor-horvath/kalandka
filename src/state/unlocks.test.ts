import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from './progress';
import { startingProgress } from './profiles';
import { UNLOCKS, announceAll, isOpen, markAnnounced, nextToAnnounce, numbersLeft, unlockOf } from './unlocks';

describe('unlocks', () => {
  it('keeps the games without a rule open', () => {
    expect(isOpen(DEFAULT_PROGRESS, 'learn')).toBe(true);
    expect(isOpen(DEFAULT_PROGRESS, 'path')).toBe(true);
    expect(isOpen(DEFAULT_PROGRESS, 'flash')).toBe(false);
  });

  it('opens a game after enough numbers, or all at once for the parents', () => {
    const flash = unlockOf('flash')!;
    expect(isOpen({ ...DEFAULT_PROGRESS, learnSolved: flash.after }, 'flash')).toBe(true);
    expect(numbersLeft({ ...DEFAULT_PROGRESS, learnSolved: flash.after - 2 }, flash)).toBe(2);
    expect(UNLOCKS.every((u) => isOpen({ ...DEFAULT_PROGRESS, unlockAll: true }, u.game))).toBe(true);
  });

  it('announces each opened game once, the earliest first', () => {
    let p = { ...DEFAULT_PROGRESS, learnSolved: 99 };
    const seen: string[] = [];
    for (let u = nextToAnnounce(p); u; u = nextToAnnounce(p)) {
      seen.push(u.game);
      p = markAnnounced(p, u);
    }
    expect(seen).toEqual(['flash', 'add', 'pots']);
  });

  it('has nothing to announce for a child who starts with everything open', () => {
    expect(nextToAnnounce(announceAll({ ...DEFAULT_PROGRESS, unlockAll: true }))).toBeNull();
    expect(nextToAnnounce(startingProgress('7+'))).toBeNull();
  });
});
