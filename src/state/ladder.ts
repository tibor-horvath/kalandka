import { ADD_LEVELS, clampLevel } from '../games/add/logic';
import { FLASH_ROUNDS_PER_LEVEL, LEVELS as FLASH_LEVELS } from '../games/flash/logic';
import { PATTERN_LEVELS, SHAPE_ORDER } from '../games/patterns/logic';
import { POTS_LEVELS, POTS_ROUNDS_PER_LEVEL } from '../games/pots/logic';
import { CODE_LEVELS, CODE_ROUNDS_PER_LEVEL } from '../games/robot/code';
import { FIX_LEVELS, FIX_ROUNDS_PER_LEVEL } from '../games/robot/fix';
import { MIRROR_LEVELS, MIRROR_ROUNDS_PER_LEVEL } from '../games/robot/mirror';
import { PATH_LEVELS, PATH_ROUNDS_PER_LEVEL } from '../games/robot/path';
import { SCALE_LEVELS, SCALE_ROUNDS_PER_LEVEL } from '../games/robot/scale';
import { SEQ_LEVELS, SEQ_ROUNDS_PER_LEVEL } from '../games/robot/seq';
import { SORT_LEVELS, SORT_ROUNDS_PER_LEVEL } from '../games/robot/sort';
import { TRACE_LEVELS, TRACE_ORDER } from '../games/trace/logic';
import { PLANTS, WATER_LEVELS } from '../games/water/logic';
import type { LevelMeterState } from './levelMeter';
import type { Progress } from './progress';

// The difficulty ladder shared by the games that have levels. The level follows the child on its own:
// enough tasks in a row without help and it steps up (with the level-up card), enough in a row that
// needed help and it quietly steps down. The level is kept apart from the solved counts, so stepping
// down never takes a sticker, a seed or a bolt away.

export type LadderGame = 'water' | 'patterns' | 'trace' | 'flash' | 'add' | 'pots' | 'path' | 'sort' | 'scale' | 'seq' | 'mirror' | 'code' | 'fix';

export interface LadderRule {
  levels: number;
  /** Tasks in a row without help that step up. */
  up: number;
  /** Tasks in a row that needed help that step down. */
  down: number;
  /** Tasks after any step before the next step down, so a child at the edge does not bounce. */
  cooldown: number;
}

/**
 * One task is one answer in the garden games and one round in the workshop, where a round holds two
 * to four tasks and the level can only change between rounds. Mézút's row is one level's digits, so a
 * child steps up only after writing every one of them.
 */
