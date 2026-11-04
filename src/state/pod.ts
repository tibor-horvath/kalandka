import type { Progress } from './progress';
import type { WorldId } from './worlds';

// The reward pod: every solved task fills a quarter of the pod in the game's top bar, and a full pod
// pays one seed (in the garden) or one bolt (in the workshop), then starts again. The task count is
// also the clock the Kiskert's plants and the robot's battery run on, so they still move with every
// task while the seeds and bolts to spend come slower.

export const TASKS_PER_REWARD = 4;

/** Every task ever solved in this world (games and finished paper pages). */
export function tasksIn(p: Progress, world: WorldId): number {
  return world === 'robot' ? p.robotTasks : p.gardenTasks;
}

/** Quarters of the pod filled now: 0 … TASKS_PER_REWARD − 1. */
export function podFill(p: Progress, world: WorldId): number {
  return tasksIn(p, world) % TASKS_PER_REWARD;
}

/** Seeds or bolts that `n` more solved tasks pay, from the pod as it is now. */
export function rewardFor(p: Progress, world: WorldId, n: number): number {
  return Math.floor((podFill(p, world) + Math.max(0, n)) / TASKS_PER_REWARD);
}

/** `n` solved tasks in a world: the clock moves on, and every full pod pays a seed or a bolt. */
export function creditTasks(p: Progress, world: WorldId, n = 1): Progress {
  const pay = rewardFor(p, world, n);
  return world === 'robot'
    ? { ...p, robotTasks: p.robotTasks + n, bolts: p.bolts + pay }
    : { ...p, gardenTasks: p.gardenTasks + n, seeds: p.seeds + pay };
}
