import { seedBalance } from './garden';
import type { Progress } from './progress';
import { boltBalance } from './robotParts';
import { bellBalance } from './town';
import type { WorldId } from './worlds';

// Each world's reward to spend, in one place: the garden's seeds, the workshop's bolts, the Óratorony's bells.

/** One of the world's rewards, as a word: "mag", "csavar", "harang". */
export const REWARD_UNIT: Record<WorldId, string> = { garden: 'mag', robot: 'csavar', tower: 'harang' };

/** What the child has to spend in the world now. */
export function balanceIn(p: Progress, world: WorldId): number {
  if (world === 'robot') return boltBalance(p);
  if (world === 'tower') return bellBalance(p);
  return seedBalance(p);
}
