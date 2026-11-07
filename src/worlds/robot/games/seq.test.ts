import { describe, expect, it } from 'vitest';
import {
  SEQ_LEVELS,
  SEQ_ROUNDS_PER_LEVEL,
  buildSeqRound,
  readRow,
  rightFeedback,
  sameItem,
  seqLevelIndex,
  startFeedback,
  wrongFeedback,
  type Item,
  type SeqTask
} from './seq';

const level = (name: string) => SEQ_LEVELS.findIndex((l) => l.name === name);
const tasksOf = (name: string, rounds = 20) => Array.from({ length: rounds }, (_, r) => buildSeqRound(level(name), r).tasks).flat();

/** The smallest repeat the row before the gap follows, or 0 when there is none shorter than half of it. */
function period(row: Item[]): number {
  for (let p = 1; p <= row.length / 2; p++) if (row.every((it, i) => i < p || sameItem(it, row[i - p]))) return p;
  return 0;
}

describe('Mintagép', () => {
  it('moves up a level every five solved rounds', () => {
    expect(seqLevelIndex(0)).toBe(0);
    expect(seqLevelIndex(SEQ_ROUNDS_PER_LEVEL - 1)).toBe(0);
    expect(seqLevelIndex(SEQ_ROUNDS_PER_LEVEL)).toBe(1);
    expect(seqLevelIndex(999)).toBe(SEQ_LEVELS.length - 1);
  });

  it('builds the same round every time', () => {
    for (let l = 0; l < SEQ_LEVELS.length; l++) expect(buildSeqRound(l, 4)).toEqual(buildSeqRound(l, 4));
  });

  it('always offers three different choices with the answer among them once', () => {
    for (let l = 0; l < SEQ_LEVELS.length; l++) {
      for (let r = 0; r < 20; r++) {
        for (const t of buildSeqRound(l, r).tasks) {
          expect(t.choices).toHaveLength(3);
          expect(t.choices.filter((c) => sameItem(c, t.answer))).toHaveLength(1);
          for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(sameItem(t.choices[i], t.choices[j])).toBe(false);
        }
      }
    }
  });

  it('starts with two colours of one shape taking turns, for the youngest', () => {
    for (const t of tasksOf('Két szín')) {
      const row = [...t.row, t.answer];
      expect(new Set(row.map((p) => (p.kind === 'part' ? p.color : ''))).size).toBe(2);
      expect(row.every((p) => p.kind === 'part' && p.shape === 'round')).toBe(true);
      expect(period(row)).toBe(2);
      expect(t.row.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('shows at least two whole repeats before every gap, and the answer carries the repeat on', () => {
    for (const name of ['Két szín', 'Hosszabb ismétlés']) {
      for (const t of tasksOf(name)) {
        expect(t.row.length).toBeGreaterThanOrEqual(2 * t.unit);
        expect(sameItem(t.answer, t.row[t.row.length - t.unit])).toBe(true);
        expect(period(t.row)).toBe(t.unit);
      }
    }
  });

  it('makes each wrong choice on Szín és forma off by exactly one feature', () => {
    for (const t of tasksOf('Szín és forma')) {
      const a = t.answer;
      for (const c of t.choices) {
        if (sameItem(c, a) || c.kind !== 'part' || a.kind !== 'part') continue;
        expect(Number(c.color !== a.color) + Number(c.shape !== a.shape)).toBe(1);
      }
    }
  });

  it('grows towers by one, then by two, and keeps them short enough to count', () => {
    for (const r of Array.from({ length: 10 }, (_, i) => buildSeqRound(level('Növekvő sor'), i))) {
      r.tasks.forEach((t, i) => {
        const ns = [...t.row, t.answer].map((s) => (s.kind === 'stack' ? s.n : 0));
        const step = i < 2 ? 1 : 2;
        ns.forEach((n, j) => j > 0 && expect(n - ns[j - 1]).toBe(step));
        expect(Math.max(...ns)).toBeLessThanOrEqual(8);
      });
    }
  });

  it('turns the arrow a quarter each step', () => {
    for (const t of tasksOf('Forgó sor')) {
      const dirs = [...t.row, t.answer].map((a) => (a.kind === 'arrow' ? a.dir : -1));
      const by = (((dirs[1] - dirs[0]) % 4) + 4) % 4;
      expect([1, 3]).toContain(by);
      dirs.forEach((d, j) => j > 0 && expect((((d - dirs[j - 1]) % 4) + 4) % 4).toBe(by));
    }
  });

  it('puts exactly one part out of place on Hibavadász, after two whole repeats', () => {
    for (const t of tasksOf('Hibavadász')) {
      expect(t.mode).toBe('fix');
      expect(t.wrong).toBeGreaterThanOrEqual(2 * t.unit);
      const fixed = t.row.map((it, i) => (i === t.wrong ? t.answer : it));
      expect(period(fixed)).toBe(t.unit);
      expect(sameItem(t.row[t.wrong], t.answer)).toBe(false);
      expect(fixed.filter((it, i) => !sameItem(it, t.row[i]))).toHaveLength(1);
    }
  });

  it('pairs one arrow with one colour on Mintafordító, the colours reaching past the gap', () => {
    for (const t of tasksOf('Mintafordító')) {
      const ref = t.ref!;
      expect(ref.length).toBeGreaterThan(t.row.length);
      const full = [...t.row, t.answer];
      const pairs = new Map<string, string>();
      full.forEach((a, i) => {
        const c = ref[i].kind === 'part' ? ref[i].color : '';
        const d = a.kind === 'arrow' ? String(a.dir) : '';
        if (pairs.has(c)) expect(pairs.get(c)).toBe(d);
        pairs.set(c, d);
      });
    }
  });

  it('reads the row aloud with a pause after each repeat', () => {
    const p = (color: 'red' | 'blue'): Item => ({ kind: 'part', color, shape: 'round' });
    expect(readRow([p('red'), p('blue'), p('red'), p('blue'), p('red')], 2)).toBe('Piros, kék… piros, kék… piros');
    expect(readRow([{ kind: 'stack', n: 1 }, { kind: 'stack', n: 2 }], 0)).toBe('Egy, kettő');
  });

  it('answers a wrong pick by reading the row up to the gap', () => {
    const t = buildSeqRound(0, 0).tasks[0] as SeqTask;
    const fb = wrongFeedback(SEQ_LEVELS[0], t);
    expect(fb.tone).toBe('oops');
    expect(fb.text).toContain('… és utána?');
    expect(rightFeedback(t, 0).speech.startsWith('Úgy van!')).toBe(true);
    expect(startFeedback(SEQ_LEVELS[0], t, true).speech).toContain('mintagépnek');
  });
});
