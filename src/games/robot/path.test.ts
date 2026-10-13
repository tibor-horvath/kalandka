import { describe, expect, it } from 'vitest';
import {
  PATH_LEVELS,
  PATH_ROUNDS_PER_LEVEL,
  blockAt,
  bumpFeedback,
  buildPuzzle,
  fold,
  nthCard,
  pathLevelIndex,
  routeCells,
  run,
  shortest,
  step,
  stepCount,
  type Puzzle
} from './path';

const ROUNDS = 40;
const each = (fn: (p: Puzzle, level: number, round: number) => void) => {
  PATH_LEVELS.forEach((_, level) => {
    for (let round = 0; round < ROUNDS; round++) fn(buildPuzzle(level, round), level, round);
  });
};

describe('Robotút courses', () => {
  it('are the same for the same level and round', () => {
    expect(buildPuzzle(3, 7)).toEqual(buildPuzzle(3, 7));
    expect(buildPuzzle(3, 7)).not.toEqual(buildPuzzle(3, 8));
  });

  it('can always be done with their own solution, within the level’s steps and slots', () => {
    each((p) => {
      const { level } = p;
      expect(run(p, p.solution).outcome).toBe('goal');
      const steps = stepCount(p.solution);
      expect(steps).toBeGreaterThanOrEqual(level.steps[0]);
      expect(steps).toBeLessThanOrEqual(level.steps[1]);
      if (level.mode === 'plan') expect(p.solution.length).toBeLessThanOrEqual(level.slots);
      expect(p.crates.length).toBeGreaterThanOrEqual(level.crates[0]);
      expect(p.crates.length).toBeLessThanOrEqual(level.crates[1]);
    });
  });

  it('never puts the robot, the battery and a crate on the same cell', () => {
    each((p) => {
      const cells = [p.start, ...p.goals, ...p.crates].map((c) => `${c.x},${c.y}`);
      expect(new Set(cells).size).toBe(cells.length);
      expect(blockAt(p, p.start)).toBeNull();
      for (const g of p.goals) expect(blockAt(p, g)).toBeNull();
    });
  });

  it('makes the crates matter on the detour levels', () => {
    each((p) => {
      if (!p.level.detour) return;
      const manhattan = Math.abs(p.start.x - p.goals[0].x) + Math.abs(p.start.y - p.goals[0].y);
      expect(shortest(p, 'absolute')!.length).toBeGreaterThan(manhattan);
    });
  });

  it('needs the repeat cards on the repeat level', () => {
    each((p) => {
      if (!p.level.repeat) return;
      expect(shortest(p, p.level.moves)!.length).toBeGreaterThan(p.level.slots);
      expect(p.solution.some((c) => c.times > 1)).toBe(true);
    });
  });

  it('has ten levels, and the two-battery level needs both batteries', () => {
    expect(PATH_LEVELS).toHaveLength(10);
    const two = PATH_LEVELS.findIndex((l) => l.batteries === 2);
    for (let round = 0; round < ROUNDS; round++) {
      const p = buildPuzzle(two, round);
      expect(p.goals).toHaveLength(2);
      const r = run(p, p.solution);
      expect(r.outcome).toBe('goal');
      expect(r.frames.at(-1)!.collected.sort()).toEqual([0, 1]);
      // Stopping at the first battery is not enough.
      const first = r.frames.findIndex((f) => f.collected.length === 1);
      expect(r.frames[first].collected).toHaveLength(1);
    }
  });

  it('gives the advanced levels a charge of the shortest way plus one or two', () => {
    each((p) => {
      if (p.level.charge === undefined) {
        expect(p.energy).toBeNull();
        return;
      }
      expect(p.level.charge).toBeGreaterThanOrEqual(1);
      expect(p.level.charge).toBeLessThanOrEqual(2);
      expect(p.energy).toBe(shortest(p, p.level.moves)!.length + p.level.charge);
      expect(stepCount(p.solution)).toBeLessThanOrEqual(p.energy!);
    });
    expect(PATH_LEVELS.slice(0, 4).every((l) => l.charge === undefined)).toBe(true);
  });

  it('stops the robot when the charge runs out, on the step after the last one it had', () => {
    // Three steps to the right reach the battery; the charge lasts for four.
    const p: Puzzle = { level: PATH_LEVELS[4], cols: 4, rows: 2, start: { x: 0, y: 1, dir: 1 }, goals: [{ x: 3, y: 1 }], crates: [], energy: 4, solution: [] };
    expect(run(p, [{ cmd: 'up', times: 1 }, { cmd: 'right', times: 3 }, { cmd: 'down', times: 1 }]).outcome).toBe('empty');
    const out = run(p, [{ cmd: 'up', times: 1 }, { cmd: 'down', times: 1 }, { cmd: 'right', times: 3 }]);
    expect(out.outcome).toBe('empty');
    expect(out.frames).toHaveLength(4);
    expect(out.card).toBe(2);
    expect(run(p, [{ cmd: 'up', times: 1 }, { cmd: 'right', times: 3 }]).outcome).toBe('short');
    expect(run(p, [{ cmd: 'right', times: 3 }]).outcome).toBe('goal');
  });

  it('moves up a level every five solved courses and stays on the last', () => {
    expect(pathLevelIndex(0)).toBe(0);
    expect(pathLevelIndex(PATH_ROUNDS_PER_LEVEL - 1)).toBe(0);
    expect(pathLevelIndex(PATH_ROUNDS_PER_LEVEL)).toBe(1);
    expect(pathLevelIndex(999)).toBe(PATH_LEVELS.length - 1);
  });
});

