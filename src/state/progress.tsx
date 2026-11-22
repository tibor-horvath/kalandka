import { createContext, useContext } from 'react';
import { GAME_IDS, WORLD_IDS, type GameId, type WorldId } from '../worlds';
import type { Bed, FlowerId, GiftFruit, TreatId, VegSpot, VisitorId } from './garden';
import { SAVE_VERSION, migrateSave } from './migrations';
import { carryOverStickers, markEarnedSeen } from './stickers';
import type { PartSlot } from './robotParts';
import type { Ladder, LadderGame } from './ladder';
import type { PracticePay } from './pod';
import type { TaskLog } from './taskLog';

/** One game's part of the save. */
export interface GameSave {
  /** Goes up when the child moves on to the next task; App keys the game's screen by it. */
  round: number;
  /** Tasks solved (Locsolás counts its plants instead, see solvedOf in games.ts). */
  solved: number;
}

/** One world's part of the save. */
export interface WorldSave {
  /** Every task ever solved in the world (games and finished paper pages): the clock its reward place runs on. */
  tasks: number;
  /** Every reward ever earned (seeds, bolts, bells: one per full reward pod, see pod.ts); the balance is earned − spent. */
  earned: number;
  spent: number;
  /** The world's guide has introduced themself. */
  welcomed: boolean;
  /** Games opened at least once; the rest wear the "Új!" badge. */
  opened: GameId[];
}

