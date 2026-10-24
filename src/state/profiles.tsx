import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PLANTS } from '../games/water/logic';
import { DEFAULT_PROGRESS, ProgressContext, readProgress, type Progress, type Update } from './progress';

// Several children can play on one device. Each child has a profile (name, figure, age) and their own
// progress: garden, seeds, levels and screen time. Csepi's voice, the sounds and the evening rest
// belong to the device and are shared by everyone.

export type AvatarId = 'frog' | 'ladybug' | 'bee' | 'snail' | 'flower' | 'fish';
export const AVATAR_IDS: AvatarId[] = ['frog', 'ladybug', 'bee', 'snail', 'flower', 'fish'];

/** Sets the starting levels of a new profile; parents can change them later on the levels page. */
export type AgeBand = '5' | '6' | '7+';
export const AGE_BANDS: AgeBand[] = ['5', '6', '7+'];

/** Saves from before the 5–7 audience may still hold '3-4'; those children start with the youngest band. */
function readAge(age: unknown): AgeBand | null {
  if (age === '3-4') return '5';
  return AGE_BANDS.includes(age as AgeBand) ? (age as AgeBand) : null;
}

export interface Kid {
  id: string;
  /** Empty for the profile made from a save that predates profiles, until a parent names it. */
  name: string;
  avatar: AvatarId;
  age: AgeBand | null;
}

/** Settings that belong to the device, not to one child. */
export const SHARED_KEYS = ['voice', 'sounds', 'voiceRate', 'csepiVoice', 'robotVoice', 'eveningRest', 'eveningFrom'] as const satisfies readonly (keyof Progress)[];
type SharedKey = (typeof SHARED_KEYS)[number];
export type Shared = Pick<Progress, SharedKey>;
type KidProgress = Omit<Progress, SharedKey>;

export interface Profiles {
  kids: Kid[];
  activeId: string;
  /** Csepi asks who is playing when the app starts (with two or more children). */
  askOnStart: boolean;
  shared: Shared;
  progress: Record<string, KidProgress>;
}

/** Every child has a figure of their own, so they find themselves without reading. */
export const MAX_KIDS = AVATAR_IDS.length;
export const NAME_MAX = 16;

const KEY = 'kalandka.profiles.v1';
/** The single-child save from before profiles; read once and left in place. */
const LEGACY_KEY = 'kalandka.progress.v1';

function pickShared(p: Progress): Shared {
  return Object.fromEntries(SHARED_KEYS.map((k) => [k, p[k]])) as Shared;
}

function omitShared(p: Progress): KidProgress {
  const rest: Partial<Progress> = { ...p };
  for (const k of SHARED_KEYS) delete rest[k];
  return rest as KidProgress;
}

function sameShared(a: Shared, b: Shared): boolean {
  return SHARED_KEYS.every((k) => a[k] === b[k]);
}

function newId(): string {
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** A child's progress as the games see it: their own, plus the device settings. */
export function progressOf(s: Profiles, id: string): Progress {
  return { ...DEFAULT_PROGRESS, ...s.progress[id], ...s.shared };
}

/** Starting levels for a new child of this age. */
export function startingProgress(age: AgeBand | null): Progress {
  if (age === '6') return { ...DEFAULT_PROGRESS, learnRound: 5 };
  // Everything is open from the start, so Csepi says hello instead of announcing unlocks.
  if (age === '7+') return { ...DEFAULT_PROGRESS, learnRound: 10, waterRound: PLANTS.length, unlockAll: true, flashAnnounced: true, addAnnounced: true };
  return DEFAULT_PROGRESS;
}

/** One profile around the progress saved so far (the old single-child save, or a fresh start). */
export function fromProgress(p: Progress, id = newId()): Profiles {
  return {
    kids: [{ id, name: '', avatar: 'frog', age: null }],
    activeId: id,
    askOnStart: true,
    shared: pickShared(p),
    progress: { [id]: omitShared(p) }
  };
}

function isKid(k: unknown): k is Kid {
  const kid = k as Kid;
  return !!kid && typeof kid.id === 'string' && typeof kid.name === 'string' && AVATAR_IDS.includes(kid.avatar);
}

export function parseProfiles(raw: string | null, legacyRaw: string | null): Profiles {
  try {
    const saved = raw ? (JSON.parse(raw) as Partial<Profiles>) : null;
    const kids = Array.isArray(saved?.kids) ? saved.kids.filter(isKid).map((k) => ({ ...k, age: readAge(k.age) })) : [];
    if (saved && kids.length) {
      return {
        kids,
        activeId: kids.some((k) => k.id === saved.activeId) ? saved.activeId! : kids[0].id,
        askOnStart: saved.askOnStart ?? true,
        shared: pickShared({ ...DEFAULT_PROGRESS, ...saved.shared }),
        progress: Object.fromEntries(kids.map((k) => [k.id, omitShared(readProgress(saved.progress?.[k.id]))]))
      };
    }
  } catch {
    // A broken save falls back to the old one below.
  }
  try {
    return fromProgress(legacyRaw ? readProgress(JSON.parse(legacyRaw)) : DEFAULT_PROGRESS);
  } catch {
    return fromProgress(DEFAULT_PROGRESS);
  }
}

function loadProfiles(): Profiles {
  try {
    return parseProfiles(localStorage.getItem(KEY), localStorage.getItem(LEGACY_KEY));
  } catch {
    return fromProgress(DEFAULT_PROGRESS);
  }
}

function saveProfiles(s: Profiles): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: the game still works, it just forgets.
  }
}