describe('running a program', () => {
  const p: Puzzle = {
    level: PATH_LEVELS[2],
    cols: 4,
    rows: 3,
    start: { x: 0, y: 1, dir: 1 },
    goals: [{ x: 3, y: 1 }],
    crates: [{ x: 2, y: 1 }],
    energy: null,
    solution: []
  };

  it('stops at a crate and names the card', () => {
    const r = run(p, [{ cmd: 'right', times: 1 }, { cmd: 'right', times: 1 }]);
    expect(r.outcome).toBe('bump');
    expect(r.card).toBe(1);
    expect(r.frames.at(-1)!.bumped).toBe('crate');
    expect(r.frames.at(-1)!.pose).toMatchObject({ x: 1, y: 1 });
  });

  it('stops at the wall, and says when the program ends too early', () => {
    expect(run(p, [{ cmd: 'left', times: 1 }]).frames[0].bumped).toBe('wall');
    expect(run(p, [{ cmd: 'up', times: 1 }]).outcome).toBe('short');
  });

  it('reaches the battery round the crate, and the route shows each cell once', () => {
    const cards = fold(['up', 'right', 'right', 'right', 'down']);
    expect(cards).toEqual([{ cmd: 'up', times: 1 }, { cmd: 'right', times: 3 }, { cmd: 'down', times: 1 }]);
    expect(run(p, cards).outcome).toBe('goal');
    expect(routeCells(p, cards)).toHaveLength(6);
  });

  it('turns on the spot and goes the way it faces', () => {
    const a = step(p, p.start, 'turnL');
    expect(a.pose).toMatchObject({ x: 0, y: 1, dir: 0 });
    expect(step(p, a.pose, 'fwd').pose).toMatchObject({ x: 0, y: 0, dir: 0 });
    expect(step(p, { x: 0, y: 1, dir: 0 }, 'right').pose).toMatchObject({ x: 1, y: 1, dir: 1 });
  });

  it('finds the shortest way with turns', () => {
    const cmds = shortest(p, 'relative')!;
    expect(run(p, cmds.map((cmd) => ({ cmd, times: 1 }))).outcome).toBe('goal');
    expect(cmds).toEqual(['fwd', 'turnL', 'fwd', 'turnR', 'fwd', 'fwd', 'turnR', 'fwd']);
  });
});

describe("Csavar's words", () => {
  it('names the card with the right article, never says wrong', () => {
    expect(nthCard(0)).toBe('az első');
    expect(nthCard(2)).toBe('a harmadik');
    expect(nthCard(4)).toBe('az ötödik');
    const f = bumpFeedback('crate', 0);
    expect(f.text).toMatch(/^Hoppá! Az első kártyánál/);
    expect(f.text).not.toMatch(/rossz|hiba/i);
  });
});
