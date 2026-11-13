import type { Progress } from '../progress';
import { today } from '../screenTime';
import { TREES, gardenFull, grownCount, isGrown, isWelcomed, seedBalance, type TreeKind } from './beds';
import { basketOf, fruitOf, recipeOf, treatsOf, type FruitKind, type GiftFruit, type TreatId } from './harvest';
import { VEGS, eatVeg, pollenFlowers, ripeVeg, takePollen, type VegId, type VegKind } from './veg';

// Visitors who come to a growing garden, and the gifts, decorations and daily snacks the child gives them.

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
//
// Beds are never emptied, so a garden planted full without a bush (or without a pear tree) can never make the
// treats that need berries (or pears). Then every visitor who likes such a treat takes seeds too, the same way,
// so every gift can still be given and the garden can still be finished.

export const SEED_EATERS: VisitorId[] = ['blackbird', 'squirrel', 'owl'];
/** Seeds standing in for one treat. */
export const SEEDS_PER_TREAT = FOOD_PER_TREAT;

export function eatsSeeds(id: VisitorId): boolean {
  return SEED_EATERS.includes(id);
}

/** The garden is planted full and no bed grows a fruit this treat needs, so it can never be made again once the basket runs out. */
export function treatOutOfReach(p: Progress, treat: TreatId): boolean {
  if (!gardenFull(p)) return false;
  const r = recipeOf(treat);
  const grows = (f: FruitKind) => p.beds.some((b) => !!b && fruitOf(b) === f);
  return (r.pears > 0 && !grows('pear')) || (r.berries > 0 && !grows('berry'));
}

/** The visitor takes a handful of seeds instead of a treat: a bird, or anyone whose treat the garden can no longer grow. */
export function takesSeeds(p: Progress, id: VisitorId): boolean {
  return eatsSeeds(id) || treatOutOfReach(p, wishOf(id).treat);
}

/** Seeds the visitor's next gift takes as a handful; 0 when they take no seeds or have had every gift. */
export function seedGiftSize(p: Progress, id: VisitorId): number {
  return takesSeeds(p, id) ? giftSize(p, id) * SEEDS_PER_TREAT : 0;
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

// After its five gifts, every visitor still has a snack, once a day: the smallest gift there is, in any form it
// takes (one treat from the shelf, three of its garden food, or three seeds). Each snack adds one small thing to
// the visitor's pile beside it (Süni's mushrooms, Mókus's pinecones …), up to ten in rows of five, so the corner
// keeps growing. Snacks go on after the pile is full; it just stays full. A snack is only ever offered on a tap,
// never as a reminder.

/** Garden food or seeds in one snack: one Veteményes spot, three fruit, three flowers' pollen, a small handful. */
export const SNACK_SIZE = FOOD_PER_TREAT;
/** Things in a full snack pile: two rows of five. */
export const SNACK_PILE = 10;

/** What each visitor's snack pile is made of: the first of its own decorations that is small enough to heap. */
export const PILE_OF: Record<VisitorId, DecorId> = {
  hedgehog: 'mushroom',
  ladybug: 'poppies',
  butterfly: 'lavender',
  blackbird: 'cherry-branch',
  frog: 'waterlily',
  squirrel: 'pinecone',
  snail: 'mossy-stone',
  bee: 'honey-pot',
  rabbit: 'clover',
  mole: 'molehill',
  lizard: 'fern',
  owl: 'feather'
};

export type SnackHow = 'treat' | 'food' | 'seeds';

/** Things in the visitor's snack pile, 0 … SNACK_PILE. */
export function snackPile(p: Progress, id: VisitorId): number {
  return Math.min(SNACK_PILE, p.snacks[id] ?? 0);
}

/** The visitor has had all five gifts and no snack yet today. */
export function snackDue(p: Progress, id: VisitorId, day = today()): boolean {
  return isWelcomed(p, id) && giftsOf(p, id) >= GIFTS_EACH && p.snacked[id] !== day;
}

/** The snack can be given now in this form. */
export function canSnackWith(p: Progress, id: VisitorId, how: SnackHow, day = today()): boolean {
  if (!snackDue(p, id, day)) return false;
  const { food, treat } = wishOf(id);
  if (how === 'treat') return treatsOf(p, treat) >= 1;
  if (how === 'food') return !!food && foodOnHand(p, food) >= SNACK_SIZE;
  return takesSeeds(p, id) && seedBalance(p) >= SNACK_SIZE;
}

/** Some snack can be given now. */
export function canSnack(p: Progress, id: VisitorId, day = today()): boolean {
  return (['food', 'treat', 'seeds'] as SnackHow[]).some((how) => canSnackWith(p, id, how, day));
}

/** The visitor has its snack; one more thing goes on its pile. Unchanged when it cannot have it that way today. */
export function snack(p: Progress, id: VisitorId, how: SnackHow, day = today()): Progress {
  if (!canSnackWith(p, id, how, day)) return p;
  const { food, treat } = wishOf(id);
  const spent =
    how === 'treat'
      ? { ...p, pantry: { ...p.pantry, [treat]: treatsOf(p, treat) - 1 } }
      : how === 'food'
        ? spendFood(p, food!, SNACK_SIZE)
        : { ...p, seedsSpent: p.seedsSpent + SNACK_SIZE };
  return { ...spent, snacked: { ...p.snacked, [id]: day }, snacks: { ...p.snacks, [id]: (p.snacks[id] ?? 0) + 1 } };
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
