import { ADD_LEVELS_VERSION, migrateAddLevel } from '../worlds/garden/games/add/logic';
import { carryOverBeds } from './garden/beds';

// How a saved child's progress catches up with the app. A save carries the version it was written at; on load every
// step after it runs, in order, on the raw saved object, before the defaults fill the gaps (see readProgress).
// A change to the save's shape adds a step here and never edits an old one: a save from any release still reads.
// Saves from before versions (version 0) get every step from the first.

export type RawSave = Record<string, unknown>;

export interface Migration {
  /** The version a save is at after this step. */
  to: number;
  about: string;
  run: (raw: RawSave) => RawSave;
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function list<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Drops fields a step has moved elsewhere, so they do not linger in the save. */
function without(raw: RawSave, keys: readonly string[]): RawSave {
  const out = { ...raw };
  for (const k of keys) delete out[k];
  return out;
}

/**
 * Version 1: the fixes older releases made by looking for a missing field. Each is guarded the way it was then,
 * so a save that already had it is left alone.
 */
function beforeVersions(raw: RawSave): RawSave {
  let r = { ...raw };
  // Saves from before the gather and take levels: keep the child on the same sums. A save without the field predates the add levels.
  const addVersion = typeof r.addLevelsVersion === 'number' ? r.addLevelsVersion : 1;
  if (addVersion < ADD_LEVELS_VERSION) {
    const played = num(r.addSolved) > 0 || num(r.addLevel) > 0;
    r.addLevel = played ? migrateAddLevel(num(r.addLevel), addVersion) : 0;
  }
  // Saves from before the 15-minute default: switch "no limit" to it once; parents can turn it off again.
  if (!r.limitDefaulted) r.screenLimitMin = num(r.screenLimitMin) || 15;
  // Saves from the ten-bed plots: every bed stays in its plot, and each plot gets five new empty beds.
  if (r.plotBeds === undefined) r.beds = carryOverBeds(list(r.beds));
  // Saves from before the reward pod paid one seed or bolt per task, which was the clock then: the clock starts there.
  if (r.gardenTasks === undefined) r = { ...r, gardenTasks: num(r.seeds), robotTasks: num(r.bolts) };
  return without(r, ['addLevelsVersion', 'limitDefaulted', 'plotBeds']);
}

/** The save's field names for each game's round and solved count before version 2. Frozen: never change these. */
export const V1_GAME_FIELDS: Record<string, readonly [round: string, solved: string | null]> = {
  learn: ['learnRound', 'learnSolved'],
  water: ['waterRound', null],
  patterns: ['patternRound', 'patternsSolved'],
  flash: ['flashRound', 'flashSolved'],
  add: ['addRound', 'addSolved'],
  trace: ['traceRound', 'traceSolved'],
  pots: ['potsRound', 'potsSolved'],
  path: ['pathRound', 'pathSolved'],
  sort: ['sortRound', 'sortSolved'],
  scale: ['scaleRound', 'scaleSolved'],
  seq: ['seqRound', 'seqSolved'],
  mirror: ['mirrorRound', 'mirrorSolved'],
  code: ['codeRound', 'codeSolved'],
  fix: ['fixRound', 'fixSolved'],
  day: ['dayRound', 'daySolved'],
  season: ['seasonRound', 'seasonSolved'],
  set: ['setRound', 'setSolved'],
  read: ['readRound', 'readSolved'],
  digi: ['digiRound', 'digiSolved'],
  sleep: ['sleepRound', 'sleepSolved'],
  sand: ['sandRound', 'sandSolved']
};

/** Each world's fields before version 2: task clock, rewards earned and spent, welcome, opened games. Frozen. */
export const V1_WORLD_FIELDS: Record<string, { tasks: string; earned: string; spent: string; welcomed: string | null; opened: string | null }> = {
  garden: { tasks: 'gardenTasks', earned: 'seeds', spent: 'seedsSpent', welcomed: null, opened: null },
  robot: { tasks: 'robotTasks', earned: 'bolts', spent: 'boltsSpent', welcomed: 'robotWelcomed', opened: 'robotOpened' },
  tower: { tasks: 'towerTasks', earned: 'bells', spent: 'bellsSpent', welcomed: 'towerWelcomed', opened: 'towerOpened' }
};

/** Version 2: each game's round and solved count under `games`, each world's clock and rewards under `worlds`. */
function groupByGameAndWorld(raw: RawSave): RawSave {
  const games = Object.fromEntries(
    Object.entries(V1_GAME_FIELDS).map(([id, [round, solved]]) => [id, { round: num(raw[round]), solved: solved ? num(raw[solved]) : 0 }])
  );
  const worlds = Object.fromEntries(
    Object.entries(V1_WORLD_FIELDS).map(([id, f]) => [
      id,
      {
        tasks: num(raw[f.tasks]),
        earned: num(raw[f.earned]),
        spent: num(raw[f.spent]),
        welcomed: f.welcomed ? raw[f.welcomed] === true : false,
        opened: f.opened ? list<string>(raw[f.opened]) : []
      }
    ])
  );
  const moved = [
    ...Object.values(V1_GAME_FIELDS).flatMap(([round, solved]) => (solved ? [round, solved] : [round])),
    ...Object.values(V1_WORLD_FIELDS).flatMap((f) => [f.tasks, f.earned, f.spent, f.welcomed, f.opened].filter((k): k is string => k !== null))
  ];
  return { ...without(raw, moved), games, worlds };
}

export const MIGRATIONS: readonly Migration[] = [
  { to: 1, about: 'the fixes made before saves had versions', run: beforeVersions },
  { to: 2, about: 'rounds and solved counts per game, task clocks and rewards per world', run: groupByGameAndWorld }
];

/** The version a save is written at now. */
export const SAVE_VERSION = MIGRATIONS[MIGRATIONS.length - 1].to;

/** The version a raw save was written at; 0 for saves from before versions. */
export function versionOf(raw: RawSave): number {
  return typeof raw.version === 'number' ? raw.version : 0;
}

/** Runs every step the save has not had yet. A save from a newer app than this one is left as it is. */
export function migrateSave(raw: RawSave): RawSave {
  const from = versionOf(raw);
  return MIGRATIONS.filter((m) => m.to > from).reduce<RawSave>((r, m) => ({ ...m.run(r), version: m.to }), raw);
}
