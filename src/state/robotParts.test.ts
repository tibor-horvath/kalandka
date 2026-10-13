import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import {
  BASIC_LOOK,
  FRIENDS,
  PARTS,
  PART_SLOTS,
  boltBalance,
  boughtCount,
  buy,
  canBuyAnything,
  cheapestLeft,
  friendsOf,
  lookOf,
  newFriend,
  owns,
  partsIn,
  wear
} from './robotParts';

const withBolts = (bolts: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, bolts, ...extra });

describe('Robotépítő parts', () => {
  it('has one free starting part per slot, and the starting look uses them', () => {
    for (const slot of PART_SLOTS) {
      const free = partsIn(slot.id).filter((p) => p.cost === 0);
      expect(free).toHaveLength(1);
      expect(BASIC_LOOK[slot.id]).toBe(free[0].id);
    }
    expect(lookOf(DEFAULT_PROGRESS)).toEqual(BASIC_LOOK);
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
  });

  it('spends bolts from the balance, puts the part on, and never lowers the bolts earned', () => {
    const p = buy(withBolts(5), 'head-square');
    expect(p.bolts).toBe(5);
    expect(boltBalance(p)).toBe(2);
    expect(owns(p, 'head-square')).toBe(true);
    expect(lookOf(p).head).toBe('head-square');
  });

  it('does not buy without enough bolts, or twice', () => {
    const poor = withBolts(2);
    expect(buy(poor, 'head-square')).toBe(poor);
    const once = buy(withBolts(10), 'head-square');
    expect(buy(once, 'head-square')).toBe(once);
  });

  it('swaps back to an owned part for free, and ignores parts not owned', () => {
    const p = buy(withBolts(10), 'legs-wheels');
    const back = wear(p, 'legs-feet');
    expect(lookOf(back).legs).toBe('legs-feet');
    expect(boltBalance(back)).toBe(boltBalance(p));
    expect(wear(back, 'legs-rocket')).toBe(back);
    // A look naming a part the child does not own falls back to the starting part.
    expect(lookOf({ ...DEFAULT_PROGRESS, robotLook: { legs: 'legs-rocket' } }).legs).toBe('legs-feet');
  });

  it('knows the cheapest part left and whether any can be bought', () => {
    expect(cheapestLeft(DEFAULT_PROGRESS)?.cost).toBe(2);
    expect(canBuyAnything(withBolts(1))).toBe(false);
    expect(canBuyAnything(withBolts(2))).toBe(true);
    let p = withBolts(1000);
    for (const part of PARTS) p = buy(p, part.id);
    expect(cheapestLeft(p)).toBeNull();
    expect(canBuyAnything(p)).toBe(false);
  });
});

describe('robot friends', () => {
  it('come one by one as parts are bought, each welcomed once', () => {
    let p = withBolts(1000);
    expect(newFriend(p)).toBeNull();
    p = buy(buy(p, 'antenna-spring'), 'paint-orange');
    expect(boughtCount(p)).toBe(2);
    expect(newFriend(p)?.id).toBe('dog');
    p = { ...p, robotFriendsSeen: 1 };
    expect(newFriend(p)).toBeNull();
  });

  it('can all be reached with the parts there are', () => {
    const buyable = PARTS.filter((p) => p.cost > 0).length;
    expect(Math.max(...FRIENDS.map((f) => f.after))).toBeLessThanOrEqual(buyable);
    let p = withBolts(1000);
    for (const part of PARTS) p = buy(p, part.id);
    expect(friendsOf(p)).toHaveLength(FRIENDS.length);
  });
});
