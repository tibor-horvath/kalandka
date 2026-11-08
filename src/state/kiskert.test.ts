import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import {
  BEDS,
  BORDER_SPOTS,
  GIFTS_EACH,
  PLOT_BEDS,
  POLLEN_REST,
  VEG_COST,
  VEG_GROWS,
  VEG_SPOTS,
  VISITORS,
  bedAt,
  bedTree,
  basketOf,
  basketTotal,
  broughtBy,
  canGiveFood,
  canPlantVeg,
  canSnack,
  carryOverBeds,
  decorOf,
  foodGiftSize,
  fruitName,
  giftsOf,
  giveFood,
  grownCount,
  openBeds,
  openBorder,
  openVeg,
  ownsTree,
  ownsVeg,
  pickFruit,
  plant,
  plantVeg,
  pollenFlowers,
  ripeVeg,
  seedBalance,
  snack,
  vegAt,
  visitorsOf,
  type Bed
} from './rewards';

const flower = (at = 0): Bed => ({ kind: 'flower', at });
/** A garden with `grown` flowers grown in the first beds and these visitors welcomed. */
const garden = (grown: number, visitorsSeen: number, extra: Partial<Progress> = {}): Progress => ({
  ...DEFAULT_PROGRESS,
  seeds: 200,
  gardenTasks: 100,
  beds: Array.from({ length: grown }, () => flower()),
  visitorsSeen,
  ...extra
});
const seen = (id: (typeof VISITORS)[number]['id']) => VISITORS.findIndex((v) => v.id === id) + 1;

