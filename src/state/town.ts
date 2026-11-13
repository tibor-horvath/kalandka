import type { Progress } from './progress';

// The Kisváros: Óratorony's reward place, a little town square under the clock tower. Bells earned in the games
// put up its buildings one by one, counted in like seeds in the Kiskert; nothing is ever taken down. The square's
// sky follows the world's solved tasks, a part of the day per task, so the town lives with the child's play and
// never with the calendar.

export interface Building {
  id: string;
  name: string;
  /** Bells it takes. */
  cost: number;
}

/** In the order they stand around the square; any can be bought first. */
export const BUILDINGS: Building[] = [
  { id: 'bakery', name: 'Pékség', cost: 2 },
  { id: 'flowers', name: 'Virágbolt', cost: 2 },
  { id: 'fountain', name: 'Szökőkút', cost: 3 },
  { id: 'post', name: 'Posta', cost: 3 },
  { id: 'playground', name: 'Játszótér', cost: 3 },
  { id: 'school', name: 'Iskola', cost: 4 },
  { id: 'library', name: 'Könyvtár', cost: 4 },
  { id: 'station', name: 'Vasútállomás', cost: 5 },
  { id: 'cinema', name: 'Mozi', cost: 5 },
  { id: 'clock', name: 'Toronyóra', cost: 6 }
];

export function bellBalance(p: Progress): number {
  return Math.max(0, p.bells - p.bellsSpent);
}

export function isBuilt(p: Progress, id: string): boolean {
  return p.town.includes(id);
}

export function builtCount(p: Progress): number {
  return BUILDINGS.filter((b) => isBuilt(p, b.id)).length;
}

/** Something the bells reach that is not built yet: the island's "Építhetsz!" badge. */
export function canBuild(p: Progress): boolean {
  return BUILDINGS.some((b) => !isBuilt(p, b.id) && b.cost <= bellBalance(p));
}

/** Puts a building up once its bells are counted in; a second call, or too few bells, changes nothing. */
export function build(p: Progress, id: string): Progress {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b || isBuilt(p, id) || bellBalance(p) < b.cost) return p;
  return { ...p, town: [...p.town, id], bellsSpent: p.bellsSpent + b.cost };
}

export type DayTime = 'morning' | 'noon' | 'afternoon' | 'evening';
const DAY_TIMES: DayTime[] = ['morning', 'noon', 'afternoon', 'evening'];

/** The square's time of day: it moves on one part with every solved task in the Óratorony. */
export function townTime(p: Progress): DayTime {
  return DAY_TIMES[p.towerTasks % DAY_TIMES.length];
}
