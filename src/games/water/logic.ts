import { numberAttr } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';

/** One ten-frame for targets up to 10, two ten-frames for 11–20. */
export function maxDropsFor(target: number): number {
  return target > 10 ? 20 : 10;
}

/** The watering can pours this many at once (only offered on two ten-frames). */
export const CAN_DROPS = 5;

export interface Plant {
  id: string;
  /** Nominative, lower case: "harangvirág". */
  name: string;
  /** Dative with article, sentence start: "A harangvirágnak". */
  dative: string;
  target: number;
  petal: string;
}

export const PLANTS: Plant[] = [
  { id: 'harangvirag', name: 'harangvirág', dative: 'A harangvirágnak', target: 6, petal: '#7DA7F5' },
  { id: 'tulipan', name: 'tulipán', dative: 'A tulipánnak', target: 3, petal: '#F2709C' },
  { id: 'napraforgo', name: 'napraforgó', dative: 'A napraforgónak', target: 8, petal: '#FFC93C' },
  { id: 'szazszorszep', name: 'százszorszép', dative: 'A százszorszépnek', target: 5, petal: '#FFFFFF' },
  { id: 'pipacs', name: 'pipacs', dative: 'A pipacsnak', target: 9, petal: '#F2603A' },
  { id: 'ibolya', name: 'ibolya', dative: 'Az ibolyának', target: 4, petal: '#B07CE8' },
  { id: 'margareta', name: 'margaréta', dative: 'A margarétának', target: 7, petal: '#FFF4B8' },
  { id: 'kankalin', name: 'kankalin', dative: 'A kankalinnak', target: 2, petal: '#FFB347' },
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

export interface WaterLevel {
  /** Shown to parents. */
  name: string;
  min: number;
  max: number;
}

export const WATER_LEVELS: WaterLevel[] = [
  { name: '2–5 csepp', min: 2, max: 5 },
  { name: '6–10 csepp', min: 6, max: 10 },
  { name: '11–20 csepp', min: 11, max: 20 }
];

/** The plant of a round on a level of the ladder: the plants with that many drops, or any plant with 11–20. */
export function plantForLevel(level: number, round: number): Plant {
  const r = Math.max(0, Math.floor(round));
  const { min, max } = WATER_LEVELS[level];
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
  return `${plant.dative} ${numberAttr(plant.target)} csepp kell. Koppints a felhőre!`;
}

/** filled = drop inside the target; extra = drop beyond it; target = empty spot still needed. */
export type SlotKind = 'filled' | 'extra' | 'target' | 'empty';

export function slotKinds(count: number, target: number): SlotKind[] {
  return Array.from({ length: maxDropsFor(target) }, (_, k) => {
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

export function removeDrop(count: number): number {
  return Math.max(0, count - 1);
}
