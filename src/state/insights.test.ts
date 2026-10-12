import { describe, expect, it } from 'vitest';
import { gateQuestion, insights } from './insights';
import { DEFAULT_PROGRESS } from './progress';

const DAY = '2026-10-12';
const played = { playDate: DAY, playSeconds: 300 };

describe('parent insights', () => {
  it('suggests where to start on a fresh profile', () => {
    const list = insights({ ...DEFAULT_PROGRESS, ...played }, DAY);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Kezdjétek a Számvetéssel.');
  });

  it('puts a struggle first, with a concrete tip', () => {
    const list = insights({ ...DEFAULT_PROGRESS, ...played, addLevel: 4, addMisses: 2, learnSolved: 14 }, DAY);
    expect(list[0].tone).toBe('tip');
    expect(list[0].title).toBe('A Méhecskében a „20-ig, tízes átlépéssel” még nehéz.');
    expect(list[1].title).toBe('14 számot ismer 20-ig.');
  });

  it('notices a good streak and finished numbers', () => {
    const list = insights({ ...DEFAULT_PROGRESS, ...played, addStreak: 4, learnSolved: 25 }, DAY);
    expect(list.map((i) => i.title)).toEqual(['4 jó összeadás egymás után.', 'Minden számot ismer 20-ig.']);
  });

  it('mentions a day without play', () => {
    expect(insights({ ...DEFAULT_PROGRESS, learnSolved: 3 }, DAY).some((i) => i.title === 'Ma még nem játszott.')).toBe(true);
  });

  it('never shows more than asked', () => {
    expect(insights({ ...DEFAULT_PROGRESS, addMisses: 3, addStreak: 3, learnSolved: 5 }, DAY, 2)).toHaveLength(2);
  });
});

describe('parents gate', () => {
  it('asks a two-digit multiplication', () => {
    for (const r of [0, 0.2, 0.5, 0.99]) {
      const q = gateQuestion(() => r);
      expect(Number(q.answer)).toBe(q.a * q.b);
      expect(q.answer).toHaveLength(2);
    }
  });
});
