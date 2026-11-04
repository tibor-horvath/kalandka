import type { Progress } from './progress';
import type { ArrivalProgress } from './rewards';

// Robotépítő, Robotműhely's reward: every four solved tasks in the workshop fill a pod that pays a bolt (see pod.ts); bolts buy parts
// for the child's own robot; once the first robot has a few new parts a second robot comes to the
// workbench, which buys parts of its own; more new parts bring robot friends who stay. The robot also
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
  /** 0: every robot has it from the start. */
  cost: number;
}

export const PARTS: Part[] = [
  { id: 'head-round', slot: 'head', name: 'Kerek fej', cost: 0 },
  { id: 'head-square', slot: 'head', name: 'Szögletes fej', cost: 3 },
  { id: 'head-dome', slot: 'head', name: 'Üvegkupola', cost: 5 },
  { id: 'head-ears', slot: 'head', name: 'Füles fej', cost: 6 },
  { id: 'antenna-rod', slot: 'antenna', name: 'Pálca', cost: 0 },
  { id: 'antenna-spring', slot: 'antenna', name: 'Rugó', cost: 2 },
  { id: 'antenna-star', slot: 'antenna', name: 'Csillag', cost: 4 },
  { id: 'antenna-dish', slot: 'antenna', name: 'Parabola', cost: 6 },
  { id: 'body-box', slot: 'body', name: 'Doboz', cost: 0 },
  { id: 'body-barrel', slot: 'body', name: 'Hordó', cost: 4 },
  { id: 'body-heart', slot: 'body', name: 'Szívpanel', cost: 6 },
  { id: 'body-gear', slot: 'body', name: 'Fogaskerék', cost: 8 },
  { id: 'arms-short', slot: 'arms', name: 'Rövid kar', cost: 0 },
  { id: 'arms-claw', slot: 'arms', name: 'Fogó', cost: 3 },
  { id: 'arms-spring', slot: 'arms', name: 'Rugós kar', cost: 5 },
  { id: 'arms-magnet', slot: 'arms', name: 'Mágneskar', cost: 7 },
  { id: 'legs-feet', slot: 'legs', name: 'Talpak', cost: 0 },
  { id: 'legs-wheels', slot: 'legs', name: 'Kerekek', cost: 4 },
  { id: 'legs-rocket', slot: 'legs', name: 'Rakéta', cost: 7 },
  { id: 'legs-tracks', slot: 'legs', name: 'Lánctalp', cost: 9 },
  { id: 'paint-teal', slot: 'paint', name: 'Türkiz', cost: 0 },
  { id: 'paint-blue', slot: 'paint', name: 'Kék', cost: 0 },
  { id: 'paint-orange', slot: 'paint', name: 'Narancs', cost: 2 },
  { id: 'paint-purple', slot: 'paint', name: 'Lila', cost: 2 },
  { id: 'paint-yellow', slot: 'paint', name: 'Sárga', cost: 2 },
  { id: 'paint-pink', slot: 'paint', name: 'Rózsaszín', cost: 3 },
  { id: 'paint-green', slot: 'paint', name: 'Zöld', cost: 3 }
];

export type RobotLook = Record<PartSlot, string>;

/** 0: the first robot, 1: the second. */
export type RobotIdx = 0 | 1;

export const BASIC_LOOK: RobotLook = { head: 'head-round', antenna: 'antenna-rod', body: 'body-box', arms: 'arms-short', legs: 'legs-feet', paint: 'paint-teal' };

/** Each robot's starting look; the second one starts blue, so the two are easy to tell apart. */
export const BASIC_LOOKS: Record<RobotIdx, RobotLook> = { 0: BASIC_LOOK, 1: { ...BASIC_LOOK, paint: 'paint-blue' } };

/** New parts on the first robot that bring the second robot to the workbench. */
export const SECOND_ROBOT_AFTER = 6;

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

function ownedList(p: Progress, r: RobotIdx): string[] {
  return (r === 1 ? p.robot2Owned : p.robotOwned) ?? [];
}

function savedLook(p: Progress, r: RobotIdx): Partial<RobotLook> | undefined {
  return r === 1 ? p.robot2Look : p.robotLook;
}

function withRobot(p: Progress, r: RobotIdx, owned: string[], look: RobotLook): Progress {
  return r === 1 ? { ...p, robot2Owned: owned, robot2Look: look } : { ...p, robotOwned: owned, robotLook: look };
}

/** Parts bought for one robot (the starting parts do not count). */
export function boughtOn(p: Progress, r: RobotIdx): number {
  return ownedList(p, r).filter((id) => (partById(id)?.cost ?? 0) > 0).length;
}

/** Parts bought so far for both robots: they bring the robot friends. */
export function boughtCount(p: Progress): number {
  return boughtOn(p, 0) + boughtOn(p, 1);
}

/** The second robot comes once the first has a few new parts; it stays for good. */
export function secondRobotOpen(p: Progress): boolean {
  return boughtOn(p, 0) >= SECOND_ROBOT_AFTER;
}

/** The second robot has come but Csavar has not introduced it yet. */
export function secondRobotNew(p: Progress): boolean {
  return secondRobotOpen(p) && !p.robot2Announced;
}

/** The robots on the workbench so far. */
export function robotsOpen(p: Progress): RobotIdx[] {
  return secondRobotOpen(p) ? [0, 1] : [0];
}

/** The robot on the workbench (the first one until the second has come). */
export function activeRobot(p: Progress): RobotIdx {
  return p.robotActive === 1 && secondRobotOpen(p) ? 1 : 0;
}

export function owns(p: Progress, id: string, r: RobotIdx = activeRobot(p)): boolean {
  const part = partById(id);
  return !!part && (part.cost === 0 || ownedList(p, r).includes(id));
}

