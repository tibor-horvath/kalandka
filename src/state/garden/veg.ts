import type { Progress } from '../progress';
import { PLOTS, isGrown, isWelcomed, openPlots, seedBalance } from './beds';
import type { VisitorId } from './visitors';

// The Veteményes and the bee's pollen: garden food that visitors eat.

// ---------- the Veteményes ----------
// Next to the flower border each open plot has a vegetable patch of five spots. Carrots and lettuce come with the
// visitors who eat them (Nyuszi, Csiga): their seeds open the patch. A spot grows three of its vegetable in two
// tasks, never gets thirsty, and keeps them there until that visitor eats them; then the spot is free to plant
// again. The beds themselves are never emptied, and the patch never counts toward visitors.

export type VegId = 'carrot' | 'lettuce';

export interface VegKind {
  id: VegId;
  name: string;
  /** "répát": the vegetable as the thing planted, in Csepi's lines. */
  planted: string;
  /** The visitor who brings its seeds, and eats it. */
  bringer: VisitorId;
}

export const VEGS: VegKind[] = [
  { id: 'carrot', name: 'Répa', planted: 'répát', bringer: 'rabbit' },
  { id: 'lettuce', name: 'Saláta', planted: 'salátát', bringer: 'snail' }
];

/** Spots of the Veteményes in one plot. */
export const VEG_SPOTS = 5;
export const VEG_COST = 2;
/** Solved tasks after planting until a spot is ripe. */
export const VEG_GROWS = 2;
/** Vegetables one ripe spot holds. */
export const VEG_HELPINGS = 3;

export interface VegSpot {
  kind: VegId;
  /** Garden tasks solved in total when it was planted. */
  at: number;
}

export function vegOf(id: VegId): VegKind {
  return VEGS.find((v) => v.id === id)!;
}

export function ownsVeg(p: Progress, id: VegId): boolean {
  return isWelcomed(p, vegOf(id).bringer);
}

export function ownedVegs(p: Progress): VegKind[] {
  return VEGS.filter((v) => ownsVeg(p, v.id));
}

/** Veteményes spots open now: none until a vegetable visitor has come, then five per open plot. */
export function openVeg(p: Progress): number {
  return ownedVegs(p).length > 0 ? openPlots(p) * VEG_SPOTS : 0;
}

export function vegAt(p: Progress, i: number): VegSpot | null {
  return p.veg[i] ?? null;
}

export function vegRipe(spot: VegSpot, tasks: number): boolean {
  return tasks - spot.at >= VEG_GROWS;
}

export function canPlantVeg(p: Progress, i: number, id: VegId): boolean {
  return i >= 0 && i < openVeg(p) && !vegAt(p, i) && ownsVeg(p, id) && seedBalance(p) >= VEG_COST;
}

export function plantVeg(p: Progress, i: number, id: VegId): Progress {
  if (!canPlantVeg(p, i, id)) return p;
  const veg = Array.from({ length: VEG_SPOTS * PLOTS }, (_, k) => vegAt(p, k));
  veg[i] = { kind: id, at: p.gardenTasks };
  return { ...p, veg, seedsSpent: p.seedsSpent + VEG_COST };
}

/** Ripe spots of this vegetable, in order. */
export function ripeVegSpots(p: Progress, id: VegId): number[] {
  return p.veg.flatMap((s, i) => (s && s.kind === id && vegRipe(s, p.gardenTasks) ? [i] : []));
}

/** Ripe vegetables of this kind, three to a spot. */
export function ripeVeg(p: Progress, id: VegId): number {
  return ripeVegSpots(p, id).length * VEG_HELPINGS;
}

/** The first ripe spots of a vegetable, as many as `n` vegetables fill; they are eaten. */
export function eatVeg(p: Progress, id: VegId, n: number): Progress {
  const spots = ripeVegSpots(p, id).slice(0, Math.ceil(n / VEG_HELPINGS));
  const veg = Array.from({ length: VEG_SPOTS * PLOTS }, (_, k) => (spots.includes(k) ? null : vegAt(p, k)));
  return { ...p, veg };
}

// ---------- pollen ----------
// Méhecske gathers pollen: the bee flies from flower to flower by itself and Csepi counts. Flowers in the beds and
// in the border both give it, and every flower stays; one that gave pollen has more again a few tasks later.

export const POLLEN_REST = 3;

/** Flowers with pollen now: "b3" is a grown flower in bed 3, "s7" the border flower in spot 7. */
export function pollenFlowers(p: Progress): string[] {
  const ready = (key: string) => {
    const at = p.pollen[key];
    return at === undefined || p.gardenTasks - at >= POLLEN_REST;
  };
  const beds = p.beds.flatMap((b, i) => (b && b.kind === 'flower' && isGrown(b, p.gardenTasks) ? [`b${i}`] : []));
  const border = p.border.flatMap((f, i) => (f ? [`s${i}`] : []));
  return [...beds, ...border].filter(ready);
}

export function takePollen(p: Progress, n: number): Progress {
  const taken = pollenFlowers(p).slice(0, n);
  return { ...p, pollen: { ...p.pollen, ...Object.fromEntries(taken.map((k) => [k, p.gardenTasks])) } };
}
