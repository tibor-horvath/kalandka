import type { Progress } from '../progress';
import type { FruitKind } from './harvest';
import { welcomedVisitors, type VisitorId } from './visitors';

// The Kiskert's beds: what can be planted (plants, tree kinds, flower kinds from the Magtár), the two plots, and the border.

export type PlantKind = 'flower' | 'bush' | 'tree';

export interface PlantOption {
  id: PlantKind;
  name: string;
  cost: number;
  /** Solved tasks after planting until it is grown: the bigger the plant, the longer it takes. */
  grows: number;
}

export const PLANT_OPTIONS: PlantOption[] = [
  { id: 'flower', name: 'Virág', cost: 3, grows: 3 },
  { id: 'bush', name: 'Áfonyabokor', cost: 6, grows: 5 },
  { id: 'tree', name: 'Fa', cost: 10, grows: 8 }
];

/** Beds in one plot: three rows of five. */
export const PLOT_BEDS = 15;
/** The Kiskert's plots: the second opens once every bed of the first is planted, and stays open. */
export const PLOTS = 2;
/** Beds in the whole garden, both plots. */
export const BEDS = PLOT_BEDS * PLOTS;

export interface Bed {
  kind: PlantKind;
  /** A flower's kind (see FLOWERS); none is the first one, Mályva. */
  flower?: FlowerId;
  /** A tree's kind (see TREES); none is the first one, the pear tree. */
  tree?: TreeId;
  /** Garden tasks solved in total when it was planted; growth counts the tasks solved since. */
  at: number;
  /** Garden tasks solved in total when it was last watered; none yet: care counts from when it grew. */
  watered?: number;
  /** Fruit picked since it was last watered (or grew). */
  picked?: number;
  /** Ripe fruit still on it when it was last watered: it stays on and counts toward its most. */
  kept?: number;
}

/** Seeds the child can still plant. `seeds` counts every seed ever earned. */
export function seedBalance(p: Progress): number {
  return Math.max(0, p.seeds - p.seedsSpent);
}

export function bedAt(p: Progress, i: number): Bed | null {
  return p.beds[i] ?? null;
}

/** Solved tasks a plant of this kind needs to grow. */
export function growAfter(kind: PlantKind): number {
  return PLANT_OPTIONS.find((o) => o.id === kind)!.grows;
}

/** 0 … growAfter(kind): how far a planting has grown, `tasks` being the garden's task clock. */
export function growthOf(bed: Bed, tasks: number): number {
  return Math.min(growAfter(bed.kind), Math.max(0, tasks - bed.at));
}

export function isGrown(bed: Bed, tasks: number): boolean {
  return growthOf(bed, tasks) >= growAfter(bed.kind);
}

/**
 * Beds that have grown something. A bed is never emptied (vegetables grow in the Veteményes, not in the beds),
 * so this only ever goes up: visitors and their ring never step back.
 */
export function grownCount(p: Progress): number {
  return p.beds.filter((b): b is Bed => !!b && isGrown(b, p.gardenTasks)).length;
}

/**
 * Beds the child can plant in: the first plot, and the second too once the first has been planted full. A bed
 * planted in the second plot keeps it open, so a save carried over from the ten-bed plots never loses it.
 */
export function openBeds(p: Progress): number {
  const firstFull = Array.from({ length: PLOT_BEDS }, (_, i) => bedAt(p, i)).every(Boolean);
  const secondUsed = p.beds.slice(PLOT_BEDS).some(Boolean);
  return firstFull || secondUsed ? BEDS : PLOT_BEDS;
}

/** Plots open now, 1 or 2. */
export function openPlots(p: Progress): number {
  return openBeds(p) / PLOT_BEDS;
}

/** Ten-bed plots of the old layout, for carrying a save over. */
const OLD_PLOT_BEDS = 10;

/**
 * A save from the ten-bed plots: each bed stays in the plot it was in (the first plot's ten stay where they were,
 * the second plot's move to its new start), and the five new beds of each plot start empty.
 */
export function carryOverBeds(beds: (Bed | null)[]): (Bed | null)[] {
  const out: (Bed | null)[] = Array.from({ length: BEDS }, () => null);
  beds.forEach((b, i) => {
    if (!b || i >= OLD_PLOT_BEDS * PLOTS) return;
    const plot = Math.floor(i / OLD_PLOT_BEDS);
    out[plot * PLOT_BEDS + (i % OLD_PLOT_BEDS)] = b;
  });
  return out;
}