export const LADDER_RULES: Record<LadderGame, LadderRule> = {
  water: { levels: WATER_LEVELS.length, up: 4, down: 3, cooldown: 3 },
  patterns: { levels: PATTERN_LEVELS.length, up: 4, down: 3, cooldown: 3 },
  trace: { levels: TRACE_LEVELS.length, up: TRACE_LEVELS[0].digits.length, down: 3, cooldown: 3 },
  flash: { levels: FLASH_LEVELS.length, up: 4, down: 3, cooldown: 3 },
  add: { levels: ADD_LEVELS.length, up: 5, down: 3, cooldown: 3 },
  pots: { levels: POTS_LEVELS.length, up: 5, down: 3, cooldown: 3 },
  path: { levels: PATH_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  sort: { levels: SORT_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  scale: { levels: SCALE_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  seq: { levels: SEQ_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  mirror: { levels: MIRROR_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  code: { levels: CODE_LEVELS.length, up: 4, down: 2, cooldown: 3 },
  fix: { levels: FIX_LEVELS.length, up: 4, down: 2, cooldown: 3 }
};

export interface Ladder {
  /** The level the next task is on (0-based). */
  level: number;
  /** Never steps down below this: the starting level a parent set. */
  floor: number;
  /** Tasks in a row without help on this level. */
  streak: number;
  /** Tasks in a row that needed help. */
  helpRun: number;
  /** Tasks since the last step, up or down. */
  sinceChange: number;
  lastChange: 'up' | 'down' | null;
  /** Highest level ever stepped onto; `levels` once the top level was mastered too. Only grows. */
  reached: number;
  /** Highest level a task was solved on; −1 before the first. Only grows. */
  solvedTop: number;
}

export type LadderChange = 'up' | 'down' | 'mastered' | null;

export interface LadderStep {
  ladder: Ladder;
  change: LadderChange;
  helped: boolean;
}

const LEGACY: Partial<Record<LadderGame, { rounds: number; solved: (p: Progress) => number }>> = {
  flash: { rounds: FLASH_ROUNDS_PER_LEVEL, solved: (p) => p.flashSolved },
  pots: { rounds: POTS_ROUNDS_PER_LEVEL, solved: (p) => p.potsSolved },
  path: { rounds: PATH_ROUNDS_PER_LEVEL, solved: (p) => p.pathSolved },
  sort: { rounds: SORT_ROUNDS_PER_LEVEL, solved: (p) => p.sortSolved },
  scale: { rounds: SCALE_ROUNDS_PER_LEVEL, solved: (p) => p.scaleSolved },
  seq: { rounds: SEQ_ROUNDS_PER_LEVEL, solved: (p) => p.seqSolved },
  mirror: { rounds: MIRROR_ROUNDS_PER_LEVEL, solved: (p) => p.mirrorSolved },
  code: { rounds: CODE_ROUNDS_PER_LEVEL, solved: (p) => p.codeSolved },
  fix: { rounds: FIX_ROUNDS_PER_LEVEL, solved: (p) => p.fixSolved }
};

/** Games that walked a fixed order before their ladder: which level each round of that order belongs to. */
const ROUND_LEVELS: Partial<Record<LadderGame, { round: (p: Progress) => number; level: (round: number) => number }>> = {
  water: { round: (p) => p.waterRound, level: (r) => (r >= PLANTS.length ? 2 : r >= 4 ? 1 : 0) },
  patterns: { round: (p) => p.patternRound, level: (r) => (r >= SHAPE_ORDER.length ? 3 : Math.min(2, r)) },
  trace: { round: (p) => p.traceRound, level: (r) => (r >= TRACE_ORDER.length ? 2 : 0) + (r % TRACE_ORDER.length >= LADDER_RULES.trace.up ? 1 : 0) }
};

const fresh = (level = 0): Ladder => ({ level, floor: 0, streak: 0, helpRun: 0, sinceChange: 0, lastChange: null, reached: level, solvedTop: -1 });

/**
 * The ladder of a save from before the ladders: levels used to be every N solved rounds, and Méhkas kept
 * its own level and counters. The child stays exactly where they were, with the same stickers.
 */
function legacyLadder(p: Progress, game: LadderGame): Ladder {
  const rule = LADDER_RULES[game];
  const top = rule.levels - 1;
  if (game === 'add') {
    const level = clampLevel(p.addLevel);
    return { ...fresh(level), streak: Math.min(rule.up - 1, p.addStreak), helpRun: p.addMisses, solvedTop: p.addSolved > 0 ? level : -1 };
  }
  const walked = ROUND_LEVELS[game];
  if (walked) {
    const round = Math.max(0, walked.round(p));
    return {
      ...fresh(walked.level(round)),
      // Mézút picks its digit by this count, so the child carries on from the same digit.
      sinceChange: game === 'trace' ? round % rule.up : 0,
      solvedTop: round > 0 ? walked.level(round - 1) : -1
    };
  }
  const { rounds, solved: of } = LEGACY[game]!;
  const solved = Math.max(0, of(p));
  const passed = Math.floor(solved / rounds);
  const level = Math.min(top, passed);
  return {
    ...fresh(level),
    streak: level < top ? Math.min(rule.up - 1, solved - level * rounds) : 0,
    // A whole top level done counted as mastering it.
    reached: Math.min(rule.levels, passed),
    solvedTop: solved > 0 ? Math.min(top, Math.ceil(solved / rounds) - 1) : -1
  };
}

export function ladderOf(p: Progress, game: LadderGame): Ladder {
  return p.ladders[game] ?? legacyLadder(p, game);
}

export function withLadder(p: Progress, game: LadderGame, ladder: Ladder): Progress {
  return { ...p, ladders: { ...p.ladders, [game]: ladder } };
}

/** Tasks in a row it takes to step up; one more right after stepping down, to go back to the harder level. */
export function upNeed(l: Ladder, rule: LadderRule): number {
  return rule.up + (l.lastChange === 'down' ? 1 : 0);
}

/** A solved task: count it, and step up or down when it is time. */
export function afterSolve(l: Ladder, rule: LadderRule, helped: boolean): LadderStep {
  const top = rule.levels - 1;
  const next: Ladder = {
    ...l,
    streak: helped ? 0 : l.streak + 1,
    helpRun: helped ? l.helpRun + 1 : 0,
    sinceChange: l.sinceChange + 1,
    reached: Math.max(l.reached, l.level),
    solvedTop: Math.max(l.solvedTop, l.level)
  };
  const restart = { streak: 0, helpRun: 0, sinceChange: 0 };

  if (!helped && next.streak >= upNeed(l, rule)) {
    if (l.level < top) {
      const level = l.level + 1;
      return { ladder: { ...next, ...restart, level, lastChange: 'up', reached: Math.max(next.reached, level) }, change: 'up', helped };
    }
    // The top level has no next one: the row starts again, and the first full row counts as mastering it.
    const mastered = next.reached < rule.levels;
    return { ladder: { ...next, streak: 0, reached: rule.levels }, change: mastered ? 'mastered' : null, helped };
  }
  if (helped && next.helpRun >= rule.down && l.level > l.floor && next.sinceChange >= rule.cooldown) {
    return { ladder: { ...next, ...restart, level: l.level - 1, lastChange: 'down' }, change: 'down', helped };
  }
  return { ladder: next, change: null, helped };
}

/** A parent's starting level: the child plays from here and never drops below it. Earlier levels count as done. */
export function startAt(l: Ladder, level: number): Ladder {
  return {
    ...l,
    level,
    floor: level,
    streak: 0,
    helpRun: 0,
    sinceChange: 0,
    lastChange: null,
    reached: Math.max(l.reached, level),
    solvedTop: Math.max(l.solvedTop, level - 1)
  };
}

/**
 * A new child's level, guessed from their age: like a parent's starting level, but it is only a guess,
 * so the child can still step down from it.
 */
export function placeAt(l: Ladder, level: number): Ladder {
  return { ...startAt(l, level), floor: 0 };
}

/** Solves a task in `game` for this progress: the new ladder in place, and what happened. */
export function solveIn(p: Progress, game: LadderGame, helped: boolean): { progress: Progress; step: LadderStep } {
  const step = afterSolve(ladderOf(p, game), LADDER_RULES[game], helped);
  return { progress: withLadder(p, game, step.ladder), step };
}

/**
 * The in-game level meter: the staircase, and one slot per task of the streak that steps up. `start` is
 * the ladder when the task began, so the meter stays on that level after a win steps up.
 */
export function ladderMeter(start: Ladder, rule: LadderRule, step: LadderStep | null): LevelMeterState {
  const rounds = upNeed(start, rule);
  const full = step !== null && (step.change === 'up' || step.change === 'mastered' || (!step.helped && start.streak + 1 >= rounds));
  const done = step === null ? start.streak : full ? rounds : step.helped ? 0 : start.streak + 1;
  return { level: start.level, levels: rule.levels, done, rounds, levelUp: step?.change === 'up' };
}

/** Said after a win that stepped down: no "level lost", just an easier next task. */
export const EASIER_SPEECH = 'A következőt egy kicsit könnyebben gyakoroljuk.';
