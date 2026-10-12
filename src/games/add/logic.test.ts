import { describe, expect, it } from 'vitest';
import {
  ADD_LEVELS,
  BOX_W,
  RIGHT_X,
  SCENE_H,
  addLockedSpeech,
  afterTask,
  chooseOffer,
  buildAddRound,
  questionFeedback,
  rightFeedback,
  runningTotal,
  sumSentence,
  tourFeedback,
  tourOrder
} from './logic';

const LIMITS = [5, 10, 10, 19, 18, 100, 99, 98];

describe('Méhecske (addition)', () => {
  it('offers a harder level after five first-try answers, never at the top', () => {
    let s = { level: 0, streak: 0, misses: 0 };
    for (let i = 0; i < 4; i++) {
      const r = afterTask(s, true);
      expect(r.offer).toBeNull();
      s = r;
    }
    const fifth = afterTask(s, true);
    expect(fifth).toMatchObject({ level: 0, streak: 5, offer: 'up' });
    expect(afterTask({ level: ADD_LEVELS.length - 1, streak: 4, misses: 0 }, true).offer).toBeNull();
  });

  it('offers an easier level after three tasks in a row that needed help, never below level one', () => {
    let s = { level: 3, streak: 4, misses: 0 };
    s = afterTask(s, false);
    expect(s.streak).toBe(0);
    s = afterTask(s, false);
    const third = afterTask(s, false);
    expect(third.offer).toBe('down');
    expect(afterTask({ level: 0, streak: 0, misses: 2 }, false).offer).toBeNull();
    expect(afterTask({ level: 3, streak: 0, misses: 2 }, true)).toMatchObject({ misses: 0, offer: null });
  });

  it('moves exactly one step when the child accepts, and stays otherwise', () => {
    expect(chooseOffer({ level: 3, streak: 5, misses: 0 }, 'up', true)).toEqual({ level: 4, streak: 0, misses: 0 });
    expect(chooseOffer({ level: 3, streak: 5, misses: 0 }, 'up', false)).toEqual({ level: 3, streak: 0, misses: 0 });
    expect(chooseOffer({ level: 3, streak: 0, misses: 3 }, 'down', true)).toEqual({ level: 2, streak: 0, misses: 0 });
    expect(chooseOffer({ level: 0, streak: 0, misses: 3 }, 'down', true).level).toBe(0);
  });

  it('keeps every sum inside its level, with a fair set of answers', () => {
    ADD_LEVELS.forEach((level, li) => {
      for (let round = 0; round < 120; round++) {
        const r = buildAddRound(round, li);
        expect(r.a).toBeGreaterThanOrEqual(1);
        expect(r.b).toBeGreaterThanOrEqual(1);
        expect(r.sum).toBe(r.a + r.b);
        expect(r.sum).toBeLessThanOrEqual(LIMITS[li]);
        expect(r.choices).toHaveLength(3);
        expect(new Set(r.choices).size).toBe(3);
        expect(r.choices).toContain(r.sum);
        expect(r.choices.every((c) => c >= 2 && c <= 100)).toBe(true);
        if (level.strategy === 'all') expect(r.items.reduce((s, i) => s + i.value, 0)).toBe(r.sum);
      }
    });
  });

  it('crosses the ten where the level says so, and never where it does not', () => {
    for (let round = 0; round < 120; round++) {
      const crossing20 = buildAddRound(round, 4);
      expect(crossing20.sum).toBeGreaterThan(10);
      expect(crossing20.a).toBeLessThan(10);
      const noCarry = buildAddRound(round, 6);
      expect((noCarry.a % 10) + (noCarry.b % 10)).toBeLessThan(10);
      const carry = buildAddRound(round, 7);
      expect((carry.a % 10) + (carry.b % 10)).toBeGreaterThanOrEqual(10);
    }
  });

  it('draws tens as bouquets from level 4, and keeps everything inside its box', () => {
    const r = { ...buildAddRound(2, 6) };
    expect(r.items.filter((i) => i.kind === 'ten').length).toBe(Math.floor(r.a / 10) + Math.floor(r.b / 10));
    expect(buildAddRound(2, 1).items.every((i) => i.kind === 'one')).toBe(true);
    for (let li = 0; li < ADD_LEVELS.length; li++) {
      for (let round = 0; round < 40; round++) {
        for (const it of buildAddRound(round, li).items) {
          const boxX = it.group === 'a' ? 0 : RIGHT_X;
          expect(it.x).toBeGreaterThan(boxX);
          expect(it.x).toBeLessThan(boxX + BOX_W);
          expect(it.y).toBeGreaterThan(0);
          expect(it.y).toBeLessThan(SCENE_H);
        }
      }
    }
  });

  it('counts tens first on the tour and reaches the sum', () => {
    const r = buildAddRound(5, 7);
    const order = tourOrder(r);
    expect(order[0].kind).toBe('ten');
    expect(runningTotal(r, order)).toBe(r.sum);
    const on = buildAddRound(1, 2);
    expect(runningTotal(on, [])).toBe(on.a);
  });

  it('speaks correct Hungarian', () => {
    expect(sumSentence(3, 2)).toBe('Három meg kettő, az öt.');
    expect(sumSentence(34, 25)).toBe('Harmincnégy meg huszonöt, az ötvenkilenc.');
    const r = { ...buildAddRound(0, 0), a: 3, b: 2, sum: 5 };
    expect(questionFeedback(r).speech).toBe('Három virág meg két virág. Hány virág van összesen?');
    expect(rightFeedback(r).text).toBe('Igen! 3 + 2 = 5. Ügyes vagy!');
    expect(rightFeedback(r, 'up').text.endsWith('Jöhet a nehezebb, vagy maradunk még?')).toBe(true);
    expect(rightFeedback(r, 'down').text.endsWith('Próbáljunk egy kicsit könnyebbet?')).toBe(true);
    expect(rightFeedback(r, 'down').text).not.toMatch(/rossz|hiba/i);
    expect(tourFeedback(r).text).not.toMatch(/rossz|hiba/i);
    expect(addLockedSpeech(8)).toBe('Ez a kertrész még alszik. Ismerj meg még két számot a Számvetésben, és kinyílik!');
  });
});
