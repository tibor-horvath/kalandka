import { garden } from './garden/manifest';
import { robot } from './robot/manifest';
import { tower } from './tower/manifest';

// Every Kalandka world, in map order. A new world is a folder with a manifest.ts and a ui.tsx, and one line here
// and in ui.ts; shared code reads the worlds and their games from these lists instead of naming them.

export const WORLD_MANIFESTS = [garden, robot, tower] as const;

type Manifests = typeof WORLD_MANIFESTS;
export type WorldId = Manifests[number]['id'];
export type GameId = Manifests[number]['games'][number]['id'];
export type WorldManifestOf = Manifests[number];

export const WORLD_IDS: WorldId[] = WORLD_MANIFESTS.map((w) => w.id);

/** Every game, in hub order: the garden's, then the workshop's, then the Óratorony's. */
export const GAME_IDS: GameId[] = WORLD_MANIFESTS.flatMap((w) => w.games.map((g) => g.id));