/** Empty beds the child can plant in now, in order. */
export function emptyBeds(p: Progress): number[] {
  return Array.from({ length: openBeds(p) }, (_, i) => i).filter((i) => !bedAt(p, i));
}

/** Every bed of both plots is planted: spare seeds go to the pantry then. */
export function gardenFull(p: Progress): boolean {
  return openBeds(p) === BEDS && emptyBeds(p).length === 0;
}

export function canPlant(p: Progress, i: number, kind: PlantKind): boolean {
  const option = PLANT_OPTIONS.find((o) => o.id === kind);
  return !!option && i >= 0 && i < openBeds(p) && !bedAt(p, i) && seedBalance(p) >= option.cost;
}

/**
 * Plants in an empty bed; unchanged when the bed is taken or the seeds are not enough. A flower (or a tree) is of the
 * kind asked for when the child has it (see FLOWERS, TREES), else the first kind. The child counts the seeds out first (SeedCount).
 */
export function plant(p: Progress, i: number, kind: PlantKind, flower: FlowerId = FIRST_FLOWER, tree: TreeId = FIRST_TREE): Progress {
  if (!canPlant(p, i, kind)) return p;
  const cost = PLANT_OPTIONS.find((o) => o.id === kind)!.cost;
  const beds = Array.from({ length: BEDS }, (_, k) => bedAt(p, k));
  const kept =
    kind === 'flower' && flower !== FIRST_FLOWER && ownsFlower(p, flower)
      ? { flower }
      : kind === 'tree' && tree !== FIRST_TREE && ownsTree(p, tree)
        ? { tree }
        : {};
  beds[i] = { kind, at: p.gardenTasks, ...kept };
  return { ...p, beds, seedsSpent: p.seedsSpent + cost };
}

// ---------- tree kinds ----------
// Every child has the pear tree. The other trees' seeds come with a visitor who loves their fruit: Süni brings the
// apple, the blackbird the cherry, Mókus the walnut. Their fruit is picked into the basket like pears and is given
// straight to that visitor, a handful at a time; it goes into no recipe.

export type TreeId = 'pear' | 'apple' | 'cherry' | 'walnut';

export interface TreeKind {
  id: TreeId;
  name: string;
  /** "almafát": the tree as the thing planted, in Csepi's lines. */
  planted: string;
  fruit: FruitKind;
  /** The visitor who brings its seeds; none: every child has it. */
  bringer?: VisitorId;
}

export const TREES: TreeKind[] = [
  { id: 'pear', name: 'Körtefa', planted: 'körtefát', fruit: 'pear' },
  { id: 'apple', name: 'Almafa', planted: 'almafát', fruit: 'apple', bringer: 'hedgehog' },
  { id: 'cherry', name: 'Cseresznyefa', planted: 'cseresznyefát', fruit: 'cherry', bringer: 'blackbird' },
  { id: 'walnut', name: 'Diófa', planted: 'diófát', fruit: 'nut', bringer: 'squirrel' }
];

export const FIRST_TREE: TreeId = 'pear';

export function treeOf(id: TreeId): TreeKind {
  return TREES.find((t) => t.id === id) ?? TREES[0];
}

/** The tree kind growing in a bed (the pear tree unless another was planted). */
export function bedTree(bed: Bed): TreeId {
  return bed.tree ?? FIRST_TREE;
}

export function isWelcomed(p: Progress, id: VisitorId): boolean {
  return welcomedVisitors(p).some((v) => v.id === id);
}

export function ownsTree(p: Progress, id: TreeId): boolean {
  const bringer = treeOf(id).bringer;
  return !bringer || isWelcomed(p, bringer);
}

export function ownedTrees(p: Progress): TreeKind[] {
  return TREES.filter((t) => ownsTree(p, t.id));
}

/** "Körtefa", "Mályva", "Áfonyabokor": what grows in a bed, by its own kind. */
export function bedName(bed: Bed): string {
  if (bed.kind === 'flower') return flowerOf(bedFlower(bed)).name;
  if (bed.kind === 'tree') return treeOf(bedTree(bed)).name;
  return PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name;
}

// ---------- flower kinds (Magtár) ----------
// Every child has Mályva. The other flower kinds' seeds are bought once in the Magtár, counted out like any
// planting, and are the child's for good: from then on a flower in a bed or in the border can be of that kind.

export type FlowerId = 'malva' | 'tulip' | 'primrose' | 'cornflower' | 'bellflower';

export interface FlowerKind {
  id: FlowerId;
  name: string;
  /** "mályvát": the flower as the thing planted, in Csepi's lines. */
  planted: string;
  /** Seeds for the packet; 0: every child has it. */
  cost: number;
}

