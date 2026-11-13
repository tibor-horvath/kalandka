import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import { GIFTS_EACH, VISITORS, WISHES, canGive, decorCount, decorOf, gardenDone, giftSize, giftsOf, giftsReady, give, treatsOf, wishOf } from './garden';
import { earnedStickers } from './stickers';

/** A garden where every visitor has been welcomed, with these treats on the shelf. */
const shelf = (pantry: Progress['pantry'], extra: Partial<Progress> = {}): Progress => {
  const beds = Array.from({ length: 30 }, () => ({ kind: 'flower' as const, at: 0 }));
  return { ...DEFAULT_PROGRESS, seeds: 100, gardenTasks: 100, beds, visitorsSeen: VISITORS.length, pantry, ...extra };
};

describe('visitor gifts', () => {
  it('has a wish with five decorations for every visitor, all different', () => {
    expect(WISHES.map((w) => w.visitor)).toEqual(VISITORS.map((v) => v.id));
    const ids = WISHES.flatMap((w) => w.decor.map((d) => d.id));
    expect(ids).toHaveLength(VISITORS.length * GIFTS_EACH);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('asks for one treat, then two, up to five', () => {
    let p = shelf({ jam: 20 });
    expect(giftSize(p, 'hedgehog')).toBe(1);
    p = give(p, 'hedgehog');
    expect(treatsOf(p, 'jam')).toBe(19);
    expect(giftSize(p, 'hedgehog')).toBe(2);
    p = give(p, 'hedgehog');
    expect(treatsOf(p, 'jam')).toBe(17);
    p = give(give(give(p, 'hedgehog'), 'hedgehog'), 'hedgehog');
    expect(treatsOf(p, 'jam')).toBe(5);
    expect(giftsOf(p, 'hedgehog')).toBe(GIFTS_EACH);
    expect(giftSize(p, 'hedgehog')).toBe(0);
    expect(give(p, 'hedgehog')).toBe(p);
  });

  it('leaves the decorations in order, one per gift', () => {
    let p = shelf({ compote: 6 });
    expect(decorOf(p, 'frog')).toEqual([]);
    p = give(give(p, 'frog'), 'frog');
    expect(decorOf(p, 'frog').map((d) => d.id)).toEqual(['reeds', 'stepping-stones']);
    expect(decorCount(p)).toBe(2);
  });

  it('waits until the treat is on the shelf', () => {
    const p = shelf({ jam: 1 });
    expect(canGive(p, 'ladybug')).toBe(false);
    expect(give(p, 'ladybug')).toBe(p);
    const later = give(give(p, 'hedgehog'), 'butterfly');
    expect(giftsOf(later, 'butterfly')).toBe(0);
    // No seeds in the bag, so the birds (who also take a handful of seeds) are not ready.
    // Bushes only, so Méhecske finds no pollen and waits for jam like the others.
    const bushes = Array.from({ length: 30 }, () => ({ kind: 'bush' as const, at: 0, watered: 100 }));
    expect(giftsReady(shelf({ jam: 1 }, { seeds: 0, beds: bushes })).map((v) => v.id)).toEqual(['hedgehog', 'butterfly', 'bee', 'rabbit']);
  });

  it('takes gifts only from visitors already welcomed', () => {
    const p = shelf({ loaf: 5 }, { visitorsSeen: 3 });
    expect(wishOf('blackbird').treat).toBe('loaf');
    expect(canGive(p, 'blackbird')).toBe(false);
    expect(canGive({ ...p, visitorsSeen: 4 }, 'blackbird')).toBe(true);
  });

  it('is done when every visitor has had every gift, with a sticker for each step', () => {
    // Fifteen treats per visitor: jam for four of them, pie and the loaf for three, compote for two.
    let p = shelf({ jam: 60, pie: 45, loaf: 45, compote: 30 });
    expect(earnedStickers(p).filter((s) => s.game === 'kiskert')).toEqual([]);
    p = give(p, 'hedgehog');
    expect(earnedStickers(p).filter((s) => s.game === 'kiskert').map((s) => s.id)).toEqual(['kiskert-gift']);
    for (const v of VISITORS) while (canGive(p, v.id)) p = give(p, v.id);
    expect(gardenDone(p)).toBe(true);
    expect(Object.values(p.pantry).every((n) => n === 0)).toBe(true);
    expect(earnedStickers(p).filter((s) => s.game === 'kiskert').map((s) => s.id)).toEqual(['kiskert-gift', 'kiskert-all', 'kiskert-done']);
  });

  it('reads older saves without gifts', () => {
    const old = readProgress({ visitorsSeen: 2, pantry: { jam: 2 }, stickersSeen: [] });
    expect(giftsOf(old, 'hedgehog')).toBe(0);
    expect(canGive(old, 'hedgehog')).toBe(false);
  });
});