/** A robot as it looks now; anything unknown or not owned falls back to its starting part. */
export function lookOf(p: Progress, r: RobotIdx = activeRobot(p)): RobotLook {
  const look = { ...BASIC_LOOKS[r] };
  const saved = savedLook(p, r);
  for (const slot of PART_SLOTS) {
    const id = saved?.[slot.id];
    const part = id ? partById(id) : undefined;
    if (part && part.slot === slot.id && owns(p, id!, r)) look[slot.id] = id!;
  }
  return look;
}

export function canBuy(p: Progress, id: string, r: RobotIdx = activeRobot(p)): boolean {
  const part = partById(id);
  return !!part && !owns(p, id, r) && boltBalance(p) >= part.cost;
}

/** Buys a part for a robot and puts it on; unchanged when it is already owned or the bolts are not enough. */
export function buy(p: Progress, id: string, r: RobotIdx = activeRobot(p)): Progress {
  if (!canBuy(p, id, r)) return p;
  const part = partById(id)!;
  return withRobot({ ...p, boltsSpent: p.boltsSpent + part.cost }, r, [...ownedList(p, r), id], { ...lookOf(p, r), [part.slot]: id });
}

/** Puts on a part the robot already owns; free, and unchanged for one it does not own. */
export function wear(p: Progress, id: string, r: RobotIdx = activeRobot(p)): Progress {
  const part = partById(id);
  if (!part || !owns(p, id, r)) return p;
  return withRobot(p, r, ownedList(p, r), { ...lookOf(p, r), [part.slot]: id });
}

/** The cheapest part still to buy for a robot, or null once it has them all. */
export function cheapestLeft(p: Progress, r: RobotIdx = activeRobot(p)): Part | null {
  return PARTS.filter((part) => !owns(p, part.id, r)).sort((a, b) => a.cost - b.cost)[0] ?? null;
}

/** Some part for some robot on the workbench is within the bolts. */
export function canBuyAnything(p: Progress): boolean {
  return robotsOpen(p).some((r) => {
    const next = cheapestLeft(p, r);
    return !!next && boltBalance(p) >= next.cost;
  });
}

// ---------- robot friends ----------

export type FriendId = 'dog' | 'drone' | 'mini' | 'cat' | 'bird' | 'turtle';

export interface Friend {
  id: FriendId;
  name: string;
  /** Parts bought (for both robots together) that bring it. */
  after: number;
  /** Csavar's line when it arrives. */
  speech: string;
}

export const FRIENDS: Friend[] = [
  { id: 'dog', name: 'Kutyabot', after: 2, speech: 'Nézd, ki jött! Kutyabot beköltözött a műhelybe. Itt marad veled.' },
  { id: 'drone', name: 'Drón', after: 5, speech: 'Nézd, ki jött! Egy kis drón szállt le a műhelyben. Itt marad veled.' },
  { id: 'mini', name: 'Csavarka', after: 8, speech: 'Nézd, ki jött! Csavarka, a kistestvérem! Ő is itt marad veled.' },
  { id: 'cat', name: 'Macskabot', after: 12, speech: 'Nézd, ki jött! Macskabot dorombol a műhelyben. Itt marad veled.' },
  { id: 'bird', name: 'Madárbot', after: 20, speech: 'Nézd, ki jött! Madárbot berepült a műhelybe. Itt marad veled.' },
  { id: 'turtle', name: 'Teknősbot', after: 30, speech: 'Nézd, ki jött! Teknősbot lassan, de ideért. Itt marad veled!' }
];

export function friendsOf(p: Progress): Friend[] {
  const n = boughtCount(p);
  return FRIENDS.filter((f) => n >= f.after);
}

/** The next friend that arrived but has not been welcomed yet. */
export function newFriend(p: Progress): Friend | null {
  return friendsOf(p)[p.robotFriendsSeen] ?? null;
}

/** The way to the next robot friend still to welcome: parts bought since the friend before it. Null once all have come. */
export function friendProgress(p: Progress): ArrivalProgress | null {
  const next = FRIENDS[p.robotFriendsSeen];
  if (!next) return null;
  const from = FRIENDS[p.robotFriendsSeen - 1]?.after ?? 0;
  const need = next.after - from;
  return { need, done: Math.min(need, Math.max(0, boughtCount(p) - from)), coming: 0 };
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
  return Math.max(0, Math.min(BATTERY_BARS, BATTERY_BARS - (p.robotTasks - p.robotChargedAt)));
}

/** Charges one bar; filling the last bar counts as a full charge. Unchanged when it is full. */
export function chargeOne(p: Progress): Progress {
  const now = batteryOf(p);
  if (now >= BATTERY_BARS) return p;
  const from = Math.max(p.robotChargedAt, p.robotTasks - BATTERY_BARS);
  return { ...p, robotChargedAt: from + 1, robotCharges: p.robotCharges + (now + 1 === BATTERY_BARS ? 1 : 0) };
}

export function isSqueaky(p: Progress): boolean {
  return p.robotTasks - p.robotOiledAt >= SQUEAKY_AFTER;
}

export function oil(p: Progress): Progress {
  return isSqueaky(p) ? { ...p, robotOiledAt: p.robotTasks } : p;
}

export function tricksOf(p: Progress): Trick[] {
  return TRICKS.filter((t) => p.robotCharges >= t.after);
}

/** Full charges still needed for the next trick, or null once the robot knows them all. */
export function chargesToNextTrick(p: Progress): number | null {
  const next = TRICKS.find((t) => p.robotCharges < t.after);
  return next ? next.after - p.robotCharges : null;
}
