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
        expect(r.total).toBe(POTS_LEVELS[level].total);
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
});
