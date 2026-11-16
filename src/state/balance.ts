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

/** Spends `n` of the world's reward. Callers check the balance first. */
export function spend(p: Progress, world: WorldId, n: number): Progress {
  const w = p.worlds[world];
  return { ...p, worlds: { ...p.worlds, [world]: { ...w, spent: w.spent + n } } };
}

/** The save's worlds after spending `n` of one world's reward, for a change that spends and does more: `{ ...p, beds, worlds: spentIn(p, 'garden', cost) }`. */
export function spentIn(p: Progress, world: WorldId, n: number): Progress['worlds'] {
  return spend(p, world, n).worlds;
}
