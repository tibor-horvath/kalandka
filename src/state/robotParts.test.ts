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
  friendProgress,
  friendsOf,
  lookOf,
  newFriend,
  owns,
  partsIn,
  robotsOpen,
  secondRobotNew,
  wear,
  FRIEND_GIFTS,
  FRIEND_GIFTS_EACH,
  canGiveFriend,
  friendGiftCount,
  friendGiftsOf,
  friendGiftsOpen,
  giveFriend,
  nextFriendGift,
  setWish,
  slotsAffordable,
  startSlot,
  wishOf,
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

  it('shows the way to the next friend: parts bought since the one before', () => {
    let p = withBolts(1000);
    expect(friendProgress(p)).toEqual({ need: FRIENDS[0].after, done: 0, coming: 0 });
    p = buy(p, 'antenna-spring');
    expect(friendProgress(p)).toEqual({ need: 2, done: 1, coming: 0 });
    p = { ...buy(buy(p, 'paint-orange'), 'paint-purple'), robotFriendsSeen: 1 };
    expect(friendProgress(p)).toEqual({ need: FRIENDS[1].after - FRIENDS[0].after, done: 1, coming: 0 });
    expect(friendProgress({ ...p, robotFriendsSeen: FRIENDS.length })).toBeNull();
  });

  it('can all be reached with the parts there are for both robots', () => {
    const buyable = PARTS.filter((p) => p.cost > 0).length;
    expect(Math.max(...FRIENDS.map((f) => f.after))).toBeLessThanOrEqual(buyable * 2);
    const p = buyAll(buyAll(withBolts(1000), 0), 1);
    expect(friendsOf(p)).toHaveLength(FRIENDS.length);
  });
});

describe('where to go (C · Hová menjek?)', () => {
  it('marks the tabs with a part the bolts buy, and opens on the first of them', () => {
    expect(slotsAffordable(withBolts(0))).toEqual([]);
    expect(startSlot(withBolts(0))).toBe('head');
    // Two bolts buy the spring antenna and the cheap paints, nothing else.
    expect(slotsAffordable(withBolts(2))).toEqual(['antenna', 'paint']);
    expect(startSlot(withBolts(2))).toBe('antenna');
    expect(slotsAffordable(withBolts(3))).toEqual(['head', 'antenna', 'arms', 'paint']);
  });

  it('counts friend gifts as something to buy once the friends take them', () => {
    const p = { ...buyAll(withBolts(91), 0), robotFriendsSeen: 3 };
    expect(boltBalance(p)).toBe(0);
    expect(canBuyAnything(p)).toBe(false);
    expect(canBuyAnything({ ...p, bolts: p.bolts + 1 })).toBe(true);
  });
});

describe('the wish (B · Ezt szeretném)', () => {
  it('keeps one part to save up for, with the bolts still missing', () => {
    let p = withBolts(3);
    expect(wishOf(p)).toBeNull();
    p = setWish(p, 'legs-tracks');
    expect(wishOf(p)).toMatchObject({ robot: 0, need: 6 });
    expect(wishOf(p)?.part.id).toBe('legs-tracks');
    expect(startSlot(p)).toBe('legs');
    p = setWish(p, 'body-gear');
    expect(wishOf(p)?.part.id).toBe('body-gear');
    expect(wishOf({ ...p, bolts: 20 })?.need).toBe(0);
  });

  it('never wishes for a part already owned, and clears the wish when it is bought', () => {
    expect(setWish(withBolts(0), 'head-round').robotWish).toBeNull();
    let p = setWish(withBolts(9), 'legs-tracks');
    p = buy(p, 'legs-tracks');
    expect(p.robotWish).toBeNull();
    expect(wishOf(p)).toBeNull();
  });

  it('belongs to its robot: the other robot opens on its own tabs', () => {
    let p = { ...buyAll(withBolts(1000), 0), robotActive: 1 };
    p = setWish({ ...p, robotActive: 0 }, 'legs-tracks', 1);
    expect(wishOf(p)?.robot).toBe(1);
    expect(startSlot(p, 1)).toBe('legs');
    expect(startSlot(p, 0)).toBe('head');
  });
});

describe('friend gifts (D · Barátok műhelye)', () => {
  const ready = (extra: number) => ({ ...buyAll(withBolts(91 + extra), 0), robotFriendsSeen: 3 });

  it('gives each friend five different gifts, thirty in all', () => {
    for (const f of FRIENDS) {
      expect(FRIEND_GIFTS[f.id]).toHaveLength(FRIEND_GIFTS_EACH);
      expect(new Set(FRIEND_GIFTS[f.id]).size).toBe(FRIEND_GIFTS_EACH);
    }
  });

  it('opens only once a robot has every part, and only for welcomed friends', () => {
    const early = { ...withBolts(100), robotFriendsSeen: 1 };
    expect(friendGiftsOpen(early)).toBe(false);
    expect(canGiveFriend(early, 'dog')).toBe(false);
    const p = ready(10);
    expect(friendGiftsOpen(p)).toBe(true);
    expect(canGiveFriend(p, 'dog')).toBe(true);
    expect(canGiveFriend(p, 'turtle')).toBe(false);
  });

  it('asks one bolt more for each gift, and keeps every gift', () => {
    let p = ready(15);
    for (let k = 0; k < FRIEND_GIFTS_EACH; k++) {
      expect(nextFriendGift(p, 'dog')).toEqual({ thing: FRIEND_GIFTS.dog[k], cost: k + 1 });
      p = giveFriend(p, 'dog');
    }
    expect(friendGiftsOf(p, 'dog')).toBe(FRIEND_GIFTS_EACH);
    expect(boltBalance(p)).toBe(0);
    expect(nextFriendGift(p, 'dog')).toBeNull();
    expect(giveFriend(p, 'dog')).toBe(p);
    expect(friendGiftCount(p)).toBe(FRIEND_GIFTS_EACH);
  });

  it('does not give a gift the bolts do not reach', () => {
    const p = ready(0);
    expect(giveFriend(p, 'dog')).toBe(p);
  });
});
