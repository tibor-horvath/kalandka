import { spentIn } from './balance';
import type { Progress } from './progress';

// The Kisváros: Óratorony's reward place, a little town square under the clock tower. Bells earned in the games
// put up its buildings, grow them through three stages, and buy gifts for the residents who move in with them;
// every gift stays beside its building as a decoration. Nothing is ever taken down.
// The square follows the tower clock: it starts at the real time and the child turns it from there; the sky, the
// open shops and the train on the hour follow it.

/** A gift's decoration, drawn beside its building (see DecorArt in worlds/tower/art.tsx). */
export type DecorKind = 'bench' | 'lamp' | 'flowerbox' | 'flag' | 'tree' | 'bike' | 'sign' | 'balloon';

export interface Gift {
  decor: DecorKind;
  /** As the card says it: "Pad". */
  name: string;
}

export interface Resident {
  id: string;
  /** "Panni", "Pál". */
  name: string;
  /** "pék", "postás": who they are in town. */
  role: string;
  /** Drawn with a hat of this kind and a coat of this colour. */
  hat: 'chef' | 'cap' | 'none' | 'bow' | 'top';
  coat: string;
}

export interface Building {
  id: string;
  name: string;
  /** Bells it takes to put up. */
  cost: number;
  /** "a pékség": the building in a sentence. */
  the: string;
  resident: Resident;
  /** Opening hours on a 24-hour day (open ≤ h < close); the station's train also leaves on every whole hour it is open. */
  open: number;
  close: number;
  /** What happens there when it opens: "Kinyitott a pékség, friss a kenyér!" */
  opens: string;
  gifts: Gift[];
}

const gifts = (...g: [DecorKind, string][]): Gift[] => g.map(([decor, name]) => ({ decor, name }));

/** In the order they stand around the square; any can be built first. */
export const BUILDINGS: Building[] = [
  {
    id: 'bakery', name: 'Pékség', cost: 2, the: 'a pékség', open: 6, close: 18,
    resident: { id: 'baker', name: 'Panni', role: 'pék', hat: 'chef', coat: '#FFFFFF' },
    opens: 'Kinyitott a pékség, friss a kenyér!',
    gifts: gifts(['sign', 'Cégtábla'], ['flowerbox', 'Virágláda'], ['bench', 'Pad'], ['lamp', 'Lámpa'], ['flag', 'Zászló'])
  },
  {
    id: 'flowers', name: 'Virágbolt', cost: 2, the: 'a virágbolt', open: 8, close: 17,
    resident: { id: 'florist', name: 'Vili', role: 'virágárus', hat: 'none', coat: '#3D8F3F' },
    opens: 'Kinyitott a virágbolt.',
    gifts: gifts(['flowerbox', 'Virágláda'], ['tree', 'Kis fa'], ['bench', 'Pad'], ['balloon', 'Lufi'], ['sign', 'Cégtábla'])
  },
  {
    id: 'fountain', name: 'Szökőkút', cost: 3, the: 'a szökőkút', open: 7, close: 21,
    resident: { id: 'gardener', name: 'Gáspár', role: 'kertész', hat: 'cap', coat: '#8A5A3B' },
    opens: 'Elindult a szökőkút.',
    gifts: gifts(['bench', 'Pad'], ['tree', 'Kis fa'], ['lamp', 'Lámpa'], ['flowerbox', 'Virágláda'], ['bike', 'Bicikli'])
  },
  {
    id: 'post', name: 'Posta', cost: 3, the: 'a posta', open: 8, close: 16,
    resident: { id: 'postman', name: 'Pál', role: 'postás', hat: 'cap', coat: '#2E86DE' },
    opens: 'Kinyitott a posta, indulnak a levelek.',
    gifts: gifts(['bike', 'Bicikli'], ['sign', 'Cégtábla'], ['flag', 'Zászló'], ['bench', 'Pad'], ['lamp', 'Lámpa'])
  },
  {
    id: 'playground', name: 'Játszótér', cost: 3, the: 'a játszótér', open: 9, close: 19,
    resident: { id: 'grandma', name: 'Bori néni', role: 'nagymama', hat: 'bow', coat: '#E8577D' },
    opens: 'Kinyitott a játszótér, jönnek a gyerekek.',
    gifts: gifts(['balloon', 'Lufi'], ['bench', 'Pad'], ['tree', 'Kis fa'], ['bike', 'Bicikli'], ['flag', 'Zászló'])
  },
  {
    id: 'school', name: 'Iskola', cost: 4, the: 'az iskola', open: 8, close: 13,
    resident: { id: 'teacher', name: 'Teri', role: 'tanító', hat: 'none', coat: '#7B68C8' },
    opens: 'Becsöngettek, kezdődik a tanítás.',
    gifts: gifts(['flag', 'Zászló'], ['tree', 'Kis fa'], ['bench', 'Pad'], ['sign', 'Cégtábla'], ['balloon', 'Lufi'])
  },
  {
    id: 'library', name: 'Könyvtár', cost: 4, the: 'a könyvtár', open: 10, close: 18,
    resident: { id: 'librarian', name: 'Kati', role: 'könyvtáros', hat: 'bow', coat: '#3D8F3F' },
    opens: 'Kinyitott a könyvtár, lehet olvasni.',
    gifts: gifts(['lamp', 'Lámpa'], ['bench', 'Pad'], ['flowerbox', 'Virágláda'], ['sign', 'Cégtábla'], ['tree', 'Kis fa'])
  },
  {
    id: 'station', name: 'Vasútállomás', cost: 5, the: 'a vasútállomás', open: 6, close: 22,
    resident: { id: 'driver', name: 'Matyi', role: 'mozdonyvezető', hat: 'cap', coat: '#1E2B3C' },
    opens: 'Kinyitott az állomás.',
    gifts: gifts(['lamp', 'Lámpa'], ['bench', 'Pad'], ['flag', 'Zászló'], ['sign', 'Cégtábla'], ['flowerbox', 'Virágláda'])
  },
  {
    id: 'cinema', name: 'Mozi', cost: 5, the: 'a mozi', open: 16, close: 22,
    resident: { id: 'projectionist', name: 'Marci', role: 'mozigépész', hat: 'top', coat: '#C8553D' },
    opens: 'Kinyitott a mozi, kezdődik a mese!',
    gifts: gifts(['sign', 'Cégtábla'], ['lamp', 'Lámpa'], ['balloon', 'Lufi'], ['flag', 'Zászló'], ['bench', 'Pad'])
  },
  {
    id: 'clock', name: 'Toronyóra', cost: 6, the: 'a toronyóra', open: 0, close: 24,
    resident: { id: 'clockmaker', name: 'Ottó', role: 'órásmester', hat: 'top', coat: '#5B4B9A' },
    opens: 'Jár a toronyóra.',
    gifts: gifts(['flag', 'Zászló'], ['lamp', 'Lámpa'], ['tree', 'Kis fa'], ['flowerbox', 'Virágláda'], ['bench', 'Pad'])
  }
];

