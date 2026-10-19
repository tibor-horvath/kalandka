import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import {
  BASIC_LOOK,
  BASIC_LOOKS,
  FRIENDS,
  PARTS,
  PART_SLOTS,
  SECOND_ROBOT_AFTER,
  activeRobot,
  boltBalance,
  boughtOn,
  boughtCount,
  buy,
  canBuyAnything,
  cheapestLeft,
  friendsOf,
  lookOf,
  newFriend,
  owns,
  partsIn,
  robotsOpen,
  secondRobotNew,
  wear,
  type RobotIdx
} from './robotParts';

/** Buys every part there is for one robot. */
const buyAll = (p: Progress, r: RobotIdx): Progress => PARTS.reduce((q, part) => buy(q, part.id, r), p);

const withBolts = (bolts: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, bolts, ...extra });

describe('Robotépítő parts', () => {
  it('has a free starting part in every slot, and both robots start in free parts, in different colours', () => {
    for (const slot of PART_SLOTS) {
      const free = partsIn(slot.id).filter((p) => p.cost === 0).map((p) => p.id);
      expect(free.length).toBeGreaterThan(0);
      expect(free).toContain(BASIC_LOOKS[0][slot.id]);
      expect(free).toContain(BASIC_LOOKS[1][slot.id]);
    }
    expect(BASIC_LOOKS[0].paint).not.toBe(BASIC_LOOKS[1].paint);
    expect(lookOf(DEFAULT_PROGRESS)).toEqual(BASIC_LOOK);
    expect(lookOf(DEFAULT_PROGRESS, 1)).toEqual(BASIC_LOOKS[1]);
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
    let p = buyAll(withBolts(1000), 0);
    expect(cheapestLeft(p, 0)).toBeNull();
    // The second robot has come by then, and it still has every part to buy.
    expect(canBuyAnything(p)).toBe(true);
    p = buyAll(p, 1);
    expect(cheapestLeft(p, 1)).toBeNull();
    expect(canBuyAnything(p)).toBe(false);
  });
});

describe('the second robot', () => {
  it('comes once the first robot has enough new parts, and is announced once', () => {
    let p = withBolts(1000);
    const cheap = PARTS.filter((x) => x.cost > 0).sort((a, b) => a.cost - b.cost);
    for (const part of cheap.slice(0, SECOND_ROBOT_AFTER - 1)) p = buy(p, part.id);
    expect(robotsOpen(p)).toEqual([0]);
    expect(secondRobotNew(p)).toBe(false);
    p = buy(p, cheap[SECOND_ROBOT_AFTER - 1].id);
    expect(robotsOpen(p)).toEqual([0, 1]);
    expect(secondRobotNew(p)).toBe(true);
    expect(secondRobotNew({ ...p, robot2Announced: true })).toBe(false);
  });

  it('buys and wears its own parts, without touching the first robot', () => {
    let p = buyAll(withBolts(1000), 0);
    p = { ...p, robotActive: 1 };
    expect(activeRobot(p)).toBe(1);
    expect(owns(p, 'head-square')).toBe(false);
    const spent = boltBalance(p);
    p = buy(p, 'head-square');
    expect(boltBalance(p)).toBe(spent - 3);
    expect(lookOf(p, 1).head).toBe('head-square');
    expect(lookOf(p, 0)).toEqual(lookOf(buyAll(withBolts(1000), 0), 0));
    expect(boughtOn(p, 1)).toBe(1);
  });

  it('is not on the workbench before it has come, even if a save says so', () => {
    expect(activeRobot({ ...DEFAULT_PROGRESS, robotActive: 1 })).toBe(0);
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

  it('can all be reached with the parts there are for both robots', () => {
    const buyable = PARTS.filter((p) => p.cost > 0).length;
    expect(Math.max(...FRIENDS.map((f) => f.after))).toBeLessThanOrEqual(buyable * 2);
    const p = buyAll(buyAll(withBolts(1000), 0), 1);
    expect(friendsOf(p)).toHaveLength(FRIENDS.length);
  });
});
