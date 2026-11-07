import { describe, expect, it } from 'vitest';
import { article, buildLearnRound, flashLockedSpeech, learnedFeedback } from './logic';

describe('Számmagok', () => {
  it('teaches 1 to 20 in order, then starts again', () => {
    expect(Array.from({ length: 21 }, (_, r) => buildLearnRound(r).count)).toEqual([...Array.from({ length: 20 }, (_, i) => i + 1), 1]);
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
