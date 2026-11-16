import { V1_GAME_FIELDS, V1_WORLD_FIELDS } from './migrations';
import { DEFAULT_PROGRESS, type GameSave, type Progress, type WorldSave } from './progress';
import type { GameId } from './games';
import type { WorldId } from './worlds';

// For tests: a save written with the short flat names (seeds, gardenTasks, pathSolved …) that the grouped save has
// put under `games` and `worlds`, so a test still reads as "a child with 5 seeds who solved 3 courses".

type FlatName = 'seeds' | 'bolts' | 'bells' | 'seedsSpent' | 'boltsSpent' | 'bellsSpent' | 'gardenTasks' | 'robotTasks' | 'towerTasks' | 'robotWelcomed' | 'towerWelcomed' | `${string}Round` | `${string}Solved`;
export type SavePatch = Partial<Progress> & { [K in FlatName]?: number | boolean | string[] };

const GAME_BY_FIELD = new Map<string, [GameId, keyof GameSave]>(
  Object.entries(V1_GAME_FIELDS).flatMap(([id, [round, solved]]) => [
    [round, [id as GameId, 'round'] as [GameId, keyof GameSave]],
    ...(solved ? [[solved, [id as GameId, 'solved'] as [GameId, keyof GameSave]] as const] : [])
  ])
);
const WORLD_BY_FIELD = new Map<string, [WorldId, keyof WorldSave]>(
  Object.entries(V1_WORLD_FIELDS).flatMap(([id, f]) =>
    (Object.entries(f) as [keyof WorldSave, string | null][]).flatMap(([part, field]) => (field ? [[field, [id as WorldId, part]] as [string, [WorldId, keyof WorldSave]]] : []))
  )
);

export function save(patch: SavePatch = {}, base: Progress = DEFAULT_PROGRESS): Progress {
  let p: Progress = { ...base, games: { ...base.games }, worlds: { ...base.worlds } };
  for (const [k, v] of Object.entries(patch)) {
    const game = GAME_BY_FIELD.get(k);
    const world = WORLD_BY_FIELD.get(k);
    if (game) p.games[game[0]] = { ...p.games[game[0]], [game[1]]: v };
    else if (world) p.worlds[world[0]] = { ...p.worlds[world[0]], [world[1]]: v };
    else p = { ...p, [k]: v };
  }
  return p;
}
