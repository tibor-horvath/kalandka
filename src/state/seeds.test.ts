import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import { BORDER_SPOTS, FLOWERS, PLOT_BEDS, VISITORS, bedAt, bedFlower, borderAt, borderPattern, buyFlower, canBuyFlower, canGive, canGiveSeeds, canPlantBorder, decorOf, emptyBorder, giftsOf, giftsReady, giveSeeds, openBorder, ownedFlowers, ownsFlower, plant, plantBorder, seedBalance, seedGiftSize, type FlowerId } from './garden';

const withSeeds = (n: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, seeds: n, ...extra });

describe('flower kinds (Magtár)', () => {
  it('starts every child with Mályva only, and the packets cost more the further along', () => {
    expect(ownedFlowers(DEFAULT_PROGRESS).map((f) => f.id)).toEqual(['malva']);
    const costs = FLOWERS.map((f) => f.cost);
    expect(costs[0]).toBe(0);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
  });

  it('buys a packet once, for good, with its seeds', () => {
    let p = withSeeds(10);
    expect(canBuyFlower(p, 'tulip')).toBe(true);
    p = buyFlower(p, 'tulip');
    expect(ownsFlower(p, 'tulip')).toBe(true);
    expect(seedBalance(p)).toBe(7);
    expect(buyFlower(p, 'tulip')).toBe(p);
  });

  it('does not buy without enough seeds', () => {
    const p = withSeeds(4);
    expect(canBuyFlower(p, 'cornflower')).toBe(false);
    expect(buyFlower(p, 'cornflower')).toBe(p);
  });

  it('plants a flower of a kind the child has, and Mályva for one they do not', () => {
    let p = buyFlower(withSeeds(20), 'tulip');
    p = plant(p, 0, 'flower', 'tulip');
    p = plant(p, 1, 'flower', 'bellflower');
    expect(bedFlower(bedAt(p, 0)!)).toBe('tulip');
    expect(bedFlower(bedAt(p, 1)!)).toBe('malva');
    expect(bedAt(p, 1)!.flower).toBeUndefined();
    expect(seedBalance(p)).toBe(20 - 3 - 3 - 3);
  });

  it('keeps older beds as Mályva', () => {
    const p = readProgress({ seeds: 3, seedsSpent: 3, beds: [{ kind: 'flower', at: 0 }] });
    expect(bedFlower(bedAt(p, 0)!)).toBe('malva');
    expect(p.flowersOwned).toEqual([]);
    expect(p.border).toEqual([]);
  });
});

