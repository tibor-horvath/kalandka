import { createContext, useContext } from 'react';
import { ADD_LEVELS_VERSION, migrateAddLevel } from '../worlds/garden/games/add/logic';
import type { GameId } from './games';
import { carryOverBeds, carryOverStickers, markEarnedSeen, type Bed, type FlowerId, type GiftFruit, type TreatId, type VegSpot, type VisitorId } from './rewards';
import type { PartSlot } from './robotParts';
import type { Ladder, LadderGame } from './ladder';
import type { PracticePay } from './pod';
import type { TaskLog } from './taskLog';
import type { WorldId } from './worlds';

export interface Progress {
  /** Every seed ever earned (one per full reward pod, see pod.ts); the balance to plant is seeds − seedsSpent. */
  seeds: number;
  /** Every task solved in the garden world: the clock the Kiskert's plants grow, ripen and get thirsty on. */
  gardenTasks: number;
  /** Seeds planted in the Kiskert. */
  seedsSpent: number;
  /** The Kiskert's beds (see BEDS in rewards.ts); null is an empty bed. */
  beds: (Bed | null)[];
  /** Flower kinds bought in the Magtár, for good; Mályva is every child's and is not listed (see FLOWERS in rewards.ts). */
  flowersOwned: FlowerId[];
  /** The Kiskert's border flowers, ten in front of each open plot (see the border section in rewards.ts); null is an empty spot. */
  border: (FlowerId | null)[];
  /** The Veteményes, five spots per open plot (see rewards.ts); null is an empty spot. */
  veg: (VegSpot | null)[];
  /** Beds per plot the save was made with; missing: the old ten (see carryOverBeds). */
  plotBeds: number;
  /** Apples, cherries and walnuts in the basket, given straight to the visitors who love them. */
  basket: Partial<Record<GiftFruit, number>>;
  /** When each flower last gave Méhecske pollen, by "b<bed>" or "s<border spot>": the garden task count then. */
  pollen: Record<string, number>;
  /** The day (local YYYY-MM-DD) each visitor last had a snack (after its five gifts). */
  snacked: Partial<Record<VisitorId, string>>;
  /** Snacks each visitor has had: its snack pile grows by one per snack (see snackPile in rewards.ts). */
  snacks: Partial<Record<VisitorId, number>>;
  /** Fruit picked in the Kiskert, kept for good (see the care section in rewards.ts). */
  pears: number;
  berries: number;
  /** Fruit made into treats; the basket holds pears − pearsUsed and berries − berriesUsed. */
  pearsUsed: number;
  berriesUsed: number;
  /** Treats on the pantry shelf, by kind (see RECIPES). */
  pantry: Partial<Record<TreatId, number>>;
  /** Kiskert visitors already welcomed (see VISITORS). */
  visitorsSeen: number;
  /** Gifts each visitor has had from the pantry shelf, 0 … 3 (see the gifts section in rewards.ts). */
  gifts: Partial<Record<VisitorId, number>>;
  /** Stickers already celebrated; the rest of the earned ones get the sticker animation. */
  stickersSeen: string[];
  /** Stickers celebrated on stickersDay (local YYYY-MM-DD), in order; the rest screen shows the day's haul. */
  stickersDay: string;
  stickersToday: string[];
  /** Printed pages a grown-up marked done, each once (see pageKey in print/link.ts); they earn the Feladatlapok stickers and each game's level stickers (see sheetLevels in rewards.ts). */
  pagesDone: string[];
  /** Plant ids grown in the watering game, oldest first. */
  garden: string[];
  waterRound: number;
  patternRound: number;
  patternsSolved: number;
  learnRound: number;
  /** Numbers met in Számmagok; 5 opens Villámszem. */
  learnSolved: number;
  /** Számmagok's Vegyesen rounds solved: mixed numbers whose numeral the child found. */
  learnMixSolved: number;
  flashRound: number;
  addRound: number;
  addSolved: number;
  /** Méhkas's level and counters from before the ladders; read once into ladders.add (see ladder.ts). */
  addLevel: number;
  addStreak: number;
  addMisses: number;
  /** Which Méhkas ladder addLevel indexes into; older saves are migrated on load. */
  addLevelsVersion: number;
  addAnnounced: boolean;
  flashSolved: number;
  /** Mézút round: which digit to trace next (see TRACE_ORDER). */
  traceRound: number;
  traceSolved: number;
  /** Mézút digits written on a faded trail (Halvány út, from the second lap on). */
  traceFadedSolved: number;
  potsRound: number;
  /** Cserépbarátok rounds solved; every five move up a level (see POTS_LEVELS); parents can set it. */
  potsSolved: number;
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
  /** The 15-minute default limit has been applied (saves from before it had no limit). */
  limitDefaulted: boolean;
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
  /** Csavar has introduced himself. */
  robotWelcomed: boolean;
  /** Workshop machines opened at least once; the rest wear the "Új gép!" badge. */
  robotOpened: GameId[];
  /** Robotműhely's reward: one bolt per full reward pod, like the garden's seeds. */
  bolts: number;
  /** Every task solved in the workshop: the clock the robot's battery and oil run on. */
  robotTasks: number;
  /** Robotút course: which one comes next, and how many were done (five per level). */
  pathRound: number;
  pathSolved: number;
  /** Válogatógép round: which one comes next, and how many were done (five per level, see SORT_LEVELS). */
  sortRound: number;
  sortSolved: number;
  /** Mérleg round: which one comes next, and how many were done (five per level, see SCALE_LEVELS). */
  scaleRound: number;
  scaleSolved: number;
  /** Mintagép round: which one comes next, and how many were done (five per level, see SEQ_LEVELS). */
  seqRound: number;
  seqSolved: number;
  /** Tükörgép round: which one comes next, and how many were done (five per level, see MIRROR_LEVELS). */
  mirrorRound: number;
  mirrorSolved: number;
  /** Kódzár round: which one comes next, and how many were done. */
  codeRound: number;
  codeSolved: number;
  /** Hibavadász round: which one comes next, and how many were done. */
  fixRound: number;
  fixSolved: number;
  /** Bolts spent in Robotépítő; the balance is bolts − boltsSpent. */
  boltsSpent: number;
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
  /** Recent solved tasks per game and whether they needed help, for the parents' notes (see taskLog.ts). */
  taskLog: TaskLog;
  /** Each levelled game's difficulty ladder; a game missing here starts from its older save fields (see ladder.ts). */
  ladders: Partial<Record<LadderGame, Ladder>>;
  /** Seeds and bolts the finished games' practice paid today (see PRACTICE_PAY_PER_DAY in pod.ts). */
  practicePay: PracticePay;
}

