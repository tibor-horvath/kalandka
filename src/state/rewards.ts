import { ADD_LEVELS } from '../games/add/logic';
import { LEVELS as FLASH_LEVELS } from '../games/flash/logic';
import { LEARN_MAX } from '../games/learn/logic';
import { POTS_LEVELS } from '../games/pots/logic';
import { TRACE_ORDER } from '../games/trace/logic';
import { PATH_LEVELS } from '../games/robot/path';
import { SCALE_LEVELS } from '../games/robot/scale';
import { CODE_LEVELS } from '../games/robot/code';
import { FIX_LEVELS } from '../games/robot/fix';
import { MIRROR_LEVELS } from '../games/robot/mirror';
import { SEQ_LEVELS } from '../games/robot/seq';
import { SORT_LEVELS } from '../games/robot/sort';
import { GAMES, type GameId } from './games';
import type { Progress } from './progress';
import type { WorldId } from './worlds';
import { ladderOf } from './ladder';

// The reward loop: every solved task earns a seed; seeds are planted in the child's own garden
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
  /** Solved tasks (seeds earned) after planting until it is grown: the bigger the plant, the longer it takes. */
  grows: number;
}

export const PLANT_OPTIONS: PlantOption[] = [
  { id: 'flower', name: 'Virág', cost: 3, grows: 3 },
  { id: 'bush', name: 'Áfonyabokor', cost: 6, grows: 5 },
  { id: 'tree', name: 'Körtefa', cost: 10, grows: 8 }
];

/** Beds in one plot, five in a row like a ten-frame. */
export const PLOT_BEDS = 10;
/** The Kiskert's plots: the second opens once every bed of the first is planted. */
export const PLOTS = 2;
/** Beds in the whole garden, both plots. */
export const BEDS = PLOT_BEDS * PLOTS;