describe('fifteen beds per plot', () => {
  it('has two plots of three rows of five', () => {
    expect(PLOT_BEDS).toBe(15);
    expect(BEDS).toBe(30);
    expect(BORDER_SPOTS).toBe(10);
  });

  it('opens the second plot once the first is planted full, with its own border', () => {
    expect(openBeds(garden(PLOT_BEDS - 1, 0))).toBe(PLOT_BEDS);
    expect(openBeds(garden(PLOT_BEDS, 0))).toBe(BEDS);
    expect(openBorder(garden(PLOT_BEDS, 0))).toBe(BORDER_SPOTS * 2);
  });

  it('carries a ten-bed save over: every bed stays in its plot and the second plot stays open', () => {
    const old: (Bed | null)[] = Array.from({ length: 20 }, (_, i) => ({ kind: 'flower', at: i }));
    const beds = carryOverBeds(old);
    expect(beds).toHaveLength(BEDS);
    expect(beds.slice(0, 10).map((b) => b?.at)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(beds.slice(10, 15)).toEqual([null, null, null, null, null]);
    expect(beds.slice(15, 25).map((b) => b?.at)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    const p = { ...DEFAULT_PROGRESS, beds };
    expect(openBeds(p)).toBe(BEDS);
    expect(grownCount({ ...p, gardenTasks: 100 })).toBe(20);
  });

  it('reads an old save once, and leaves a new one as it is', () => {
    const old = readProgress({ beds: [flower(), null, flower()].concat(Array(8).fill(null), [flower(7)]), stickersSeen: [] });
    expect(old.plotBeds).toBe(15);
    expect(bedAt(old, 0)).not.toBeNull();
    expect(bedAt(old, 11)).toBeNull();
    expect(bedAt(old, 16)?.at).toBe(7);
    const fresh = readProgress({ beds: [null, flower(3)], plotBeds: 15, stickersSeen: [] });
    expect(bedAt(fresh, 1)?.at).toBe(3);
  });
});

describe('twelve visitors', () => {
  it('come at 3 … 30 grown beds, the last when every bed has grown', () => {
    expect(VISITORS).toHaveLength(12);
    expect(VISITORS.map((v) => v.after)).toEqual([3, 5, 8, 10, 13, 16, 18, 20, 22, 25, 27, 30]);
    expect(visitorsOf(garden(30, 0)).length).toBe(12);
    expect(visitorsOf(garden(17, 0)).map((v) => v.id).at(-1)).toBe('squirrel');
  });

  it('take five gifts each', () => {
    expect(GIFTS_EACH).toBe(5);
  });
});

describe('tree kinds', () => {
  it('come with Süni, the blackbird and Mókus', () => {
    expect(ownsTree(garden(30, 0), 'pear')).toBe(true);
    expect(ownsTree(garden(30, 0), 'apple')).toBe(false);
    expect(ownsTree(garden(30, seen('hedgehog')), 'apple')).toBe(true);
    expect(ownsTree(garden(30, seen('hedgehog')), 'cherry')).toBe(false);
    expect(broughtBy('squirrel')?.tree?.id).toBe('walnut');
    expect(broughtBy('rabbit')?.veg?.id).toBe('carrot');
    expect(broughtBy('frog')).toBeNull();
  });

  it('plants the kind asked for only when the child has it', () => {
    const p = garden(0, 0);
    expect(bedTree(bedAt(plant(p, 0, 'tree', 'malva', 'apple'), 0)!)).toBe('pear');
    const q = garden(3, seen('hedgehog'), { beds: [flower(), flower(), flower()] });
    expect(bedTree(bedAt(plant(q, 5, 'tree', 'malva', 'apple'), 5)!)).toBe('apple');
  });

  it('picks apples into the basket, not into the recipes', () => {
    let p = plant(garden(3, seen('hedgehog')), 5, 'tree', 'malva', 'apple');
    p = { ...p, gardenTasks: p.gardenTasks + 20 };
    expect(fruitName(bedAt(p, 5)!)).toBe('alma');
    p = pickFruit(pickFruit(p, 5), 5);
    expect(basketOf(p, 'apple')).toBe(2);
    expect(p.pears).toBe(0);
    expect(basketTotal(p)).toBe(2);
  });
});

describe('the Veteményes', () => {
  it('opens with the first vegetable visitor, five spots per open plot', () => {
    expect(openVeg(garden(18, seen('squirrel')))).toBe(0);
    expect(ownsVeg(garden(18, seen('snail')), 'lettuce')).toBe(true);
    expect(ownsVeg(garden(18, seen('snail')), 'carrot')).toBe(false);
    expect(openVeg(garden(18, seen('snail')))).toBe(VEG_SPOTS * 2);
  });

  it('plants for two seeds and ripens three in two tasks, never counting toward visitors', () => {
    let p = garden(22, seen('rabbit'));
    expect(canPlantVeg(p, 0, 'carrot')).toBe(true);
    p = plantVeg(p, 0, 'carrot');
    expect(seedBalance(p)).toBe(200 - VEG_COST);
    expect(ripeVeg(p, 'carrot')).toBe(0);
    p = { ...p, gardenTasks: p.gardenTasks + VEG_GROWS };
    expect(ripeVeg(p, 'carrot')).toBe(3);
    expect(grownCount(p)).toBe(22);
    expect(canPlantVeg(p, 0, 'carrot')).toBe(false);
  });
});

describe('gifts from the garden', () => {
  it('asks three, then six … fifteen', () => {
    let p = garden(22, seen('rabbit'), { gifts: {} });
    expect(foodGiftSize(p, 'rabbit')).toBe(3);
    p = { ...p, gifts: { rabbit: 4 } };
    expect(foodGiftSize(p, 'rabbit')).toBe(15);
    expect(foodGiftSize(p, 'frog')).toBe(0);
  });

  it('lets Nyuszi eat whole spots of carrots, which are then free to plant again', () => {
    let p = garden(22, seen('rabbit'));
    p = plantVeg(plantVeg(p, 0, 'carrot'), 1, 'carrot');
    expect(canGiveFood(p, 'rabbit')).toBe(false);
    p = { ...p, gardenTasks: p.gardenTasks + VEG_GROWS };
    p = giveFood(p, 'rabbit');
    expect(giftsOf(p, 'rabbit')).toBe(1);
    expect(decorOf(p, 'rabbit').map((d) => d.id)).toEqual(['clover']);
    expect(vegAt(p, 0)).toBeNull();
    expect(vegAt(p, 1)).not.toBeNull();
    expect(canPlantVeg(p, 0, 'carrot')).toBe(true);
    // The second gift needs six: one ripe spot is not enough.
    expect(canGiveFood(p, 'rabbit')).toBe(false);
  });

  it('gives Süni apples straight from the basket', () => {
    let p = garden(3, seen('hedgehog'), { basket: { apple: 4 } });
    p = giveFood(p, 'hedgehog');
    expect(basketOf(p, 'apple')).toBe(1);
    expect(giftsOf(p, 'hedgehog')).toBe(1);
  });

  it('lets Méhecske gather pollen from bed and border flowers, which keep blooming and have more a few tasks later', () => {
    let p = garden(20, seen('bee'), { border: ['malva', 'tulip'] });
    expect(pollenFlowers(p)).toHaveLength(22);
    p = { ...p, gifts: { bee: 4 } };
    expect(foodGiftSize(p, 'bee')).toBe(15);
    p = giveFood(p, 'bee');
    expect(giftsOf(p, 'bee')).toBe(5);
    expect(pollenFlowers(p)).toHaveLength(7);
    expect(p.beds.filter(Boolean)).toHaveLength(20);
    expect(pollenFlowers({ ...p, gardenTasks: p.gardenTasks + POLLEN_REST })).toHaveLength(22);
  });
});

describe('the snack after the five gifts', () => {
  it('is one ripe spot a day, only once every gift is given', () => {
    let p = plantVeg(plantVeg(garden(22, seen('rabbit')), 0, 'carrot'), 1, 'carrot');
    p = { ...p, gardenTasks: p.gardenTasks + VEG_GROWS };
    expect(canSnack(p, 'rabbit', '2026-11-08')).toBe(false);
    p = { ...p, gifts: { rabbit: GIFTS_EACH } };
    expect(canSnack(p, 'rabbit', '2026-11-08')).toBe(true);
    p = snack(p, 'rabbit', '2026-11-08');
    expect(ripeVeg(p, 'carrot')).toBe(3);
    expect(canSnack(p, 'rabbit', '2026-11-08')).toBe(false);
    expect(canSnack(p, 'rabbit', '2026-11-09')).toBe(true);
    expect(canSnack(p, 'hedgehog', '2026-11-09')).toBe(false);
  });
});
