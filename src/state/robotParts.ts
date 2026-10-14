import type { Progress } from './progress';

// Robotépítő, Robotműhely's reward: every solved Robotút course earns a bolt; bolts buy parts for
// the child's own robot; a robot with more new parts brings robot friends who stay. The robot also
// asks for care (battery and oil, below). As in the Kiskert, rewards are only ever added: a bought
// part is the child's for good (swapping back is free), nothing is random and nothing depends on
// time played.

export type PartSlot = 'antenna' | 'head' | 'body' | 'arms' | 'legs' | 'paint';

export interface PartSlotInfo {
  id: PartSlot;
  name: string;
}

export const PART_SLOTS: PartSlotInfo[] = [
  { id: 'head', name: 'Fej' },
  { id: 'antenna', name: 'Antenna' },
  { id: 'body', name: 'Test' },
  { id: 'arms', name: 'Kar' },
  { id: 'legs', name: 'Láb' },
  { id: 'paint', name: 'Szín' }
];

export interface Part {
  id: string;
  slot: PartSlot;
  name: string;
  /** 0: the robot has it from the start. */
  cost: number;
}

export const PARTS: Part[] = [
  { id: 'head-round', slot: 'head', name: 'Kerek fej', cost: 0 },
  { id: 'head-square', slot: 'head', name: 'Szögletes fej', cost: 3 },
  { id: 'head-dome', slot: 'head', name: 'Üvegkupola', cost: 5 },
  { id: 'antenna-rod', slot: 'antenna', name: 'Pálca', cost: 0 },
  { id: 'antenna-spring', slot: 'antenna', name: 'Rugó', cost: 2 },
  { id: 'antenna-star', slot: 'antenna', name: 'Csillag', cost: 4 },
  { id: 'body-box', slot: 'body', name: 'Doboz', cost: 0 },
  { id: 'body-barrel', slot: 'body', name: 'Hordó', cost: 4 },
  { id: 'body-heart', slot: 'body', name: 'Szívpanel', cost: 6 },
  { id: 'arms-short', slot: 'arms', name: 'Rövid kar', cost: 0 },
  { id: 'arms-claw', slot: 'arms', name: 'Fogó', cost: 3 },
  { id: 'arms-spring', slot: 'arms', name: 'Rugós kar', cost: 5 },
  { id: 'legs-feet', slot: 'legs', name: 'Talpak', cost: 0 },
  { id: 'legs-wheels', slot: 'legs', name: 'Kerekek', cost: 4 },
  { id: 'legs-rocket', slot: 'legs', name: 'Rakéta', cost: 7 },
  { id: 'paint-teal', slot: 'paint', name: 'Türkiz', cost: 0 },
  { id: 'paint-orange', slot: 'paint', name: 'Narancs', cost: 2 },
  { id: 'paint-purple', slot: 'paint', name: 'Lila', cost: 2 },
  { id: 'paint-yellow', slot: 'paint', name: 'Sárga', cost: 2 }
];

export type RobotLook = Record<PartSlot, string>;

export const BASIC_LOOK: RobotLook = { head: 'head-round', antenna: 'antenna-rod', body: 'body-box', arms: 'arms-short', legs: 'legs-feet', paint: 'paint-teal' };

export function partById(id: string): Part | undefined {
  return PARTS.find((p) => p.id === id);
}

export function partsIn(slot: PartSlot): Part[] {
  return PARTS.filter((p) => p.slot === slot);
}

/** Bolts the child can still spend. `bolts` counts every bolt ever earned. */
export function boltBalance(p: Progress): number {
  return Math.max(0, p.bolts - p.boltsSpent);
}

export function owns(p: Progress, id: string): boolean {
  const part = partById(id);
  return !!part && (part.cost === 0 || p.robotOwned.includes(id));
}

/** The robot as it looks now; anything unknown or not owned falls back to the starting part. */
export function lookOf(p: Progress): RobotLook {
  const look = { ...BASIC_LOOK };
  for (const slot of PART_SLOTS) {
    const id = p.robotLook?.[slot.id];
    const part = id ? partById(id) : undefined;
    if (part && part.slot === slot.id && owns(p, id!)) look[slot.id] = id!;
  }
  return look;
}

export function canBuy(p: Progress, id: string): boolean {
  const part = partById(id);
  return !!part && !owns(p, id) && boltBalance(p) >= part.cost;
}

/** Buys a part and puts it on; unchanged when it is already owned or the bolts are not enough. */
export function buy(p: Progress, id: string): Progress {
  if (!canBuy(p, id)) return p;
  const part = partById(id)!;
  return { ...p, boltsSpent: p.boltsSpent + part.cost, robotOwned: [...p.robotOwned, id], robotLook: { ...lookOf(p), [part.slot]: id } };
}

