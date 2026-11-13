import type { Progress } from '../progress';
import { BEDS, bedAt, bedTree, gardenFull, growAfter, isGrown, seedBalance, treeOf, type Bed, type PlantKind } from './beds';

// Care and the pantry: grown bushes and trees ripen fruit and get thirsty; picked fruit (or spare seeds) becomes treats.

// ---------- care: thirst and fruit ----------
// A grown bush or tree ripens one fruit per solved task, which the child picks into the basket. A few
// tasks after it was last watered it gets thirsty and stops ripening until the child waters it, which
// is free. Thirsty is the worst a plant ever gets: it never wilts, picked fruit is kept, and fruit
// still on a plant stays on it when it is watered, for the child to pick. Everything counts tasks, not time, so a
// week away leaves the garden as the child left it. Flowers need no care.

/** Solved tasks after watering (or growing) until a bush or tree is thirsty again. */
export const THIRSTY_AFTER = 5;

export type FruitKind = 'pear' | 'berry' | 'apple' | 'cherry' | 'nut';
/** Fruit that goes into no recipe: each is given straight to the visitor who loves it. */
export type GiftFruit = 'apple' | 'cherry' | 'nut';

/** Fruit a plant ripens between two waterings; a flower ripens none and needs no care. */
export const FRUIT_MAX: Record<PlantKind, number> = { flower: 0, bush: 3, tree: 5 };

/** "körte", "áfonya": the fruit, as Csepi says it. */
export const FRUIT_NAMES: Record<FruitKind, string> = { pear: 'körte', berry: 'áfonya', apple: 'alma', cherry: 'cseresznye', nut: 'dió' };

export function fruitOf(bed: Bed): FruitKind | null {
  return bed.kind === 'tree' ? treeOf(bedTree(bed)).fruit : bed.kind === 'bush' ? 'berry' : null;
}

/** "körte", "áfonya": what the child picks from this plant. */
export function fruitName(bed: Bed): string {
  const f = fruitOf(bed);
  return f ? FRUIT_NAMES[f] : '';
}

/** The task count care is measured from: the last watering, or when it grew. */
function caredAt(bed: Bed): number {
  return bed.watered ?? bed.at + growAfter(bed.kind);
}

export function isThirsty(bed: Bed, tasks: number): boolean {
  return FRUIT_MAX[bed.kind] > 0 && isGrown(bed, tasks) && tasks - caredAt(bed) >= THIRSTY_AFTER;
}

/** Fruit hanging on the plant, ready to pick. */
export function ripeFruit(bed: Bed, tasks: number): number {
  if (!isGrown(bed, tasks)) return 0;
  const ripened = Math.min(FRUIT_MAX[bed.kind], (bed.kept ?? 0) + Math.min(THIRSTY_AFTER, Math.max(0, tasks - caredAt(bed))));
  return Math.max(0, ripened - pickedFruit(bed));
}

/** Fruit picked from the plant since its last watering: the child counts these aloud. */
export function pickedFruit(bed: Bed): number {
  return bed.picked ?? 0;
}

export function thirstyBeds(p: Progress): number[] {
  return p.beds.flatMap((b, i) => (b && isThirsty(b, p.gardenTasks) ? [i] : []));
}

export function ripeTotal(p: Progress): number {
  return p.beds.reduce((n, b) => n + (b ? ripeFruit(b, p.gardenTasks) : 0), 0);
}

function withBed(p: Progress, i: number, bed: Bed): (Bed | null)[] {
  const beds = Array.from({ length: BEDS }, (_, k) => bedAt(p, k));
  beds[i] = bed;
  return beds;
}

function addFruit(p: Progress, bed: Bed, n: number): Progress {
  const f = fruitOf(bed);
  if (f === 'pear') return { ...p, pears: p.pears + n };
  if (f === 'berry') return { ...p, berries: p.berries + n };
  if (!f) return p;
  return { ...p, basket: { ...p.basket, [f]: basketOf(p, f) + n } };
}

