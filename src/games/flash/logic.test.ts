import { describe, expect, it } from 'vitest';
import { FIELD_H, FIELD_W, LEVELS, buildFlashRound, levelFor, revealFeedback, rightFeedback } from './logic';

describe('Magvillantás', () => {
  it('moves up a level every four solved rounds', () => {
    expect(levelFor(0)).toBe(LEVELS[0]);
    expect(levelFor(4)).toBe(LEVELS[1]);
    expect(levelFor(12)).toBe(LEVELS[3]);
    expect(levelFor(99)).toBe(LEVELS[3]);
  });

  it('shows seeds for at least 2.5 seconds', () => {
    for (const level of LEVELS) expect(level.flashMs).toBeGreaterThanOrEqual(2500);
  });

  it('builds the same round every time', () => {
    expect(buildFlashRound(7, 0)).toEqual(buildFlashRound(7, 0));
  });

  it('keeps counts, seeds and answers consistent across many rounds and levels', () => {
    for (const solved of [0, 4, 8, 12]) {
      const level = levelFor(solved);
      for (let round = 0; round < 60; round++) {
        const r = buildFlashRound(round, solved);
        expect(r.count).toBeGreaterThanOrEqual(level.min);
        expect(r.count).toBeLessThanOrEqual(level.max);
        expect(r.seeds).toHaveLength(r.count);
        expect(r.choices).toHaveLength(3);
        expect(new Set(r.choices).size).toBe(3);
        expect(r.choices).toContain(r.count);
        expect(r.choices.every((c) => c >= 1)).toBe(true);
        for (const s of r.seeds) {
          expect(s.x).toBeGreaterThanOrEqual(0);
          expect(s.x).toBeLessThanOrEqual(FIELD_W);
          expect(s.y).toBeGreaterThanOrEqual(0);
          expect(s.y).toBeLessThanOrEqual(FIELD_H);
        }
      }
    }
  });

  it('never lets scattered seeds overlap', () => {
    for (let round = 0; round < 60; round++) {
      const { seeds } = buildFlashRound(round, 8);
      for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
          expect(Math.hypot(seeds[i].x - seeds[j].x, seeds[i].y - seeds[j].y)).toBeGreaterThanOrEqual(70);
        }
      }
    }
  });

  it('speaks correct Hungarian', () => {
    expect(rightFeedback(2).speech).toBe('Igen! két magot láttál. Kikeltek!');
    expect(revealFeedback(3).speech).toBe('Nézzük meg újra együtt! egy, kettő, három.');
  });
});