export interface Progress {
  /** The save's shape (see migrations.ts). */
  version: number;
  games: Record<GameId, GameSave>;
  worlds: Record<WorldId, WorldSave>;
  /** The Kiskert's beds (see BEDS in garden/beds.ts); null is an empty bed. */
  beds: (Bed | null)[];
  /** Flower kinds bought in the Magtár, for good; Mályva is every child's and is not listed (see FLOWERS in garden/beds.ts). */
  flowersOwned: FlowerId[];
  /** The Kiskert's border flowers, ten in front of each open plot (see the border section in garden/beds.ts); null is an empty spot. */
  border: (FlowerId | null)[];
  /** The Veteményes, five spots per open plot (see garden/veg.ts); null is an empty spot. */
  veg: (VegSpot | null)[];
  /** Apples, cherries and walnuts in the basket, given straight to the visitors who love them. */
  basket: Partial<Record<GiftFruit, number>>;
  /** When each flower last gave Méhecske pollen, by "b<bed>" or "s<border spot>": the garden task count then. */
  pollen: Record<string, number>;
  /** The day (local YYYY-MM-DD) each visitor last had a snack (after its five gifts). */
  snacked: Partial<Record<VisitorId, string>>;
  /** Fruit picked in the Kiskert, kept for good (see garden/harvest.ts). */
  pears: number;
  berries: number;
  /** Fruit made into treats; the basket holds pears − pearsUsed and berries − berriesUsed. */
  pearsUsed: number;
  berriesUsed: number;
  /** Treats on the pantry shelf, by kind (see RECIPES). */
  pantry: Partial<Record<TreatId, number>>;
  /** Kiskert visitors already welcomed (see VISITORS). */
  visitorsSeen: number;
  /** Gifts each visitor has had from the pantry shelf, 0 … 3 (see the gifts section in garden/visitors.ts). */
  gifts: Partial<Record<VisitorId, number>>;
  /** Stickers already celebrated; the rest of the earned ones get the sticker animation. */
  stickersSeen: string[];
  /** Stickers celebrated on stickersDay (local YYYY-MM-DD), in order; the rest screen shows the day's haul. */
  stickersDay: string;
  stickersToday: string[];
  /** Printed pages a grown-up marked done, each once (see pageKey in print/link.ts); they earn the Feladatlapok stickers and each game's level stickers (see sheetLevels in stickers.ts). */
  pagesDone: string[];
  /**
   * Pages marked done before their level had enough right answers: finished, but not their level
   * (see markPageDone in stickers.ts). Pages marked before answers were checked are never in it.
   */
  pagesPractised: string[];
  /** Right answers so far on each game level's sheets (`id.rev.level`), added up page by page like the game's tally of tasks a level. */
  sheetRight: Record<string, number>;
  /** Plant ids grown in the watering game, oldest first. */
  garden: string[];
  /** Számmagok's Vegyesen rounds solved: mixed numbers whose numeral the child found. */
  learnMixSolved: number;
  /** Méhkas's level and counters from before the ladders; read once into ladders.add (see ladder.ts). */
  addLevel: number;
  addStreak: number;
  addMisses: number;
  addAnnounced: boolean;
  /** Mézút digits written on a faded trail (Halvány út, from the second lap on). */
  traceFadedSolved: number;
  potsAnnounced: boolean;
  /** Csepi has announced that Villámszem opened. */
  flashAnnounced: boolean;
  voice: boolean;
  /** Pops, chimes and the light vibration while tracing. */
  sounds: boolean;
  /** Parents opened every game, skipping the unlock steps (for older children). */
  unlockAll: boolean;
  /** Daily play limit in minutes; 0 = no limit. */
  screenLimitMin: number;
  /** Day the counters below belong to (local YYYY-MM-DD). */
  playDate: string;
  playSeconds: number;
  /** Extra time a parent granted today. */
  bonusSeconds: number;
  /** Seconds played per day (YYYY-MM-DD), last 14 days. */
  playHistory: Record<string, number>;
  /** "Pihenő most" was pressed on this day: no more play until tomorrow. */
  restDay: string;
  eveningRest: boolean;
  /** Hour the evening rest starts (until 7:00). */
  eveningFrom: number;
  /** Csepi warns two minutes before the limit. */
  warnBefore: boolean;
  /** A task in progress may be finished after the limit (up to 2 minutes). */
  graceToFinish: boolean;
  voiceRate: 'slow' | 'normal';
  /** Voice names chosen in the advanced settings; '' picks one automatically. */
  csepiVoice: string;
  robotVoice: string;
  welcomed: boolean;
  /** The world the child last chose on the Kalandka map (see state/worlds.ts); null until they first choose one. */
  world: WorldId | null;
  /** Robot parts bought (see state/robotParts.ts); the starting parts are always owned. */
  robotOwned: string[];
  /** The part worn in each slot. */
  robotLook: Partial<Record<PartSlot, string>>;
  /** The second robot's parts and look (see SECOND_ROBOT_AFTER); each robot buys its own parts. */
  robot2Owned: string[];
  robot2Look: Partial<Record<PartSlot, string>>;
  /** The robot on the workbench: 0 or 1. */
  robotActive: number;
  /** Csavar has announced the second robot. */
  robot2Announced: boolean;
  /** Robot friends welcomed so far. */
  robotFriendsSeen: number;
  /** Workshop task count the robot's battery is measured from (see the care section in robotParts.ts). */
  robotChargedAt: number;
  /** Workshop task count when the robot was last oiled. */
  robotOiledAt: number;
  /** Full charges so far; they teach the robot its tricks. */
  robotCharges: number;
  /** The part the child is saving up for ("Ezt szeretném"), shown beside the reward pod in the workshop games; null when none. */
  robotWish: { robot: number; part: string } | null;
  /** Gifts each robot friend has had (see FRIEND_GIFTS in robotParts.ts). */
  friendGifts: Partial<Record<string, number>>;
  /** Kisváros buildings put up, in the order they were bought (see state/town.ts). */
  town: string[];
  /** Upgrades each Kisváros building has had (0 … 2; built is stage 1). */
  townStages: Partial<Record<string, number>>;
  /** Gifts each building's resident has had (0 … 5). */
  townGifts: Partial<Record<string, number>>;
  /** Buildings whose resident has been welcomed with their card. */
  townWelcomed: string[];
  /** Szint-bemutatók seen (by idea, see worlds/tower/games/intros.ts): they no longer open by themselves. */
  introsSeen: string[];
  /** Recent solved tasks per game and whether they needed help, for the parents' notes (see taskLog.ts). */
  taskLog: TaskLog;
  /** Each levelled game's difficulty ladder; a game missing here starts from its older save fields (see ladder.ts). */
  ladders: Partial<Record<LadderGame, Ladder>>;
  /** Seeds and bolts the finished games' practice paid today (see PRACTICE_PAY_PER_DAY in pod.ts). */
  practicePay: PracticePay;
}

