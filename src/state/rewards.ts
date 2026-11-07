import { LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { GAMES, type GameId } from './games';
import type { Progress } from './progress';
import type { WorldId } from './worlds';
import { ladderOf, type LadderGame } from './ladder';
import { FRIENDS, boughtCount, friendsOf, secondRobotOpen } from './robotParts';
import { creditTasks, rewardFor } from './pod';
import { today } from './screenTime';

// The reward loop: every four solved tasks fill a pod that pays a seed (see pod.ts); seeds are planted in the child's own garden
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
  /** Garden tasks solved in total when it was planted; growth counts the tasks solved since. */
  at: number;
  /** Garden tasks solved in total when it was last watered; none yet: care counts from when it grew. */
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

/** 0 … growAfter(kind): how far a planting has grown, `tasks` being the garden's task clock. */
export function growthOf(bed: Bed, tasks: number): number {
  return Math.min(growAfter(bed.kind), Math.max(0, tasks - bed.at));
}

export function isGrown(bed: Bed, tasks: number): boolean {
  return growthOf(bed, tasks) >= growAfter(bed.kind);
}

export function grownCount(p: Progress): number {
  return p.beds.filter((b): b is Bed => !!b && isGrown(b, p.gardenTasks)).length;
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
  beds[i] = { kind, at: p.gardenTasks };
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
  const ripened = Math.min(FRUIT_MAX[bed.kind], THIRSTY_AFTER, Math.max(0, tasks - caredAt(bed)));
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

function addFruit(p: Progress, kind: PlantKind, n: number): Progress {
  return fruitOf(kind) === 'pear' ? { ...p, pears: p.pears + n } : { ...p, berries: p.berries + n };
}

/** Picks one ripe fruit into the basket; unchanged when there is none. */
export function pickFruit(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || ripeFruit(bed, p.gardenTasks) === 0) return p;
  return addFruit({ ...p, beds: withBed(p, i, { ...bed, picked: pickedFruit(bed) + 1 }) }, bed.kind, 1);
}

/** Waters a thirsty plant; fruit still on it goes into the basket. Unchanged when it is not thirsty. */
export function water(p: Progress, i: number): Progress {
  const bed = bedAt(p, i);
  if (!bed || !isThirsty(bed, p.gardenTasks)) return p;
  const left = ripeFruit(bed, p.gardenTasks);
  return addFruit({ ...p, beds: withBed(p, i, { ...bed, watered: p.gardenTasks, picked: 0 }) }, bed.kind, left);
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
    { from: 2, mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', legacy: ['water-20'] }
  ],
  patterns: [
    { from: 0, mark: 'AB', label: 'Kettes sor', praise: 'Folytattad az első virágsort!', legacy: ['patterns-ab'] },
    { from: 1, mark: 'ABC', label: 'Hármas sor', praise: 'Már a hármas sort is folytatod!', legacy: ['patterns-abc'] },
    { from: 2, mark: 'AAB', label: 'Kettő-egy', praise: 'Már a kettő-egy sort is kitalálod!' },
    { from: 3, mark: '?', label: 'Hiányzó virág', praise: 'Megtalálod a hiányzó virágot is!', legacy: ['patterns-all'] }
  ],
  flash: [
    { from: 0, mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', legacy: ['flash-3'] },
    { from: 1, mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!' },
    { from: 2, mark: '•5', label: 'Szórt magok', praise: 'A szórt magokat is egy pillantásra látod!', legacy: ['flash-5'] },
    { from: 3, mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', legacy: ['flash-10'] }
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
    { from: 2, mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', legacy: ['pots-mix'] }
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
  { id: 'kiskert-all', game: 'kiskert', mark: '6', label: 'Minden lakónak', praise: 'Mind a hat lakó kapott tőled ajándékot!', earned: (p) => VISITORS.every((v) => giftsOf(p, v.id) >= 1) },
  { id: 'kiskert-done', game: 'kiskert', mark: '18', label: 'Kész a kert', praise: 'Kész a kert! Minden lakó megkapta az ajándékát.', earned: gardenDone },
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
