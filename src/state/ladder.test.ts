import { describe, expect, it } from 'vitest';
import { buildTraceRound } from '../worlds/garden/games/trace/logic';
import { LADDER_RULES, afterSolve, ladderMeter, ladderOf, placeAt, startAt, type Ladder, type LadderRule } from './ladder';
import { DEFAULT_PROGRESS } from './progress';

const rule: LadderRule = { levels: 4, up: 4, down: 2, cooldown: 3 };
const at = (level: number, more: Partial<Ladder> = {}): Ladder => ({
  level, floor: 0, streak: 0, helpRun: 0, sinceChange: 9, lastChange: null, reached: level, solvedTop: level - 1, ...more
});

/** Plays these tasks in order (true = needed help) and returns the ladder and every change. */
function play(l: Ladder, helps: boolean[]) {
  const changes: string[] = [];
  for (const h of helps) {
    const s = afterSolve(l, rule, h);
    if (s.change) changes.push(s.change);
    l = s.ladder;
  }
  return { l, changes };
}

describe('difficulty ladder', () => {
  it('steps up after enough tasks in a row without help', () => {
    const { l, changes } = play(at(1), [false, false, false, false]);
    expect(changes).toEqual(['up']);
    expect(l).toMatchObject({ level: 2, streak: 0, lastChange: 'up', reached: 2, solvedTop: 1 });
  });

  it('starts the streak again after a task that needed help', () => {
    expect(play(at(1), [false, false, false, true, false, false, false]).l).toMatchObject({ level: 1, streak: 3 });
  });

  it('steps down after enough tasks in a row that needed help', () => {
    const { l, changes } = play(at(2), [true, true]);
    expect(changes).toEqual(['down']);
    expect(l).toMatchObject({ level: 1, lastChange: 'down', reached: 2 });
  });

  it('waits a few tasks after a step before stepping down', () => {
    const up = play(at(1), [false, false, false, false]).l;
    expect(play(up, [true, true]).l.level).toBe(2);
    expect(play(up, [true, true, true]).l.level).toBe(1);
  });

  it('asks one more task in a row to go back up after stepping down', () => {
    const down = play(at(2), [true, true]).l;
    expect(play(down, [false, false, false, false]).l.level).toBe(1);
    expect(play(down, [false, false, false, false, false]).l.level).toBe(2);
  });

  it('never drops below the starting level a parent set', () => {
    const l = startAt(at(0), 2);
    expect(l).toMatchObject({ level: 2, floor: 2, solvedTop: 1 });
    expect(play(l, [true, true, true, true, true, true]).l.level).toBe(2);
  });

  it('masters the top level once, then keeps refilling the row', () => {
    const { l, changes } = play(at(3), [false, false, false, false, false, false, false, false]);
    expect(changes).toEqual(['mastered']);
    expect(l).toMatchObject({ level: 3, reached: 4 });
  });

  it('never takes back how far the child got', () => {
    const { l } = play(at(3), [true, true, true, true, true, true]);
    expect(l.level).toBe(1);
    expect(l.reached).toBe(3);
    expect(l.solvedTop).toBe(3);
  });

  it('shows the streak on the meter and fills it on the step up', () => {
    const l = at(1, { streak: 3 });
    expect(ladderMeter(l, rule, null)).toMatchObject({ level: 1, levels: 4, done: 3, rounds: 4, levelUp: false });
    expect(ladderMeter(l, rule, afterSolve(l, rule, false))).toMatchObject({ level: 1, done: 4, levelUp: true });
    expect(ladderMeter(l, rule, afterSolve(l, rule, true))).toMatchObject({ done: 0, levelUp: false });
  });
});

describe('saves from before the ladders', () => {
  it('keeps a workshop game on the level its solved rounds gave', () => {
    const l = ladderOf({ ...DEFAULT_PROGRESS, sortSolved: 12 }, 'sort');
    expect(l).toMatchObject({ level: 2, streak: 2, solvedTop: 2, floor: 0 });
  });

  it('counts a whole top level as mastered', () => {
    const top = LADDER_RULES.pots.levels;
    expect(ladderOf({ ...DEFAULT_PROGRESS, potsSolved: 5 * top }, 'pots')).toMatchObject({ level: top - 1, reached: top });
  });

  it('takes Méhkas’s own level and counters', () => {
    expect(ladderOf({ ...DEFAULT_PROGRESS, addLevel: 4, addStreak: 2, addMisses: 1, addSolved: 9 }, 'add')).toMatchObject({
      level: 4, streak: 2, helpRun: 1, solvedTop: 4
    });
    expect(ladderOf(DEFAULT_PROGRESS, 'add').solvedTop).toBe(-1);
  });

  it('keeps Locsolás on the drops its plants had reached', () => {
    const at = (waterRound: number) => ladderOf({ ...DEFAULT_PROGRESS, waterRound }, 'water');
    expect(at(0)).toMatchObject({ level: 0, solvedTop: -1 });
    expect(at(5)).toMatchObject({ level: 1, solvedTop: 1 });
    expect(at(9)).toMatchObject({ level: 2, reached: 2, solvedTop: 1 });
    expect(at(10)).toMatchObject({ level: 2, solvedTop: 2 });
  });

  it('keeps Virágsor on the shape it had reached, and in the row once the first lap was done', () => {
    const at = (patternRound: number) => ladderOf({ ...DEFAULT_PROGRESS, patternRound }, 'patterns').level;
    expect([0, 1, 2, 3, 4, 30].map(at)).toEqual([0, 1, 2, 2, 3, 3]);
  });

  it('keeps Mézút on the same half of the digits and the same trail, at the same digit', () => {
    const at = (traceRound: number) => ladderOf({ ...DEFAULT_PROGRESS, traceRound }, 'trace');
    expect([0, 4, 5, 9, 10, 15, 22].map((r) => at(r).level)).toEqual([0, 0, 1, 1, 2, 3, 2]);
    expect(buildTraceRound(at(7).level, at(7).sinceChange).digit).toBe(8);
  });
});

describe('placing a new child by age', () => {
  it('starts on the level with the ones below counted as done', () => {
    expect(placeAt(ladderOf(DEFAULT_PROGRESS, 'sort'), 3)).toMatchObject({ level: 3, reached: 3, solvedTop: 2 });
  });

  it('leaves room to step down, unlike a level a parent set', () => {
    let l = placeAt(ladderOf(DEFAULT_PROGRESS, 'sort'), 3);
    for (let i = 0; i < 3; i++) l = afterSolve(l, rule, true).ladder;
    expect(l.level).toBe(2);
    let set = startAt(ladderOf(DEFAULT_PROGRESS, 'sort'), 3);
    for (let i = 0; i < 3; i++) set = afterSolve(set, rule, true).ladder;
    expect(set.level).toBe(3);
  });
});
