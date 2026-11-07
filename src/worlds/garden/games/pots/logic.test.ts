import { describe, expect, it } from 'vitest';
import {
  POTS_LEVELS,
  POTS_ROUNDS_PER_LEVEL,
  askFeedback,
  boxSize,
  buildPotsRound,
  potCells,
  potsLevelFor,
  potsLockedSpeech,
  revealFeedback,
  rightFeedback
} from './logic';

describe('Cserépbarátok', () => {
  it('moves up a level every five solved rounds', () => {
    expect(potsLevelFor(0)).toBe(POTS_LEVELS[0]);
    expect(potsLevelFor(POTS_ROUNDS_PER_LEVEL)).toBe(POTS_LEVELS[1]);
    expect(potsLevelFor(99)).toBe(POTS_LEVELS[POTS_LEVELS.length - 1]);
  });

  it('builds the same round every time', () => {
    expect(buildPotsRound(7, 0)).toEqual(buildPotsRound(7, 0));
  });

  it('keeps pots, flowers and answers consistent across many rounds and levels', () => {
    for (let level = 0; level < POTS_LEVELS.length; level++) {
      for (let round = 0; round < 80; round++) {
        const r = buildPotsRound(round, level);
        expect(POTS_LEVELS[level].totals ?? [POTS_LEVELS[level].total]).toContain(r.total);
        expect(r.have).toBeGreaterThanOrEqual(1);
        expect(r.need).toBeGreaterThanOrEqual(1);
        expect(r.have + r.need).toBe(r.total);
        expect(r.filled).toHaveLength(r.total);
        expect(r.filled.filter(Boolean)).toHaveLength(r.have);
        if (!r.level.scattered) expect(r.filled.slice(0, r.have).every(Boolean)).toBe(true);
        expect(r.choices).toHaveLength(3);
        expect(new Set(r.choices).size).toBe(3);
        expect(r.choices).toContain(r.need);
        expect(r.choices.every((c) => c >= 1 && c < r.total)).toBe(true);
      }
    }
  });

  it('meets every number friend of ten', () => {
    const needs = new Set(Array.from({ length: 80 }, (_, round) => buildPotsRound(round, 1).need));
    expect([...needs].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('lays the pots out in rows of five inside the box', () => {
    for (const total of [5, 10]) {
      const { width, height } = boxSize(total);
      const cells = potCells(total);
      expect(cells).toHaveLength(total);
      expect(new Set(cells.map((c) => c.y)).size).toBe(total / 5);
      for (const c of cells) {
        expect(c.x).toBeGreaterThan(0);
        expect(c.x).toBeLessThan(width);
        expect(c.y).toBeGreaterThan(0);
        expect(c.y).toBeLessThan(height);
      }
    }
  });

  it('speaks correct Hungarian', () => {
    const five = { ...buildPotsRound(0, 0), have: 2, need: 3, total: 5 };
    expect(askFeedback(five).speech).toMatch(/^Két virág már nyílik\. Hány virág kell még, hogy mind az öt cserép virágos legyen\?/);
    expect(askFeedback(five).text).toBe('2 virág már nyílik. Hány kell még, hogy mind az 5 cserép virágos legyen?');
    const ten = { ...five, have: 3, need: 7, total: 10 };
    expect(askFeedback(ten).text).toContain('mind a 10 cserép');
    expect(rightFeedback(ten).text).toBe('Igen! 3 + 7 = 10. Ők tízes barátok!');
    expect(rightFeedback(ten).speech).toBe('Igen! Három meg hét, az tíz. Ők tízes barátok!');
    expect(rightFeedback(five).speech).toContain('ötös barátok');
    expect(revealFeedback(five).speech).toBe('Hoppá! Számoljuk meg együtt az üres cserepeket! Egy, kettő, három.');
    expect(potsLockedSpeech(8)).toContain('még két számot');
  });
  const levelWhere = (test: (l: (typeof POTS_LEVELS)[number]) => boolean) => POTS_LEVELS.findIndex(test);

  it('meets every box from six to nine and all their friends', () => {
    const level = levelWhere((l) => l.totals !== undefined);
    const pairs = new Set(Array.from({ length: 200 }, (_, round) => buildPotsRound(round, level)).map((r) => `${r.have}+${r.need}`));
    for (const total of [6, 7, 8, 9]) for (let have = 1; have < total; have++) expect(pairs).toContain(`${have}+${total - have}`);
  });

  it('keeps the first ten full on the twenty level', () => {
    const level = levelWhere((l) => l.total === 20);
    const needs = new Set(Array.from({ length: 80 }, (_, round) => buildPotsRound(round, level)).map((r) => r.need));
    expect([...needs].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(rightFeedback(buildPotsRound(0, level)).text).toMatch(/Ők húszas barátok!$/);
  });

  it('hides the box and talks about the cover on the last level', () => {
    const r = buildPotsRound(3, levelWhere((l) => l.hidden === true));
    expect(r.total).toBe(10);
    expect(askFeedback(r).speech).not.toContain('koppints');
    expect(askFeedback(r).text).toMatch(/^A takaró alatt \d virág nyílik\./);
    expect(revealFeedback(r).text).toContain('Vegyük le a takarót');
  });

  it('lays twenty pots out as two ten-frames side by side', () => {
    const { width, height } = boxSize(20);
    const cells = potCells(20);
    expect(height).toBe(boxSize(10).height);
    expect(new Set(cells.map((c) => c.y)).size).toBe(2);
    expect(cells[10].x - cells[4].x).toBeGreaterThan(cells[1].x - cells[0].x);
    for (const c of cells) expect(c.x).toBeLessThan(width);
  });

  it('names the friends of every box', () => {
    const r = buildPotsRound(0, 0);
    expect(rightFeedback({ ...r, have: 3, need: 4, total: 7 }).speech).toBe('Igen! Három meg négy, az hét. Ők hetes barátok!');
  });
});