/** Apples, cherries or walnuts in the basket, waiting for the visitor who loves them. */
export function basketOf(p: Progress, f: GiftFruit): number {
  return p.basket[f] ?? 0;
}

/** Everything in the basket, for the one basket pill in the top bar. */
export function basketTotal(p: Progress): number {
  return basketPears(p) + basketBerries(p) + basketOf(p, 'apple') + basketOf(p, 'cherry') + basketOf(p, 'nut');
}

/** Picks one ripe fruit into the basket; unchanged when there is none. */
export function pickFruit(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || ripeFruit(bed, p.gardenTasks) === 0) return p;
  return addFruit({ ...p, beds: withBed(p, i, { ...bed, picked: pickedFruit(bed) + 1 }) }, bed, 1);
}

/** Waters a thirsty plant; fruit still on it stays there to pick. Unchanged when it is not thirsty. */
export function water(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || !isThirsty(bed, p.gardenTasks)) return p;
  const kept = ripeFruit(bed, p.gardenTasks);
  return { ...p, beds: withBed(p, i, { ...bed, watered: p.gardenTasks, picked: 0, kept }) };
}

/** Waters every thirsty plant at once (the watering can). */
export function waterAll(p: Progress): Progress {
  return thirstyBeds(p).reduce(water, p);
}

// ---------- the pantry (Kamra) ----------
// Fruit in the basket is made into treats that stand on the pantry shelf for good: the child counts
// out the fruit a recipe asks for. Once both plots are planted full, spare seeds bake a seed loaf, so
// seeds and fruit always have a use. Making a treat is always the child's choice, like planting.

export type TreatId = 'jam' | 'compote' | 'pie' | 'loaf';

export interface Recipe {
  id: TreatId;
  name: string;
  pears: number;
  berries: number;
  seeds: number;
}

export const RECIPES: Recipe[] = [
  { id: 'jam', name: 'Áfonyalekvár', pears: 0, berries: 3, seeds: 0 },
  { id: 'compote', name: 'Körtebefőtt', pears: 3, berries: 0, seeds: 0 },
  { id: 'pie', name: 'Gyümölcspite', pears: 2, berries: 2, seeds: 0 },
  { id: 'loaf', name: 'Magos kalács', pears: 0, berries: 0, seeds: 5 }
];

export function recipeOf(id: TreatId): Recipe {
  return RECIPES.find((r) => r.id === id)!;
}

/** Pears in the basket: picked ones not yet made into treats. `pears` counts every pear ever picked. */
export function basketPears(p: Progress): number {
  return Math.max(0, p.pears - p.pearsUsed);
}

export function basketBerries(p: Progress): number {
  return Math.max(0, p.berries - p.berriesUsed);
}

/** The seed loaf waits until there is nowhere left to plant, so seeds go to the garden first. */
export function recipeOpen(p: Progress, id: TreatId): boolean {
  return id !== 'loaf' || gardenFull(p);
}

export function canMake(p: Progress, id: TreatId): boolean {
  const r = recipeOf(id);
  return recipeOpen(p, id) && basketPears(p) >= r.pears && basketBerries(p) >= r.berries && seedBalance(p) >= r.seeds;
}

/** Makes a treat for the shelf; unchanged when the basket (or the seeds) are not enough. */
export function make(p: Progress, id: TreatId): Progress {
  if (!canMake(p, id)) return p;
  const r = recipeOf(id);
  return {
    ...p,
    pearsUsed: p.pearsUsed + r.pears,
    berriesUsed: p.berriesUsed + r.berries,
    seedsSpent: p.seedsSpent + r.seeds,
    pantry: { ...p.pantry, [id]: (p.pantry[id] ?? 0) + 1 }
  };
}

export function treatsOf(p: Progress, id: TreatId): number {
  return p.pantry[id] ?? 0;
}

/** Treats on the shelf, all kinds. */
export function pantryCount(p: Progress): number {
  return RECIPES.reduce((n, r) => n + treatsOf(p, r.id), 0);
}

export function canMakeAnything(p: Progress): boolean {
  return RECIPES.some((r) => canMake(p, r.id));
}