/** Applies a game's progress update to one child; device settings go to the shared part. */
export function applyUpdate(s: Profiles, id: string, fn: (p: Progress) => Progress): Profiles {
  if (!s.progress[id]) return s;
  const next = fn(progressOf(s, id));
  const shared = pickShared(next);
  return { ...s, shared: sameShared(shared, s.shared) ? s.shared : shared, progress: { ...s.progress, [id]: omitShared(next) } };
}

export function addKid(s: Profiles, kid: Omit<Kid, 'id'>, id = newId()): Profiles {
  if (s.kids.length >= MAX_KIDS) return s;
  return { ...s, kids: [...s.kids, { ...kid, id }], progress: { ...s.progress, [id]: omitShared(startingProgress(kid.age)) } };
}

export function editKid(s: Profiles, id: string, patch: Partial<Omit<Kid, 'id'>>): Profiles {
  return { ...s, kids: s.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) };
}

/** The last child cannot be removed; the parents' reset clears their progress instead. */
export function removeKid(s: Profiles, id: string): Profiles {
  if (s.kids.length <= 1 || !s.kids.some((k) => k.id === id)) return s;
  const kids = s.kids.filter((k) => k.id !== id);
  const { [id]: _gone, ...progress } = s.progress;
  return { ...s, kids, progress, activeId: s.activeId === id ? kids[0].id : s.activeId };
}

export function setActive(s: Profiles, id: string): Profiles {
  return s.kids.some((k) => k.id === id) ? { ...s, activeId: id } : s;
}

/** Figures no other child uses yet. */
export function freeAvatars(s: Profiles, exceptId?: string): AvatarId[] {
  const taken = new Set(s.kids.filter((k) => k.id !== exceptId).map((k) => k.avatar));
  return AVATAR_IDS.filter((a) => !taken.has(a));
}

type Change = (fn: (s: Profiles) => Profiles) => void;

const ProfilesContext = createContext<{ profiles: Profiles; change: Change } | null>(null);

/** Holds every profile and gives the games the active child's progress. */
export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profiles>(loadProfiles);

  useEffect(() => saveProfiles(profiles), [profiles]);

  const change = useCallback<Change>((fn) => setProfiles((s) => fn(s)), []);
  const value = useMemo(() => ({ profiles, change }), [profiles, change]);

  return (
    <ProfilesContext.Provider value={value}>
      <KidScope kidId={profiles.activeId}>{children}</KidScope>
    </ProfilesContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error('useProfiles must be used inside ProfilesProvider');
  return ctx;
}

/** The active child (always one: the last profile cannot be removed). */
export function useActiveKid(): Kid {
  const { profiles } = useProfiles();
  return profiles.kids.find((k) => k.id === profiles.activeId) ?? profiles.kids[0];
}

/** Below this, useProgress() reads and writes the given child's progress. */
export function KidScope({ kidId, children }: { kidId: string; children: ReactNode }) {
  const { profiles, change } = useProfiles();
  const own = profiles.progress[kidId];
  const shared = profiles.shared;

  const progress = useMemo(() => ({ ...DEFAULT_PROGRESS, ...own, ...shared }), [own, shared]);
  const update = useCallback<Update>((fn) => change((s) => applyUpdate(s, kidId, fn)), [change, kidId]);
  const value = useMemo(() => ({ progress, update }), [progress, update]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** The name Csepi and the menus use; the profile from an old save may not have one yet. */
export function kidName(kid: Kid): string {
  return kid.name.trim() || 'Kertész';
}
