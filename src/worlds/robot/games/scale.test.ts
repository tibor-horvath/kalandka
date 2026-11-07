import { describe, expect, it } from 'vitest';
import {
  BALANCE_MAX,
  MAX_TILT,
  PAN_SLOTS,
  SCALE_LEVELS,
  SCALE_ROUNDS_PER_LEVEL,
  balanceFeedback,
  buildScaleRound,
  chooseMissFeedback,
  chooseRightFeedback,
  chooseTotals,
  compareMissFeedback,
  compareRightFeedback,
  heavier,
  panSlots,
  scaleLevelIndex,
  startFeedback,
  tilt,
  total,
  type ChooseTask
} from './scale';

const ROUNDS = 60;

describe('Mérleg', () => {
  it('moves up a level every five solved rounds', () => {
    expect(scaleLevelIndex(0)).toBe(0);
    expect(scaleLevelIndex(SCALE_ROUNDS_PER_LEVEL)).toBe(1);
    expect(scaleLevelIndex(999)).toBe(SCALE_LEVELS.length - 1);
  });

  it('builds the same round every time', () => {
    for (let l = 0; l < SCALE_LEVELS.length; l++) expect(buildScaleRound(l, 4)).toEqual(buildScaleRound(l, 4));
  });

  it('tilts towards the heavier side, more for a bigger difference, up to a stop', () => {
    expect(tilt(3, 3)).toBe(0);
    expect(tilt(2, 5)).toBeGreaterThan(0);
    expect(tilt(5, 2)).toBeLessThan(0);
    expect(tilt(4, 5)).toBeLessThan(tilt(3, 5));
    expect(Math.abs(tilt(0, 10))).toBe(MAX_TILT);
    expect(heavier(4, 4)).toBe('equal');
  });

  it('starts with sides at least two apart, up to 5, and never the same, for the youngest', () => {
    for (let round = 0; round < ROUNDS; round++) {
      for (const t of buildScaleRound(0, round).tasks) {
        if (t.kind !== 'compare') throw new Error('expected compare');
        const [l, r] = [total(t.left), total(t.right)];
        expect(Math.max(l, r)).toBeLessThanOrEqual(5);
        expect(Math.abs(l - r)).toBeGreaterThanOrEqual(2);
        expect(Math.min(l, r)).toBeGreaterThanOrEqual(1);
        expect(t.answer).toBe(heavier(l, r));
      }
    }
  });

  it('has one level task in every round once "the same" is an answer', () => {
    for (let round = 0; round < ROUNDS; round++) {
      const tasks = buildScaleRound(1, round).tasks;
      expect(tasks.filter((t) => t.kind === 'compare' && t.answer === 'equal')).toHaveLength(1);
    }
  });

  it('gives balancing tasks that can be balanced from the tray and fit on the pans', () => {
    for (let l = 0; l < SCALE_LEVELS.length; l++) {
      if (SCALE_LEVELS[l].mode !== 'balance') continue;
      for (let round = 0; round < ROUNDS; round++) {
        for (const t of buildScaleRound(l, round).tasks) {
          if (t.kind !== 'balance') throw new Error('expected balance');
          expect(total(t.right)).toBeLessThan(total(t.left));
          expect(total(t.left)).toBeLessThanOrEqual(BALANCE_MAX);
          expect(t.tray).toContain(1);
          expect(panSlots(t.left).every((s) => s.row < 3)).toBe(true);
          if (SCALE_LEVELS[l].twos) expect(t.left).toContain(2);
        }
      }
    }
  });

  it('balances a choose task with exactly its answer', () => {
    for (let l = 0; l < SCALE_LEVELS.length; l++) {
      if (SCALE_LEVELS[l].mode !== 'choose') continue;
      for (let round = 0; round < ROUNDS; round++) {
        for (const t of buildScaleRound(l, round).tasks) {
          if (t.kind !== 'choose') throw new Error('expected choose');
          const at = chooseTotals(t, t.answer);
          expect(at.left).toBe(at.right);
          expect(t.choices).toHaveLength(3);
          expect(new Set(t.choices).size).toBe(3);
          expect(t.choices).toContain(t.answer);
          expect(t.choices.every((c) => c >= 1)).toBe(true);
          expect([...t.choices].sort((a, b) => a - b)).toEqual(t.choices);
          for (const c of t.choices.filter((c) => c !== t.answer)) {
            const off = chooseTotals(t, c);
            expect(off.left).not.toBe(off.right);
          }
          expect(t.secret).toBe(!!SCALE_LEVELS[l].secret);
        }
      }
    }
  });

  it('stands weights in rows of five and never breaks a two across rows', () => {
    const slots = panSlots([2, 2, 1, 2, 1, 1]);
    expect(slots.map((s) => [s.col, s.row])).toEqual([[0, 0], [2, 0], [4, 0], [0, 1], [2, 1], [3, 1]]);
    expect(panSlots(Array.from({ length: PAN_SLOTS }, () => 1)).at(-1)).toEqual({ col: 4, row: 2, w: 1 });
  });

  it('counts with the child instead of saying "wrong"', () => {
    const miss = compareMissFeedback({ kind: 'compare', left: [1, 1, 1, 1], right: [1, 1], answer: 'left' });
    expect(miss.speech).toContain('négy');
    expect(miss.speech).toContain('kettő');
    expect(compareRightFeedback({ kind: 'compare', left: [1, 1, 1], right: [1, 1, 1], answer: 'equal' }).tone).toBe('good');
    expect(balanceFeedback(5, 6, false)?.tone).toBe('oops');
    expect(balanceFeedback(5, 4, false)).toBeNull();
    expect(balanceFeedback(5, 5, false)?.tone).toBe('good');
  });

  it('says which way a wrong weight tips, then counts what is missing', () => {
    const t: ChooseTask = { kind: 'choose', left: [1, 1, 1, 1, 1, 1, 1], right: [1, 1, 1, 1], unknown: 'right', secret: false, answer: 3, choices: [2, 3, 4] };
    expect(chooseMissFeedback(t, 4, 1).text).toContain('sok');
    expect(chooseMissFeedback(t, 2, 1).text).toContain('kevés');
    expect(chooseMissFeedback(t, 2, 2).text).toMatch(/Mennyi kell még/);
    expect(chooseRightFeedback(t).text).toContain('3 + 4 = 7');
    const crate: ChooseTask = { kind: 'choose', left: [], right: [1, 1, 1], unknown: 'left', secret: true, answer: 3, choices: [2, 3, 4] };
    expect(chooseRightFeedback(crate).text).toContain('A doboz súlya 3');
    expect(chooseMissFeedback(crate, 4, 1).text).toContain('sok');
  });

  it('has an opening line for every level', () => {
    SCALE_LEVELS.forEach((level, i) => {
      const f = startFeedback(level, buildScaleRound(i, 0).tasks[0]);
      expect(f.text.length).toBeGreaterThan(0);
      expect(f.speech.length).toBeGreaterThan(0);
    });
  });
});
