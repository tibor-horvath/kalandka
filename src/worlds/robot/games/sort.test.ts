import { describe, expect, it } from 'vitest';
import {
  SORT_LEVELS,
  SORT_ROUNDS_PER_LEVEL,
  binFor,
  binName,
  buildRound,
  describe as describePart,
  isOdd,
  oddRightFeedback,
  oddWrongFeedback,
  sortLevelIndex,
  sortSolvedFeedback,
  startFeedback,
  wrongFeedback,
  type Feature,
  type Part,
  type SortRound
} from './sort';

const FEATURES: Feature[] = ['color', 'shape', 'size'];
const level = (name: string) => SORT_LEVELS.findIndex((l) => l.name === name);

describe('Válogatógép', () => {
  it('moves up a level every five solved rounds', () => {
    expect(sortLevelIndex(0)).toBe(0);
    expect(sortLevelIndex(SORT_ROUNDS_PER_LEVEL - 1)).toBe(0);
    expect(sortLevelIndex(SORT_ROUNDS_PER_LEVEL)).toBe(1);
    expect(sortLevelIndex(999)).toBe(SORT_LEVELS.length - 1);
  });

  it('builds the same round every time', () => {
    for (let l = 0; l < SORT_LEVELS.length; l++) expect(buildRound(l, 3)).toEqual(buildRound(l, 3));
  });

  it('starts with two colours and nothing else changing, for the youngest', () => {
    for (let round = 0; round < 30; round++) {
      const r = buildRound(0, round) as SortRound;
      expect(r.bins).toHaveLength(2);
      expect(r.parts).toHaveLength(4);
      expect(new Set(r.parts.map((p) => p.shape)).size).toBe(1);
      expect(new Set(r.parts.map((p) => p.size)).size).toBe(1);
      expect(new Set(r.parts.map((p) => p.color)).size).toBe(2);
    }
  });

  it('gives every part exactly one box, and every box at least one part', () => {
    for (let l = 0; l < SORT_LEVELS.length; l++) {
      for (let round = 0; round < 40; round++) {
        const r = buildRound(l, round);
        if (isOdd(r)) continue;
        expect(r.parts).toHaveLength(r.level.items);
        expect(r.bins).toHaveLength(r.level.bins);
        const filled = r.parts.map((p) => binFor(r.bins, p));
        expect(filled.every((b) => b >= 0)).toBe(true);
        expect(new Set(filled).size).toBe(r.bins.length);
        for (const p of r.parts) {
          // A part never fits two labelled boxes at once.
          const fits = r.bins.filter((b) => Object.keys(b.match).length > 0 && Object.entries(b.match).every(([k, v]) => p[k as Feature] === v));
          expect(fits.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('keeps the features a level does not use the same on every part', () => {
    for (let l = 0; l < SORT_LEVELS.length; l++) {
      const lv = SORT_LEVELS[l];
      if (lv.mode !== 'sort' || lv.rule !== 'color') continue;
      for (let round = 0; round < 20; round++) {
        const r = buildRound(l, round) as SortRound;
        for (const f of FEATURES.filter((f) => f !== 'color' && !lv.vary.includes(f))) {
          expect(new Set(r.parts.map((p) => p[f])).size).toBe(1);
        }
      }
    }
  });

  it('puts near misses in the two-rule round', () => {
    for (let round = 0; round < 30; round++) {
      const r = buildRound(level('Két szabály'), round) as SortRound;
      const want = r.bins[0].match;
      expect(r.parts.some((p) => p.color === want.color && p.shape !== want.shape)).toBe(true);
      expect(r.parts.some((p) => p.shape === want.shape && p.color !== want.color)).toBe(true);
      expect(r.parts.filter((p) => binFor(r.bins, p) === 0)).toHaveLength(3);
    }
  });

  it('shows the hidden rule with two examples that differ only in it, and goes round the rules', () => {
    const rules = new Set<string>();
    for (let round = 0; round < 12; round++) {
      const r = buildRound(level('Mi a szabály?'), round) as SortRound;
      expect(r.preset).toBe(2);
      const [a, b] = r.parts;
      expect(binFor(r.bins, a)).toBe(0);
      expect(binFor(r.bins, b)).toBe(1);
      const diff = FEATURES.filter((f) => a[f] !== b[f]);
      expect(diff).toEqual([r.rule]);
      rules.add(r.rule);
    }
    expect(rules).toEqual(new Set(['color', 'shape', 'size']));
  });

  it('makes exactly one part the odd one out, by one feature only', () => {
    for (let round = 0; round < 40; round++) {
      const r = buildRound(level('Kakukktojás'), round);
      if (!isOdd(r)) throw new Error('expected an odd round');
      expect(r.rows).toHaveLength(3);
      for (const row of r.rows) {
        expect(row.parts).toHaveLength(4);
        // The rule's feature: three and one, the single one is the odd part.
        const odd = row.parts[row.odd];
        expect(row.parts.filter((p) => p[row.feature] === odd[row.feature])).toHaveLength(1);
        // No other feature singles out a part.
        for (const f of FEATURES.filter((f) => f !== row.feature)) {
          for (const p of row.parts) expect(row.parts.filter((q) => q[f] === p[f]).length).not.toBe(1);
        }
      }
    }
  });

  it('names parts and boxes in Hungarian', () => {
    const p: Part = { color: 'red', shape: 'triangle', size: 'small' };
    expect(describePart(p)).toBe('kicsi piros háromszög');
    expect(binName({ match: { color: 'red' } })).toBe('a pirosak');
    expect(binName({ match: { shape: 'round' } })).toBe('a körök');
    expect(binName({ match: { color: 'blue', shape: 'square' } })).toBe('a kék négyzetek');
    expect(binName({ match: {} })).toBe('a többi');
  });

  it('never says "wrong": hints name what to look at', () => {
    for (let l = 0; l < SORT_LEVELS.length; l++) {
      const r = buildRound(l, 1);
      const start = startFeedback(r);
      expect(start.text.length).toBeGreaterThan(0);
      if (isOdd(r)) {
        expect(oddWrongFeedback(r.rows[0], 1).tone).toBe('oops');
        expect(oddWrongFeedback(r.rows[0], 2).text).toMatch(/Figyeld/);
        expect(oddRightFeedback(r.rows[0], true).tone).toBe('good');
        continue;
      }
      const part = r.parts[r.preset];
      const hint = wrongFeedback(r, part, 1);
      expect(hint.text).toMatch(/^Hoppá!/);
      expect(hint.text).not.toMatch(/rossz/i);
      expect(sortSolvedFeedback(r).tone).toBe('good');
    }
  });

  it('tells which colour or shape keeps a part out of the two-rule box', () => {
    const r = buildRound(level('Két szabály'), 0) as SortRound;
    const want = r.bins[0].match;
    const nearColor = r.parts.find((p) => p.color === want.color && p.shape !== want.shape)!;
    expect(wrongFeedback(r, nearColor, 1).text).toContain('többi');
    const target = r.parts.find((p) => binFor(r.bins, p) === 0)!;
    expect(wrongFeedback(r, target, 1).text).toContain('első dobozba');
  });
});
