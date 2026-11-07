import { describe, expect, it } from 'vitest';
import {
  ADD_LEVELS,
  BOX_W,
  RIGHT_X,
  SCENE_H,
  addLockedSpeech,
  bedWidth,
  carriedValue,
  buildAddRound,
  gatheredSlots,
  migrateAddLevel,
  needsMoves,
  questionFeedback,
  rightFeedback,
  runningTotal,
  sumSentence,
  takeLayout,
  takeSentence,
  takeTap,
  UNTIE_HINT,
  mustUntie,
  tourFeedback,
  tourOrder,
  untie,
  type AddItem
} from './logic';

const LIMITS = [5, 5, 5, 10, 10, 10, 19, 19, 18, 18, 100, 50, 99, 59, 98, 58];

describe('Méhkas (addition)', () => {
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
        if (take) expect(r.items.reduce((s, i) => s + i.value, 0)).toBe(r.a);
        else if (level.strategy !== 'on') expect(r.items.reduce((s, i) => s + i.value, 0)).toBe(r.answer);
      }
    });
  });

  it('crosses the ten where the level says so, and never where it does not', () => {
    for (let round = 0; round < 120; round++) {
      const crossing20 = buildAddRound(round, 8);
      expect(crossing20.answer).toBeGreaterThan(10);
      expect(crossing20.a).toBeLessThan(10);
      const noCarry = buildAddRound(round, 12);
      expect((noCarry.a % 10) + (noCarry.b % 10)).toBeLessThan(10);
      const carry = buildAddRound(round, 14);
      expect((carry.a % 10) + (carry.b % 10)).toBeGreaterThanOrEqual(10);
    }
  });

  it('draws tens as bouquets from 20 up, and keeps everything inside its box', () => {
    const r = { ...buildAddRound(2, 12) };
    expect(r.items.filter((i) => i.kind === 'ten').length).toBe(Math.floor(r.a / 10) + Math.floor(r.b / 10));
    expect(buildAddRound(2, 1).items.every((i) => i.kind === 'one')).toBe(true);
    for (let li = 0; li < ADD_LEVELS.length; li++) {
      for (let round = 0; round < 40; round++) {
        for (const it of buildAddRound(round, li).items) {
          const r = buildAddRound(round, li);
          const boxX = it.group === 'a' ? 0 : RIGHT_X;
          expect(it.x).toBeGreaterThan(boxX);
          expect(it.x).toBeLessThan(boxX + (it.group === 'a' ? bedWidth(r) : BOX_W));
          expect(it.y).toBeGreaterThan(0);
          expect(it.y).toBeLessThan(SCENE_H);
        }
      }
    }
  });

  it('counts tens first on the tour and reaches the sum', () => {
    const r = buildAddRound(5, 14);
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
    names.forEach((name, old) => expect(ADD_LEVELS[migrateAddLevel(old, 1)].name).toBe(name));
    const v2 = ['Gyűjtés 5-ig', 'Elvétel 5-ig', '5-ig', '10-ig, gyűjtéssel', 'Elvétel 10-ig', '10-ig, továbbszámolással', '20-ig', '20-ig, tízes átlépéssel', 'Kerek tízesek 100-ig', '100-ig', '100-ig, tízes átlépéssel'];
    v2.forEach((name, old) => expect(ADD_LEVELS[migrateAddLevel(old, 2)].name).toBe(name));
  });

  it('puts each subtraction level right after its addition twin, crossing the ten only where it says so', () => {
    const takes = ADD_LEVELS.map((l, i) => [l, i] as const).filter(([l]) => l.strategy === 'take' && l.bundles);
    expect(takes.map(([l]) => l.name)).toEqual(['Elvétel 20-ig', 'Elvétel 20-ig, tízes átlépéssel', 'Kerek tízesek elvétele', 'Elvétel 100-ig', 'Elvétel 100-ig, tízes átlépéssel']);
    for (const [level, li] of takes) {
      for (let round = 0; round < 120; round++) {
        const r = buildAddRound(round, li);
        expect(r.b).toBeLessThan(r.a);
        const crosses = r.b % 10 > r.a % 10;
        expect(crosses).toBe(level.name.includes('átlépéssel'));
        if (level.name.startsWith('Kerek')) expect([r.a % 10, r.b % 10]).toEqual([0, 0]);
      }
    }
  });

  it('lets the child take away exactly b on every bouquet level, untying a bouquet only when it must', () => {
    ADD_LEVELS.forEach((level, li) => {
      if (level.strategy !== 'take') return;
      for (let round = 0; round < 60; round++) {
        const r = buildAddRound(round, li);
        let items: AddItem[] = r.items;
        const gone: string[] = [];
        let unties = 0;
        for (let guard = 0; carriedValue(items, gone) < r.b && guard < 200; guard++) {
          const need = r.b - carriedValue(items, gone);
          const left = items.filter((i) => !gone.includes(i.id));
          // A child who prefers loose flowers, but takes whole bouquets while ten or more are needed.
          const pick = (need >= 10 && left.find((i) => i.kind === 'ten')) || left.find((i) => i.kind === 'one') || left.find((i) => i.kind === 'ten')!;
          const act = takeTap(items, gone, pick, need);
          if (act === 'carry') gone.push(pick.id);
          else if (act === 'untie') {
            items = untie(items, pick.id);
            unties++;
          } else throw new Error(`unexpected ${act}`);
          for (const [, slot] of takeLayout(r, items)) {
            expect(slot.x).toBeGreaterThan(0);
            expect(slot.x).toBeLessThan(bedWidth(r));
            expect(slot.y).toBeGreaterThan(0);
            expect(slot.y).toBeLessThan(SCENE_H);
          }
        }
        expect(carriedValue(items, gone)).toBe(r.b);
        expect(unties).toBe(level.bundles && r.b % 10 > r.a % 10 ? 1 : 0);
        expect(runningTotal(r, tourOrder(r, gone, items))).toBe(r.answer);
      }
    });
  });

  it('keeps a whole bouquet when loose flowers are enough, and unties one when they are not', () => {
    const r = buildAddRound(0, 9);
    const ten = r.items.find((i) => i.kind === 'ten')!;
    const loose = r.items.filter((i) => i.kind === 'one');
    expect(takeTap(r.items, [], ten, loose.length)).toBe('too-many');
    expect(takeTap(r.items, [], ten, loose.length + 1)).toBe('untie');
    expect(takeTap(r.items, [], ten, 10)).toBe('carry');
    expect(takeTap(r.items, [], loose[0], 0)).toBe('count');
    const after = untie(r.items, ten.id);
    expect(after.filter((i) => i.kind === 'one')).toHaveLength(loose.length + 10);
    expect(after.reduce((s, i) => s + i.value, 0)).toBe(r.a);
  });

  it('shows the untie hint only while the loose flowers are too few and a bouquet is left', () => {
    const r = buildAddRound(0, 9);
    const ten = r.items.find((i) => i.kind === 'ten')!;
    const loose = r.items.filter((i) => i.kind === 'one');
    expect(mustUntie(r.items, [], loose.length)).toBe(false);
    expect(mustUntie(r.items, [], loose.length + 1)).toBe(true);
    expect(mustUntie(r.items, [], 10)).toBe(false);
    expect(mustUntie(untie(r.items, ten.id), [], loose.length + 1)).toBe(false);
    expect(questionFeedback(r, 0, true).text).toContain(UNTIE_HINT);
    expect(questionFeedback(r, 0, false).text).not.toContain(UNTIE_HINT);
  });

  it('speaks correct Hungarian', () => {
    expect(sumSentence(3, 2)).toBe('Három meg kettő, az öt.');
    expect(sumSentence(34, 25)).toBe('Harmincnégy meg huszonöt, az ötvenkilenc.');
    const r = { ...buildAddRound(0, 2), a: 3, b: 2, answer: 5 };
    expect(questionFeedback(r).speech).toBe('Három virág meg két virág. Hány virág van összesen?');
    expect(rightFeedback(r).text).toBe('Igen! 3 + 2 = 5. Ügyes vagy!');
    expect(rightFeedback(r, 'up').text.endsWith('Jöhet a nehezebb!')).toBe(true);
    expect(rightFeedback(r, 'down').text.endsWith('egy kicsit könnyebben gyakoroljuk.')).toBe(true);
    expect(rightFeedback(r, 'down').text).not.toMatch(/rossz|hiba/i);
    expect(tourFeedback(r).text).not.toMatch(/rossz|hiba/i);
    expect(takeSentence(5, 2)).toBe('Öt virágból kettőt elvitt a méhecske, maradt három.');
    expect(takeSentence(23, 12)).toBe('Huszonhárom virágból tizenkét virágot elvitt a méhecske, maradt tizenegy.');
    const t = { ...buildAddRound(0, 1), a: 5, b: 2, answer: 3 };
    expect(questionFeedback(t).speech).toBe('Öt virág nyílik. A méhecske elvisz kettőt a kaptárba. Koppints két virágra!');
    expect(questionFeedback(t, 1).speech).toBe('Még egy virágot vigyen el!');
    expect(questionFeedback(t, 2).speech).toBe('Hány virág maradt?');
    expect(tourFeedback(t).text).not.toMatch(/rossz|hiba/i);
    expect(addLockedSpeech(8)).toBe('Ez a kertrész még alszik. Ismerj meg még két számot a Számmagokban, és kinyílik!');
  });
});
