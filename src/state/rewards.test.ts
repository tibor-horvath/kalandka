import { describe, expect, it } from 'vitest';
import { ADD_LEVELS } from '../games/add/logic';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import {
  BEDS,
  growAfter,
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

describe('stickers', () => {
  it('belong to known games, three per skill step, with unique ids', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    for (const g of STICKER_GAMES) expect(STICKERS.filter((s) => s.game === g.id && !s.set)).toHaveLength(3);
    expect(STICKERS.filter((s) => s.set).map((s) => s.id)).toEqual(['trace-fade', 'trace-memory']);
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
