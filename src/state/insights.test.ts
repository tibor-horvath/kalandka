import { describe, expect, it } from 'vitest';
import { article, gameNotes, gateQuestion, insights } from './insights';
import { ladderOf, withLadder } from './ladder';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import { LOG_KEEP, logTask, recentMarks, windowStart, type LoggedGame } from './taskLog';

const DAY = '2026-10-12';
const played = { playDate: DAY, playSeconds: 300 };

/** A profile that solved these tasks on DAY, true = needed help. */
function solved(game: LoggedGame, helps: boolean[], p: Progress = { ...DEFAULT_PROGRESS, ...played }): Progress {
  return helps.reduce((acc, h) => logTask(acc, game, h, DAY), p);
}

const note = (p: Progress, game: string) => gameNotes(p, DAY).find((n) => n.game === game)!;

describe('task log', () => {
  it('keeps the last few tasks per game', () => {
    const p = solved('sort', Array.from({ length: LOG_KEEP + 5 }, (_, i) => i % 2 === 0));
    expect(p.taskLog.sort).toHaveLength(LOG_KEEP);
    expect(p.taskLog.mirror).toBeUndefined();
  });

  it('looks back one week, today included', () => {
    expect(windowStart('2026-10-12')).toBe('2026-10-06');
    expect(windowStart('2026-03-03')).toBe('2026-02-25');
    let p = logTask(DEFAULT_PROGRESS, 'path', true, '2026-10-05');
    p = logTask(p, 'path', false, '2026-10-06');
    p = logTask(p, 'path', false, DAY);
    expect(recentMarks(p, 'path', DAY)).toEqual([
      { d: '2026-10-06', h: 0 },
      { d: DAY, h: 0 }
    ]);
  });
});

describe('notes per game', () => {
  it('has a note for every game', () => {
    expect(gameNotes(DEFAULT_PROGRESS, DAY).map((n) => n.game)).toEqual([
      'Számvetés', 'Locsolás', 'Virágsor', 'Magvillantás', 'Mézút', 'Méhecske', 'Cserépbarátok',
      'Robotút', 'Válogatógép', 'Mérleg', 'Mintagép', 'Tükörgép'
    ]);
  });

  it('says nothing yet after too little play', () => {
    const n = note(solved('mirror', [true, true]), 'Tükörgép');
    expect(n.tone).toBe('none');
    expect(n.title).toBe('Ezen a héten kevés játék.');
    expect(n.home).toBeUndefined();
    expect(note(DEFAULT_PROGRESS, 'Mérleg').title).toBe('Még nincs elég játék.');
  });

  it('gives a tip with the level and a home idea after a run of help', () => {
    const n = note(solved('mirror', [false, false, true, true, true], { ...DEFAULT_PROGRESS, mirrorSolved: 20 }), 'Tükörgép');
    expect(n.tone).toBe('tip');
    expect(n.title).toBe('A Tükörgépben a „Fel-le tükör” még nehéz.');
    expect(n.home).toMatch(/kézitükröt/);
  });

  it('gives a tip when most tasks needed help', () => {
    expect(note(solved('seq', [true, false, true, false, true]), 'Mintagép').tone).toBe('tip');
  });

  it('says what goes well, with the count', () => {
    const n = note(solved('path', [false, true, false, false]), 'Robotút');
    expect(n.tone).toBe('good');
    expect(n.title).toBe('A „Lépésenként” jól halad.');
    expect(n.text).toBe('Ezen a héten 3 pálya ment segítség nélkül, 4 közül.');
    expect(note(solved('sort', [false, false, false]), 'Válogatógép').title).toBe('A „Két szín” megy neki.');
  });

  it('tells parents when a game stepped back on its own', () => {
    const p = withLadder(DEFAULT_PROGRESS, 'mirror', { ...ladderOf(DEFAULT_PROGRESS, 'mirror'), level: 3, lastChange: 'down', sinceChange: 1, reached: 4 });
    const n = note(p, 'Tükörgép');
    expect(n.tone).toBe('tip');
    expect(n.title).toBe('A Tükörgép visszalépett a „Színes kép” szintre.');
    expect(note({ ...p, ladders: { mirror: { ...p.ladders.mirror!, sinceChange: 8 } } }, 'Tükörgép').tone).toBe('none');
  });

  it('says "az" before a level name read with a vowel', () => {
    expect(['Elvétel 100-ig', 'Egy lámpa', '1–5, szórva', '5-ig', '11–20 csepp', '2–10 csepp', 'Két szín'].map(article)).toEqual(['az', 'az', 'az', 'az', 'a', 'a', 'a']);
    const n = note(solved('mirror', [false, false, false], { ...DEFAULT_PROGRESS, mirrorSolved: 0 }), 'Tükörgép');
    expect(n.title).toBe('Az „Egy lámpa” megy neki.');
    expect(n.short).toBe('3 / 3 segítség nélkül.');
  });

  it('counts the numbers met in Számvetés', () => {
    expect(note({ ...DEFAULT_PROGRESS, learnSolved: 14 }, 'Számvetés').title).toBe('14 számot ismer 20-ig.');
    expect(note({ ...DEFAULT_PROGRESS, learnSolved: 25 }, 'Számvetés').title).toBe('Minden számot ismer 20-ig.');
  });
});

describe('highlighted notes', () => {
  it('suggests where to start on a fresh profile', () => {
    const list = insights({ ...DEFAULT_PROGRESS, ...played }, DAY);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Kezdjétek a Számvetéssel.');
  });

  it('puts tips first, then good news, Számvetés last', () => {
    let p = solved('water', [false, false, false], { ...DEFAULT_PROGRESS, learnSolved: 14 });
    p = solved('patterns', [true, true, true], p);
    expect(insights(p, DAY).map((n) => [n.game, n.tone])).toEqual([
      ['Virágsor', 'tip'],
      ['Locsolás', 'good'],
      ['Számvetés', 'good']
    ]);
  });

  it('shows both worlds when both have something to say', () => {
    let p = solved('water', [true, true, true]);
    p = solved('patterns', [true, true, true], p);
    p = solved('flash', [true, true, true], p);
    p = solved('trace', [true, true, true], p);
    p = solved('sort', [false, false, false], p);
    const list = insights(p, DAY);
    expect(list).toHaveLength(4);
    expect(list.map((n) => n.world)).toContain('robot');
    expect(list[0].tone).toBe('tip');
    expect(list.at(-1)!.game).toBe('Válogatógép');
  });

  it('never shows more than asked', () => {
    let p = solved('water', [true, true, true]);
    p = solved('sort', [true, true, true], p);
    p = solved('scale', [true, true, true], p);
    expect(insights(p, DAY, 2)).toHaveLength(2);
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
