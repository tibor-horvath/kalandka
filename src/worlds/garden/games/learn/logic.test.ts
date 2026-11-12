import { describe, expect, it } from 'vitest';
import { LEARN_CYCLE, article, buildLearnRound, flashLockedSpeech, learnedFeedback, mixNumbers, mixWrongFeedback } from './logic';

describe('Számmagok', () => {
  it('teaches 1 to 20 in order, then five mixed numbers, then starts again', () => {
    expect(LEARN_CYCLE).toBe(25);
    expect(Array.from({ length: 20 }, (_, r) => buildLearnRound(r).count)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(Array.from({ length: 20 }, (_, r) => buildLearnRound(r).choices)).toEqual(Array<undefined>(20).fill(undefined));
    expect(Array.from({ length: 5 }, (_, i) => buildLearnRound(20 + i).count)).toEqual(mixNumbers(0));
    expect(buildLearnRound(25).count).toBe(1);
    expect(buildLearnRound(25).choices).toBeUndefined();
  });

  it('mixes five different numbers from 1–20, a new mix each lap', () => {
    for (let lap = 0; lap < 10; lap++) {
      const mix = mixNumbers(lap);
      expect(new Set(mix).size).toBe(5);
      expect(mix.every((n) => n >= 1 && n <= 20)).toBe(true);
      expect(mix).not.toEqual([...mix].sort((a, b) => a - b));
    }
    expect(mixNumbers(1)).not.toEqual(mixNumbers(0));
  });

  it('asks for the numeral among three close ones, in order', () => {
    for (let r = 20; r < 25 * 8; r += r % 25 === 24 ? 21 : 1) {
      const { count, choices, seeds } = buildLearnRound(r);
      expect(seeds).toHaveLength(count);
      expect(choices).toHaveLength(3);
      expect(choices).toContain(count);
      expect(new Set(choices).size).toBe(3);
      expect(choices).toEqual([...choices!].sort((a, b) => a - b));
      expect(choices!.every((n) => n >= 1 && n <= 20 && Math.abs(n - count) <= 2)).toBe(true);
    }
  });

  it('names a wrong numeral and the seeds counted', () => {
    expect(mixWrongFeedback(5, 7).text).toBe('Ez az 5. Mi 7 magot számoltunk. Keresd meg!');
    expect(mixWrongFeedback(12, 11).speech).toBe('Ez a tizenkettő. Mi tizenegy magot számoltunk. Keresd meg!');
  });

  it('lays out one seed per number, as a five and the rest above 5', () => {
    for (let r = 0; r < 20; r++) expect(buildLearnRound(r).seeds).toHaveLength(r + 1);
    const seven = buildLearnRound(6).seeds;
    expect(seven.filter((s) => s.x < 300)).toHaveLength(5);
    expect(seven.filter((s) => s.x > 300)).toHaveLength(2);
  });

  it('shows 11–20 as a full ten-frame and the rest', () => {
    const fifteen = buildLearnRound(14).seeds;
    expect(fifteen.filter((s) => s.x < 300)).toHaveLength(10);
    expect(fifteen.filter((s) => s.x > 300)).toHaveLength(5);
    for (const s of buildLearnRound(19).seeds) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(600);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(280);
    }
  });

  it('names the number with the right forms and article', () => {
    expect(learnedFeedback(1).speech).toBe('Egy mag. Ez az egy!');
    expect(learnedFeedback(2).speech).toBe('Két mag. Ez a kettő!');
    expect(learnedFeedback(5).text).toBe('5 mag. Ez az 5!');
    expect(learnedFeedback(12).speech).toBe('Tizenkét mag. Ez a tizenkettő!');
    expect(article('három')).toBe('a');
  });

  it('tells how many numbers are left before Villámszem opens', () => {
    expect(flashLockedSpeech(3)).toBe('Ez a kertrész még alszik. Ismerj meg még két számot a Számmagokban, és kinyílik!');
  });
});
