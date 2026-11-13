import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import { FRUIT_MAX, THIRSTY_AFTER, growAfter, isThirsty, pickFruit, plant, ripeFruit, ripeTotal, thirstyBeds, water, waterAll } from './garden';
import { BATTERY_BARS, SQUEAKY_AFTER, TRICKS, batteryOf, chargeOne, isSqueaky, oil, tricksOf } from './robotParts';

const withSeeds = (seeds: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, seeds, ...extra });
/** A pear tree in bed 0 that has just grown. */
const grownTree = () => {
  const p = plant(withSeeds(10), 0, 'tree');
  return { ...p, gardenTasks: p.gardenTasks + growAfter('tree') };
};
const solve = (p: Progress, n: number): Progress => ({ ...p, gardenTasks: p.gardenTasks + n });

describe('Kiskert care', () => {
  it('ripens one fruit per solved task on a grown tree, up to its most', () => {
    let p = grownTree();
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(0);
    p = solve(p, 2);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(2);
    p = solve(p, 20);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(FRUIT_MAX.tree);
  });

  it('gets thirsty a few tasks after it grew, never worse, and keeps its fruit', () => {
    let p = solve(grownTree(), THIRSTY_AFTER - 1);
    expect(isThirsty(p.beds[0]!, p.gardenTasks)).toBe(false);
    p = solve(p, 1);
    expect(thirstyBeds(p)).toEqual([0]);
    const later = solve(p, 500);
    expect(thirstyBeds(later)).toEqual([0]);
    expect(ripeFruit(later.beds[0]!, later.gardenTasks)).toBe(FRUIT_MAX.tree);
  });

  it('never makes flowers or seedlings thirsty', () => {
    let p = plant(plant(withSeeds(13), 0, 'flower'), 1, 'tree');
    p = solve(p, 3 + THIRSTY_AFTER);
    expect(thirstyBeds(p)).toEqual([]);
    expect(ripeTotal(p)).toBe(0);
  });

  it('picks one fruit at a time into the basket', () => {
    let p = solve(grownTree(), 3);
    p = pickFruit(p, 0);
    expect(p.pears).toBe(1);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(2);
    p = pickFruit(pickFruit(p, 0), 0);
    expect(p.pears).toBe(3);
    expect(pickFruit(p, 0)).toBe(p);
  });

  it('waters a thirsty plant for free, leaves its fruit on to pick and starts it ripening again', () => {
    let p = pickFruit(pickFruit(solve(grownTree(), THIRSTY_AFTER), 0), 0);
    const spent = p.seedsSpent;
    p = water(p, 0);
    expect(p.seedsSpent).toBe(spent);
    expect(p.pears).toBe(2);
    expect(isThirsty(p.beds[0]!, p.gardenTasks)).toBe(false);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(FRUIT_MAX.tree - 2);
    p = solve(p, 1);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(FRUIT_MAX.tree - 1);
    p = solve(p, 5);
    expect(ripeFruit(p.beds[0]!, p.gardenTasks)).toBe(FRUIT_MAX.tree);
    expect(water(solve(grownTree(), 2), 0)).toEqual(solve(grownTree(), 2));
  });

  it('waters every thirsty plant with the can', () => {
    let p = plant(plant(withSeeds(16), 0, 'tree'), 1, 'bush');
    p = solve(p, growAfter('tree') + THIRSTY_AFTER);
    expect(thirstyBeds(p)).toEqual([0, 1]);
    p = waterAll(p);
    expect(thirstyBeds(p)).toEqual([]);
    expect(p.pears).toBe(0);
    expect(ripeTotal(p)).toBe(FRUIT_MAX.tree + FRUIT_MAX.bush);
  });

  it('reads older saves without the basket', () => {
    const p = readProgress({ seeds: 4, stickersSeen: [] });
    expect(p.pears).toBe(0);
    expect(p.berries).toBe(0);
  });
});

describe('Robotépítő care', () => {
  const withBolts = (bolts: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, bolts, robotTasks: bolts, ...extra });

  it('starts full and uses one bar per solved task, down to empty', () => {
    expect(batteryOf(withBolts(0))).toBe(BATTERY_BARS);
    expect(batteryOf(withBolts(2))).toBe(BATTERY_BARS - 2);
    expect(batteryOf(withBolts(50))).toBe(0);
  });

  it('charges one bar at a time from empty, however long ago it ran out', () => {
    let p = withBolts(50);
    for (let k = 1; k <= BATTERY_BARS; k++) {
      p = chargeOne(p);
      expect(batteryOf(p)).toBe(k);
    }
    expect(chargeOne(p)).toBe(p);
    expect(p.robotCharges).toBe(1);
    expect(p.bolts).toBe(50);
  });

  it('teaches a trick every few full charges', () => {
    let p = withBolts(0);
    for (let c = 0; c < TRICKS[0].after; c++) {
      p = { ...p, robotTasks: p.robotTasks + BATTERY_BARS };
      for (let k = 0; k < BATTERY_BARS; k++) p = chargeOne(p);
    }
    expect(tricksOf(p).map((t) => t.id)).toEqual([TRICKS[0].id]);
  });

  it('squeaks after a while and is fixed by oil', () => {
    let p = withBolts(SQUEAKY_AFTER - 1);
    expect(isSqueaky(p)).toBe(false);
    expect(oil(p)).toBe(p);
    p = { ...p, robotTasks: p.robotTasks + 1 };
    expect(isSqueaky(p)).toBe(true);
    p = oil(p);
    expect(isSqueaky(p)).toBe(false);
    expect(p.robotTasks).toBe(SQUEAKY_AFTER);
  });
});
