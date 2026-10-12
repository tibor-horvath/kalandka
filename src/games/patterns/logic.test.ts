import { describe, expect, it } from 'vitest';
import { buildRound, hintFeedback } from './logic';

describe('flower pattern game', () => {
  it('builds an AB round first', () => {
    const r = buildRound(0);
    expect(r.shape).toBe('AB');
    expect(r.shown).toEqual(['tulip', 'sun', 'tulip', 'sun', 'tulip']);
    expect(r.answer).toBe('sun');
  });

  it('cycles shapes and then swaps flowers', () => {
    expect(buildRound(1).shape).toBe('ABC');
    expect(buildRound(3).sequence).toEqual(['tulip', 'sun', 'sun', 'tulip', 'sun', 'sun']);
    expect(buildRound(4).shape).toBe('AB');
    expect(buildRound(4).sequence[0]).toBe('sun');
  });

  it('answer always continues the pattern', () => {
    for (let i = 0; i < 24; i++) {
      const r = buildRound(i);
      const period = r.shape === 'AB' ? 2 : 3;
      expect(r.answer).toBe(r.sequence[5 - period]);
    }
  });

  it('hints instead of saying wrong', () => {
    const hint = hintFeedback(buildRound(0), 1);
    expect(hint.text).toBe('Nézd csak: tulipán, napraforgó, tulipán… mi jön ezután?');
    expect(hint.text).not.toMatch(/rossz|hiba/i);
  });
});
