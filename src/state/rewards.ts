import { LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { GAMES, type GameId } from './games';
import type { Progress } from './progress';
import type { WorldId } from './worlds';
import { ladderOf, type LadderGame } from './ladder';
import { FRIENDS, boughtCount, friendsOf, secondRobotOpen } from './robotParts';
import { creditTasks, rewardFor } from './pod';
import { today } from './screenTime';

// The reward loop: every two solved tasks fill a pod that pays a seed (see pod.ts); seeds are planted in the child's own garden
// (Kiskert); plants grow as the child keeps playing; a grown garden brings visitors; picked fruit
// (and, once the garden is full, spare seeds) is made into treats for the pantry shelf; and each new
// skill earns a sticker for the album. Grown bushes and trees also ask for care (see below), but
// rewards are only ever added: nothing wilts, nothing is taken away, nothing is random and nothing
// depends on time played.

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

function isWelcomed(p: Progress, id: VisitorId): boolean {
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

// ---------- visitors ----------

export type VisitorId =
  | 'hedgehog'
  | 'ladybug'
  | 'butterfly'
  | 'blackbird'
  | 'frog'
  | 'squirrel'
  | 'snail'
  | 'bee'
  | 'rabbit'
  | 'mole'
  | 'lizard'
  | 'owl';

export interface Visitor {
  id: VisitorId;
  name: string;
  /** Beds that have grown something, which bring it. */
  after: number;
  /** Csepi's line when it arrives. */
  speech: string;
}

export const VISITORS: Visitor[] = [
  { id: 'hedgehog', name: 'Süni', after: 3, speech: 'Nézd, ki jött! Süni beköltözött a kertedbe. Itt marad veled.' },
  { id: 'ladybug', name: 'Katica', after: 5, speech: 'Nézd, ki jött! Katica leszállt a kertedbe. Itt marad veled.' },
  { id: 'butterfly', name: 'Pillangó', after: 8, speech: 'Nézd, ki jött! Egy pillangó táncol a virágaid között.' },
  { id: 'blackbird', name: 'Rigó', after: 10, speech: 'Nézd, ki jött! A rigó fészket rakott a kertedben. Itt marad veled.' },
  { id: 'frog', name: 'Béka', after: 13, speech: 'Nézd, ki jött! Egy kis béka ugrált be a kertedbe. Itt marad veled.' },
  { id: 'squirrel', name: 'Mókus', after: 16, speech: 'Nézd, ki jött! Mókus beköltözött a kertedbe. Itt marad veled.' },
  { id: 'snail', name: 'Csiga', after: 18, speech: 'Nézd, ki jött! Egy kis csiga mászott be a kertedbe. Itt marad veled.' },
  { id: 'bee', name: 'Méhecske', after: 20, speech: 'Nézd, ki jött! Egy méhecske zümmög a virágaid között. Itt marad veled.' },
  { id: 'rabbit', name: 'Nyuszi', after: 22, speech: 'Nézd, ki jött! Nyuszi beugrott a kertedbe. Itt marad veled.' },
  { id: 'mole', name: 'Vakond', after: 25, speech: 'Nézd, ki jött! Vakond kidugta a fejét a földből. Itt marad veled.' },
  { id: 'lizard', name: 'Gyík', after: 27, speech: 'Nézd, ki jött! Egy kis gyík napozik a kertedben. Itt marad veled.' },
  { id: 'owl', name: 'Bagoly', after: 30, speech: 'Nézd, ki jött! Bagoly költözött a kertedbe. Tele van a kert!' }
];

export function visitorOf(id: VisitorId): Visitor {
  return VISITORS.find((v) => v.id === id)!;
}

export function visitorsOf(p: Progress): Visitor[] {
  const grown = grownCount(p);
  return VISITORS.filter((v) => grown >= v.after);
}

/** The next visitor that arrived but has not been welcomed yet. */
export function newVisitor(p: Progress): Visitor | null {
  return visitorsOf(p)[p.visitorsSeen] ?? null;
}

/** How far along the way to a visitor is: `done` of `need` since the one before, and `coming` on the way. */
export interface ArrivalProgress {
  need: number;
  done: number;
  coming: number;
}

/**
 * The way to the next visitor still to welcome: grown plants since the visitor before it, and plants planted but
 * still growing, which count once they grow. Null once every visitor has come.
 */
export function visitorProgress(p: Progress): ArrivalProgress | null {
  const next = VISITORS[p.visitorsSeen];
  if (!next) return null;
  const from = VISITORS[p.visitorsSeen - 1]?.after ?? 0;
  const need = next.after - from;
  const done = Math.min(need, Math.max(0, grownCount(p) - from));
  const growing = p.beds.filter((b) => !!b && !isGrown(b, p.gardenTasks)).length;
  return { need, done, coming: Math.min(growing, need - done) };
}

/** Visitors already welcomed, in order of arrival. */
export function welcomedVisitors(p: Progress): Visitor[] {
  return visitorsOf(p).slice(0, p.visitorsSeen);
}

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
function eatVeg(p: Progress, id: VegId, n: number): Progress {
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

function takePollen(p: Progress, n: number): Progress {
  const taken = pollenFlowers(p).slice(0, n);
  return { ...p, pollen: { ...p.pollen, ...Object.fromEntries(taken.map((k) => [k, p.gardenTasks])) } };
}

// ---------- gifts and decorations ----------
// Each visitor takes five gifts. A treat from the pantry shelf is one, then two, up to five; a visitor who loves
// something from the garden (its vegetable, its tree's fruit, pollen) or seeds takes three of it, then six, up to
// fifteen, counted out together. Every gift leaves a decoration in the visitor's corner for good. When all sixty
// are there, the garden is done (Kész a kert!). Giving is always the child's choice, like cooking.

export const GIFTS_EACH = 5;
/** Garden food (or seeds) standing in for one treat. */
export const FOOD_PER_TREAT = 3;

export type FoodId = VegId | GiftFruit | 'pollen';

export type DecorId =
  | 'mushroom'
  | 'leaves'
  | 'hedgehog-house'
  | 'apple-basket'
  | 'brushwood'
  | 'spotted-stone'
  | 'fence'
  | 'daisies'
  | 'poppies'
  | 'bug-hotel'
  | 'lavender'
  | 'sunflower'
  | 'arch'
  | 'dandelions'
  | 'flag'
  | 'feeder'
  | 'birdbath'
  | 'birdhouse'
  | 'nest'
  | 'cherry-branch'
  | 'reeds'
  | 'stepping-stones'
  | 'pond'
  | 'waterlily'
  | 'bridge'
  | 'pinecone'
  | 'stump'
  | 'swing'
  | 'nut-pile'
  | 'rope-bridge'
  | 'lettuce-leaf'
  | 'mossy-stone'
  | 'puddle'
  | 'toadstool'
  | 'snail-stairs'
  | 'hive'
  | 'honey-pot'
  | 'flower-box'
  | 'bee-bath'
  | 'sunflower-row'
  | 'clover'
  | 'burrow'
  | 'flower-basket'
  | 'carrot-cart'
  | 'straw-hat'
  | 'molehill'
  | 'spade'
  | 'worm-house'
  | 'miner-hat'
  | 'tunnel'
  | 'sun-stone'
  | 'stone-wall'
  | 'fern'
  | 'sandbox'
  | 'cactus'
  | 'hollow'
  | 'moon-lamp'
  | 'feather'
  | 'branch-swing'
  | 'star-spinner';

export interface Decor {
  id: DecorId;
  name: string;
}

export interface Wish {
  visitor: VisitorId;
  /** The treat from the pantry shelf it likes. */
  treat: TreatId;
  /** What it loves from the garden, offered first on its gift card. */
  food?: FoodId;
  /** What the visitor leaves after each gift, in order. */
  decor: Decor[];
}

const d = (id: DecorId, name: string): Decor => ({ id, name });

export const WISHES: Wish[] = [
  {
    visitor: 'hedgehog',
    treat: 'jam',
    food: 'apple',
    decor: [d('mushroom', 'Gomba'), d('leaves', 'Levélkupac'), d('hedgehog-house', 'Sünház'), d('apple-basket', 'Almás kosár'), d('brushwood', 'Rőzserakás')]
  },
  {
    visitor: 'ladybug',
    treat: 'pie',
    decor: [d('spotted-stone', 'Pöttyös kő'), d('fence', 'Kis kerítés'), d('daisies', 'Százszorszép-csokor'), d('poppies', 'Pipacs'), d('bug-hotel', 'Rovarhotel')]
  },
  {
    visitor: 'butterfly',
    treat: 'jam',
    decor: [d('lavender', 'Levendula'), d('sunflower', 'Napraforgó'), d('arch', 'Virágkapu'), d('dandelions', 'Pitypang'), d('flag', 'Szivárványzászló')]
  },
  {
    visitor: 'blackbird',
    treat: 'loaf',
    food: 'cherry',
    decor: [d('feeder', 'Madáretető'), d('birdbath', 'Madáritató'), d('birdhouse', 'Madárodú'), d('nest', 'Fészek'), d('cherry-branch', 'Cseresznyeág')]
  },
  {
    visitor: 'frog',
    treat: 'compote',
    decor: [d('reeds', 'Kis nádas'), d('stepping-stones', 'Ugróköves ösvény'), d('pond', 'Kis tó'), d('waterlily', 'Tündérrózsa'), d('bridge', 'Kis híd')]
  },
  {
    visitor: 'squirrel',
    treat: 'loaf',
    food: 'nut',
    decor: [d('pinecone', 'Toboz'), d('stump', 'Fatönk'), d('swing', 'Hinta'), d('nut-pile', 'Mogyorókupac'), d('rope-bridge', 'Kötélhíd')]
  },
  {
    visitor: 'snail',
    treat: 'pie',
    food: 'lettuce',
    decor: [d('lettuce-leaf', 'Salátalevél'), d('mossy-stone', 'Mohás kő'), d('puddle', 'Tócsa'), d('toadstool', 'Gombaernyő'), d('snail-stairs', 'Csigalépcső')]
  },
  {
    visitor: 'bee',
    treat: 'jam',
    food: 'pollen',
    decor: [d('hive', 'Kaptár'), d('honey-pot', 'Mézescsupor'), d('flower-box', 'Virágláda'), d('bee-bath', 'Méhitató'), d('sunflower-row', 'Napraforgósor')]
  },
  {
    visitor: 'rabbit',
    treat: 'jam',
    food: 'carrot',
    decor: [d('clover', 'Lóhere'), d('burrow', 'Üreg'), d('flower-basket', 'Virágos kosár'), d('carrot-cart', 'Répás szekér'), d('straw-hat', 'Szalmakalap')]
  },
  {
    visitor: 'mole',
    treat: 'compote',
    decor: [d('molehill', 'Túrás'), d('spade', 'Kis lapát'), d('worm-house', 'Gilisztaház'), d('miner-hat', 'Bányászsisak'), d('tunnel', 'Alagút')]
  },
  {
    visitor: 'lizard',
    treat: 'pie',
    decor: [d('sun-stone', 'Napozó kő'), d('stone-wall', 'Kőfal'), d('fern', 'Páfrány'), d('sandbox', 'Homokozó'), d('cactus', 'Kaktusz')]
  },
  {
    visitor: 'owl',
    treat: 'loaf',
    decor: [d('hollow', 'Odú'), d('moon-lamp', 'Holdlámpa'), d('feather', 'Toll'), d('branch-swing', 'Ág-hinta'), d('star-spinner', 'Csillagforgó')]
  }
];

/** "áfonyalekvárt": a treat as the thing asked for, in Csepi's lines. */
export const TREAT_WANTED: Record<TreatId, string> = {
  jam: 'áfonyalekvárt',
  compote: 'körtebefőttet',
  pie: 'gyümölcspitét',
  loaf: 'magos kalácsot'
};

/** Garden food: its name, one of it and many of it, as Csepi says them ("répa", "répát", "répát"). */
export const FOOD_NAMES: Record<FoodId, { name: string; wanted: string }> = {
  carrot: { name: 'répa', wanted: 'répát' },
  lettuce: { name: 'saláta', wanted: 'salátát' },
  apple: { name: 'alma', wanted: 'almát' },
  cherry: { name: 'cseresznye', wanted: 'cseresznyét' },
  nut: { name: 'dió', wanted: 'diót' },
  pollen: { name: 'virágpor', wanted: 'virágport' }
};

export function wishOf(id: VisitorId): Wish {
  return WISHES.find((w) => w.visitor === id)!;
}

/** Gifts this visitor has had, 0 … GIFTS_EACH. */
export function giftsOf(p: Progress, id: VisitorId): number {
  return Math.min(GIFTS_EACH, p.gifts[id] ?? 0);
}

/** Treats the visitor's next gift takes (one, then two, up to five); 0 once they have had them all. */
export function giftSize(p: Progress, id: VisitorId): number {
  const given = giftsOf(p, id);
  return given >= GIFTS_EACH ? 0 : given + 1;
}

/** Decorations this visitor has left so far. */
export function decorOf(p: Progress, id: VisitorId): Decor[] {
  return wishOf(id).decor.slice(0, giftsOf(p, id));
}

export function canGive(p: Progress, id: VisitorId): boolean {
  const n = giftSize(p, id);
  return n > 0 && isWelcomed(p, id) && treatsOf(p, wishOf(id).treat) >= n;
}

/** Gives the visitor their next gift from the shelf; unchanged when it is not there yet. */
export function give(p: Progress, id: VisitorId): Progress {
  if (!canGive(p, id)) return p;
  const { treat } = wishOf(id);
  return {
    ...p,
    pantry: { ...p.pantry, [treat]: treatsOf(p, treat) - giftSize(p, id) },
    gifts: { ...p.gifts, [id]: giftsOf(p, id) + 1 }
  };
}

/** Garden food the visitor's next gift takes (3, 6 … 15); 0 when it loves nothing from the garden or has had every gift. */
export function foodGiftSize(p: Progress, id: VisitorId): number {
  return wishOf(id).food ? giftSize(p, id) * FOOD_PER_TREAT : 0;
}

/** How much of a garden food there is to give now. */
export function foodOnHand(p: Progress, food: FoodId): number {
  if (food === 'carrot' || food === 'lettuce') return ripeVeg(p, food);
  if (food === 'pollen') return pollenFlowers(p).length;
  return basketOf(p, food);
}

export function canGiveFood(p: Progress, id: VisitorId): boolean {
  const { food } = wishOf(id);
  const n = foodGiftSize(p, id);
  return !!food && n > 0 && isWelcomed(p, id) && foodOnHand(p, food) >= n;
}

function spendFood(p: Progress, food: FoodId, n: number): Progress {
  if (food === 'carrot' || food === 'lettuce') return eatVeg(p, food, n);
  if (food === 'pollen') return takePollen(p, n);
  return { ...p, basket: { ...p.basket, [food]: basketOf(p, food) - n } };
}

/** Gives the visitor their next gift from the garden; it leaves the same decoration a treat would. */
export function giveFood(p: Progress, id: VisitorId): Progress {
  if (!canGiveFood(p, id)) return p;
  const used = spendFood(p, wishOf(id).food!, foodGiftSize(p, id));
  return { ...used, gifts: { ...p.gifts, [id]: giftsOf(p, id) + 1 } };
}

// The birds of the garden also eat seeds: instead of a treat from the shelf, the blackbird, Mókus and Bagoly take a
// handful of seeds, three for each treat they ask for (3, then 6 … 15), counted out like a planting. So the
// birds, who like the seed loaf, need not wait for the garden to be planted full.

export const SEED_EATERS: VisitorId[] = ['blackbird', 'squirrel', 'owl'];
/** Seeds standing in for one treat. */
export const SEEDS_PER_TREAT = FOOD_PER_TREAT;

export function eatsSeeds(id: VisitorId): boolean {
  return SEED_EATERS.includes(id);
}

/** Seeds the visitor's next gift takes as a handful; 0 when they take no seeds or have had every gift. */
export function seedGiftSize(p: Progress, id: VisitorId): number {
  return eatsSeeds(id) ? giftSize(p, id) * SEEDS_PER_TREAT : 0;
}

export function canGiveSeeds(p: Progress, id: VisitorId): boolean {
  const n = seedGiftSize(p, id);
  return n > 0 && isWelcomed(p, id) && seedBalance(p) >= n;
}

/** Gives the visitor their next gift as a handful of seeds; it leaves the same decoration a treat would. */
export function giveSeeds(p: Progress, id: VisitorId): Progress {
  if (!canGiveSeeds(p, id)) return p;
  return { ...p, seedsSpent: p.seedsSpent + seedGiftSize(p, id), gifts: { ...p.gifts, [id]: giftsOf(p, id) + 1 } };
}

/** Welcomed visitors whose next gift is ready: on the shelf, in the garden, or (for the birds) in the seed bag. */
export function giftsReady(p: Progress): Visitor[] {
  return welcomedVisitors(p).filter((v) => canGive(p, v.id) || canGiveFood(p, v.id) || canGiveSeeds(p, v.id));
}

// After its five gifts, a vegetable visitor still eats a snack: tapping it offers one ripe spot of its vegetable,
// once a day. It is only ever offered on a tap, never as a reminder.

/** Vegetables in one snack: one spot. */
export const SNACK_SIZE = VEG_HELPINGS;

export function canSnack(p: Progress, id: VisitorId, day = today()): boolean {
  const { food } = wishOf(id);
  if (food !== 'carrot' && food !== 'lettuce') return false;
  return giftsOf(p, id) >= GIFTS_EACH && p.snacked[id] !== day && ripeVeg(p, food) >= SNACK_SIZE;
}

/** The visitor eats one ripe spot of its vegetable; unchanged when it cannot today. */
export function snack(p: Progress, id: VisitorId, day = today()): Progress {
  if (!canSnack(p, id, day)) return p;
  const food = wishOf(id).food as VegId;
  return { ...eatVeg(p, food, SNACK_SIZE), snacked: { ...p.snacked, [id]: day } };
}

export function decorCount(p: Progress): number {
  return VISITORS.reduce((n, v) => n + giftsOf(p, v.id), 0);
}

/** Every visitor has had every gift: the garden is done. */
export function gardenDone(p: Progress): boolean {
  return decorCount(p) === VISITORS.length * GIFTS_EACH;
}

/** What a visitor brings when it arrives: the seeds of its tree or vegetable, if any. */
export function broughtBy(id: VisitorId): { tree?: TreeKind; veg?: VegKind } | null {
  const tree = TREES.find((t) => t.bringer === id);
  const veg = VEGS.find((v) => v.bringer === id);
  return tree ? { tree } : veg ? { veg } : null;
}

// ---------- stickers ----------

/** Each world's reward place (Kiskert, Robotépítő) and finished paper sheets have album rows of their own, next to the games. */
export type StickerGameId = GameId | 'kiskert' | 'robotepito' | 'paper-garden' | 'paper-robot';

export interface Sticker {
  id: string;
  game: StickerGameId;
  /** Printed on the sticker. */
  mark: string;
  label: string;
  /** Csepi's line when it is collected. */
  praise: string;
  earned: (p: Progress) => boolean;
  /** Feladatlapok stickers carry a drawn sheet under the mark: one page, or a stack once there are five or more. */
  sheets?: 'one' | 'stack';
  /** The last sticker of a row, with a gold ring. */
  gold?: boolean;
}

export interface StickerGame {
  id: StickerGameId;
  name: string;
  color: string;
  ink: string;
  /** The world whose album page the game is on. */
  world: WorldId;
}

/** A game's album row: its name and world from the game list; `name` only to hyphenate a long one. */
function gameRow(id: GameId, color: string, ink: string, name = GAMES[id].name): StickerGame {
  return { id, name, color, ink, world: GAMES[id].world };
}

/** Album order and each game's sticker colour (light ones carry dark ink). Soft hyphens keep long names whole in the album's narrow columns. */
export const STICKER_GAMES: StickerGame[] = [
  gameRow('learn', '#2E86DE', '#FFFFFF'),
  gameRow('water', '#9FCDF3', '#10233A'),
  gameRow('patterns', '#F4A3C4', '#10233A'),
  gameRow('flash', '#8A5A3B', '#FFFFFF'),
  gameRow('add', '#FFC93C', '#10233A'),
  gameRow('trace', '#D9741A', '#FFFFFF'),
  gameRow('pots', '#2F7D32', '#FFFFFF', 'Cserép­barátok'),
  { id: 'kiskert', name: 'Kiskert', color: '#7A4FB5', ink: '#FFFFFF', world: 'garden' },
  { id: 'paper-garden', name: 'Feladat­lapok', color: '#F3E3B3', ink: '#10233A', world: 'garden' },
  gameRow('path', '#138A86', '#FFFFFF'),
  gameRow('sort', '#5E7184', '#FFFFFF', 'Válogató­gép'),
  gameRow('scale', '#F2B33D', '#10233A'),
  gameRow('seq', '#2E5FA8', '#FFFFFF'),
  gameRow('mirror', '#7FE9F0', '#10233A'),
  gameRow('code', '#C98F4E', '#10233A'),
  gameRow('fix', '#D9741A', '#FFFFFF', 'Hiba­vadász'),
  { id: 'robotepito', name: 'Robot­építő', color: '#7A4FB5', ink: '#FFFFFF', world: 'robot' },
  { id: 'paper-robot', name: 'Feladat­lapok', color: '#D5DEE6', ink: '#10233A', world: 'robot' }
];

/** Pages done from this world's games: a sticker waits on the page's own world, like the game's. */
export function pagesDoneIn(p: Progress, world: WorldId): number {
  return p.pagesDone.filter((key) => STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world === world).length;
}

function pageWorld(key: string): WorldId | undefined {
  return STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world;
}

/** What a finished page of `tasks` tasks pays now: its tasks fill the reward pod like solved tasks in its world's games. */
export function pageReward(p: Progress, key: string, tasks: number): { seeds: number; bolts: number } {
  const world = pageWorld(key);
  const pay = world ? rewardFor(p, world, tasks) : 0;
  return { seeds: world === 'garden' ? pay : 0, bolts: world === 'robot' ? pay : 0 };
}

/**
 * A grown-up saw the page finished. It counts once, for finishing, never for how many answers were right,
 * and it changes no level. Its `tasks` fill the reward pod (see `pageReward`). There is no taking it back: a sticker that has been stuck in stays.
 */
export function markPageDone(p: Progress, key: string, tasks: number): Progress {
  if (p.pagesDone.includes(key)) return p;
  const world = pageWorld(key);
  const done = { ...p, pagesDone: [...p.pagesDone, key] };
  return world ? creditTasks(done, world, tasks) : done;
}

/** Feladatlapok stickers: pages done in a world. */
const pagesIn = (world: WorldId, count: number) => (p: Progress) => pagesDoneIn(p, world) >= count;

/** The highest level of this game's printed sheet (0-based, as in the page key) with a page marked done; -1 for none. */
export function sheetTop(p: Progress, game: GameId): number {
  return p.pagesDone.reduce((top, key) => {
    const [id, , level] = key.split('.');
    return id === game ? Math.max(top, Number(level)) : top;
  }, -1);
}

/**
 * The ladder level each printed sheet level stands for, where the sheet's levels are not the game's own: the
 * sheet joins or splits some levels (Csepp-kert's first sheet is both small-drop levels, Virágsor prints AAB and ABB apart).
 */
const SHEET_LADDER: Partial<Record<LadderGame, number[]>> = {
  water: [1, 2],
  patterns: [0, 1, 2, 2, 3],
  trace: [0, 1, 3]
};

/** The highest ladder level a finished sheet of this game stands for; -1 for none. */
function sheetLadderTop(p: Progress, game: LadderGame): number {
  const top = sheetTop(p, game);
  return top < 0 ? -1 : (SHEET_LADDER[game]?.[top] ?? top);
}

/**
 * A game's level stickers, easiest first: one per level, or one per few neighbouring levels in the games with
 * long ladders (Méhkas, Robotút), so no game has more than seven. `from` is the first level (0-based) the
 * sticker stands for: it is earned with the first task solved there, so a child who keeps needing help on a
 * level still has its sticker. `legacy` names the stickers of the old hand-picked list it replaces.
 */
interface LevelSticker {
  from: number;
  mark: string;
  label: string;
  praise: string;
  legacy?: string[];
}

export const MAX_LEVEL_STICKERS = 7;

export const LEVEL_STICKERS: Record<LadderGame, LevelSticker[]> = {
  water: [
    { from: 0, mark: '1', label: 'Első virág', praise: 'Kinőtt az első virágod!', legacy: ['water-1'] },
    { from: 1, mark: '10', label: 'Tízes keret', praise: 'Már tíz cseppig locsolsz!', legacy: ['water-10'] },
    { from: 2, mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', legacy: ['water-20'] },
    { from: 3, mark: '+', label: 'Továbbszámolás', praise: 'Már tovább tudsz számolni!' },
    { from: 4, mark: '10+', label: 'Tízen át', praise: 'Már a tízesen is átlocsolsz!' },
    { from: 5, mark: '2, 4', label: 'Kettesével', praise: 'Már kettesével is számolsz!' }
  ],
  patterns: [
    { from: 0, mark: 'AB', label: 'Kettes sor', praise: 'Folytattad az első virágsort!', legacy: ['patterns-ab'] },
    { from: 1, mark: 'ABC', label: 'Hármas sor', praise: 'Már a hármas sort is folytatod!', legacy: ['patterns-abc'] },
    { from: 2, mark: 'AAB', label: 'Kettő-egy', praise: 'Már a kettő-egy sort is kitalálod!' },
    { from: 3, mark: '?', label: 'Hiányzó virág', praise: 'Megtalálod a hiányzó virágot is!', legacy: ['patterns-all'] },
    { from: 4, mark: 'AABB', label: 'Kettő-kettő', praise: 'Már a kettő-kettő sort is folytatod!' },
    { from: 5, mark: '+1', label: 'Növő csokor', praise: 'Látod, hogyan nő a csokor!' },
    { from: 6, mark: '+2', label: 'Kettővel több', praise: 'Már a kettesével növő csokrot is kitalálod!' }
  ],
  flash: [
    { from: 0, mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', legacy: ['flash-3'] },
    { from: 1, mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!' },
    { from: 2, mark: '•5', label: 'Szórt magok', praise: 'A szórt magokat is egy pillantásra látod!', legacy: ['flash-5'] },
    { from: 3, mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', legacy: ['flash-10'] },
    { from: 4, mark: '5+3', label: 'Tízes keret', praise: 'A tízes keretet is egy pillantásra látod!' },
    { from: 5, mark: '20', label: 'Húsz mag', praise: 'Már húsz magot is egy pillantásra látsz!' }
  ],
  add: [
    { from: 0, mark: '5', label: 'Ötig', praise: 'Már ötig adsz össze és veszel el!' },
    { from: 3, mark: '+10', label: 'Tízig', praise: 'Már tízig adsz össze és veszel el!', legacy: ['add-5'] },
    { from: 6, mark: '20', label: 'Húszig', praise: 'Már húszig adsz össze és veszel el!', legacy: ['add-10'] },
    { from: 8, mark: '10+', label: 'Tízes átlépés', praise: 'Már a tízesen is átlépsz!' },
    { from: 10, mark: '40', label: 'Kerek tízesek', praise: 'Már a kerek tízesekkel is számolsz!', legacy: ['add-100'] },
    { from: 12, mark: '100', label: 'Százig', praise: 'Már százig adsz össze és veszel el!' },
    { from: 14, mark: '100+', label: 'Nagy átlépés', praise: 'Százig is átlépsz a tízesen!' }
  ],
  trace: [
    { from: 0, mark: '1–5', label: 'Írom 5-ig', praise: 'Már ötig írod a számokat!', legacy: ['trace-5'] },
    { from: 1, mark: '0–9', label: 'Minden szám', praise: 'Minden számot meg tudsz írni!', legacy: ['trace-9', 'trace-0'] },
    { from: 2, mark: '5', label: 'Halvány út', praise: 'Már halvány úton is írod a számokat!', legacy: ['trace-fade'] },
    { from: 3, mark: '10', label: 'Fejből írom', praise: 'Minden számot emlékezetből írsz!', legacy: ['trace-memory'] }
  ],
  pots: [
    { from: 0, mark: '5', label: 'Öt barátai', praise: 'Ismered az öt barátait!', legacy: ['pots-5'] },
    { from: 1, mark: '10', label: 'Tíz barátai', praise: 'Ismered a tíz barátait!', legacy: ['pots-10'] },
    { from: 2, mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', legacy: ['pots-mix'] },
    { from: 3, mark: '6–9', label: 'Új barátok', praise: 'Már a hat, hét, nyolc és kilenc barátait is ismered!' },
    { from: 4, mark: '20', label: 'Húsz barátai', praise: 'Ismered a húsz barátait!' },
    { from: 5, mark: '?', label: 'Fejből', praise: 'Fejből tudod a tíz barátait!' }
  ],
  path: [
    { from: 0, mark: '1', label: 'Első út', praise: 'Elvezetted a robotot az elemhez!', legacy: ['path-first'] },
    { from: 2, mark: '▶', label: 'Tervező', praise: 'Előre megtervezted a robot útját!', legacy: ['path-plan'] },
    { from: 4, mark: '→→', label: 'Hosszú út', praise: 'A hosszú úton is elvezetted a robotot!' },
    { from: 5, mark: '×3', label: 'Ismétlő', praise: 'Az ismétléssel rövid lett a programod!' },
    { from: 6, mark: '↻', label: 'Fordulós', praise: 'A robot arra megy, amerre néz, és te tudod, merre fordítsd!', legacy: ['path-turn'] },
    { from: 8, mark: '×↻', label: 'Ismételd és fordulj', praise: 'Egy programban ismételsz és fordulsz is!', legacy: ['path-repeat'] },
    { from: 9, mark: '2', label: 'Két elem', praise: 'Egy programmal két elemet is összegyűjtöttél!', legacy: ['path-two'] }
  ],
  sort: [
    { from: 0, mark: '2', label: 'Első válogatás', praise: 'Minden darabot a helyére tettél!', legacy: ['sort-first'] },
    { from: 1, mark: '3', label: 'Három szín', praise: 'Már három színt is szétválogatsz!' },
    { from: 2, mark: '▲', label: 'Formák', praise: 'Már formák szerint is válogatsz!', legacy: ['sort-shape'] },
    { from: 3, mark: '●•', label: 'Nagy és kicsi', praise: 'Már nagyság szerint is válogatsz!' },
    { from: 4, mark: '?', label: 'Kakukktojás', praise: 'Megtalálod, melyik nem illik a többihez!', legacy: ['sort-odd'] },
    { from: 5, mark: '2+', label: 'Két szabály', praise: 'Egyszerre két dologra is figyelsz!', legacy: ['sort-two'] },
    { from: 6, mark: '!', label: 'Szabálykereső', praise: 'Kitaláltad a gép titkos szabályát!', legacy: ['sort-rule'] }
  ],
  scale: [
    { from: 0, mark: '↓', label: 'Első mérés', praise: 'Megmondtad, melyik oldal a nehezebb!', legacy: ['scale-first'] },
    { from: 1, mark: '≈', label: 'Egyforma', praise: 'Észreveszed, ha a két oldal egyforma nehéz!' },
    { from: 2, mark: '=', label: 'Egyensúly', praise: 'Egyensúlyba hoztad a mérleget!', legacy: ['scale-even'] },
    { from: 3, mark: '10', label: 'Egyensúly tízig', praise: 'Már tízig is egyensúlyba hozod a mérleget!' },
    { from: 4, mark: '2', label: 'Kettes súly', praise: 'Már a kettes súlyokkal is kiméred!', legacy: ['scale-two'] },
    { from: 5, mark: '?', label: 'Hiányzó súly', praise: 'Kitaláltad, melyik súly hiányzik!', legacy: ['scale-missing'] },
    { from: 6, mark: 'x', label: 'Titkos doboz', praise: 'Kitaláltad, mennyit nyom a titkos doboz!', legacy: ['scale-secret'] }
  ],
  seq: [
    { from: 0, mark: 'AB', label: 'Első minta', praise: 'Folytattad a gép első mintáját!', legacy: ['seq-first'] },
    { from: 1, mark: 'ABB', label: 'Hosszú minta', praise: 'A hosszabb mintát is folytatod!' },
    { from: 2, mark: '●■', label: 'Szín és forma', praise: 'Egyszerre figyeled a színt és a formát!', legacy: ['seq-both'] },
    { from: 3, mark: '123', label: 'Növekvő sor', praise: 'Tudod, hogyan nő tovább a sor!' },
    { from: 4, mark: '↻', label: 'Forgató', praise: 'Tudod, merre fordul a nyíl!', legacy: ['seq-turn'] },
    { from: 5, mark: '!', label: 'Hibavadász', praise: 'Megtalálod, hol csúszott el a gép!', legacy: ['seq-fix'] },
    { from: 6, mark: '⇄', label: 'Mintafordító', praise: 'Ugyanazt a mintát nyilakkal is felismered!', legacy: ['seq-translate'] }
  ],
  mirror: [
    { from: 0, mark: '•|•', label: 'Első tükör', praise: 'Megtaláltad az első tükörképet!', legacy: ['mirror-first'] },
    { from: 1, mark: '••|', label: 'Több lámpa', praise: 'Több lámpát is jól tükrözöl!' },
    { from: 2, mark: '♥', label: 'Fél kép', praise: 'A tükörrel egész képet rajzolsz!', legacy: ['mirror-picture'] },
    { from: 3, mark: '◐', label: 'Színes kép', praise: 'A színes képet is pontosan tükrözöd!' },
    { from: 4, mark: '⇅', label: 'Fel-le tükör', praise: 'A fekvő tükörrel is boldogulsz!', legacy: ['mirror-flat'] },
    { from: 5, mark: 'b|d', label: 'Tükörkép', praise: 'Már nem téveszted össze a tükörképet a másolattal!', legacy: ['mirror-pick'] },
    { from: 6, mark: '!', label: 'Tükörjavító', praise: 'Megtalálod, hol tévedett a tükörgép!', legacy: ['mirror-fix'] }
  ],
  code: [
    { from: 0, mark: '●●', label: 'Első zár', praise: 'Kinyitottad az első kódzárat!', legacy: ['code-first'] },
    { from: 1, mark: '●●●', label: 'Hosszú zár', praise: 'A hosszabb zárat is kinyitod!' },
    { from: 2, mark: '●→', label: 'Kódtábla', praise: 'Már a kódtáblát is el tudod olvasni!', legacy: ['code-key'] },
    { from: 3, mark: '■→', label: 'Új kódtábla', praise: 'Az új kódtáblát is el tudod olvasni!' },
    { from: 4, mark: '•3', label: 'Pöttykód', praise: 'A pöttyökből számot csinálsz!', legacy: ['code-dots'] },
    { from: 5, mark: '→●', label: 'Üzenetküldő', praise: 'Titkos üzenetet küldtél Kutyabotnak!', legacy: ['code-send'] },
    { from: 6, mark: '?', label: 'Kódfejtő', praise: 'Kitaláltad a letakart jelet!', legacy: ['code-crack'] }
  ],
  fix: [
    { from: 0, mark: '↑✓', label: 'Első javítás', praise: 'Megjavítottad az első programot!', legacy: ['fix-first'] },
    { from: 1, mark: '↑↑', label: 'Hosszú program', praise: 'A hosszabb programban is megtalálod a hibát!' },
    { from: 2, mark: '▣', label: 'Dobozkerülő', praise: 'A dobozok között is megtalálod a hibát!', legacy: ['fix-crates'] },
    { from: 3, mark: '✕', label: 'Kártyaszedő', praise: 'Megtalálod a felesleges kártyát!' },
    { from: 4, mark: '×3', label: 'Számjavító', praise: 'Már a rossz számot is kijavítod!', legacy: ['fix-times'] },
    { from: 5, mark: '↰', label: 'Fordulójavító', praise: 'A fordulós programban is megtalálod a hibát!', legacy: ['fix-turn'] },
    { from: 6, mark: '!!', label: 'Dupla javítás', praise: 'Két hibát is megtaláltál egy programban!', legacy: ['fix-two'] }
  ]
};

const LADDER_GAMES = Object.keys(LEVEL_STICKERS) as LadderGame[];

const isLadderGame = (id: StickerGameId): id is LadderGame => (LADDER_GAMES as string[]).includes(id);

/** A game's level stickers: number n (from 1) stands for its level(s) on the ladder, solved in the game or on a finished sheet. */
function levelStickers(game: LadderGame): Sticker[] {
  return LEVEL_STICKERS[game].map((s, i) => ({
    id: `${game}-level-${i + 1}`,
    game,
    mark: s.mark,
    label: s.label,
    praise: s.praise,
    earned: (p: Progress) => ladderOf(p, game).solvedTop >= s.from || sheetLadderTop(p, game) >= s.from
  }));
}

/** Számmagok's sheet levels start at 1, 6, 11 and 16: a finished page of `level` knows the numbers up to its sticker's. */
const learnSheet = (level: number) => (p: Progress) => sheetTop(p, 'learn') >= level;

/**
 * Számmagok has no ladder: its stickers count the numbers the child knows, in the game or on a finished sheet.
 * The reward places count what was done.
 */
const OTHER_STICKERS: Sticker[] = [
  { id: 'learn-5', game: 'learn', mark: '1–5', label: 'Ismerem 5-ig', praise: 'Már ötig ismered a számokat!', earned: (p) => p.learnSolved >= 5 || learnSheet(0)(p) },
  { id: 'learn-10', game: 'learn', mark: '1–10', label: 'Ismerem 10-ig', praise: 'Már tízig ismered a számokat!', earned: (p) => p.learnSolved >= 10 || learnSheet(1)(p) },
  { id: 'learn-20', game: 'learn', mark: '1–20', label: 'Ismerem 20-ig', praise: 'Már húszig ismered a számokat!', earned: (p) => p.learnSolved >= LEARN_MAX || learnSheet(3)(p) },
  { id: 'kiskert-gift', game: 'kiskert', mark: '1', label: 'Első ajándék', praise: 'Megajándékoztad az első lakót a kertedben!', earned: (p) => decorCount(p) >= 1 },
  { id: 'kiskert-all', game: 'kiskert', mark: '12', label: 'Minden lakónak', praise: 'Mind a tizenkét lakó kapott tőled ajándékot!', earned: (p) => VISITORS.every((v) => giftsOf(p, v.id) >= 1) },
  { id: 'kiskert-done', game: 'kiskert', mark: '60', label: 'Kész a kert', praise: 'Kész a kert! Minden lakó megkapta az ajándékát.', earned: gardenDone },
  { id: 'robotepito-part', game: 'robotepito', mark: '1', label: 'Első alkatrész', praise: 'Felszerelted az első új alkatrészt a robotodra!', earned: (p) => boughtCount(p) >= 1 },
  { id: 'robotepito-second', game: 'robotepito', mark: '2', label: 'Második robot', praise: 'Megérkezett a második robotod a munkapadra!', earned: secondRobotOpen },
  { id: 'robotepito-friends', game: 'robotepito', mark: '6', label: 'Minden barát', praise: 'Mind a hat robotbarát beköltözött a műhelybe!', earned: (p) => friendsOf(p).length === FRIENDS.length }
];

/** Pages done for each Feladatlapok sticker: the Fibonacci numbers, so the first ones come quickly and the later ones ask for a little more each time. */
export const PAGE_STEPS = [1, 2, 3, 5, 8, 13, 21, 34, 55];

const PAGE_WORDS: Record<number, string> = {
  2: 'két',
  3: 'három',
  5: 'öt',
  8: 'nyolc',
  13: 'tizenhárom',
  21: 'huszonegy',
  34: 'harmincnégy',
  55: 'ötvenöt'
};

const capital = (word: string) => word[0].toUpperCase() + word.slice(1);

/** A world's Feladatlapok stickers, one per step in PAGE_STEPS. */
function pageStickers(world: WorldId): Sticker[] {
  const game: StickerGameId = world === 'garden' ? 'paper-garden' : 'paper-robot';
  return PAGE_STEPS.map((n, i) => {
    const last = i === PAGE_STEPS.length - 1;
    const word = PAGE_WORDS[n];
    return {
      id: `${game}-${n}`,
      game,
      mark: String(n),
      label: n === 1 ? 'Első lap' : `${capital(word)} lap`,
      praise: n === 1 ? 'Kész az első feladatlapod!' : last ? `${capital(word)} feladatlap! Igazi lapgyűjtő vagy!` : `Már ${word} feladatlapot befejeztél!`,
      earned: pagesIn(world, n),
      sheets: n < 5 ? 'one' : 'stack',
      gold: last
    };
  });
}

const PAGE_STICKERS = [...pageStickers('garden'), ...pageStickers('robot')];

/** Every sticker, in album order. */
export const STICKERS: Sticker[] = STICKER_GAMES.flatMap(({ id }) =>
  isLadderGame(id) ? levelStickers(id) : [...OTHER_STICKERS, ...PAGE_STICKERS].filter((s) => s.game === id)
);

/** The level sticker that took the place of each sticker of the old hand-picked list. */
const LEGACY_STICKERS: Record<string, string> = {
  ...Object.fromEntries(
    LADDER_GAMES.flatMap((game) => LEVEL_STICKERS[game].flatMap((s, i) => (s.legacy ?? []).map((old) => [old, `${game}-level-${i + 1}`])))
  ),
  // The old fifteen-page Feladatlapok sticker: its place went to thirteen pages.
  'paper-garden-15': 'paper-garden-13',
  'paper-robot-15': 'paper-robot-13'
};

/**
 * Saves from before the level stickers (or the Fibonacci Feladatlapok row): a sticker the child had stuck in stays, as the sticker that took
 * its place, even where that level has no solved task yet (the old list gave some for stepping onto a level).
 */
export function carryOverStickers(p: Progress): Progress {
  const carried = [...new Set(p.stickersSeen.map((id) => LEGACY_STICKERS[id]).filter((id) => id && !p.stickersSeen.includes(id)))];
  const seen = [...p.stickersSeen, ...carried];
  // The Fibonacci row put new steps between the old 1, 5 and 15 pages: below a sticker already stuck in, they count as
  // celebrated, so the child does not get a row of pops for pages finished long ago. Stickers come in album order, so a
  // new save never has a later step seen before an earlier one.
  const between = PAGE_STICKERS.filter((s) => !seen.includes(s.id) && PAGE_STICKERS.some((t) => t.game === s.game && seen.includes(t.id) && Number(t.mark) > Number(s.mark)));
  const added = [...carried, ...between.map((s) => s.id)];
  return added.length === 0 ? p : { ...p, stickersSeen: [...p.stickersSeen, ...added] };
}

export function gameOf(s: Sticker): StickerGame {
  return STICKER_GAMES.find((g) => g.id === s.game)!;
}

/** A sticker once stuck in stays, whatever happens to the level or the rule it came from. */
export function earnedStickers(p: Progress): Sticker[] {
  return STICKERS.filter((s) => s.earned(p) || p.stickersSeen.includes(s.id));
}

/** Stickers earned but not celebrated yet, in album order; with a world, only that world's (each pops on its own home screen). */
export function newStickers(p: Progress, world?: WorldId): Sticker[] {
  return earnedStickers(p).filter((s) => !p.stickersSeen.includes(s.id) && (!world || gameOf(s).world === world));
}

export function markStickerSeen(p: Progress, id: string, day = today()): Progress {
  if (p.stickersSeen.includes(id)) return p;
  const before = p.stickersDay === day ? p.stickersToday : [];
  return { ...p, stickersSeen: [...p.stickersSeen, id], stickersDay: day, stickersToday: [...before, id] };
}

/** The day's stickers, newest first: those still waiting for their celebration, then the ones celebrated that day. */
export function todaysStickers(p: Progress, day = today()): Sticker[] {
  const celebrated = p.stickersDay === day ? [...p.stickersToday].reverse() : [];
  const ids = [...new Set([...newStickers(p).map((s) => s.id), ...celebrated])];
  return ids.map((id) => STICKERS.find((s) => s.id === id)).filter((s): s is Sticker => s !== undefined);
}

/**
 * Counts every sticker earned so far as celebrated, without the animation. Used when progress jumps
 * without the child playing for it (older saves, a parent choosing a starting level), so the child
 * is only ever celebrated for what they did.
 */
export function markEarnedSeen(p: Progress): Progress {
  const fresh = newStickers(p);
  return fresh.length === 0 ? p : { ...p, stickersSeen: [...p.stickersSeen, ...fresh.map((s) => s.id)] };
}
