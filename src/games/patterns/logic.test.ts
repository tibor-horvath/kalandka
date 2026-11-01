import { describe, expect, it } from 'vitest';
import { PATTERN_LEVELS, buildLevelRound, buildRound, hintFeedback, isEndGap, periodOf, screenTitle } from './logic';

describe('flower pattern game', () => {
  it('serves only its own shapes on a level, with the gap at the end until the last level', () => {
    PATTERN_LEVELS.forEach(({ shapes, inside }, level) => {
      const rounds = Array.from({ length: 12 }, (_, i) => buildLevelRound(level, i));
      expect([...new Set(rounds.map((r) => r.shape))].sort()).toEqual([...shapes].sort());
      for (const r of rounds) {
        expect(isEndGap(r)).toBe(!inside);
        expect(r.sequence[r.gap]).toBe(r.answer);
      }
    });
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

  it('hints instead of saying wrong', () => {
    const hint = hintFeedback(buildRound(0), 1);
    expect(hint.text).toBe('Nézd csak: tulipán, napraforgó, tulipán… mi jön ezután?');
    expect(hint.text).not.toMatch(/rossz|hiba/i);
  });
});