describe('the border (Szegély)', () => {
  const full = (kinds: FlowerId[], extra: Partial<Progress> = {}) =>
    kinds.reduce((p, f, i) => plantBorder(p, i, f), FLOWERS.reduce((p, f) => buyFlower(p, f.id), withSeeds(100, extra)));

  it('opens ten spots per open plot', () => {
    expect(openBorder(DEFAULT_PROGRESS)).toBe(BORDER_SPOTS);
    const firstFull = { beds: Array.from({ length: PLOT_BEDS }, () => ({ kind: 'flower' as const, at: 0 })) };
    expect(openBorder(withSeeds(0, firstFull))).toBe(BORDER_SPOTS * 2);
  });

  it('costs one seed for a new flower and nothing to change one', () => {
    let p = buyFlower(withSeeds(5), 'tulip');
    p = plantBorder(p, 0, 'malva');
    expect(seedBalance(p)).toBe(1);
    p = plantBorder(p, 0, 'tulip');
    expect(borderAt(p, 0)).toBe('tulip');
    expect(seedBalance(p)).toBe(1);
    expect(canPlantBorder(p, 0, 'tulip')).toBe(false);
  });

  it('needs a seed for an empty spot and a kind the child has', () => {
    const none = withSeeds(0);
    expect(canPlantBorder(none, 0, 'malva')).toBe(false);
    const some = withSeeds(3);
    expect(canPlantBorder(some, 0, 'tulip')).toBe(false);
    expect(canPlantBorder(some, BORDER_SPOTS, 'malva')).toBe(false);
  });

  it('lists the empty spots of a row in order', () => {
    const p = plantBorder(plantBorder(withSeeds(5), 0, 'malva'), 2, 'malva');
    expect(emptyBorder(p, 0)).toEqual([1, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('finds the repeating pattern of a full row', () => {
    expect(borderPattern(full(['malva', 'tulip', 'malva', 'tulip', 'malva', 'tulip', 'malva', 'tulip', 'malva', 'tulip']), 0)).toEqual(['malva', 'tulip']);
    expect(borderPattern(full(['malva', 'malva', 'tulip', 'malva', 'malva', 'tulip', 'malva', 'malva', 'tulip', 'malva']), 0)).toEqual(['malva', 'malva', 'tulip']);
    const abc: FlowerId[] = ['tulip', 'primrose', 'cornflower'];
    expect(borderPattern(full(Array.from({ length: 10 }, (_, k) => abc[k % 3])), 0)).toEqual(abc);
  });

  it('sees no pattern in one kind, a mixed row or a row with gaps', () => {
    expect(borderPattern(full(Array.from({ length: 10 }, () => 'malva' as FlowerId)), 0)).toBeNull();
    expect(borderPattern(full(['malva', 'tulip', 'tulip', 'malva', 'tulip', 'malva', 'malva', 'tulip', 'malva', 'tulip']), 0)).toBeNull();
    expect(borderPattern(full(['malva', 'tulip', 'malva', 'tulip']), 0)).toBeNull();
  });
});

describe('a handful of seeds for the birds', () => {
  const birds = (seeds: number, extra: Partial<Progress> = {}): Progress => {
    // Ten grown plants: the hedgehog, ladybug, butterfly and blackbird have come.
    const beds = Array.from({ length: 10 }, () => ({ kind: 'flower' as const, at: 0 }));
    return { ...DEFAULT_PROGRESS, seeds, gardenTasks: 100, beds, visitorsSeen: 4, ...extra };
  };

  it('is three seeds for each treat asked for, for the blackbird and Mókus only', () => {
    const p = birds(30);
    expect(seedGiftSize(p, 'blackbird')).toBe(3);
    expect(seedGiftSize(p, 'squirrel')).toBe(3);
    expect(seedGiftSize(p, 'hedgehog')).toBe(0);
  });

  it('lets the blackbird have a gift before the garden is full', () => {
    let p = birds(20);
    expect(canGive(p, 'blackbird')).toBe(false);
    expect(canGiveSeeds(p, 'blackbird')).toBe(true);
    expect(giftsReady(p).map((v) => v.id)).toContain('blackbird');
    p = giveSeeds(p, 'blackbird');
    expect(giftsOf(p, 'blackbird')).toBe(1);
    expect(decorOf(p, 'blackbird').map((d) => d.id)).toEqual(['feeder']);
    expect(seedBalance(p)).toBe(17);
    expect(seedGiftSize(p, 'blackbird')).toBe(6);
    p = giveSeeds(giveSeeds(p, 'blackbird'), 'blackbird');
    expect(seedBalance(p)).toBe(17 - 6 - 9);
    expect(giftsOf(p, 'blackbird')).toBe(3);
    expect(seedGiftSize(p, 'blackbird')).toBe(12);
    // Two seeds left in the bag: not enough for the fourth handful.
    expect(giveSeeds(p, 'blackbird')).toBe(p);
  });

  it('waits for enough seeds, and for the bird to have come', () => {
    expect(canGiveSeeds(birds(2), 'blackbird')).toBe(false);
    expect(canGiveSeeds(birds(20), 'squirrel')).toBe(false);
    expect(VISITORS.find((v) => v.id === 'squirrel')).toBeDefined();
  });
});
