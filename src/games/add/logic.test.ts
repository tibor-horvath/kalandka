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
  gatheredSlots,
  migrateAddLevel,
  needsMoves,
  questionFeedback,
  rightFeedback,
  runningTotal,
  sumSentence,
  takeSentence,
  tourFeedback,
  tourOrder
} from './logic';

const LIMITS = [5, 5, 5, 10, 10, 10, 19, 18, 100, 99, 98];

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
        const take = level.strategy === 'take';
        expect(r.answer).toBe(take ? r.a - r.b : r.a + r.b);
        expect(r.answer).toBeGreaterThanOrEqual(1);
        expect(take ? r.a : r.answer).toBeLessThanOrEqual(LIMITS[li]);
        expect(r.choices).toHaveLength(3);
        expect(new Set(r.choices).size).toBe(3);
        expect(r.choices).toContain(r.answer);
        expect(r.choices.every((c) => c >= 1 && c <= 100)).toBe(true);
        if (take) expect(r.items.length).toBe(r.a);
        else if (level.strategy !== 'on') expect(r.items.reduce((s, i) => s + i.value, 0)).toBe(r.answer);
      }
    });
  });

  it('crosses the ten where the level says so, and never where it does not', () => {
    for (let round = 0; round < 120; round++) {
      const crossing20 = buildAddRound(round, 7);
      expect(crossing20.answer).toBeGreaterThan(10);
      expect(crossing20.a).toBeLessThan(10);
      const noCarry = buildAddRound(round, 9);
      expect((noCarry.a % 10) + (noCarry.b % 10)).toBeLessThan(10);
      const carry = buildAddRound(round, 10);
      expect((carry.a % 10) + (carry.b % 10)).toBeGreaterThanOrEqual(10);
    }
  });

  it('draws tens as bouquets from 20 up, and keeps everything inside its box', () => {
    const r = { ...buildAddRound(2, 9) };
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
    const r = buildAddRound(5, 10);
    const order = tourOrder(r);
    expect(order[0].kind).toBe('ten');
    expect(runningTotal(r, order)).toBe(r.answer);
    const on = buildAddRound(1, 5);
    expect(runningTotal(on, [])).toBe(on.a);
  });

  it('starts digit-free: gather and take levels first, with dot answers', () => {
    expect(ADD_LEVELS.slice(0, 2).map((l) => [l.strategy, l.answers])).toEqual([
      ['gather', 'dots'],
      ['take', 'dots']
    ]);
    expect(ADD_LEVELS.slice(2).every((l) => l.answers !== 'dots')).toBe(true);
    for (let round = 0; round < 40; round++) {
      const r = buildAddRound(round, 0);
      expect(needsMoves(r)).toBe(true);
      expect(questionFeedback(r).text).not.toMatch(/[0-9]/);
      expect(rightFeedback(r).text).not.toMatch(/[0-9]/);
    }
    expect(needsMoves(buildAddRound(0, 2))).toBe(false);
  });

  it('gathers every flower into the left bed, one slot each, and keeps the first group in place', () => {
    for (let round = 0; round < 40; round++) {
      const r = buildAddRound(round, 3);
      const start = gatheredSlots(r, 0);
      r.items.filter((i) => i.group === 'a').forEach((it, k) => expect(start[k]).toMatchObject({ x: it.x, y: it.y }));
      const all = gatheredSlots(r, r.b);
      expect(all).toHaveLength(r.answer);
      expect(all.every((s) => s.x > 0 && s.x < BOX_W && s.y > 0 && s.y < SCENE_H)).toBe(true);
    }
  });

  it('counts only the flowers left behind on a take level', () => {
    const r = buildAddRound(3, 4);
    const gone = r.items.slice(0, r.b).map((i) => i.id);
    expect(runningTotal(r, tourOrder(r, gone))).toBe(r.answer);
  });

  it('keeps a saved child on the same sums after the new levels were added', () => {
    const names = ['5-ig', '10-ig, gyűjtéssel', '10-ig, továbbszámolással', '20-ig', '20-ig, tízes átlépéssel', 'Kerek tízesek 100-ig', '100-ig', '100-ig, tízes átlépéssel'];
    names.forEach((name, old) => expect(ADD_LEVELS[migrateAddLevel(old)].name).toBe(name));
  });

  it('speaks correct Hungarian', () => {
    expect(sumSentence(3, 2)).toBe('Három meg kettő, az öt.');
    expect(sumSentence(34, 25)).toBe('Harmincnégy meg huszonöt, az ötvenkilenc.');
    const r = { ...buildAddRound(0, 2), a: 3, b: 2, answer: 5 };
    expect(questionFeedback(r).speech).toBe('Három virág meg két virág. Hány virág van összesen?');
    expect(rightFeedback(r).text).toBe('Igen! 3 + 2 = 5. Ügyes vagy!');
    expect(rightFeedback(r, 'up').text.endsWith('Jöhet a nehezebb, vagy maradunk még?')).toBe(true);
    expect(rightFeedback(r, 'down').text.endsWith('Próbáljunk egy kicsit könnyebbet?')).toBe(true);
    expect(rightFeedback(r, 'down').text).not.toMatch(/rossz|hiba/i);
    expect(tourFeedback(r).text).not.toMatch(/rossz|hiba/i);
    expect(takeSentence(5, 2)).toBe('Öt virágból kettőt elvitt a méhecske, maradt három.');
    const t = { ...buildAddRound(0, 1), a: 5, b: 2, answer: 3 };
    expect(questionFeedback(t).speech).toBe('Öt virág nyílik. A méhecske elvisz kettőt a kaptárba. Koppints két virágra!');
    expect(questionFeedback(t, 1).speech).toBe('Még egy virágot vigyen el!');
    expect(questionFeedback(t, 2).speech).toBe('Hány virág maradt?');
    expect(tourFeedback(t).text).not.toMatch(/rossz|hiba/i);
    expect(addLockedSpeech(8)).toBe('Ez a kertrész még alszik. Ismerj meg még két számot a Számvetésben, és kinyílik!');
  });
});
