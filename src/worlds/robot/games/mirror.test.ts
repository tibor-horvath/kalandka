import { describe, expect, it } from 'vitest';
import {
  MIRROR_LEVELS,
  MIRROR_ROUNDS_PER_LEVEL,
  PICTURES,
  boardDoneFeedback,
  buildMirrorRound,
  key,
  lampWrongFeedback,
  mirrorLevelIndex,
  nearestTarget,
  onGivenSide,
  paintColors,
  pictureLamps,
  reflect,
  stepsFromMirror,
  type Cell,
  type FixTask,
  type LightTask,
  type PickTask
} from './mirror';

const rounds = (kind: string) => {
  const i = MIRROR_LEVELS.findIndex((l) => l.kind === kind);
  return Array.from({ length: 12 }, (_, r) => buildMirrorRound(i, r));
};
const same = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((p) => b.some((q) => q.r === p.r && q.c === p.c));

describe('Tükörgép levels', () => {
  it('steps up every five solved rounds and stops at the last', () => {
    expect(mirrorLevelIndex(0)).toBe(0);
    expect(mirrorLevelIndex(MIRROR_ROUNDS_PER_LEVEL - 1)).toBe(0);
    expect(mirrorLevelIndex(MIRROR_ROUNDS_PER_LEVEL)).toBe(1);
    expect(mirrorLevelIndex(999)).toBe(MIRROR_LEVELS.length - 1);
  });

  it('builds the same round every time', () => {
    for (let l = 0; l < MIRROR_LEVELS.length; l++) expect(buildMirrorRound(l, 3)).toEqual(buildMirrorRound(l, 3));
  });

  it('starts 5-year-olds on a single lamp', () => {
    for (const round of rounds('one')) for (const t of round.tasks as LightTask[]) expect(t.given).toHaveLength(1);
  });
});

describe('the board', () => {
  it('reflects across a standing and a lying mirror, keeping the distance', () => {
    expect(reflect({ r: 1, c: 0 }, 'v', 3, 6)).toEqual({ r: 1, c: 5 });
    expect(reflect({ r: 0, c: 2 }, 'h', 6, 5)).toEqual({ r: 5, c: 2 });
    expect(stepsFromMirror({ r: 0, c: 2 }, 'v', 3, 6)).toBe(1);
    expect(stepsFromMirror({ r: 0, c: 3 }, 'v', 3, 6)).toBe(1);
    expect(stepsFromMirror({ r: 0, c: 0 }, 'v', 3, 6)).toBe(3);
    expect(stepsFromMirror({ r: 5, c: 0 }, 'h', 6, 5)).toBe(3);
  });

  it('puts every lamp on the first half and every reflection in the board across the mirror', () => {
    for (const kind of ['one', 'many', 'picture', 'paint', 'flat']) {
      for (const round of rounds(kind)) {
        for (const t of round.tasks as LightTask[]) {
          expect(new Set(t.given.map(key)).size).toBe(t.given.length);
          t.given.forEach((g, i) => {
            expect(onGivenSide(g, t.axis, t.rows, t.cols)).toBe(true);
            const target = t.targets[i];
            expect(target).toEqual({ ...reflect(g, t.axis, t.rows, t.cols), color: g.color });
            expect(target.r).toBeLessThan(t.rows);
            expect(target.c).toBeLessThan(t.cols);
            expect(stepsFromMirror(target, t.axis, t.rows, t.cols)).toBe(stepsFromMirror(g, t.axis, t.rows, t.cols));
          });
        }
      }
    }
  });

  it('lays the mirror flat on Fel-le tükör', () => {
    for (const round of rounds('flat')) for (const t of round.tasks as LightTask[]) expect(t.axis).toBe('h');
  });
});

describe('pictures', () => {
  it('give 6–9 lamps to light, in one colour on Fél kép and in their own on Színes kép', () => {
    for (const pic of PICTURES) {
      expect(pic.half).toHaveLength(5);
      const n = pictureLamps(pic, true).length;
      expect(n).toBeGreaterThanOrEqual(6);
      expect(n).toBeLessThanOrEqual(9);
      expect(new Set(pictureLamps(pic, false).map((l) => l.color)).size).toBe(1);
    }
    for (const round of rounds('paint')) for (const t of round.tasks as LightTask[]) expect(paintColors(t).length).toBeGreaterThanOrEqual(2);
  });

  it('names the finished picture', () => {
    expect(boardDoneFeedback(0, 'szív').text).toBe('Úgy van! Kész a szív!');
  });
});

describe('Tükör vagy másolat?', () => {
  it('offers the reflection, a copy and a quarter turn, all different and one of each', () => {
    for (const round of rounds('pick')) {
      for (const t of round.tasks as PickTask[]) {
        expect(t.choices.map((c) => c.kind).sort()).toEqual(['copy', 'mirror', 'turn']);
        const [a, b, c] = t.choices.map((ch) => ch.cells);
        expect(same(a, b) || same(b, c) || same(a, c)).toBe(false);
        const mirror = t.choices.find((ch) => ch.kind === 'mirror')!.cells;
        expect(same(mirror, t.shape.map((p) => ({ r: p.r, c: t.size - 1 - p.c })))).toBe(true);
      }
    }
  });
});

describe('Hibás tükör', () => {
  it('gets exactly one place wrong on the second half', () => {
    for (const round of rounds('fix')) {
      for (const t of round.tasks as FixTask[]) {
        const right = t.given.map((g) => key(reflect(g, t.axis, t.rows, t.cols)));
        const shown = t.shown.map(key);
        const diff = [...right.filter((k) => !shown.includes(k)), ...shown.filter((k) => !right.includes(k))];
        expect(diff).toEqual([key(t.fault)]);
        expect(onGivenSide(t.fault, t.axis, t.rows, t.cols)).toBe(false);
        expect(t.fault.lamp === null).toBe(shown.includes(key(t.fault)));
      }
    }
  });
});

describe('Csavar after a miss', () => {
  const task: LightTask = {
    mode: 'light',
    axis: 'v',
    rows: 3,
    cols: 6,
    given: [{ r: 1, c: 1, color: 'red' }],
    targets: [{ r: 1, c: 4, color: 'red' }],
    paint: false
  };

  it('points at the dark reflection in the tapped row and counts its steps', () => {
    const target = nearestTarget(task, new Set(), { r: 1, c: 5 });
    expect(target).toEqual({ r: 1, c: 4, color: 'red' });
    expect(lampWrongFeedback(task, target).text).toBe('Hoppá! Ez a piros lámpa két lépésre van a tükörtől. A tükörképe is két lépésre lesz, ugyanabban a sorban.');
    expect(nearestTarget(task, new Set(['1,4']), null)).toBeNull();
  });
});
