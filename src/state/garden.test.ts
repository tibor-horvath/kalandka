import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import { BEDS, PLOT_BEDS, VISITORS, basketBerries, basketPears, canMake, canPlant, emptyBeds, gardenFull, growAfter, grownCount, make, newVisitor, openBeds, pantryCount, plant, seedBalance, treatsOf, visitorProgress } from './garden';

const withSeeds = (seeds: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, seeds, ...extra });

describe('Kiskert', () => {
  it('spends seeds from the balance but never lowers the seeds earned', () => {
    const p = plant(withSeeds(7), 0, 'flower');
    expect(p.seeds).toBe(7);
    expect(seedBalance(p)).toBe(4);
    expect(p.beds[0]).toEqual({ kind: 'flower', at: 0 });
    expect(p.beds).toHaveLength(BEDS);
  });

  it('does not plant without enough seeds, in a taken bed or outside the garden', () => {
    const p = withSeeds(5);
    expect(canPlant(p, 0, 'bush')).toBe(false);
    expect(plant(p, 0, 'bush')).toBe(p);
    const planted = plant(p, 0, 'flower');
    expect(plant(planted, 0, 'flower')).toBe(planted);
    expect(canPlant(withSeeds(50), BEDS, 'flower')).toBe(false);
  });

  it('grows a planting after a few more solved tasks', () => {
    const p = plant(withSeeds(3), 2, 'flower');
    expect(grownCount(p)).toBe(0);
    expect(grownCount({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') - 1 })).toBe(0);
    expect(grownCount({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') })).toBe(1);
  });

  it('grows bigger plants more slowly: flower, then bush, then tree', () => {
    expect(growAfter('flower')).toBeLessThan(growAfter('bush'));
    expect(growAfter('bush')).toBeLessThan(growAfter('tree'));
    let p = plant(plant(withSeeds(13), 0, 'flower'), 1, 'tree');
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('flower') };
    expect(grownCount(p)).toBe(1);
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('tree') - growAfter('flower') };
    expect(grownCount(p)).toBe(2);
  });

  it('brings each visitor once, in order, as the garden grows', () => {
    let p = withSeeds(100);
    for (let i = 0; i < VISITORS[0].after; i++) p = plant(p, i, 'flower');
    expect(newVisitor(p)).toBeNull();
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('flower') };
    expect(newVisitor(p)?.id).toBe('hedgehog');
    p = { ...p, visitorsSeen: 1 };
    expect(newVisitor(p)).toBeNull();
  });

  it('shows the way to the next visitor: grown plants since the one before, and the ones still growing', () => {
    let p = withSeeds(100);
    expect(visitorProgress(p)).toEqual({ need: VISITORS[0].after, done: 0, coming: 0 });
    p = plant(plant(p, 0, 'flower'), 1, 'flower');
    expect(visitorProgress(p)).toEqual({ need: 3, done: 0, coming: 2 });
    p = plant({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') }, 2, 'flower');
    expect(visitorProgress(p)).toEqual({ need: 3, done: 2, coming: 1 });
    // Süni came at 3 and was welcomed: the way to Katica (5) starts again from there.
    p = { ...plant({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') }, 3, 'flower'), visitorsSeen: 1 };
    expect(visitorProgress(p)).toEqual({ need: VISITORS[1].after - VISITORS[0].after, done: 0, coming: 1 });
    expect(visitorProgress({ ...p, visitorsSeen: VISITORS.length })).toBeNull();
  });

  it('can reach every visitor within the beds', () => {
    expect(Math.max(...VISITORS.map((v) => v.after))).toBeLessThanOrEqual(BEDS);
  });
});

describe('Kiskert plots', () => {
  it('opens the second plot once every bed of the first is planted', () => {
    let p = withSeeds(100);
    expect(openBeds(p)).toBe(PLOT_BEDS);
    expect(canPlant(p, PLOT_BEDS, 'flower')).toBe(false);
    for (let i = 0; i < PLOT_BEDS - 1; i++) p = plant(p, i, 'flower');
    expect(openBeds(p)).toBe(PLOT_BEDS);
    p = plant(p, PLOT_BEDS - 1, 'flower');
    expect(openBeds(p)).toBe(BEDS);
    expect(emptyBeds(p)[0]).toBe(PLOT_BEDS);
    expect(canPlant(p, PLOT_BEDS, 'flower')).toBe(true);
    expect(gardenFull(p)).toBe(false);
  });

  it('is full only when both plots are planted', () => {
    let p = withSeeds(100);
    for (let i = 0; i < BEDS; i++) p = plant(p, i, 'flower');
    expect(gardenFull(p)).toBe(true);
    expect(emptyBeds(p)).toEqual([]);
  });
});

describe('Kamra', () => {
  const basket = (pears: number, berries: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, pears, berries, ...extra });

  it('makes fruit from the basket into a treat, keeping the fruit ever picked', () => {
    const p = make(basket(4, 1), 'compote');
    expect(treatsOf(p, 'compote')).toBe(1);
    expect(basketPears(p)).toBe(1);
    expect(basketBerries(p)).toBe(1);
    expect(p.pears).toBe(4);
    expect(pantryCount(p)).toBe(1);
  });

  it('does not make a treat without enough fruit', () => {
    const p = basket(2, 2);
    expect(canMake(p, 'jam')).toBe(false);
    expect(make(p, 'jam')).toBe(p);
    expect(treatsOf(make(p, 'pie'), 'pie')).toBe(1);
  });

  it('bakes the seed loaf only once the whole garden is planted', () => {
    let p = withSeeds(1000);
    expect(canMake(p, 'loaf')).toBe(false);
    for (let i = 0; i < BEDS; i++) p = plant(p, i, 'flower');
    expect(canMake(p, 'loaf')).toBe(true);
    const before = seedBalance(p);
    p = make(p, 'loaf');
    expect(seedBalance(p)).toBe(before - 5);
    expect(treatsOf(p, 'loaf')).toBe(1);
  });

  it('reads older saves without a pantry', () => {
    const old = readProgress({ pears: 3, berries: 2, stickersSeen: [] });
    expect(basketPears(old)).toBe(3);
    expect(pantryCount(old)).toBe(0);
  });
});
