import { describe, expect, it } from 'vitest';
import {
  PATTERN_LEVELS,
  buildGrowRound,
  buildLevelRound,
  buildRound,
  growHintFeedback,
  growSolvedFeedback,
  hintFeedback,
  isEndGap,
  periodOf,
  screenTitle
} from './logic';

describe('flower pattern game', () => {
  it('serves only its own shapes on a level, with the gap at the end until the last level', () => {
    PATTERN_LEVELS.forEach(({ shapes, inside, grow }, level) => {
      if (grow) return;
      const rounds = Array.from({ length: 12 }, (_, i) => buildLevelRound(level, i));
      expect([...new Set(rounds.map((r) => r.shape))].sort()).toEqual([...shapes].sort());
      for (const r of rounds) {
        expect(isEndGap(r)).toBe(!inside);
        expect(r.sequence[r.gap]).toBe(r.answer);
      }
    });
  });

  it('continues AABB with the right flower', () => {
    const level = PATTERN_LEVELS.findIndex((l) => l.shapes.includes('AABB'));
    for (let round = 0; round < 12; round++) {
      const r = buildLevelRound(level, round);
      expect(r.sequence[0]).toBe(r.sequence[1]);
      expect(r.sequence[2]).toBe(r.sequence[3]);
      expect(r.sequence[0]).not.toBe(r.sequence[2]);
      expect(r.answer).toBe(r.sequence[0]);
    }
    expect(hintFeedback(buildLevelRound(level, 0), 1).text).toBe('Nézd csak: tulipán, tulipán, napraforgó, napraforgó… mi jön ezután?');
  });

  it('grows the bunches by one or two, up to ten flowers, with three different choices', () => {
    for (const step of [1, 2] as const) {
      const level = PATTERN_LEVELS.findIndex((l) => l.grow === step);
      for (let round = 0; round < 12; round++) {
        const r = buildGrowRound(level, round);
        expect(r.step).toBe(step);
        r.counts.slice(1).forEach((n, i) => expect(n - r.counts[i]).toBe(step));
        expect(r.answer).toBe(r.counts[r.counts.length - 1] + step);
        expect(r.answer).toBeLessThanOrEqual(10);
        expect(new Set(r.choices).size).toBe(3);
        expect(r.choices).toContain(r.answer);
        expect(r.choices.every((c) => c >= 1 && c <= 10)).toBe(true);
      }
    }
  });

  it('talks about the growing bunches in correct Hungarian', () => {
    const r = buildGrowRound(PATTERN_LEVELS.findIndex((l) => l.grow === 2), 1);
    expect(r.counts).toEqual([2, 4, 6, 8]);
    expect(growHintFeedback(r, 1).speech).toBe('Nézd csak: kettő, négy, hat, nyolc… mi jön ezután?');
    expect(growHintFeedback(r, 2).speech).toBe('Segítek: az utolsó csokorban nyolc virág van. Ha kettővel több jön, az hány?');
    expect(growSolvedFeedback(r).text).toBe('Ügyes vagy! 10 virág jön: mindig kettővel több.');
  });

  it('varies the flowers from row to row on a one-shape level', () => {
    const rows = [0, 1, 2].map((i) => buildLevelRound(0, i).sequence.join());
    expect(new Set(rows).size).toBe(3);
  });

  it('builds an AB round first', () => {
    const r = buildRound(0);
    expect(r.shape).toBe('AB');
    expect(r.shown).toEqual(['tulip', 'sun', 'tulip', 'sun', 'tulip', null]);
    expect(r.gap).toBe(5);
    expect(r.answer).toBe('sun');
  });

  it('cycles shapes and then swaps flowers', () => {
    expect(buildRound(1).shape).toBe('ABC');
    expect(buildRound(3).sequence).toEqual(['tulip', 'sun', 'sun', 'tulip', 'sun', 'sun']);
    expect(buildRound(4).shape).toBe('AB');
    expect(buildRound(4).sequence[0]).toBe('sun');
  });

  it('answer always fits the pattern', () => {
    for (let i = 0; i < 48; i++) {
      const r = buildRound(i);
      const period = periodOf(r.shape);
      const twin = r.gap >= period ? r.gap - period : r.gap + period;
      expect(r.answer).toBe(r.sequence[r.gap]);
      expect(r.shown[twin]).toBe(r.answer);
      expect(r.shown.filter((k) => k === null)).toHaveLength(1);
    }
  });

  it('asks what comes next on the first lap, then moves the gap into the row', () => {
    for (let i = 0; i < 4; i++) expect(buildRound(i).gap).toBe(5);
    const gaps = [4, 5, 6, 7].map((i) => buildRound(i).gap);
    expect(new Set(gaps)).toEqual(new Set([1, 2, 3, 4]));
    expect(screenTitle(buildRound(0))).toBe('Melyik virág jön ezután?');
    expect(screenTitle(buildRound(4))).toBe('Melyik virág hiányzik?');
  });

  it('hints with a whole repeat the gap does not touch', () => {
    for (let i = 4; i < 24; i++) {
      const r = buildRound(i);
      const hint = hintFeedback(r, 1).text;
      expect(hint).toMatch(/mi hiányzik\?$/);
      expect(hintFeedback(r, 2).text).toContain('?,');
    }
    const r = buildRound(7); // ABB with sun, star, tulip
    expect(r.shown).toEqual(['sun', 'star', 'star', null, 'star', 'star']);
    expect(hintFeedback(r, 1).text).toBe('Nézd csak: napraforgó, nefelejcs, nefelejcs… mi hiányzik?');
    expect(hintFeedback(r, 2).speech).toContain('nefelejcs, kérdőjel, nefelejcs');
  });

  const levelOf = (name: string) => PATTERN_LEVELS.findIndex((l) => l.name === name);
  const twinShown = (r: ReturnType<typeof buildLevelRound>, g: number) =>
    r.shown.some((k, j) => k !== null && j % periodOf(r.shape) === g % periodOf(r.shape));

  it('continues the repeats of four on rows of eight', () => {
    const level = levelOf('Négyes minta');
    for (let round = 0; round < 12; round++) {
      const r = buildLevelRound(level, round);
      expect(r.sequence).toHaveLength(8);
      expect(r.gaps).toEqual([7]);
      expect(isEndGap(r)).toBe(true);
      expect(r.sequence.slice(0, 4)).toEqual(r.sequence.slice(4));
      expect(new Set(r.sequence).size).toBe(3);
    }
    const abac = buildLevelRound(level, 0);
    expect(abac.shown).toEqual(['tulip', 'sun', 'tulip', 'star', 'tulip', 'sun', 'tulip', null]);
    expect(abac.answer).toBe('star');
    const abcb = buildLevelRound(level, 1);
    expect(abcb.shape).toBe('ABCB');
    expect(abcb.sequence[1]).toBe(abcb.sequence[3]);
    expect(hintFeedback(abac, 1).text).toBe('Nézd csak: tulipán, napraforgó, tulipán, nefelejcs… mi jön ezután?');
  });

  it('mixes every shape on the missing-flower level, AABB too, each gap with its twin in the row', () => {
    const level = levelOf('Vegyes hiányzó virág');
    const rounds = Array.from({ length: 70 }, (_, i) => buildLevelRound(level, i));
    expect(new Set(rounds.map((r) => r.shape)).size).toBe(7);
    for (const r of rounds) {
      expect(r.gaps).toHaveLength(1);
      expect(r.gap).toBeGreaterThan(0);
      expect(r.gap).toBeLessThan(r.sequence.length - 1);
      expect(twinShown(r, r.gap)).toBe(true);
      expect(hintFeedback(r, 1).text).toMatch(/mi hiányzik\?$/);
    }
    const aabbGaps = new Set(rounds.filter((r) => r.shape === 'AABB').map((r) => r.gap));
    expect(aabbGaps.size).toBeGreaterThan(2);
  });

  it('hides two different flowers on "Két hiányzó virág" and hints with an untouched repeat', () => {
    const level = levelOf('Két hiányzó virág');
    for (let round = 0; round < 70; round++) {
      const r = buildLevelRound(level, round);
      expect(r.gaps).toHaveLength(2);
      expect(r.shown.filter((k) => k === null)).toHaveLength(2);
      const [a, b] = r.gaps;
      expect(r.sequence[a]).not.toBe(r.sequence[b]);
      for (const g of r.gaps) expect(twinShown(r, g)).toBe(true);
      // The first hint reads a whole repeat with no question mark in it.
      const read = hintFeedback(r, 1).text.replace(/^Nézd csak: |… mi hiányzik\?$/g, '').split(', ');
      expect(read).toHaveLength(periodOf(r.shape));
      expect(screenTitle(r)).toBe('Melyik két virág hiányzik?');
      expect(hintFeedback(r, 2).text).toContain('Mi illik az első kérdőjel helyére?');
    }
  });

  it('hints instead of saying wrong', () => {
    const hint = hintFeedback(buildRound(0), 1);
    expect(hint.text).toBe('Nézd csak: tulipán, napraforgó, tulipán… mi jön ezután?');
    expect(hint.text).not.toMatch(/rossz|hiba/i);
  });
});