/** Stages a building grows through: built, then two upgrades. */
export const STAGES = 3;
/** Gifts each resident takes, the first for one bell, then two, up to five. */
export const GIFTS_EACH = 5;

/** "Panninak", "Vilinek", "Bori néninek": a resident's name with the dative ending, by its last word's vowels. */
export function dative(name: string): string {
  const last = name.split(' ').pop() ?? name;
  return `${name}${/[aáoóuú]/.test(last) ? 'nak' : 'nek'}`;
}

export function buildingOf(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

export function bellBalance(p: Progress): number {
  return Math.max(0, p.worlds.tower.earned - p.worlds.tower.spent);
}

export function isBuilt(p: Progress, id: string): boolean {
  return p.town.includes(id);
}

export function builtCount(p: Progress): number {
  return BUILDINGS.filter((b) => isBuilt(p, b.id)).length;
}

// ---------- building ----------

/** Puts a building up once its bells are counted in; its resident moves in with it. A second call, or too few bells, changes nothing. */
export function build(p: Progress, id: string): Progress {
  const b = buildingOf(id);
  if (!b || isBuilt(p, id) || bellBalance(p) < b.cost) return p;
  return { ...p, town: [...p.town, id], worlds: spentIn(p, 'tower', b.cost) };
}

// ---------- stages ----------

/** The building's stage: 0 not built, 1 built, up to STAGES. */
export function stageOf(p: Progress, id: string): number {
  return isBuilt(p, id) ? Math.min(STAGES, 1 + (p.townStages[id] ?? 0)) : 0;
}

/** Bells the next stage takes (a little more than the building, then more again); null at the top or before it is built. */
export function upgradeCost(p: Progress, id: string): number | null {
  const b = buildingOf(id);
  const stage = stageOf(p, id);
  if (!b || stage === 0 || stage >= STAGES) return null;
  return b.cost + (stage === 1 ? 1 : 3);
}

export function upgrade(p: Progress, id: string): Progress {
  const cost = upgradeCost(p, id);
  if (cost === null || bellBalance(p) < cost) return p;
  return { ...p, townStages: { ...p.townStages, [id]: (p.townStages[id] ?? 0) + 1 }, worlds: spentIn(p, 'tower', cost) };
}

export function upgradeCount(p: Progress): number {
  return BUILDINGS.reduce((n, b) => n + Math.max(0, stageOf(p, b.id) - 1), 0);
}

// ---------- residents and their gifts ----------

/** Gifts the building's resident has had, 0 … GIFTS_EACH. */
export function giftsOf(p: Progress, id: string): number {
  return Math.min(GIFTS_EACH, p.townGifts[id] ?? 0);
}

/** The next gift and what it costs; null once all five are given, or before the resident has moved in. */
export function nextGift(p: Progress, id: string): (Gift & { cost: number }) | null {
  const b = buildingOf(id);
  const n = giftsOf(p, id);
  if (!b || !isBuilt(p, id) || n >= GIFTS_EACH) return null;
  return { ...b.gifts[n], cost: n + 1 };
}

export function give(p: Progress, id: string): Progress {
  const g = nextGift(p, id);
  if (!g || bellBalance(p) < g.cost) return p;
  return { ...p, townGifts: { ...p.townGifts, [id]: giftsOf(p, id) + 1 }, worlds: spentIn(p, 'tower', g.cost) };
}

export function giftCount(p: Progress): number {
  return BUILDINGS.reduce((n, b) => n + giftsOf(p, b.id), 0);
}

/** The first resident who moved in but has not been welcomed yet (their welcome card shows once). */
export function residentToWelcome(p: Progress): Building | null {
  const id = p.town.find((t) => !p.townWelcomed.includes(t));
  return (id && buildingOf(id)) || null;
}

export function welcome(p: Progress, id: string): Progress {
  return p.townWelcomed.includes(id) ? p : { ...p, townWelcomed: [...p.townWelcomed, id] };
}

/** Something the bells reach: a building, a stage or a gift. The island's "Építhetsz!" badge. */
export function canBuild(p: Progress): boolean {
  const have = bellBalance(p);
  return BUILDINGS.some((b) => {
    if (!isBuilt(p, b.id)) return b.cost <= have;
    const up = upgradeCost(p, b.id);
    const gift = nextGift(p, b.id);
    return (up !== null && up <= have) || (gift !== null && gift.cost <= have);
  });
}

// ---------- the tower clock ----------

/** Minutes in a day; the town's clock runs 0 … 1439 and wraps. */
export const DAY_MINUTES = 24 * 60;

/** The time now on the device, in minutes after midnight: where the tower clock stands when the Kisváros opens. */
export function nowMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** The tower clock turned by `by` minutes (forwards or back), round the day. */
export function turnClock(minutes: number, by: number): number {
  return (((minutes + by) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

export type Sky = 'night' | 'morning' | 'day' | 'evening';

/** The sky over the square at a time of day. */
export function skyAt(minutes: number): Sky {
  const h = Math.floor(minutes / 60);
  if (h < 6 || h >= 21) return 'night';
  if (h < 10) return 'morning';
  if (h < 17) return 'day';
  return 'evening';
}

/** Whether a building is open at a time of day. */
export function isOpen(b: Building, minutes: number): boolean {
  const h = Math.floor(minutes / 60);
  return h >= b.open && h < b.close;
}

/** "reggel", "délelőtt", "délben", "délután", "este", "éjjel": the part of the day, for Kakukk's line. */
export function partOfDay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  if (h < 5 || h >= 22) return 'éjjel';
  if (h < 9) return 'reggel';
  if (h < 12) return 'délelőtt';
  if (h < 13) return 'délben';
  if (h < 18) return 'délután';
  return 'este';
}

/**
 * What happens in the built town at this time: buildings opening or closing on the hour, and the train on every
 * whole hour the station is open. Empty when nothing changes now.
 */
export function happenings(p: Progress, minutes: number): string[] {
  const h = Math.floor(minutes / 60);
  const onHour = minutes % 60 === 0;
  const out: string[] = [];
  for (const b of BUILDINGS) {
    if (!isBuilt(p, b.id) || b.id === 'clock') continue;
    if (onHour && h === b.open) out.push(b.opens);
    else if (onHour && h === b.close) out.push(`Bezárt ${b.the}.`);
    if (b.id === 'station' && onHour && h >= b.open && h < b.close) out.push('Sípol a mozdony: indul a vonat!');
  }
  return out;
}