export const DEFAULT_PROGRESS: Progress = {
  version: SAVE_VERSION,
  games: Object.fromEntries(GAME_IDS.map((id) => [id, { round: 0, solved: 0 }])) as Record<GameId, GameSave>,
  worlds: Object.fromEntries(WORLD_IDS.map((id): [WorldId, WorldSave] => [id, { tasks: 0, earned: 0, spent: 0, welcomed: false, opened: [] }])) as Record<WorldId, WorldSave>,
  beds: [],
  flowersOwned: [],
  border: [],
  veg: [],
  basket: {},
  pollen: {},
  snacked: {},
  pears: 0,
  berries: 0,
  pearsUsed: 0,
  berriesUsed: 0,
  pantry: {},
  visitorsSeen: 0,
  gifts: {},
  stickersSeen: [],
  stickersDay: '',
  stickersToday: [],
  pagesDone: [],
  pagesPractised: [],
  sheetRight: {},
  garden: [],
  learnMixSolved: 0,
  addLevel: 0,
  addStreak: 0,
  addMisses: 0,
  addAnnounced: false,
  traceFadedSolved: 0,
  potsAnnounced: false,
  flashAnnounced: false,
  voice: true,
  sounds: true,
  unlockAll: false,
  screenLimitMin: 15,
  playDate: '',
  playSeconds: 0,
  bonusSeconds: 0,
  playHistory: {},
  restDay: '',
  eveningRest: false,
  eveningFrom: 19,
  warnBefore: true,
  graceToFinish: true,
  voiceRate: 'slow',
  csepiVoice: '',
  robotVoice: '',
  welcomed: false,
  world: null,
  robotOwned: [],
  robotLook: {},
  robot2Owned: [],
  robot2Look: {},
  robotActive: 0,
  robot2Announced: false,
  robotFriendsSeen: 0,
  robotChargedAt: 0,
  robotOiledAt: 0,
  robotCharges: 0,
  robotWish: null,
  friendGifts: {},
  town: [],
  townStages: {},
  townGifts: {},
  townWelcomed: [],
  introsSeen: [],
  taskLog: {},
  ladders: {},
  practicePay: { day: '', paid: {} }
};

/** A saved record of parts (games, worlds), each filled up with its defaults: a game added since the save starts fresh. */
function fillParts<K extends string, T extends object>(defaults: Record<K, T>, saved: unknown): Record<K, T> {
  const raw: Partial<Record<K, Partial<T>>> = saved && typeof saved === 'object' ? saved : {};
  return Object.fromEntries((Object.keys(defaults) as K[]).map((k) => [k, { ...defaults[k], ...raw[k] }])) as Record<K, T>;
}

/** One child's saved progress: brought up to the current version (see migrations.ts), then filled up with defaults. */
export function readProgress(saved: unknown): Progress {
  const given = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  const raw = migrateSave(given);
  const p: Progress = {
    ...DEFAULT_PROGRESS,
    ...(raw as Partial<Progress>),
    games: fillParts(DEFAULT_PROGRESS.games, raw.games),
    worlds: fillParts(DEFAULT_PROGRESS.worlds, raw.worlds)
  };
  // Not a change of shape but of the album, so it runs on every load (it does nothing the second time):
  // saves from before the stickers get what was already earned without a celebration each, and the stickers
  // of older lists carry over to the level stickers.
  return given.stickersSeen ? carryOverStickers(p) : markEarnedSeen(p);
}

export type Update = (fn: (p: Progress) => Progress) => void;

/** The progress of one child; provided by KidScope (see profiles.tsx). */
export const ProgressContext = createContext<{ progress: Progress; update: Update } | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside KidScope');
  return ctx;
}