export const FLOWERS: FlowerKind[] = [
  { id: 'malva', name: 'Mályva', planted: 'mályvát', cost: 0 },
  { id: 'tulip', name: 'Tulipán', planted: 'tulipánt', cost: 3 },
  { id: 'primrose', name: 'Kankalin', planted: 'kankalint', cost: 4 },
  { id: 'cornflower', name: 'Búzavirág', planted: 'búzavirágot', cost: 5 },
  { id: 'bellflower', name: 'Harangvirág', planted: 'harangvirágot', cost: 6 }
];

export const FIRST_FLOWER: FlowerId = 'malva';

export function flowerOf(id: FlowerId): FlowerKind {
  return FLOWERS.find((f) => f.id === id) ?? FLOWERS[0];
}

/** The flower kind growing in a bed (Mályva unless another was planted). */
export function bedFlower(bed: Bed): FlowerId {
  return bed.flower ?? FIRST_FLOWER;
}

export function ownsFlower(p: Progress, id: FlowerId): boolean {
  return flowerOf(id).cost === 0 || p.flowersOwned.includes(id);
}

/** Flower kinds the child can plant, in the Magtár's order. */
export function ownedFlowers(p: Progress): FlowerKind[] {
  return FLOWERS.filter((f) => ownsFlower(p, f.id));
}

export function canBuyFlower(p: Progress, id: FlowerId): boolean {
  return !ownsFlower(p, id) && seedBalance(p) >= flowerOf(id).cost;
}

/** Buys a packet of flower seeds for good; unchanged when it is already the child's or the seeds are not enough. */
export function buyFlower(p: Progress, id: FlowerId): Progress {
  if (!canBuyFlower(p, id)) return p;
  return { ...p, flowersOwned: [...p.flowersOwned, id], seedsSpent: p.seedsSpent + flowerOf(id).cost };
}

// ---------- the border (Szegély) ----------
// In front of each open plot runs a border of ten small flowers. An empty spot takes one seed; a flower already
// there can be changed to another kind the child has, free, so trying out a pattern never costs anything.
// When all ten make a repeating pattern, Csepi says so. Nothing in the border ever goes away on its own.

/** Spots in the border of one plot. */
export const BORDER_SPOTS = 10;
export const BORDER_COST = 1;

export function borderAt(p: Progress, i: number): FlowerId | null {
  return p.border[i] ?? null;
}

/** Border spots open now: one row per open plot. */
export function openBorder(p: Progress): number {
  return openPlots(p) * BORDER_SPOTS;
}

/** Empty border spots in one plot's row, in order. */
export function emptyBorder(p: Progress, plot: number): number[] {
  return Array.from({ length: BORDER_SPOTS }, (_, k) => plot * BORDER_SPOTS + k).filter((i) => i < openBorder(p) && !borderAt(p, i));
}

export function canPlantBorder(p: Progress, i: number, id: FlowerId): boolean {
  if (i < 0 || i >= openBorder(p) || !ownsFlower(p, id)) return false;
  const now = borderAt(p, i);
  return now ? now !== id : seedBalance(p) >= BORDER_COST;
}

/** Plants a border flower (one seed) or changes the kind of the one there (free); unchanged when it cannot. */
export function plantBorder(p: Progress, i: number, id: FlowerId): Progress {
  if (!canPlantBorder(p, i, id)) return p;
  const border = Array.from({ length: openBorder(p) }, (_, k) => borderAt(p, k));
  const paid = border[i] ? 0 : BORDER_COST;
  border[i] = id;
  return { ...p, border, seedsSpent: p.seedsSpent + paid };
}

/**
 * The repeating unit of a full border row, shortest first ("malva, tulip" for ABABABABAB), when its ten flowers
 * repeat a unit of two to five flowers with at least two kinds in it; null otherwise. The tenth flower may end
 * part-way through the unit, as a pattern written out does.
 */
export function borderPattern(p: Progress, plot: number): FlowerId[] | null {
  const row = Array.from({ length: BORDER_SPOTS }, (_, k) => borderAt(p, plot * BORDER_SPOTS + k));
  if (row.some((f) => !f)) return null;
  const spots = row as FlowerId[];
  for (let n = 2; n <= 5; n++) {
    const unit = spots.slice(0, n);
    if (new Set(unit).size < 2) continue;
    if (spots.every((f, k) => f === unit[k % n])) return unit;
  }
  return null;
}
