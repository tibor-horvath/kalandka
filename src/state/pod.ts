import type { LadderGame } from './games';
import type { Progress } from './progress';
import { today } from './screenTime';
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

/** `n` solved tasks in a world: the clock moves on, and every full pod pays a seed or a bolt (unless `pays` is false). */
export function creditTasks(p: Progress, world: WorldId, n = 1, pays = true): Progress {
  const pay = pays ? rewardFor(p, world, n) : 0;
  return world === 'robot'
    ? { ...p, robotTasks: p.robotTasks + n, bolts: p.bolts + pay }
    : { ...p, gardenTasks: p.gardenTasks + n, seeds: p.seeds + pay };
}

// A finished game turns into practice (see isFinished in ladder.ts): its tasks still fill the pod and move
// the clock, but each game pays at most this many seeds or bolts a day; after that the pod rests till tomorrow.

export const PRACTICE_PAY_PER_DAY = 5;

/** Seeds or bolts practice paid on one day, per game. */
export interface PracticePay {
  /** Local YYYY-MM-DD; another day starts every game from 0. */
  day: string;
  paid: Partial<Record<LadderGame, number>>;
}

/** What this game's practice paid today. */
export function practicePaid(p: Progress, game: LadderGame, day = today()): number {
  return p.practicePay.day === day ? (p.practicePay.paid[game] ?? 0) : 0;
}

/** This game's practice already paid today's seeds or bolts. */
export function practiceRested(p: Progress, game: LadderGame, day = today()): boolean {
  return practicePaid(p, game, day) >= PRACTICE_PAY_PER_DAY;
}

/** One solved practice task: like creditTasks, but a full pod pays only while today's allowance lasts. */
export function creditPractice(p: Progress, game: LadderGame, world: WorldId, day = today()): Progress {
  const paid = practicePaid(p, game, day);
  const pays = paid < PRACTICE_PAY_PER_DAY;
  const pay = pays ? rewardFor(p, world, 1) : 0;
  const credited = creditTasks(p, world, 1, pays);
  if (!pay) return credited;
  const sameDay = p.practicePay.day === day ? p.practicePay.paid : {};
  return { ...credited, practicePay: { day, paid: { ...sameDay, [game]: paid + pay } } };
}
