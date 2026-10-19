import { describe, expect, it } from 'vitest';
import { ADD_LEVELS } from '../games/add/logic';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import {
  BEDS,
  PLOT_BEDS,
  basketBerries,
  basketPears,
  canMake,
  emptyBeds,
  gardenFull,
  growAfter,
  make,
  openBeds,
  pantryCount,
  treatsOf,
  STICKERS,
  STICKER_GAMES,
  VISITORS,
  canPlant,
  earnedStickers,
  grownCount,
  markEarnedSeen,
  markStickerSeen,
  newStickers,
  newVisitor,
  plant,
  seedBalance
} from './rewards';

const withSeeds = (seeds: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, seeds, ...extra });

describe('Kiskert', () => {
  it('spends seeds from the balance but never lowers the seeds earned', () => {
    const p = plant(withSeeds(7), 0, 'flower');
    expect(p.seeds).toBe(7);
    expect(seedBalance(p)).toBe(4);
    expect(p.beds[0]).toEqual({ kind: 'flower', at: 7 });
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
    expect(grownCount({ ...p, seeds: p.seeds + growAfter('flower') - 1 })).toBe(0);
    expect(grownCount({ ...p, seeds: p.seeds + growAfter('flower') })).toBe(1);
  });

  it('grows bigger plants more slowly: flower, then bush, then tree', () => {
    expect(growAfter('flower')).toBeLessThan(growAfter('bush'));
    expect(growAfter('bush')).toBeLessThan(growAfter('tree'));
    let p = plant(plant(withSeeds(13), 0, 'flower'), 1, 'tree');
    p = { ...p, seeds: p.seeds + growAfter('flower') };
    expect(grownCount(p)).toBe(1);
    p = { ...p, seeds: p.seeds + growAfter('tree') - growAfter('flower') };
    expect(grownCount(p)).toBe(2);
  });

  it('brings each visitor once, in order, as the garden grows', () => {
    let p = withSeeds(100);
    for (let i = 0; i < VISITORS[0].after; i++) p = plant(p, i, 'flower');
    expect(newVisitor(p)).toBeNull();
    p = { ...p, seeds: p.seeds + growAfter('flower') };
    expect(newVisitor(p)?.id).toBe('hedgehog');
    p = { ...p, visitorsSeen: 1 };
    expect(newVisitor(p)).toBeNull();
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

describe('stickers', () => {
  it('belong to known games, three per skill step, with unique ids', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    for (const g of STICKER_GAMES) expect(STICKERS.filter((s) => s.game === g.id && !s.set)).toHaveLength(3);
    expect(STICKERS.filter((s) => s.set).map((s) => s.id)).toEqual(['trace-fade', 'trace-memory', 'path-repeat', 'path-two', 'sort-two', 'sort-rule', 'scale-missing', 'scale-secret', 'seq-fix', 'seq-translate']);
  });

  it('keeps each world’s stickers to its own album page and home screen', () => {
    expect(STICKER_GAMES.filter((g) => g.world === 'robot').map((g) => g.id)).toEqual(['path', 'sort', 'scale', 'seq']);
    const p = { ...DEFAULT_PROGRESS, learnSolved: 5, pathSolved: 1 };
    expect(newStickers(p, 'garden').map((s) => s.id)).toEqual(['learn-5']);
    expect(newStickers(p, 'robot').map((s) => s.id)).toEqual(['path-first']);
    expect(newStickers(p)).toHaveLength(2);
  });

  it('gives a Robotút sticker for the first course solved on its level', () => {
    const ids = (pathSolved: number) => earnedStickers({ ...DEFAULT_PROGRESS, pathSolved }).map((s) => s.id);
    expect(ids(10)).toEqual(['path-first']);
    expect(ids(11)).toEqual(['path-first', 'path-plan']);
    expect(ids(999)).toEqual(['path-first', 'path-plan', 'path-turn', 'path-repeat', 'path-two']);
  });

  it('gives a Válogatógép sticker for the first round solved on its level', () => {
    const ids = (sortSolved: number) => earnedStickers({ ...DEFAULT_PROGRESS, sortSolved }).map((s) => s.id);
    expect(ids(0)).toEqual([]);
    expect(ids(1)).toEqual(['sort-first']);
    expect(ids(10)).toEqual(['sort-first']);
    expect(ids(11)).toEqual(['sort-first', 'sort-shape']);
    expect(ids(999)).toEqual(['sort-first', 'sort-shape', 'sort-odd', 'sort-two', 'sort-rule']);
  });

  it('gives a Mintagép sticker for the first round solved on its level', () => {
    const ids = (seqSolved: number) => earnedStickers({ ...DEFAULT_PROGRESS, seqSolved }).map((s) => s.id);
    expect(ids(0)).toEqual([]);
    expect(ids(1)).toEqual(['seq-first']);
    expect(ids(10)).toEqual(['seq-first']);
    expect(ids(11)).toEqual(['seq-first', 'seq-both']);
    expect(ids(999)).toEqual(['seq-first', 'seq-both', 'seq-turn', 'seq-fix', 'seq-translate']);
  });

  it('gives a Mérleg sticker for the first round solved on its level', () => {
    const ids = (scaleSolved: number) => earnedStickers({ ...DEFAULT_PROGRESS, scaleSolved }).map((s) => s.id);
    expect(ids(0)).toEqual([]);
    expect(ids(1)).toEqual(['scale-first']);
    expect(ids(11)).toEqual(['scale-first', 'scale-even']);
    expect(ids(999)).toEqual(['scale-first', 'scale-even', 'scale-two', 'scale-missing', 'scale-secret']);
  });

  it('gives the faded-trail stickers only for digits written on a faded trail', () => {
    const ids = (p: Progress) => earnedStickers(p).map((s) => s.id).filter((id) => id.startsWith('trace'));
    expect(ids({ ...DEFAULT_PROGRESS, traceSolved: 30 })).toEqual(['trace-5', 'trace-9', 'trace-0']);
    expect(ids({ ...DEFAULT_PROGRESS, traceSolved: 15, traceFadedSolved: 5 })).toContain('trace-fade');
    expect(ids({ ...DEFAULT_PROGRESS, traceSolved: 20, traceFadedSolved: 10 })).toContain('trace-memory');
  });

  it('finds the Méhecske levels they are tied to', () => {
    for (const name of ['10-ig, gyűjtéssel', '20-ig', 'Kerek tízesek 100-ig']) expect(ADD_LEVELS.some((l) => l.name === name)).toBe(true);
  });

  it('earns nothing on a fresh start and steps up with progress', () => {
    expect(earnedStickers(DEFAULT_PROGRESS)).toEqual([]);
    const p = { ...DEFAULT_PROGRESS, traceSolved: 9 };
    expect(earnedStickers(p).map((s) => s.id)).toEqual(['trace-5', 'trace-9']);
  });

  it('celebrates each new sticker once', () => {
    let p: Progress = { ...DEFAULT_PROGRESS, learnSolved: 5 };
    expect(newStickers(p).map((s) => s.id)).toEqual(['learn-5']);
    p = markStickerSeen(p, 'learn-5');
    expect(newStickers(p)).toEqual([]);
    expect(markStickerSeen(p, 'learn-5')).toBe(p);
  });

  it('files away stickers from a jump in progress without a celebration', () => {
    const p = markEarnedSeen({ ...DEFAULT_PROGRESS, potsSolved: 10 });
    expect(earnedStickers(p)).toHaveLength(2);
    expect(newStickers(p)).toEqual([]);
  });

  it('files away what an older save had earned, but keeps newer saves as they are', () => {
    const old = readProgress({ seeds: 12, learnSolved: 10 });
    expect(newStickers(old)).toEqual([]);
    expect(seedBalance(old)).toBe(12);
    const current = readProgress({ learnSolved: 10, stickersSeen: [] });
    expect(newStickers(current).map((s) => s.id)).toEqual(['learn-5', 'learn-10']);
  });
});
