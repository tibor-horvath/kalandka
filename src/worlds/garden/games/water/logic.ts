import { capitalize, numberAttr } from '../../../../lib/numbers';
import { rng } from '../../../../lib/rng';
import type { Mood, Tone } from '../../../../lib/types';

/** One ten-frame for targets up to 10, two ten-frames for 11–20. */
export function maxDropsFor(target: number): number {
  return target > 10 ? 20 : 10;
}

/** The watering can pours this many at once (only offered on two ten-frames). */
export const CAN_DROPS = 5;

/** The watering game's flowers; each is drawn as its real species (see blooms.tsx). */
export type SpeciesId =
  | 'harangvirag'
  | 'tulipan'
  | 'napraforgo'
  | 'szazszorszep'
  | 'pipacs'
  | 'ibolya'
  | 'margareta'
  | 'kankalin'
  | 'bazsarozsa';

export interface Plant {
  id: SpeciesId;
  /** Nominative, lower case: "harangvirág". */
  name: string;
  /** Dative with article, sentence start: "A harangvirágnak". */
  dative: string;
  target: number;
  petal: string;
  /** Drops already in the frame when the plant arrives: the child counts on from them. */
  given?: number;
  /** Drops per tap of the cloud: 2 on the counting-in-twos level. */
  step?: number;
}

export const PLANTS: Plant[] = [
  { id: 'harangvirag', name: 'harangvirág', dative: 'A harangvirágnak', target: 6, petal: '#8C86E8' },
  { id: 'tulipan', name: 'tulipán', dative: 'A tulipánnak', target: 3, petal: '#F2709C' },
  { id: 'napraforgo', name: 'napraforgó', dative: 'A napraforgónak', target: 8, petal: '#FFC93C' },
  { id: 'szazszorszep', name: 'százszorszép', dative: 'A százszorszépnek', target: 5, petal: '#FFFFFF' },
  { id: 'pipacs', name: 'pipacs', dative: 'A pipacsnak', target: 9, petal: '#E2382B' },
  { id: 'ibolya', name: 'ibolya', dative: 'Az ibolyának', target: 4, petal: '#7B4FC9' },
  { id: 'margareta', name: 'margaréta', dative: 'A margarétának', target: 7, petal: '#FFFFFF' },
  { id: 'kankalin', name: 'kankalin', dative: 'A kankalinnak', target: 2, petal: '#F7DC6F' },
  { id: 'bazsarozsa', name: 'bazsarózsa', dative: 'A bazsarózsának', target: 10, petal: '#F79AB8' }
];

/**
 * The first lap of plants keeps their own targets (2–10).
 * From the second lap on, targets go 11–20 (first-grade range).
 */
export function plantForRound(round: number): Plant {
  const r = Math.max(0, Math.floor(round));
  const plant = PLANTS[r % PLANTS.length];
  if (r < PLANTS.length) return plant;
  return { ...plant, target: 11 + ((r * 7) % 10) };
}

/** count: water from empty; on: count on from the drops already there; cross: count on across ten; twos: count in twos. */
export type WaterKind = 'count' | 'on' | 'cross' | 'twos';

export interface WaterLevel {
  /** Shown to parents. */
  name: string;
  kind: WaterKind;
  /** The plant's drops on this level. */
  min: number;
  max: number;
}

export const WATER_LEVELS: WaterLevel[] = [
  { name: '2–5 csepp', kind: 'count', min: 2, max: 5 },
  { name: '6–10 csepp', kind: 'count', min: 6, max: 10 },
  { name: '11–20 csepp', kind: 'count', min: 11, max: 20 },
  { name: 'Továbbszámolás 20-ig', kind: 'on', min: 5, max: 20 },
  { name: 'Tízes átlépés', kind: 'cross', min: 11, max: 17 },
  { name: 'Kettesével 20-ig', kind: 'twos', min: 6, max: 20 }
];

/**
 * The plant of a counting-on or twos round. Counting on never crosses ten: the drops already there and the
 * target sit in the same frame (or the first frame is full), and the child adds two to six. Across ten, six to
 * nine drops are there and the target is 11–17, so filling the first frame is the way over.
 */
