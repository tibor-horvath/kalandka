import { describe, expect, it } from 'vitest';
import { FIX_LEVELS, buildFixRound, doubleFixes, fixChoices, goodCardFeedback, sameCard, singleFixes, startFeedback, type Bug, type FixTask } from './fix';
import { routeCells, run, stepCount, type Card } from './path';

const ROUNDS = 25;
const each = (fn: (t: FixTask, level: number) => void) => {
  FIX_LEVELS.forEach((_, level) => {
    for (let round = 0; round < ROUNDS; round++) for (const t of buildFixRound(level, round).tasks) fn(t, level);
  });
};

/** The program with its mistakes put right. */
const repaired = (t: FixTask): Card[] => {
  const cards = t.program.map((c, i) => t.bugs.find((b) => b.at === i)?.want ?? c);
  return t.level.kind === 'extra' ? cards.filter((_, i) => i !== t.bugs[0].at) : cards;
};

describe('Hibavadász tasks', () => {
  it('are the same for the same level and round', () => {
    expect(buildFixRound(2, 7)).toEqual(buildFixRound(2, 7));
    expect(buildFixRound(2, 7)).not.toEqual(buildFixRound(2, 8));
  });

  it('never reach the battery as found, and always do once put right', () => {
    each((t) => {
      expect(run(t.course, t.program).outcome).not.toBe('goal');
      expect(run(t.course, repaired(t)).outcome).toBe('goal');
    });
  });

  it('can be put right in one way only', () => {
    each((t) => {
      if (t.level.kind === 'two') {
        expect(singleFixes(t.course, t.level, t.program)).toEqual([]);
        expect(doubleFixes(t.course, t.level, t.program)).toEqual([t.bugs]);
      } else {
        expect(singleFixes(t.course, t.level, t.program)).toEqual(t.bugs);
      }
    });
  });

  it('keep to the level’s floor and length', () => {
    each((t) => {
      const { level, course } = t;
      expect([course.cols, course.rows]).toEqual([level.cols, level.rows]);
      expect(course.crates.length).toBeGreaterThanOrEqual(level.crates[0]);
      expect(course.crates.length).toBeLessThanOrEqual(level.crates[1]);
      const steps = stepCount(repaired(t));
      expect(steps).toBeGreaterThanOrEqual(level.steps[0]);
      expect(steps).toBeLessThanOrEqual(level.steps[1]);
      const cells = [course.start, ...course.goals, ...course.crates].map((c) => `${c.x},${c.y}`);
      expect(new Set(cells).size).toBe(cells.length);
    });
  });

  it('let the robot reach a wrong card before it stops, except a second one', () => {
    each((t) => {
      const last = run(t.course, t.program).frames.at(-1);
      expect(last?.card ?? 0).toBeGreaterThanOrEqual(t.bugs[0].at);
    });
  });

  it('has a dotted way that follows the right program', () => {
    each((t) => {
      expect(t.route).toEqual(routeCells(t.course, repaired(t)));
      expect(t.route[0]).toMatchObject({ x: t.course.start.x, y: t.course.start.y });
    });
  });

  it('offers the right card among the choices', () => {
    each((t) => {
      for (const b of t.bugs as Bug[]) {
        if (b.want) expect(fixChoices(t.level, t.program[b.at]).some((c) => sameCard(c, b.want!))).toBe(true);
      }
    });
  });

  it('keeps a round to its number of different tasks', () => {
    FIX_LEVELS.forEach((level, i) => {
      const { tasks } = buildFixRound(i, 3);
      expect(tasks).toHaveLength(level.tasks);
      expect(new Set(tasks.map((t) => JSON.stringify([t.course, t.program]))).size).toBe(level.tasks);
    });
  });

  it('starts with the small floor and the dots for 5-year-olds', () => {
    const [first] = FIX_LEVELS;
    expect(first).toMatchObject({ kind: 'swap', dots: true, crates: [0, 0] });
    expect(first.cols * first.rows).toBeLessThanOrEqual(12);
    expect(first.steps[1]).toBeLessThanOrEqual(3);
  });
});

describe('Csavar in Hibavadász', () => {
  it('has an opening line for every level', () => {
    for (const level of FIX_LEVELS) expect(startFeedback(level).speech).toMatch(/Indulás/);
  });

  it('says which way to look from a card that is fine', () => {
    const bugs: Bug[] = [{ at: 2, want: null }];
    expect(goodCardFeedback(0, bugs).text).toContain('következőket');
    expect(goodCardFeedback(3, bugs).text).toContain('korábbiakat');
  });
});