export const DEFAULT_PROGRESS: Progress = {
  seeds: 0,
  gardenTasks: 0,
  seedsSpent: 0,
  beds: [],
  flowersOwned: [],
  border: [],
  veg: [],
  plotBeds: 15,
  basket: {},
  pollen: {},
  snacked: {},
  snacks: {},
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
  garden: [],
  waterRound: 0,
  patternRound: 0,
  patternsSolved: 0,
  learnRound: 0,
  learnSolved: 0,
  learnMixSolved: 0,
  flashRound: 0,
  addRound: 0,
  addSolved: 0,
  addLevel: 0,
  addStreak: 0,
  addMisses: 0,
  addLevelsVersion: ADD_LEVELS_VERSION,
  addAnnounced: false,
  flashSolved: 0,
  traceRound: 0,
  traceSolved: 0,
  traceFadedSolved: 0,
  potsRound: 0,
  potsSolved: 0,
  potsAnnounced: false,
  flashAnnounced: false,
  voice: true,
  sounds: true,
  unlockAll: false,
  screenLimitMin: 15,
  limitDefaulted: true,
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
  robotWelcomed: false,
  robotOpened: [],
  bolts: 0,
  robotTasks: 0,
  pathRound: 0,
  pathSolved: 0,
  sortRound: 0,
  sortSolved: 0,
  scaleRound: 0,
  scaleSolved: 0,
  seqRound: 0,
  seqSolved: 0,
  mirrorRound: 0,
  mirrorSolved: 0,
  codeRound: 0,
  codeSolved: 0,
  fixRound: 0,
  fixSolved: 0,
  boltsSpent: 0,
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
  taskLog: {},
  ladders: {},
  practicePay: { day: '', paid: {} }
};

/** Saves from before the gather and take levels: keep the child on the same sums. */
export function migrate(p: Progress): Progress {
  if (p.addLevelsVersion >= ADD_LEVELS_VERSION) return p;
  const played = p.addSolved > 0 || p.addLevel > 0;
  return { ...p, addLevel: played ? migrateAddLevel(p.addLevel, p.addLevelsVersion) : 0, addLevelsVersion: ADD_LEVELS_VERSION };
}

/** One child's saved progress, filled up with defaults. Saves without a version predate the add levels. */
export function readProgress(saved: unknown): Progress {
  const raw = saved && typeof saved === 'object' ? (saved as Partial<Progress>) : {};
  let p = migrate({ ...DEFAULT_PROGRESS, addLevelsVersion: 1, ...raw });
  // Saves from before the 15-minute default: switch "no limit" to it once; parents can turn it off again.
  if (!raw.limitDefaulted) p = { ...p, screenLimitMin: p.screenLimitMin || DEFAULT_PROGRESS.screenLimitMin, limitDefaulted: true };
  // Saves from the ten-bed plots: every bed stays in its plot, and each plot gets five new empty beds.
  if (raw.plotBeds === undefined) p = { ...p, beds: carryOverBeds(p.beds), plotBeds: DEFAULT_PROGRESS.plotBeds };
  // Saves from before the reward pod paid one seed or bolt per task, which was the clock then: the clock starts there.
  if (raw.gardenTasks === undefined) p = { ...p, gardenTasks: p.seeds, robotTasks: p.bolts };
  // Saves from before the stickers: what was already earned goes into the album without a celebration each.
  // Saves from before the level stickers: the stickers of the old list carry over to the level stickers.
  return raw.stickersSeen ? carryOverStickers(p) : markEarnedSeen(p);
}

export type Update = (fn: (p: Progress) => Progress) => void;

/** The progress of one child; provided by KidScope (see profiles.tsx). */
export const ProgressContext = createContext<{ progress: Progress; update: Update } | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside KidScope');
  return ctx;
}