function laterPlant(kind: WaterKind, r: number): Plant {
  const rand = rng(r * 31 + 7);
  const pick = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const plant = PLANTS[r % PLANTS.length];
  if (kind === 'twos') return { ...plant, target: 2 * pick(3, 10), step: 2 };
  if (kind === 'cross') {
    const given = pick(6, 9);
    return { ...plant, target: pick(11, given + 8), given };
  }
  if (rand() < 0.5) {
    const target = pick(5, 10);
    return { ...plant, target, given: pick(Math.max(2, target - 5), target - 2) };
  }
  const target = pick(13, 20);
  return { ...plant, target, given: pick(Math.max(10, target - 6), target - 2) };
}

/** The plant of a round on a level of the ladder. */
export function plantForLevel(level: number, round: number): Plant {
  const r = Math.max(0, Math.floor(round));
  const { kind, min, max } = WATER_LEVELS[level];
  if (kind !== 'count') return laterPlant(kind, r);
  if (min > 10) return plantForRound(PLANTS.length + r);
  const pool = PLANTS.filter((p) => p.target >= min && p.target <= max);
  return pool[r % pool.length];
}

export type WaterStatus = 'under' | 'done' | 'over';

export function statusOf(count: number, target: number): WaterStatus {
  if (count === target) return 'done';
  return count > target ? 'over' : 'under';
}

export interface Feedback {
  status: WaterStatus;
  /** Shown in the bubble (digits). */
  text: string;
  /** Spoken by Csepi (number words, correct Hungarian forms). */
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function feedback(count: number, plant: Plant): Feedback {
  const t = plant.target;
  const status = statusOf(count, t);
  if (status === 'done') {
    return {
      status,
      text: `Hurrá! Pont ${t} csepp – kivirágzott a ${plant.name}!`,
      speech: `Hurrá! Pont ${numberAttr(t)} csepp. Kivirágzott a ${plant.name}!`,
      mood: 'cheer',
      tone: 'good'
    };
  }
  if (status === 'over') {
    const extra = count - t;
    return {
      status,
      text: `Hoppá, ez túl sok víz! Vegyél el ${extra} cseppet.`,
      speech: `Hoppá, ez túl sok víz! Vegyél el ${numberAttr(extra)} cseppet.`,
      mood: 'oops',
      tone: 'oops'
    };
  }
  const left = t - count;
  return {
    status,
    text: `Még ${left} csepp kell!`,
    speech: `Még ${numberAttr(left)} csepp kell!`,
    mood: 'smile',
    tone: 'plain'
  };
}

export function introSpeech(plant: Plant): string {
  const need = `${plant.dative} ${numberAttr(plant.target)} csepp kell.`;
  if (plant.step === 2) return `${need} A felhő most kettesével csepeg: számolj kettesével!`;
  if (plant.given) return `${need} ${capitalize(numberAttr(plant.given))} csepp már ott van. Számolj tovább, és koppints a felhőre!`;
  return `${need} Koppints a felhőre!`;
}

/** given = drop that was there when the plant came; filled = drop inside the target; extra = drop beyond it; target = empty spot still needed. */
export type SlotKind = 'given' | 'filled' | 'extra' | 'target' | 'empty';

export function slotKinds(count: number, target: number, given = 0): SlotKind[] {
  return Array.from({ length: maxDropsFor(target) }, (_, k) => {
    if (k < given) return 'given';
    const filled = k < count;
    const inTarget = k < target;
    if (filled) return inTarget ? 'filled' : 'extra';
    return inTarget ? 'target' : 'empty';
  });
}

/** Plant scale: half size with no water, full size when the target is reached. */
export function growth(count: number, target: number): number {
  return 0.5 + (0.5 * Math.min(count, target)) / target;
}

export function addDrop(count: number, target: number, amount = 1): number {
  return Math.min(maxDropsFor(target), count + amount);
}

/** Takes back the last tap's drops; the drops that were already there stay. */
export function removeDrop(count: number, given = 0, step = 1): number {
  return Math.max(given, count - step);
}
