// What the in-game level meter shows: which level the child is on, and how many of this
// level's rounds are done. Worked out from the solved count when the round started, so the
// meter fills the round's own slot on a win instead of jumping straight to the next level.

export interface LevelMeterState {
  /** 0-based level the current round belongs to. */
  level: number;
  levels: number;
  /** Rounds of this level done, counting the current one once it is solved. */
  done: number;
  rounds: number;
  /** This win fills the row and the next round is on a new level. */
  levelUp: boolean;
  /** This win fills the top level's row for the first time: every level is done ("Mester!"). */
  mastered?: boolean;
  /** Every level was done before this task: the game is practice now, with no row to fill. */
  finished?: boolean;
  /** Practice already paid today's seeds or bolts (see PRACTICE_PAY_PER_DAY): the pod rests until tomorrow. */
  rested?: boolean;
}

/** `count` levels of `rounds` rounds each: the shape of most games' level ladders. */
export function evenLevels(count: number, rounds: number): number[] {
  return Array.from({ length: count }, () => rounds);
}

/**
 * `sizes` holds the rounds in each level; the last one is the size of the row that keeps
 * refilling on the top level, since there is no next level to reach.
 */
export function levelMeter(solvedBefore: number, sizes: number[], solved: boolean): LevelMeterState {
  const top = sizes.length - 1;
  let into = Math.max(0, solvedBefore);
  let level = 0;
  while (level < top && into >= sizes[level]) into -= sizes[level++];
  const rounds = sizes[level];
  if (level === top) into %= rounds;
  const done = into + (solved ? 1 : 0);
  return { level, levels: sizes.length, done, rounds, levelUp: solved && level < top && done === rounds };
}
