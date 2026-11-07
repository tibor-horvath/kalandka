import { UNLOCK_ADD_AFTER } from '../worlds/garden/games/add/logic';
import { UNLOCK_FLASH_AFTER } from '../worlds/garden/games/learn/logic';
import { UNLOCK_POTS_AFTER } from '../worlds/garden/games/pots/logic';
import type { GameId } from './games';
import type { Progress } from './progress';

// Garden games that open once the child has met enough numbers in Számmagok. Parents can open them all
// at once (unlockAll). Csepi announces each newly opened game once, in this order.

export interface Unlock {
  game: GameId;
  /** Numbers met in Számmagok that open the game. */
  after: number;
  /** Set once Csepi has announced that the game opened. */
  announcedKey: 'flashAnnounced' | 'addAnnounced' | 'potsAnnounced';
}

export const UNLOCKS: Unlock[] = [
  { game: 'flash', after: UNLOCK_FLASH_AFTER, announcedKey: 'flashAnnounced' },
  { game: 'add', after: UNLOCK_ADD_AFTER, announcedKey: 'addAnnounced' },
  { game: 'pots', after: UNLOCK_POTS_AFTER, announcedKey: 'potsAnnounced' }
];

export function unlockOf(game: GameId): Unlock | null {
  return UNLOCKS.find((u) => u.game === game) ?? null;
}

/** Every game without an unlock rule is always open. */
export function isOpen(p: Progress, game: GameId): boolean {
  const u = unlockOf(game);
  return !u || p.unlockAll || p.learnSolved >= u.after;
}

/** Numbers still to meet before `u` opens. */
export function numbersLeft(p: Progress, u: Unlock): number {
  return Math.max(0, u.after - p.learnSolved);
}

/** The earliest game that opened and has not been announced yet. */
export function nextToAnnounce(p: Progress): Unlock | null {
  return UNLOCKS.find((u) => isOpen(p, u.game) && !p[u.announcedKey]) ?? null;
}

export function markAnnounced(p: Progress, u: Unlock): Progress {
  return { ...p, [u.announcedKey]: true };
}

/** Nothing left to announce: for a child who starts with every game open. */
export function announceAll(p: Progress): Progress {
  return UNLOCKS.reduce(markAnnounced, p);
}