export interface Bed {
  kind: PlantKind;
  /** Seeds earned in total when it was planted; growth counts the seeds earned since. */
  at: number;
  /** Seeds earned in total when it was last watered; none yet: care counts from when it grew. */
  watered?: number;
  /** Fruit picked since it was last watered (or grew). */
  picked?: number;
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

/** 0 … growAfter(kind): how far a planting has grown. */
export function growthOf(bed: Bed, seeds: number): number {
  return Math.min(growAfter(bed.kind), Math.max(0, seeds - bed.at));
}

export function isGrown(bed: Bed, seeds: number): boolean {
  return growthOf(bed, seeds) >= growAfter(bed.kind);
}

export function grownCount(p: Progress): number {
  return p.beds.filter((b): b is Bed => !!b && isGrown(b, p.seeds)).length;
}

/** Beds the child can plant in: the first plot, and the second too once the first is planted full. */
export function openBeds(p: Progress): number {
  const firstFull = Array.from({ length: PLOT_BEDS }, (_, i) => bedAt(p, i)).every(Boolean);
  return firstFull ? BEDS : PLOT_BEDS;
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

/** Plants in an empty bed; unchanged when the bed is taken or the seeds are not enough. */
export function plant(p: Progress, i: number, kind: PlantKind): Progress {
  if (!canPlant(p, i, kind)) return p;
  const cost = PLANT_OPTIONS.find((o) => o.id === kind)!.cost;
  const beds = Array.from({ length: BEDS }, (_, k) => bedAt(p, k));
  beds[i] = { kind, at: p.seeds };
  return { ...p, beds, seedsSpent: p.seedsSpent + cost };
}

// ---------- care: thirst and fruit ----------
// A grown bush or tree ripens one fruit per solved task, which the child picks into the basket. A few
// tasks after it was last watered it gets thirsty and stops ripening until the child waters it, which
// is free. Thirsty is the worst a plant ever gets: it never wilts, picked fruit is kept, and fruit
// still on a plant goes into the basket when it is watered. Everything counts tasks, not time, so a
// week away leaves the garden as the child left it. Flowers need no care.

/** Solved tasks after watering (or growing) until a bush or tree is thirsty again. */
export const THIRSTY_AFTER = 5;

export type FruitKind = 'pear' | 'berry';

/** Fruit a plant ripens between two waterings; a flower ripens none and needs no care. */
export const FRUIT_MAX: Record<PlantKind, number> = { flower: 0, bush: 3, tree: 5 };

export function fruitOf(kind: PlantKind): FruitKind | null {
  return kind === 'tree' ? 'pear' : kind === 'bush' ? 'berry' : null;
}

/** "körte", "áfonya": what the child picks from this plant. */
export function fruitName(kind: PlantKind): string {
  return kind === 'tree' ? 'körte' : 'áfonya';
}

/** The seed count care is measured from: the last watering, or when it grew. */
function caredAt(bed: Bed): number {
  return bed.watered ?? bed.at + growAfter(bed.kind);
}

export function isThirsty(bed: Bed, seeds: number): boolean {
  return FRUIT_MAX[bed.kind] > 0 && isGrown(bed, seeds) && seeds - caredAt(bed) >= THIRSTY_AFTER;
}

/** Fruit hanging on the plant, ready to pick. */
export function ripeFruit(bed: Bed, seeds: number): number {
  if (!isGrown(bed, seeds)) return 0;
  const ripened = Math.min(FRUIT_MAX[bed.kind], THIRSTY_AFTER, Math.max(0, seeds - caredAt(bed)));
  return Math.max(0, ripened - pickedFruit(bed));
}

/** Fruit picked from the plant since its last watering: the child counts these aloud. */
export function pickedFruit(bed: Bed): number {
  return bed.picked ?? 0;
}

export function thirstyBeds(p: Progress): number[] {
  return p.beds.flatMap((b, i) => (b && isThirsty(b, p.seeds) ? [i] : []));
}

export function ripeTotal(p: Progress): number {
  return p.beds.reduce((n, b) => n + (b ? ripeFruit(b, p.seeds) : 0), 0);
}

function withBed(p: Progress, i: number, bed: Bed): (Bed | null)[] {
  const beds = Array.from({ length: BEDS }, (_, k) => bedAt(p, k));
  beds[i] = bed;
  return beds;
}

function addFruit(p: Progress, kind: PlantKind, n: number): Progress {
  return fruitOf(kind) === 'pear' ? { ...p, pears: p.pears + n } : { ...p, berries: p.berries + n };
}

/** Picks one ripe fruit into the basket; unchanged when there is none. */
export function pickFruit(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || ripeFruit(bed, p.seeds) === 0) return p;
  return addFruit({ ...p, beds: withBed(p, i, { ...bed, picked: pickedFruit(bed) + 1 }) }, bed.kind, 1);
}

/** Waters a thirsty plant; fruit still on it goes into the basket. Unchanged when it is not thirsty. */
export function water(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || !isThirsty(bed, p.seeds)) return p;
  const left = ripeFruit(bed, p.seeds);
  return addFruit({ ...p, beds: withBed(p, i, { ...bed, watered: p.seeds, picked: 0 }) }, bed.kind, left);
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

export type VisitorId = 'hedgehog' | 'ladybug' | 'butterfly' | 'blackbird' | 'frog' | 'squirrel';

export interface Visitor {
  id: VisitorId;
  name: string;
  /** Grown plants that bring it. */
  after: number;
  /** Csepi's line when it arrives. */
  speech: string;
}

export const VISITORS: Visitor[] = [
  { id: 'hedgehog', name: 'Süni', after: 3, speech: 'Nézd, ki jött! Süni beköltözött a kertedbe. Itt marad veled.' },
  { id: 'ladybug', name: 'Katica', after: 5, speech: 'Nézd, ki jött! Katica leszállt a kertedbe. Itt marad veled.' },
  { id: 'butterfly', name: 'Pillangó', after: 8, speech: 'Nézd, ki jött! Egy pillangó táncol a virágaid között.' },
  { id: 'blackbird', name: 'Rigó', after: 10, speech: 'Nézd, ki jött! A rigó fészket rakott a kertedben. Itt marad veled.' },
  { id: 'frog', name: 'Béka', after: 14, speech: 'Nézd, ki jött! Egy kis béka ugrált be a kertedbe. Itt marad veled.' },
  { id: 'squirrel', name: 'Mókus', after: 20, speech: 'Nézd, ki jött! Mókus beköltözött a kertedbe. Tele van a kert!' }
];

export function visitorsOf(p: Progress): Visitor[] {
  const grown = grownCount(p);
  return VISITORS.filter((v) => grown >= v.after);
}

/** The next visitor that arrived but has not been welcomed yet. */
export function newVisitor(p: Progress): Visitor | null {
  return visitorsOf(p)[p.visitorsSeen] ?? null;
}

/** Visitors already welcomed, in order of arrival. */
export function welcomedVisitors(p: Progress): Visitor[] {
  return visitorsOf(p).slice(0, p.visitorsSeen);
}

// ---------- gifts and decorations ----------
// Treats from the pantry shelf are gifts for the visitors. Each visitor likes one treat and takes
// three gifts: one treat, then two, then three, counted out together. Every gift leaves a
// decoration in the visitor's corner for good, the third one their own home. When all eighteen are
// there, the garden is done (Kész a kert!). Giving is always the child's choice, like cooking.

export const GIFTS_EACH = 3;

export type DecorId =
  | 'mushroom'
  | 'leaves'
  | 'hedgehog-house'
  | 'spotted-stone'
  | 'fence'
  | 'daisies'
  | 'lavender'
  | 'sunflower'
  | 'arch'
  | 'feeder'
  | 'birdbath'
  | 'birdhouse'
  | 'reeds'
  | 'stepping-stones'
  | 'pond'
  | 'pinecone'
  | 'stump'
  | 'swing';

export interface Decor {
  id: DecorId;
  name: string;
}

export interface Wish {
  visitor: VisitorId;
  treat: TreatId;
  /** What the visitor leaves after each gift, in order. */
  decor: [Decor, Decor, Decor];
}

export const WISHES: Wish[] = [
  {
    visitor: 'hedgehog',
    treat: 'jam',
    decor: [
      { id: 'mushroom', name: 'Gomba' },
      { id: 'leaves', name: 'Levélkupac' },
      { id: 'hedgehog-house', name: 'Sünház' }
    ]
  },
  {
    visitor: 'ladybug',
    treat: 'pie',
    decor: [
      { id: 'spotted-stone', name: 'Pöttyös kő' },
      { id: 'fence', name: 'Kis kerítés' },
      { id: 'daisies', name: 'Százszorszép-csokor' }
    ]
  },
  {
    visitor: 'butterfly',
    treat: 'jam',
    decor: [
      { id: 'lavender', name: 'Levendula' },
      { id: 'sunflower', name: 'Napraforgó' },
      { id: 'arch', name: 'Virágkapu' }
    ]
  },
  {
    visitor: 'blackbird',
    treat: 'loaf',
    decor: [
      { id: 'feeder', name: 'Madáretető' },
      { id: 'birdbath', name: 'Madáritató' },
      { id: 'birdhouse', name: 'Madárodú' }
    ]
  },
  {
    visitor: 'frog',
    treat: 'compote',
    decor: [
      { id: 'reeds', name: 'Kis nádas' },
      { id: 'stepping-stones', name: 'Ugróköves ösvény' },
      { id: 'pond', name: 'Kis tó' }
    ]
  },
  {
    visitor: 'squirrel',
    treat: 'loaf',
    decor: [
      { id: 'pinecone', name: 'Toboz' },
      { id: 'stump', name: 'Fatönk' },
      { id: 'swing', name: 'Hinta' }
    ]
  }
];

/** "áfonyalekvárt": a treat as the thing asked for, in Csepi's lines. */
export const TREAT_WANTED: Record<TreatId, string> = {
  jam: 'áfonyalekvárt',
  compote: 'körtebefőttet',
  pie: 'gyümölcspitét',
  loaf: 'magos kalácsot'
};

export function wishOf(id: VisitorId): Wish {
  return WISHES.find((w) => w.visitor === id)!;
}

/** Gifts this visitor has had, 0 … GIFTS_EACH. */
export function giftsOf(p: Progress, id: VisitorId): number {
  return Math.min(GIFTS_EACH, p.gifts[id] ?? 0);
}

/** Treats the visitor's next gift takes (one, then two, then three); 0 once they have had them all. */
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
  return n > 0 && welcomedVisitors(p).some((v) => v.id === id) && treatsOf(p, wishOf(id).treat) >= n;
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

/** Welcomed visitors whose next gift is on the shelf. */
export function giftsReady(p: Progress): Visitor[] {
  return welcomedVisitors(p).filter((v) => canGive(p, v.id));
}

export function decorCount(p: Progress): number {
  return VISITORS.reduce((n, v) => n + giftsOf(p, v.id), 0);
}

/** Every visitor has had every gift: the garden is done. */
export function gardenDone(p: Progress): boolean {
  return decorCount(p) === VISITORS.length * GIFTS_EACH;
}

// ---------- stickers ----------

/** The Kiskert's own album row and each world's row for finished paper sheets, next to the games. */
export type StickerGameId = GameId | 'kiskert' | 'paper-garden' | 'paper-robot';

export interface Sticker {
  id: string;
  game: StickerGameId;
  /** Printed on the sticker. */
  mark: string;
  label: string;
  /** Csepi's line when it is collected. */
  praise: string;
  earned: (p: Progress) => boolean;
  /** A later skill step of the game (Mézút's faded trail), shown as its own row when it pops. */
  set?: number;
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
  gameRow('sort', '#5E7184', '#FFFFFF'),
  gameRow('scale', '#F2B33D', '#10233A'),
  gameRow('seq', '#2E5FA8', '#FFFFFF'),
  gameRow('mirror', '#7FE9F0', '#10233A'),
  gameRow('code', '#C98F4E', '#10233A'),
  gameRow('fix', '#D9741A', '#FFFFFF'),
  { id: 'paper-robot', name: 'Feladat­lapok', color: '#D5DEE6', ink: '#10233A', world: 'robot' }
];

/** Pages done from this world's games: a sticker waits on the page's own world, like the game's. */
export function pagesDoneIn(p: Progress, world: WorldId): number {
  return p.pagesDone.filter((key) => STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world === world).length;
}

/** What a finished page of `tasks` tasks pays: a seed or a bolt for each, like a solved task in its world's games. */
export function pageReward(key: string, tasks: number): { seeds: number; bolts: number } {
  const world = STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world;
  return { seeds: world === 'garden' ? tasks : 0, bolts: world === 'robot' ? tasks : 0 };
}

/**
 * A grown-up saw the page finished. It counts once, for finishing, never for how many answers were right,
 * and it changes no level. It pays `pageReward` for its `tasks`. There is no taking it back: a sticker that has been stuck in stays.
 */
export function markPageDone(p: Progress, key: string, tasks: number): Progress {
  if (p.pagesDone.includes(key)) return p;
  const pay = pageReward(key, tasks);
  return { ...p, pagesDone: [...p.pagesDone, key], seeds: p.seeds + pay.seeds, bolts: p.bolts + pay.bolts };
}

/** Feladatlapok stickers: pages done in a world. */
const pagesIn = (world: WorldId, count: number) => (p: Progress) => pagesDoneIn(p, world) >= count;

/** Robotút stickers: a course solved on a level (the first solved course of that level and on). */
const pathLevel = (name: string) => PATH_LEVELS.findIndex((l) => l.name === name);
const pathPassed = (name: string) => (p: Progress) => ladderOf(p, 'path').solvedTop >= pathLevel(name);
/** Válogatógép stickers: a round solved on a level. */
const sortLevel = (name: string) => SORT_LEVELS.findIndex((l) => l.name === name);
const sortPassed = (name: string) => (p: Progress) => ladderOf(p, 'sort').solvedTop >= sortLevel(name);
/** Mérleg stickers: a round solved on a level. */
const scaleLevel = (name: string) => SCALE_LEVELS.findIndex((l) => l.name === name);
const scalePassed = (name: string) => (p: Progress) => ladderOf(p, 'scale').solvedTop >= scaleLevel(name);

/** Mintagép stickers: a round solved on a level. */
const seqLevel = (name: string) => SEQ_LEVELS.findIndex((l) => l.name === name);
const seqPassed = (name: string) => (p: Progress) => ladderOf(p, 'seq').solvedTop >= seqLevel(name);

/** Tükörgép stickers: a round solved on a level. */
const mirrorLevel = (name: string) => MIRROR_LEVELS.findIndex((l) => l.name === name);
const mirrorPassed = (name: string) => (p: Progress) => ladderOf(p, 'mirror').solvedTop >= mirrorLevel(name);

/** Kódzár stickers: a round solved on a level. */
const codeLevel = (name: string) => CODE_LEVELS.findIndex((l) => l.name === name);
const codePassed = (name: string) => (p: Progress) => ladderOf(p, 'code').solvedTop >= codeLevel(name);

/** Hibavadász stickers: a round solved on a level. */
const fixLevel = (name: string) => FIX_LEVELS.findIndex((l) => l.name === name);
const fixPassed = (name: string) => (p: Progress) => ladderOf(p, 'fix').solvedTop >= fixLevel(name);

/** Méhkas levels that close a number range: the last level up to 5, up to 10, and round tens. */
const ADD_PAST_5 = ADD_LEVELS.findIndex((l) => l.name === '10-ig, gyűjtéssel');
const ADD_PAST_10 = ADD_LEVELS.findIndex((l) => l.name === '20-ig');
const ADD_HUNDRED = ADD_LEVELS.findIndex((l) => l.name === 'Kerek tízesek 100-ig');
const addReached = (level: number) => (p: Progress) => ladderOf(p, 'add').solvedTop >= level;

export const STICKERS: Sticker[] = [
  { id: 'learn-5', game: 'learn', mark: '1–5', label: 'Ismerem 5-ig', praise: 'Már ötig ismered a számokat!', earned: (p) => p.learnSolved >= 5 },
  { id: 'learn-10', game: 'learn', mark: '1–10', label: 'Ismerem 10-ig', praise: 'Már tízig ismered a számokat!', earned: (p) => p.learnSolved >= 10 },
  { id: 'learn-20', game: 'learn', mark: '1–20', label: 'Ismerem 20-ig', praise: 'Már húszig ismered a számokat!', earned: (p) => p.learnSolved >= LEARN_MAX },
  { id: 'water-1', game: 'water', mark: '1', label: 'Első virág', praise: 'Kinőtt az első virágod!', earned: (p) => p.garden.length >= 1 },
  { id: 'water-10', game: 'water', mark: '10', label: 'Tízes keret', praise: 'Minden virágot meglocsoltál tízig!', earned: (p) => ladderOf(p, 'water').reached >= 2 },
  { id: 'water-20', game: 'water', mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', earned: (p) => ladderOf(p, 'water').solvedTop >= 2 },
  { id: 'patterns-ab', game: 'patterns', mark: 'AB', label: 'Kettes sor', praise: 'Folytattad az első virágsort!', earned: (p) => p.patternsSolved >= 1 },
  { id: 'patterns-abc', game: 'patterns', mark: 'ABC', label: 'Hármas sor', praise: 'Már a hármas sort is folytatod!', earned: (p) => ladderOf(p, 'patterns').solvedTop >= 1 },
  { id: 'patterns-all', game: 'patterns', mark: 'AAB', label: 'Minden minta', praise: 'Mind a négy virágmintát kitaláltad!', earned: (p) => ladderOf(p, 'patterns').reached >= 3 },
  { id: 'flash-3', game: 'flash', mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', earned: (p) => ladderOf(p, 'flash').reached >= 1 },
  { id: 'flash-5', game: 'flash', mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!', earned: (p) => ladderOf(p, 'flash').reached >= FLASH_LEVELS.length - 1 },
  { id: 'flash-10', game: 'flash', mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', earned: (p) => ladderOf(p, 'flash').reached >= FLASH_LEVELS.length },
  { id: 'add-5', game: 'add', mark: '+5', label: 'Adok 5-ig', praise: 'Már ötig adsz össze és veszel el!', earned: addReached(ADD_PAST_5) },
  { id: 'add-10', game: 'add', mark: '+10', label: 'Adok 10-ig', praise: 'Már tízig adsz össze és veszel el!', earned: addReached(ADD_PAST_10) },
  { id: 'add-100', game: 'add', mark: '100', label: 'Százig', praise: 'Már a százas számokkal is számolsz!', earned: addReached(ADD_HUNDRED) },
  { id: 'trace-5', game: 'trace', mark: '1–5', label: 'Írom 5-ig', praise: 'Már ötig írod a számokat!', earned: (p) => p.traceSolved >= 5 },
  { id: 'trace-9', game: 'trace', mark: '6–9', label: 'Írom 9-ig', praise: 'Már kilencig írod a számokat!', earned: (p) => p.traceSolved >= 9 && ladderOf(p, 'trace').solvedTop >= 1 },
  { id: 'trace-0', game: 'trace', mark: '0', label: 'Minden szám', praise: 'Minden számot meg tudsz írni!', earned: (p) => ladderOf(p, 'trace').reached >= 2 },
  { id: 'trace-fade', game: 'trace', mark: '5', label: 'Halvány út', praise: 'Már halvány úton is írod a számokat!', earned: (p) => p.traceFadedSolved >= 5, set: 1 },
  { id: 'trace-memory', game: 'trace', mark: '0–9', label: 'Fejből írom', praise: 'Minden számot emlékezetből írsz!', earned: (p) => p.traceFadedSolved >= TRACE_ORDER.length && ladderOf(p, 'trace').solvedTop >= 3, set: 1 },
  { id: 'pots-5', game: 'pots', mark: '5', label: 'Öt barátai', praise: 'Ismered az öt barátait!', earned: (p) => ladderOf(p, 'pots').reached >= 1 },
  { id: 'pots-10', game: 'pots', mark: '10', label: 'Tíz barátai', praise: 'Ismered a tíz barátait!', earned: (p) => ladderOf(p, 'pots').reached >= 2 },
  { id: 'path-first', game: 'path', mark: '1', label: 'Első út', praise: 'Elvezetted a robotot az elemhez!', earned: (p) => p.pathSolved >= 1 },
  { id: 'path-plan', game: 'path', mark: '▶', label: 'Tervező', praise: 'Előre megtervezted a robot útját!', earned: pathPassed('Tervezz előre') },
  { id: 'path-turn', game: 'path', mark: '↻', label: 'Fordulós', praise: 'A robot arra megy, amerre néz, és te tudod, merre fordítsd!', earned: pathPassed('Fordulj!') },
  { id: 'path-repeat', game: 'path', mark: '×3', label: 'Ismétlő', praise: 'Az ismétléssel rövid lett a programod!', earned: pathPassed('Ismételd és fordulj'), set: 1 },
  { id: 'path-two', game: 'path', mark: '2', label: 'Két elem', praise: 'Egy programmal két elemet is összegyűjtöttél!', earned: pathPassed('Két elem'), set: 1 },
  { id: 'sort-first', game: 'sort', mark: '2', label: 'Első válogatás', praise: 'Minden darabot a helyére tettél!', earned: (p) => p.sortSolved >= 1 },
  { id: 'sort-shape', game: 'sort', mark: '▲', label: 'Formák', praise: 'Már formák szerint is válogatsz!', earned: sortPassed('Formák') },
  { id: 'sort-odd', game: 'sort', mark: '?', label: 'Kakukktojás', praise: 'Megtalálod, melyik nem illik a többihez!', earned: sortPassed('Kakukktojás') },
  { id: 'sort-two', game: 'sort', mark: '2+', label: 'Két szabály', praise: 'Egyszerre két dologra is figyelsz!', earned: sortPassed('Két szabály'), set: 1 },
  { id: 'sort-rule', game: 'sort', mark: '!', label: 'Szabálykereső', praise: 'Kitaláltad a gép titkos szabályát!', earned: sortPassed('Mi a szabály?'), set: 1 },
  { id: 'scale-first', game: 'scale', mark: '↓', label: 'Első mérés', praise: 'Megmondtad, melyik oldal a nehezebb!', earned: (p) => p.scaleSolved >= 1 },
  { id: 'scale-even', game: 'scale', mark: '=', label: 'Egyensúly', praise: 'Egyensúlyba hoztad a mérleget!', earned: scalePassed('Tedd egyensúlyba!') },
  { id: 'scale-two', game: 'scale', mark: '2', label: 'Kettes súly', praise: 'Már a kettes súlyokkal is kiméred!', earned: scalePassed('Kettes súlyok') },
  { id: 'scale-missing', game: 'scale', mark: '?', label: 'Hiányzó súly', praise: 'Kitaláltad, melyik súly hiányzik!', earned: scalePassed('Hiányzó súly'), set: 1 },
  { id: 'scale-secret', game: 'scale', mark: 'x', label: 'Titkos doboz', praise: 'Kitaláltad, mennyit nyom a titkos doboz!', earned: scalePassed('Titkos doboz'), set: 1 },
  { id: 'seq-first', game: 'seq', mark: 'AB', label: 'Első minta', praise: 'Folytattad a gép első mintáját!', earned: (p) => p.seqSolved >= 1 },
  { id: 'seq-both', game: 'seq', mark: '●■', label: 'Szín és forma', praise: 'Egyszerre figyeled a színt és a formát!', earned: seqPassed('Szín és forma') },
  { id: 'seq-turn', game: 'seq', mark: '↻', label: 'Forgató', praise: 'Tudod, merre fordul a nyíl!', earned: seqPassed('Forgó sor') },
  { id: 'seq-fix', game: 'seq', mark: '!', label: 'Hibavadász', praise: 'Megtalálod, hol csúszott el a gép!', earned: seqPassed('Hibavadász'), set: 1 },
  { id: 'seq-translate', game: 'seq', mark: '⇄', label: 'Mintafordító', praise: 'Ugyanazt a mintát nyilakkal is felismered!', earned: seqPassed('Mintafordító'), set: 1 },
  { id: 'mirror-first', game: 'mirror', mark: '•|•', label: 'Első tükör', praise: 'Megtaláltad az első tükörképet!', earned: (p) => p.mirrorSolved >= 1 },
  { id: 'mirror-picture', game: 'mirror', mark: '♥', label: 'Fél kép', praise: 'A tükörrel egész képet rajzolsz!', earned: mirrorPassed('Fél kép') },
  { id: 'mirror-flat', game: 'mirror', mark: '⇅', label: 'Fel-le tükör', praise: 'A fekvő tükörrel is boldogulsz!', earned: mirrorPassed('Fel-le tükör') },
  { id: 'mirror-pick', game: 'mirror', mark: 'b|d', label: 'Tükörkép', praise: 'Már nem téveszted össze a tükörképet a másolattal!', earned: mirrorPassed('Tükör vagy másolat?'), set: 1 },
  { id: 'mirror-fix', game: 'mirror', mark: '!', label: 'Tükörjavító', praise: 'Megtalálod, hol tévedett a tükörgép!', earned: mirrorPassed('Hibás tükör'), set: 1 },
  { id: 'code-first', game: 'code', mark: '●●', label: 'Első zár', praise: 'Kinyitottad az első kódzárat!', earned: (p) => p.codeSolved >= 1 },
  { id: 'code-key', game: 'code', mark: '●→', label: 'Kódtábla', praise: 'Már a kódtáblát is el tudod olvasni!', earned: codePassed('Kódtábla') },
  { id: 'code-dots', game: 'code', mark: '•3', label: 'Pöttykód', praise: 'A pöttyökből számot csinálsz!', earned: codePassed('Pöttykód') },
  { id: 'code-send', game: 'code', mark: '→●', label: 'Üzenetküldő', praise: 'Titkos üzenetet küldtél Kutyabotnak!', earned: codePassed('Üzenet'), set: 1 },
  { id: 'code-crack', game: 'code', mark: '?', label: 'Kódfejtő', praise: 'Kitaláltad a letakart jelet!', earned: codePassed('Hiányzó jel'), set: 1 },
  { id: 'fix-first', game: 'fix', mark: '↑✓', label: 'Első javítás', praise: 'Megjavítottad az első programot!', earned: (p) => p.fixSolved >= 1 },
  { id: 'fix-crates', game: 'fix', mark: '▣', label: 'Dobozkerülő', praise: 'A dobozok között is megtalálod a hibát!', earned: fixPassed('Dobozok között') },
  { id: 'fix-times', game: 'fix', mark: '×3', label: 'Számjavító', praise: 'Már a rossz számot is kijavítod!', earned: fixPassed('Rossz szám') },
  { id: 'fix-turn', game: 'fix', mark: '↰', label: 'Fordulójavító', praise: 'A fordulós programban is megtalálod a hibát!', earned: fixPassed('Fordulós hiba'), set: 1 },
  { id: 'fix-two', game: 'fix', mark: '!!', label: 'Dupla javítás', praise: 'Két hibát is megtaláltál egy programban!', earned: fixPassed('Két hiba'), set: 1 },
  { id: 'kiskert-gift', game: 'kiskert', mark: '1', label: 'Első ajándék', praise: 'Megajándékoztad az első lakót a kertedben!', earned: (p) => decorCount(p) >= 1 },
  { id: 'kiskert-all', game: 'kiskert', mark: '6', label: 'Minden lakónak', praise: 'Mind a hat lakó kapott tőled ajándékot!', earned: (p) => VISITORS.every((v) => giftsOf(p, v.id) >= 1) },
  { id: 'kiskert-done', game: 'kiskert', mark: '18', label: 'Kész a kert', praise: 'Kész a kert! Minden lakó megkapta az ajándékát.', earned: gardenDone },
  { id: 'pots-mix', game: 'pots', mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', earned: (p) => ladderOf(p, 'pots').reached >= POTS_LEVELS.length },
  { id: 'paper-garden-1', game: 'paper-garden', mark: '1', label: 'Első lap', praise: 'Kész az első feladatlapod!', earned: pagesIn('garden', 1) },
  { id: 'paper-garden-5', game: 'paper-garden', mark: '5', label: 'Öt lap', praise: 'Már öt feladatlapot befejeztél!', earned: pagesIn('garden', 5) },
  { id: 'paper-garden-15', game: 'paper-garden', mark: '15', label: 'Tizenöt lap', praise: 'Már tizenöt feladatlapot befejeztél!', earned: pagesIn('garden', 15) },
  { id: 'paper-robot-1', game: 'paper-robot', mark: '1', label: 'Első lap', praise: 'Kész az első feladatlapod!', earned: pagesIn('robot', 1) },
  { id: 'paper-robot-5', game: 'paper-robot', mark: '5', label: 'Öt lap', praise: 'Már öt feladatlapot befejeztél!', earned: pagesIn('robot', 5) },
  { id: 'paper-robot-15', game: 'paper-robot', mark: '15', label: 'Tizenöt lap', praise: 'Már tizenöt feladatlapot befejeztél!', earned: pagesIn('robot', 15) }
];

export function gameOf(s: Sticker): StickerGame {
  return STICKER_GAMES.find((g) => g.id === s.game)!;
}

export function earnedStickers(p: Progress): Sticker[] {
  return STICKERS.filter((s) => s.earned(p));
}

/** Stickers earned but not celebrated yet, in album order; with a world, only that world's (each pops on its own home screen). */
export function newStickers(p: Progress, world?: WorldId): Sticker[] {
  return earnedStickers(p).filter((s) => !p.stickersSeen.includes(s.id) && (!world || gameOf(s).world === world));
}

export function markStickerSeen(p: Progress, id: string): Progress {
  return p.stickersSeen.includes(id) ? p : { ...p, stickersSeen: [...p.stickersSeen, id] };
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
