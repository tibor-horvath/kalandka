import { describe, expect, it } from 'vitest';
import { STORE_MAX, balanceIn, roomIn, storeFull } from './balance';
import { BASKET_MAX, SHELF_MAX, basketHolds, basketPears, canMake, growAfter, make, pickFruit, plant, ripeFruit, shelfFull, treatsOf } from './garden';
import { creditPractice, creditTasks } from './pod';
import { save } from './testSave';

describe('store limits (Magtár, Raktár, Harangtár)', () => {
  it('pays into a store until it holds STORE_MAX, then the pod rests', () => {
    const near = save({ seeds: STORE_MAX - 1, gardenTasks: 1 });
    const paid = creditTasks(near, 'garden');
    expect(balanceIn(paid, 'garden')).toBe(STORE_MAX);
    expect(storeFull(paid, 'garden')).toBe(true);
    const more = creditTasks(creditTasks(paid, 'garden'), 'garden');
    expect(balanceIn(more, 'garden')).toBe(STORE_MAX);
    // The garden clock still moves with every task.
    expect(more.worlds.garden.tasks).toBe(paid.worlds.garden.tasks + 2);
  });

  it('keeps everything a save already holds above the limit', () => {
    const over = save({ bolts: STORE_MAX + 30, robotTasks: 3 });
    const after = creditTasks(over, 'robot');
    expect(balanceIn(after, 'robot')).toBe(STORE_MAX + 30);
    expect(roomIn(after, 'robot')).toBe(0);
  });

  it('pays again once the child spends', () => {
    const full = save({ bells: STORE_MAX, bellsSpent: 2, towerTasks: 1 });
    expect(roomIn(full, 'tower')).toBe(2);
    expect(balanceIn(creditTasks(full, 'tower'), 'tower')).toBe(STORE_MAX - 1);
  });

  it('does not count a reward a full store could not take toward the day’s practice', () => {
    const full = save({ seeds: STORE_MAX, gardenTasks: 1 });
    const after = creditPractice(full, 'add', 'garden', '2026-11-18');
    expect(balanceIn(after, 'garden')).toBe(STORE_MAX);
    expect(after.practicePay.paid.add ?? 0).toBe(0);
  });
});

describe('basket and Kamra limits', () => {
  // A grown pear tree in bed 0 with its fruit ripe.
  const orchard = (pears: number) => {
    const p = plant(save({ seeds: 10 }), 0, 'tree');
    return save({ gardenTasks: growAfter('tree') + 3, pears }, p);
  };

  it('picks into the basket until a kind has BASKET_MAX, then the fruit waits on the tree', () => {
    const roomy = orchard(BASKET_MAX - 1);
    const picked = pickFruit(roomy, 0);
    expect(basketHolds(picked, 'pear')).toBe(BASKET_MAX);
    const ripe = ripeFruit(picked.beds[0]!, picked.worlds.garden.tasks);
    expect(ripe).toBeGreaterThan(0);
    expect(pickFruit(picked, 0)).toBe(picked);
  });

  it('cooks a treat until its shelf holds SHELF_MAX', () => {
    const p = save({ pears: 30, pantry: { compote: SHELF_MAX - 1 } });
    expect(canMake(p, 'compote')).toBe(true);
    const full = make(p, 'compote');
    expect(treatsOf(full, 'compote')).toBe(SHELF_MAX);
    expect(shelfFull(full, 'compote')).toBe(true);
    expect(canMake(full, 'compote')).toBe(false);
    expect(make(full, 'compote')).toBe(full);
    expect(basketPears(full)).toBe(27);
  });
});
