import { createContext, useContext } from 'react';
import { ADD_LEVELS_VERSION, migrateAddLevel } from '../games/add/logic';
import { markEarnedSeen, type Bed, type TreatId } from './rewards';
import type { PartSlot } from './robotParts';
import type { WorldId } from './worlds';

export interface Progress {
  /** Every seed ever earned (one per solved task); the balance to plant is seeds − seedsSpent. */
  seeds: number;
  /** Seeds planted in the Kiskert. */
  seedsSpent: number;
  /** The Kiskert's beds (see BEDS in rewards.ts); null is an empty bed. */
  beds: (Bed | null)[];
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
  /** Stickers already celebrated; the rest of the earned ones get the sticker animation. */
  stickersSeen: string[];
  /** Plant ids grown in the watering game, oldest first. */
  garden: string[];
  waterRound: number;
  patternRound: number;
  patternsSolved: number;
  learnRound: number;
  /** Numbers met in Számvetés; 5 opens Magvillantás. */
  learnSolved: number;
  flashRound: number;
  addRound: number;
  addSolved: number;
  /** Méhecske level index (see ADD_LEVELS); parents can set it. */
  addLevel: number;
  addStreak: number;
  /** Méhecske tasks in a row that needed help; three offer an easier level. */
  addMisses: number;
  /** Which Méhecske ladder addLevel indexes into; older saves are migrated on load. */
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
  /** Csepi has announced that Magvillantás opened. */
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
  /** The world the child last chose on the Kalandka map (see state/worlds.ts). */
  world: WorldId;
  /** Csavar has introduced himself. */
  robotWelcomed: boolean;
  /** Robotműhely's reward: one bolt per solved task, like the garden's seeds. */
  bolts: number;
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
  /** Bolt count the robot's battery is measured from (see the care section in robotParts.ts). */
  robotChargedAt: number;
  /** Bolt count when the robot was last oiled. */
  robotOiledAt: number;
  /** Full charges so far; they teach the robot its tricks. */
  robotCharges: number;
}

export const DEFAULT_PROGRESS: Progress = {
  seeds: 0,
  seedsSpent: 0,
  beds: [],
  pears: 0,
  berries: 0,
  pearsUsed: 0,
  berriesUsed: 0,
  pantry: {},
  visitorsSeen: 0,
  stickersSeen: [],
  garden: [],
  waterRound: 0,
  patternRound: 0,
  patternsSolved: 0,
  learnRound: 0,
  learnSolved: 0,
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
  world: 'garden',
  robotWelcomed: false,
  bolts: 0,
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
  robotCharges: 0
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
  // Saves from before the stickers: what was already earned goes into the album without a celebration each.
  return raw.stickersSeen ? p : markEarnedSeen(p);
}

export type Update = (fn: (p: Progress) => Progress) => void;

/** The progress of one child; provided by KidScope (see profiles.tsx). */
export const ProgressContext = createContext<{ progress: Progress; update: Update } | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside KidScope');
  return ctx;
}
