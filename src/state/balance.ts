import type { Progress } from './progress';
import { worldInfo, type WorldId } from './worlds';

// Each world's reward to spend, in one place: the garden's seeds, the workshop's bolts, the Óratorony's bells.

/** One of the world's rewards, as a word: "mag", "csavar", "harang". */
export function rewardUnit(world: WorldId): string {
  return worldInfo(world).reward.unit;
}

/** What the child has to spend in the world now. */
export function balanceIn(p: Progress, world: WorldId): number {
  const { earned, spent } = p.worlds[world];
  return Math.max(0, earned - spent);
}

// Every world keeps its reward in a store the child can see (Magtár, Raktár, Harangtár): packs of ten and the
// ones beside them. A store holds at most STORE_MAX; a full store pays nothing more until the child spends,
// and nothing already in it is ever taken away (a save carried over above the limit keeps all of it).

/** The most seeds, bolts or bells a world's store holds: twenty packs of ten. */
export const STORE_MAX = 200;

/** Rewards the world's store can still take before it is full. */
export function roomIn(p: Progress, world: WorldId): number {
  return Math.max(0, STORE_MAX - balanceIn(p, world));
}

/** The world's store is full: the reward pod rests until the child spends. */
export function storeFull(p: Progress, world: WorldId): boolean {
  return roomIn(p, world) === 0;
}

/** Spends `n` of the world's reward. Callers check the balance first. */
export function spend(p: Progress, world: WorldId, n: number): Progress {
  const w = p.worlds[world];
  return { ...p, worlds: { ...p.worlds, [world]: { ...w, spent: w.spent + n } } };
}

/** The save's worlds after spending `n` of one world's reward, for a change that spends and does more: `{ ...p, beds, worlds: spentIn(p, 'garden', cost) }`. */
export function spentIn(p: Progress, world: WorldId, n: number): Progress['worlds'] {
  return spend(p, world, n).worlds;
}
