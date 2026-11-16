import { WORLD_IDS, WORLD_MANIFESTS, type GameId, type WorldId, type WorldManifestOf } from '../worlds';
import type { Progress, WorldSave } from './progress';

// Kalandka's worlds, as their manifests describe them (see worlds/index.ts). Every child may pick any world on the
// Kalandka map; the app opens in the one they chose last.

export type { WorldId };
export type WorldInfo = WorldManifestOf;

export const WORLDS: readonly WorldInfo[] = WORLD_MANIFESTS;
export { WORLD_IDS };

export function worldInfo(id: WorldId): WorldInfo {
  return WORLDS.find((w) => w.id === id)!;
}

export function isWorldId(s: unknown): s is WorldId {
  return WORLD_IDS.includes(s as WorldId);
}

export function currentWorld(p: Progress): WorldId {
  return isWorldId(p.world) ? p.world : WORLD_IDS[0];
}

/** One world's part of the save: its task clock, rewards and guide's welcome. */
export function worldSave(p: Progress, world: WorldId): WorldSave {
  return p.worlds[world];
}

export function withWorld(p: Progress, world: WorldId, change: Partial<WorldSave>): Progress {
  return { ...p, worlds: { ...p.worlds, [world]: { ...p.worlds[world], ...change } } };
}

/** The child's guide in this world has introduced themself. */
export function welcome(p: Progress, world: WorldId): Progress {
  return p.worlds[world].welcomed ? p : withWorld(p, world, { welcomed: true });
}

/** A game opened at least once, so its "Új!" badge goes. */
export function markOpened(p: Progress, world: WorldId, game: GameId): Progress {
  const { opened } = p.worlds[world];
  return opened.includes(game) ? p : withWorld(p, world, { opened: [...opened, game] });
}