/** Puts on a part the child already owns; free, and unchanged for one they do not own. */
export function wear(p: Progress, id: string): Progress {
  const part = partById(id);
  if (!part || !owns(p, id)) return p;
  return { ...p, robotLook: { ...lookOf(p), [part.slot]: id } };
}

/** Parts bought so far (the starting parts do not count). */
export function boughtCount(p: Progress): number {
  return p.robotOwned.filter((id) => (partById(id)?.cost ?? 0) > 0).length;
}

/** The cheapest part still to buy, or null once the child has them all. */
export function cheapestLeft(p: Progress): Part | null {
  return PARTS.filter((part) => !owns(p, part.id)).sort((a, b) => a.cost - b.cost)[0] ?? null;
}

export function canBuyAnything(p: Progress): boolean {
  const next = cheapestLeft(p);
  return !!next && boltBalance(p) >= next.cost;
}

// ---------- robot friends ----------

export type FriendId = 'dog' | 'drone' | 'mini' | 'cat';

export interface Friend {
  id: FriendId;
  name: string;
  /** Parts bought that bring it. */
  after: number;
  /** Csavar's line when it arrives. */
  speech: string;
}

export const FRIENDS: Friend[] = [
  { id: 'dog', name: 'Kutyabot', after: 2, speech: 'Nézd, ki jött! Kutyabot beköltözött a műhelybe. Itt marad veled.' },
  { id: 'drone', name: 'Drón', after: 5, speech: 'Nézd, ki jött! Egy kis drón szállt le a műhelyben. Itt marad veled.' },
  { id: 'mini', name: 'Csavarka', after: 8, speech: 'Nézd, ki jött! Csavarka, a kistestvérem! Ő is itt marad veled.' },
  { id: 'cat', name: 'Macskabot', after: 12, speech: 'Nézd, ki jött! Macskabot dorombol a műhelyben. Minden alkatrész a tiéd!' }
];

export function friendsOf(p: Progress): Friend[] {
  const n = boughtCount(p);
  return FRIENDS.filter((f) => n >= f.after);
}

/** The next friend that arrived but has not been welcomed yet. */
export function newFriend(p: Progress): Friend | null {
  return friendsOf(p)[p.robotFriendsSeen] ?? null;
}

// ---------- care: battery, oil and tricks ----------
// Every solved task in the workshop uses one battery bar: the robot did the work. A flat battery only
// makes the robot sleepy in the workshop; it never stops a game. The child charges it bar by bar, free,
// counting along; every few full charges the robot learns a trick it keeps. After a while a joint
// squeaks until it gets a drop of oil. Everything counts tasks, not time.

export const BATTERY_BARS = 5;
/** Solved tasks after oiling until a joint squeaks again. */
export const SQUEAKY_AFTER = 8;

export type TrickId = 'wobble' | 'spin' | 'jump';

export interface Trick {
  id: TrickId;
  name: string;
  /** Full charges that teach it. */
  after: number;
}

export const TRICKS: Trick[] = [
  { id: 'wobble', name: 'Billegés', after: 3 },
  { id: 'spin', name: 'Pörgés', after: 6 },
  { id: 'jump', name: 'Ugrás', after: 9 }
];

/** 0 … BATTERY_BARS. */
export function batteryOf(p: Progress): number {
  return Math.max(0, Math.min(BATTERY_BARS, BATTERY_BARS - (p.bolts - p.robotChargedAt)));
}

/** Charges one bar; filling the last bar counts as a full charge. Unchanged when it is full. */
export function chargeOne(p: Progress): Progress {
  const now = batteryOf(p);
  if (now >= BATTERY_BARS) return p;
  const from = Math.max(p.robotChargedAt, p.bolts - BATTERY_BARS);
  return { ...p, robotChargedAt: from + 1, robotCharges: p.robotCharges + (now + 1 === BATTERY_BARS ? 1 : 0) };
}

export function isSqueaky(p: Progress): boolean {
  return p.bolts - p.robotOiledAt >= SQUEAKY_AFTER;
}

export function oil(p: Progress): Progress {
  return isSqueaky(p) ? { ...p, robotOiledAt: p.bolts } : p;
}

export function tricksOf(p: Progress): Trick[] {
  return TRICKS.filter((t) => p.robotCharges >= t.after);
}

/** Full charges still needed for the next trick, or null once the robot knows them all. */
export function chargesToNextTrick(p: Progress): number | null {
  const next = TRICKS.find((t) => p.robotCharges < t.after);
  return next ? next.after - p.robotCharges : null;
}
