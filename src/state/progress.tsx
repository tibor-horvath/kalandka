import { createContext, useContext } from 'react';
import { ADD_LEVELS_VERSION, migrateAddLevel } from '../games/add/logic';

export interface Progress {
  seeds: number;
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
  welcomed: boolean;
}

export const DEFAULT_PROGRESS: Progress = {
  seeds: 0,
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
  potsRound: 0,
  potsSolved: 0,
  potsAnnounced: false,
  flashAnnounced: false,
  voice: true,
  sounds: true,
  unlockAll: false,
  screenLimitMin: 0,
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
  welcomed: false
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
  return migrate({ ...DEFAULT_PROGRESS, addLevelsVersion: 1, ...raw });
}

export type Update = (fn: (p: Progress) => Progress) => void;

/** The progress of one child; provided by KidScope (see profiles.tsx). */
export const ProgressContext = createContext<{ progress: Progress; update: Update } | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside KidScope');
  return ctx;
}
