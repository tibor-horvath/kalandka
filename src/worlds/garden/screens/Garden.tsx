import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrivalRing } from '../../../components/ArrivalRing';
import { Seed } from '../art';
import {
  BasketIcon,
  BerryIcon,
  BorderFlower,
  CanIcon,
  DecorArt,
  DropIcon,
  FlowerIcon,
  FoodIcon,
  FruitIcon,
  GardenPlant,
  GiftPacket,
  PearIcon,
  PlantIcon,
  SeedPacket,
  SittingBee,
  SittingButterfly,
  TreatArt,
  VegPatch,
  VisitorArt
} from '../kiskert';
import { SeedCount } from '../SeedCount';
import { SeedStore } from '../../../components/StoreRack';
import { packsAndOnes } from '../../../components/StoreDialog';
import { storeFull } from '../../../state/balance';
import { GuideSay, type Say } from '../../../components/GuideSay';
import { Modal, useModal } from '../../../components/Modal';
import { PlaceShell } from '../../../components/PlaceShell';
import { BackIcon, RoundButton } from '../../../components/ui';
import { chime, fanfare, popBubble } from '../../../lib/sound';
import { article, capitalize, numberAttr, numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { useProgress, type Progress } from '../../../state/progress';
import { type FruitKind, BASKET_MAX, SHELF_MAX, basketFullFor, basketHolds, fruitOf, shelfFull, BORDER_COST, BORDER_SPOTS, FIRST_FLOWER, FIRST_TREE, FLOWERS, FOOD_NAMES, GIFTS_EACH, PLANT_OPTIONS, SNACK_SIZE, PLOT_BEDS, RECIPES, TREAT_WANTED, VEG_COST, VEG_HELPINGS, VEG_SPOTS, VISITORS, basketBerries, basketPears, basketTotal, bedAt, bedFlower, bedName, bedTree, borderAt, borderPattern, broughtBy, buyFlower, canBuyFlower, canGive, canGiveFood, canGiveSeeds, canMake, canMakeAnything, canPlant, canPlantBorder, canPlantVeg, canSnack, canSnackWith, decorOf, emptyBeds, emptyBorder, flowerOf, foodGiftSize, foodOnHand, fruitName, gardenDone, gardenFull, giftSize, giftsOf, giftsReady, give, giveFood, giveSeeds, growAfter, growthOf, isGrown, isThirsty, make, newVisitor, visitorsOf, openBeds, openVeg, ownedFlowers, ownedTrees, ownedVegs, ownsFlower, ownsTree, pantryCount, pickFruit, pickedFruit, plant, plantBorder, plantVeg, pollenFlowers, recipeOf, recipeOpen, ripeFruit, ripeTotal, ripeVegSpots, seedBalance, seedGiftSize, snack, snackDue, snackedToday, takesSeeds, thirstyBeds, treatOutOfReach, treatsOf, treeOf, vegAt, vegOf, vegRipe, visitorOf, visitorProgress, water, waterAll, welcomedVisitors, wishOf, type DecorId, type FlowerId, type PlantKind, type Recipe, type SnackHow, type TreatId, type TreeId, type VegId, type VisitorId } from '../../../state/garden';

const CHEAPEST = Math.min(...PLANT_OPTIONS.map((o) => o.cost));

/** Who the fruit that goes into no recipe is for: "Süninek". */
const FRUIT_FOR: Record<'apple' | 'cherry' | 'nut', string> = { apple: 'Süninek', cherry: 'Rigónak', nut: 'Mókusnak' };
/** One bite of the eating (or one flower of the pollen flight): the next is counted after this long. */
const BITE_MS = 900;

function tasksLeft(n: number): string {
  return n === 1 ? 'Még egy feladat, és kinő.' : `Még ${n} feladat, és kinő.`;
}

const prefersLess = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** "almamagot", "répamagot": what a visitor brought, in Csepi's line. */
const BROUGHT_WORD: Record<TreeId | VegId, string> = {
  pear: 'körtemagot',
  apple: 'almamagot',
  cherry: 'cseresznyemagot',
  walnut: 'diót',
  carrot: 'répamagot',
  lettuce: 'salátamagot'
};

/** "Süninek", "Nyuszinak": the visitor as the one given to. */
function toVisitor(name: string): string {
  return /[eéiíöőüű][^aáoóuú]*$/i.test(name) ? `${name}nek` : `${name}nak`;
}

/** The plot (0 or 1) a pollen flower ("b12", "s3") stands in. */
function plotOfKey(key: string): number {
  const i = Number(key.slice(1));
  return key[0] === 'b' ? Math.floor(i / PLOT_BEDS) : Math.floor(i / BORDER_SPOTS);
}

/** A visitor eating from the garden: vegetables from the Veteményes, or the bee's pollen flight. */
type Feast =
  | { visitor: VisitorId; kind: 'veg'; food: VegId; spots: number[]; total: number; gift: boolean }
  | { visitor: VisitorId; kind: 'pollen'; keys: string[]; total: number; gift: boolean };

/** What Csepi says when a visitor has had its snack for the day. */
function snackLine(id: VisitorId): string {
  return `${visitorOf(id).name} jóllakott. Köszöni az uzsonnát! Holnap újra örül egy kis falatnak.`;
}

type View = number | 'ret';

/** Kiskert: the child plants the seeds earned in the games; plantings grow as they keep playing. */
export function Garden({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const balance = seedBalance(progress);
  const empty = emptyBeds(progress);
  const thirsty = thirstyBeds(progress);
  const plots = openBeds(progress) / PLOT_BEDS;
  // What is on show: a plot (the one with the next empty bed, so planting picks up where it left off) or the Rét.
  const [view, setView] = useState<View>(() => Math.floor((empty[0] ?? 0) / PLOT_BEDS));
  const plot = view === 'ret' ? null : view;
  // At most one thing is chosen, and its sheet stands where the dock was: an empty bed, a border spot or a Veteményes spot.
  const [selected, setSelected] = useState<number | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [vegSpot, setVegSpot] = useState<number | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [shedOpen, setShedOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  // The planting whose seeds are being counted out, and the kinds last chosen.
  const [sowing, setSowing] = useState<PlantKind | 'veg' | null>(null);
  const [lastFlower, setLastFlower] = useState<FlowerId>(FIRST_FLOWER);
  const [lastTree, setLastTree] = useState<TreeId>(FIRST_TREE);
  const showPantry = basketPears(progress) + basketBerries(progress) > 0 || pantryCount(progress) > 0 || gardenFull(progress);
  const [say, setSay] = useState<Say>(() => opening());
  // The last plant or visitor the child tapped; the count restarts its little reaction on every tap.
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  const poked = (id: string) => (poke?.id === id ? poke.n : 0);
  const pokeAt = (id: string) => setPoke((p) => ({ id, n: (p?.id === id ? p.n : 0) + 1 }));
  // One new visitor is welcomed per visit to the garden, so several arriving together never chain their welcome cards;
  // the next waits for the next visit (the island's "Vendég jött!" badge keeps pointing to it).
  const [greeted, setGreeted] = useState(false);
  const visitor = greeted ? null : newVisitor(progress);
  const welcomed = welcomedVisitors(progress);
  // The visitor whose gift card is open, the decoration just left (it pops in once), and the "Kész a kert!" card.
  const [guest, setGuest] = useState<VisitorId | null>(null);
  const [freshDecor, setFreshDecor] = useState<DecorId | null>(null);
  const givenDecor = useRef<DecorId | null>(null);
  const [done, setDone] = useState(false);
  const [feast, setFeast] = useState<Feast | null>(null);
  const [bite, setBite] = useState(0);
  const hasBees = welcomed.some((v) => v.id === 'bee');
  const hasButterfly = welcomed.some((v) => v.id === 'butterfly');
  const vegOpen = openVeg(progress) > 0;

  function opening(): Say {
    if (thirsty.length > 0) {
      return {
        text: 'Szomjasak a növényeid! Koppints a kannára.',
        speech: 'Szomjasak a növényeid! Koppints a locsolókannára, és megöntözzük őket.',
        mood: 'smile',
        tone: 'plain'
      };
    }
    if (ripeTotal(progress) > 0) {
      return { text: 'Érett a termés! Koppints rá, és szedd le.', speech: 'Érett a termés! Koppints a fára vagy a bokorra, és szedd le.', mood: 'cheer', tone: 'plain' };
    }
    if (canMakeAnything(progress)) {
      return {
        text: 'Van elég termés! Főzzünk valamit a kamrában.',
        speech: 'Van elég termés a kosárban! Koppints a kamrára, és főzzünk belőle valami finomat.',
        mood: 'cheer',
        tone: 'plain'
      };
    }
    const ready = giftsReady(progress)[0];
    if (ready) {
      const { food, treat } = wishOf(ready.id);
      const speech = canGiveFood(progress, ready.id)
        ? `Van a kertben ${FOOD_NAMES[food!].wanted}. ${ready.name} nagyon szereti! Koppints a Rétre, aztán ${toVisitor(ready.name).replace(/^./, (c) => c.toLowerCase())}.`
        : canGive(progress, ready.id)
          ? `Van a polcon ${TREAT_WANTED[treat]}. ${ready.name} nagyon szereti! Koppints a Rétre, és add oda neki.`
          : `${ready.name} egy marék magnak is örülne! Koppints a Rétre, és számolj ki neki ${numberAttr(seedGiftSize(progress, ready.id))} magot.`;
      return { text: `${ready.name} ajándékot vár a Réten!`, speech, mood: 'cheer', tone: 'plain' };
    }
    if (empty.length === 0) {
      return {
        text: 'Tele a kert! Nézd, milyen szép lett.',
        speech: gardenFull(progress) ? 'Tele a kert! Nézd, milyen szép lett. A maradék magból kalácsot süthetünk a kamrában.' : 'Tele a kert! Nézd, milyen szép lett.',
        mood: 'cheer',
        tone: 'good'
      };
    }
    if (balance < CHEAPEST) {
      const need = CHEAPEST - balance;
      return {
        text: `Még ${need} mag, és ültethetünk.`,
        speech: `Gyűjts még ${need === 1 ? 'egy' : need} magot a játékokban, és ültetünk belőle!`,
        mood: 'smile',
        tone: 'plain'
      };
    }
    return { text: 'Koppints egy üres ágyásra!', speech: 'Hová ültessünk? Koppints egy üres ágyásra, aztán válassz!', mood: 'cheer', tone: 'plain' };
  }

  const tell = (s: Say) => {
    setSay(s);
    speak(s.speech);
  };

  useEffect(() => {
    if (!visitor) speak(say.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  // Each newly arrived visitor is greeted in turn, the earliest first.
  useEffect(() => {
    if (!visitor) return;
    const brought = broughtBy(visitor.id);
    const kind = brought?.tree?.id ?? brought?.veg?.id;
    speak(kind ? `${visitor.speech} ${visitor.name} ${BROUGHT_WORD[kind]} hozott!` : visitor.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Greeted once per visitor, not on every render of the same one.
  }, [visitor?.id]);

  const clearChoice = () => {
    setSelected(null);
    setSpot(null);
    setVegSpot(null);
  };

  const showView = (v: View) => {
    popBubble(1);
    clearChoice();
    setView(v);
  };

  const tapBed = (i: number) => {
    const bed = bedAt(progress, i);
    clearChoice();
    if (!bed) {
      setSelected(i);
      popBubble(1);
      if (balance >= CHEAPEST) tell({ text: 'Mit ültessünk ide?', speech: 'Mit ültessünk ide?', mood: 'smile', tone: 'plain' });
      else tell(opening());
      return;
    }
    pokeAt(`bed${i}`);
    const left = growAfter(bed.kind) - growthOf(bed, progress.worlds.garden.tasks);
    const name = bedName(bed).toLowerCase();
    // Ripe fruit first, one per tap, counted aloud; then a thirsty plant gets its water.
    const ripe = ripeFruit(bed, progress.worlds.garden.tasks);
    const kind = fruitOf(bed);
    if (ripe > 0 && kind && basketFullFor(progress, kind)) {
      // Every hollow for this fruit is taken: it waits on the plant until the child cooks or gives some away.
      popBubble(1);
      const where = kind === 'pear' || kind === 'berry' ? 'Főzzünk belőle a Kamrában' : `Vigyük ${FRUIT_FOR[kind]}`;
      tell({
        text: `Tele a ${fruitName(bed)} helye a kosárban. ${where}!`,
        speech: `A kosárban mind a húsz ${fruitName(bed)}hely tele van. A ${fruitName(bed)} addig ott marad, ahol termett. ${where}, és lesz hely!`,
        mood: 'think',
        tone: 'plain'
      });
      return;
    }
    if (ripe > 0) {
      const count = pickedFruit(bed) + 1;
      const word = capitalize(numberCount(count));
      popBubble(Math.min(count, 5));
      update((p) => pickFruit(p, i));
      if (ripe > 1) {
        tell({ text: `${word}!`, speech: `${word}!`, mood: 'cheer', tone: 'plain' });
      } else {
        const all = `${word}! ${capitalize(numberAttr(count))} ${fruitName(bed)} a kosárban.`;
        const thirst = isThirsty(bed, progress.worlds.garden.tasks) ? ' Most locsold meg, és újra terem!' : '';
        tell({ text: all + thirst, speech: all + thirst, mood: 'cheer', tone: 'good' });
      }
      return;
    }
    if (isThirsty(bed, progress.worlds.garden.tasks)) {
      chime();
      update((p) => water(p, i));
      tell({ text: 'Köszöni! Megint teremni fog.', speech: `Megöntözted! A ${name} köszöni. Ha tovább játszol, megint terem.`, mood: 'cheer', tone: 'good' });
      return;
    }
    if (left > 0) tell({ text: tasksLeft(left), speech: `Ebből ${name} lesz. ${tasksLeft(left)}`, mood: 'smile', tone: 'plain' });
    else tell({ text: `Szép ${name}!`, speech: `Milyen szép ${name}!`, mood: 'cheer', tone: 'good' });
  };

  // Choosing a plant opens the seed count; it is planted once every seed is counted in.
  const choose = (kind: PlantKind) => {
    if (selected === null || !canPlant(progress, selected, kind)) return;
    popBubble(1);
    setSowing(kind);
  };

  const sown = (kind: PlantKind, flower: FlowerId, tree: TreeId) => {
    setSowing(null);
    if (selected === null || !canPlant(progress, selected, kind)) return;
    if (kind === 'flower') setLastFlower(flower);
    if (kind === 'tree') setLastTree(tree);
    const at = selected;
    const name = (kind === 'flower' ? flowerOf(flower).name : kind === 'tree' ? treeOf(tree).name : PLANT_OPTIONS.find((o) => o.id === kind)!.name).toLowerCase();
    const after = plant(progress, at, kind, flower, tree);
    update((p) => plant(p, at, kind, flower, tree));
    clearChoice();
    if (openBeds(after) > openBeds(progress)) {
      // The first plot is planted full: the second one opens next to it.
      fanfare();
      setView(1);
      tell({
        text: 'Megtelt az első kert! Itt a második.',
        speech: `Elültettük! Megtelt az első kert, mind a tizenöt ágyás. Nézd, kinyílt a második kert! Ott is tizenöt ágyás vár.`,
        mood: 'cheer',
        tone: 'good'
      });
      return;
    }
    chime();
    tell({
      text: 'Elültettük!',
      speech: `Elültettük! Ebből ${name} lesz. Minden megoldott feladattal nő egy kicsit. ${tasksLeft(growAfter(kind))}`,
      mood: 'cheer',
      tone: 'good'
    });
  };

  const tapSpot = (i: number) => {
    popBubble(1);
    clearChoice();
    setSpot(i);
    const now = borderAt(progress, i);
    if (now) {
      tell({ text: 'Milyen virág legyen itt?', speech: `Itt ${article(flowerOf(now).name)} ${flowerOf(now).name.toLowerCase()} nyílik. Ha szeretnéd, ingyen kicseréljük egy másikra.`, mood: 'smile', tone: 'plain' });
    } else if (balance >= BORDER_COST) {
      tell({ text: 'Milyen virág legyen itt?', speech: 'Milyen virág legyen itt a szegélyben? Egy magba kerül.', mood: 'smile', tone: 'plain' });
    } else {
      tell({ text: 'Egy mag kell hozzá.', speech: 'Ide egy mag kell. Gyűjts egyet a játékokban!', mood: 'smile', tone: 'plain' });
    }
  };

  const chooseBorder = (id: FlowerId) => {
    if (spot === null) return;
    const now = borderAt(progress, spot);
    if (now === id) return;
    if (!canPlantBorder(progress, spot, id)) {
      popBubble(1);
      tell({ text: 'Egy mag kell hozzá.', speech: 'Ide egy mag kell. Gyűjts egyet a játékokban!', mood: 'smile', tone: 'plain' });
      return;
    }
    const after = plantBorder(progress, spot, id);
    update((p) => plantBorder(p, spot, id));
    const row = Math.floor(spot / BORDER_SPOTS);
    const pattern = borderPattern(after, row);
    if (pattern && !borderPattern(progress, row)) {
      // The row has just become a pattern: say it the way a pattern is read, then where it goes on.
      fanfare();
      const names = [...pattern, ...pattern].map((f) => flowerOf(f).name.toLowerCase()).join(', ');
      tell({ text: 'Mintás szegély lett!', speech: `Mintás szegély lett! ${capitalize(names)}, és így tovább. Ügyes!`, mood: 'cheer', tone: 'good' });
    } else if (now) {
      chime();
      tell({ text: `Itt most ${flowerOf(id).name.toLowerCase()} nyílik.`, speech: `Kicseréltük! Itt most ${flowerOf(id).name.toLowerCase()} nyílik.`, mood: 'cheer', tone: 'plain' });
    } else {
      chime();
      tell({ text: 'Egy! Elültettük.', speech: `Egy! Elültettük ${article(flowerOf(id).name)} ${flowerOf(id).planted}.`, mood: 'cheer', tone: 'good' });
    }
    // A new flower moves on to the next empty spot of the row, while there are seeds for it.
    if (!now) {
      const next = emptyBorder(after, row)[0];
      setSpot(next !== undefined && seedBalance(after) >= BORDER_COST ? next : null);
    }
  };

  const tapVeg = (i: number) => {
    const here = vegAt(progress, i);
    clearChoice();
    popBubble(1);
    if (here) {
      const v = vegOf(here.kind);
      const eater = visitorOf(v.bringer);
      tell(
        vegRipe(here, progress.worlds.garden.tasks)
          ? { text: `Érett ${v.name.toLowerCase()}!`, speech: `Három érett ${v.name.toLowerCase()}. ${eater.name} nagyon szereti!`, mood: 'cheer', tone: 'plain' }
          : { text: 'Még nő.', speech: `Itt ${v.name.toLowerCase()} nő. Még egy kis játék, és megérik.`, mood: 'smile', tone: 'plain' }
      );
      return;
    }
    setVegSpot(i);
    tell(
      balance >= VEG_COST
        ? { text: 'Mit ültessünk a veteményesbe?', speech: 'Mit ültessünk a veteményesbe? Két magba kerül.', mood: 'smile', tone: 'plain' }
        : { text: 'Két mag kell hozzá.', speech: 'Ide két mag kell. Gyűjts a játékokban!', mood: 'smile', tone: 'plain' }
    );
  };

  const [vegKind, setVegKind] = useState<VegId>('carrot');
  const chooseVeg = (id: VegId) => {
    if (vegSpot === null || !canPlantVeg(progress, vegSpot, id)) {
      popBubble(1);
      return;
    }
    setVegKind(id);
    setSowing('veg');
  };

  const sownVeg = () => {
    setSowing(null);
    if (vegSpot === null || !canPlantVeg(progress, vegSpot, vegKind)) return;
    const at = vegSpot;
    update((p) => plantVeg(p, at, vegKind));
    clearChoice();
    chime();
    tell({ text: 'Elültettük!', speech: `Elültettük! Két feladat, és megérik a ${vegOf(vegKind).name.toLowerCase()}.`, mood: 'cheer', tone: 'good' });
  };

  const waterThirsty = () => {
    if (thirsty.length === 0) return;
    chime();
    update(waterAll);
    tell({
      text: 'Megöntöztük! Köszönik.',
      speech: 'Megöntöztük őket! Köszönik. Ha tovább játszol, megint teremnek.',
      mood: 'cheer',
      tone: 'good'
    });
  };

  const welcome = () => {
    if (!visitor) return;
    fanfare();
    setGreeted(true);
    update((p) => ({ ...p, visitorsSeen: p.visitorsSeen + 1 }));
    const { food, treat } = wishOf(visitor.id);
    const likes = food ? `${FOOD_NAMES[food].wanted} és ${TREAT_WANTED[treat]}` : TREAT_WANTED[treat];
    const more = visitorsOf(progress).length > progress.visitorsSeen + 1 ? ' Még valaki érkezett, legközelebb őt is köszöntjük.' : '';
    tell({
      text: `${visitor.name} ${likes} szeret.`,
      speech: `${visitor.name} ${likes} szeret. Koppints a Rétre, és megajándékozhatod.${more}`,
      mood: 'cheer',
      tone: 'plain'
    });
  };

  const thanks = (v: VisitorId, after: Progress) => {
    const decor = decorOf(after, v).at(-1)!;
    givenDecor.current = decor.id;
    if (gardenDone(after)) {
      setGuest(null);
      setDone(true);
      speak('Kész a kert! Minden lakó megkapta az ajándékát, és mindegyik készített neked valamit. Nézd, milyen szép lett!');
    }
  };

  const gave = (v: VisitorId, how: 'treat' | 'seeds' | 'fruit') => {
    const giving = how === 'seeds' ? giveSeeds : how === 'fruit' ? giveFood : give;
    const after = giving(progress, v);
    update((p) => giving(p, v));
    thanks(v, after);
  };

  /** A snack given on the gift card (a treat, a handful of seeds or fruit from the basket); the card thanks the child. */
  const snackedWith = (v: VisitorId, how: SnackHow) => {
    update((p) => snack(p, v, how));
  };

  // Vegetables and pollen are eaten in the garden: the card closes, the visitor eats bite by bite and Csepi counts.
  const startFeast = (v: VisitorId, gift: boolean) => {
    const { food } = wishOf(v);
    setGuest(null);
    clearChoice();
    const n = gift ? foodGiftSize(progress, v) : SNACK_SIZE;
    if (food === 'pollen') {
      const keys = pollenFlowers(progress).slice(0, n);
      begin({ visitor: v, kind: 'pollen', keys, total: keys.length, gift });
      return;
    }
    if (food !== 'carrot' && food !== 'lettuce') return;
    const spots = ripeVegSpots(progress, food).slice(0, Math.ceil(n / VEG_HELPINGS));
    begin({ visitor: v, kind: 'veg', food, spots, total: n, gift });
  };

  const begin = (f: Feast) => {
    if (prefersLess()) {
      finishFeast(f);
      return;
    }
    setBite(0);
    setFeast(f);
    setView(f.kind === 'veg' ? Math.floor(f.spots[0] / VEG_SPOTS) : plotOfKey(f.keys[0]));
    tell({
      text: f.kind === 'pollen' ? 'Figyeld a méhecskét!' : `${visitorOf(f.visitor).name} eszik. Számoljunk!`,
      speech: f.kind === 'pollen' ? 'Figyeld a méhecskét! Számoljuk a virágokat.' : `${visitorOf(f.visitor).name} eszik. Számoljunk együtt!`,
      mood: 'cheer',
      tone: 'plain'
    });
  };

  const finishFeast = (f: Feast) => {
    const v = visitorOf(f.visitor);
    const counted = Array.from({ length: f.total }, (_, k) => capitalize(numberCount(k + 1))).join('! ');
    const before = progress;
    const after = f.gift ? giveFood(before, f.visitor) : snack(before, f.visitor, 'food');
    update((p) => (f.gift ? giveFood(p, f.visitor) : snack(p, f.visitor, 'food')));
    setFeast(null);
    fanfare();
    if (f.gift) {
      thanks(f.visitor, after);
      const decor = decorOf(after, f.visitor).at(-1)!;
      setView('ret');
      setFreshDecor(decor.id);
      tell({
        text: `${v.name} köszöni! Készített neked valamit.`,
        speech: `${prefersLess() ? `${counted}! ` : ''}${v.name} köszöni. Nézd, mit készített neked: egy ${decor.name.toLowerCase()}!`,
        mood: 'cheer',
        tone: 'good'
      });
    } else {
      setView('ret');
      tell({ text: `${v.name} jóllakott!`, speech: `${prefersLess() ? `${counted}! ` : ''}${snackLine(f.visitor)}`, mood: 'cheer', tone: 'good' });
    }
  };

  // The feast moves on one bite (or one flower) at a time; the view follows the pollen to the other plot when it must.
  useEffect(() => {
    if (!feast) return;
    if (bite >= feast.total) {
      const end = window.setTimeout(() => finishFeast(feast), 500);
      return () => window.clearTimeout(end);
    }
    const next = window.setTimeout(() => {
      popBubble(Math.min(bite + 1, 5));
      speak(capitalize(numberCount(bite + 1)));
      setBite(bite + 1);
      if (feast.kind === 'pollen' && feast.keys[bite + 1]) setView(plotOfKey(feast.keys[bite + 1]));
      if (feast.kind === 'veg') {
        const spotNow = feast.spots[Math.floor((bite + 1) / VEG_HELPINGS)];
        if (spotNow !== undefined) setView(Math.floor(spotNow / VEG_SPOTS));
      }
    }, bite === 0 ? 700 : BITE_MS);
    return () => window.clearTimeout(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Each bite schedules the next.
  }, [feast, bite]);

  // Where the bee and the butterfly sit: one bee on every third grown flower, the butterfly on the first one left.
  const grownFlowers = progress.beds.flatMap((b, i) => (b && b.kind === 'flower' && isGrown(b, progress.worlds.garden.tasks) ? [i] : []));
  const beeOn = new Set(hasBees ? grownFlowers.filter((_, k) => k % 3 === 0) : []);
  const butterflyOn = hasButterfly ? grownFlowers.find((i) => !beeOn.has(i)) : undefined;
  const feastKey = feast?.kind === 'pollen' ? feast.keys[Math.min(bite, feast.keys.length - 1)] : null;
  /** Vegetables still left in a Veteményes spot while it is being eaten. */
  const leftIn = (i: number): number => {
    if (feast?.kind !== 'veg') return VEG_HELPINGS;
    const k = feast.spots.indexOf(i);
    if (k < 0) return VEG_HELPINGS;
    return Math.max(0, Math.min(VEG_HELPINGS, VEG_HELPINGS - (bite - k * VEG_HELPINGS)));
  };

  // A tree kind a visitor brought shows "új" on the Fa card until one is planted; a vegetable until one is sown.
  const newTree = ownedTrees(progress).some((t) => t.id !== FIRST_TREE && !progress.beds.some((b) => b?.kind === 'tree' && bedTree(b) === t.id));
  const newVeg = (id: VegId) => !progress.veg.some((s) => s?.kind === id) && giftsOf(progress, vegOf(id).bringer) === 0;
  const readyGuests = giftsReady(progress);

  const sheet = selected !== null ? 'bed' : spot !== null ? 'border' : vegSpot !== null ? 'veg' : null;

  return (
    <PlaceShell
      world="garden"
      className="screen--garden"
      title="Kiskertem"
      onBack={onBack}
      counters={
        <>
          {basketTotal(progress) > 0 && (
            <button
              type="button"
              className="pill pill--basket kk-basket"
              aria-label={`Kosár: ${basketTotal(progress)} gyümölcs. Koppints, és megmutatja, mi van benne.`}
              onClick={() => {
                popBubble(1);
                setBasketOpen(true);
              }}
            >
              <BasketIcon size={30} />
              <span>{basketTotal(progress)}</span>
            </button>
          )}
          <button
            type="button"
            className="pill"
            aria-label={`${balance} mag. Koppints, és megmutatom a Magtárat.`}
            onClick={() => {
              popBubble(1);
              setShedOpen(true);
            }}
            disabled={!!feast}
          >
            <Seed />
            <span>
              {balance}
              <span className="pill__unit"> mag</span>
            </span>
          </button>
        </>
      }
    >
      <div className="kk">
        <div className="kk__bar">
          <div className="kk-tabs" role="tablist" aria-label="Kertek">
            {Array.from({ length: plots }, (_, k) => (
              <button key={k} type="button" role="tab" aria-selected={view === k} className={`kk-tab${view === k ? ' is-on' : ''}`} onClick={() => showView(k)} disabled={!!feast}>
                {k + 1}. kert
              </button>
            ))}
            <button
              type="button"
              role="tab"
              aria-selected={view === 'ret'}
              aria-label={`Rét, ${welcomed.length} lakó${readyGuests.length ? `, ${readyGuests.length} ajándékot vár` : ''}`}
              className={`kk-tab kk-tab--ret${view === 'ret' ? ' is-on' : ''}`}
              onClick={() => showView('ret')}
              disabled={!!feast}
            >
              <MeadowIcon />
              Rét
              <span className={`kk-tab__count${readyGuests.length ? ' is-waiting' : ''}`} aria-hidden="true">
                {welcomed.length}
              </span>
            </button>
          </div>
          {plot === null && (
            <button
              type="button"
              className={`pantry-btn kk-kamra${canMakeAnything(progress) ? ' is-ready' : ''}`}
              aria-label={`Kamra, ${pantryCount(progress)} finomság a polcon`}
              disabled={!!feast}
              onClick={() => {
                popBubble(2);
                setPantryOpen(true);
              }}
            >
              <TreatArt id="jam" size={34} />
              <span>Kamra</span>
              <span className="water-btn__count" aria-label={`${pantryCount(progress)} finomság a polcon`}>
                {pantryCount(progress)}
              </span>
            </button>
          )}
          <GuideSay world="garden" {...say} />
        </div>

        {plot !== null ? (
          <div className="kk-field">
            <div className="kk-beds">
              {Array.from({ length: PLOT_BEDS }, (_, k) => {
                const i = plot * PLOT_BEDS + k;
                const bed = bedAt(progress, i);
                const growth = bed ? growthOf(bed, progress.worlds.garden.tasks) : 0;
                const needs = bed ? growAfter(bed.kind) : 0;
                const grown = !!bed && growth >= needs;
                const dry = !!bed && isThirsty(bed, progress.worlds.garden.tasks);
                const ripe = bed ? ripeFruit(bed, progress.worlds.garden.tasks) : 0;
                const name = bed ? bedName(bed) : '';
                const bee = beeOn.has(i);
                const butterfly = butterflyOn === i;
                const flight = feastKey === `b${i}`;
                const guests = `${bee ? ', egy méhecske ül rajta' : ''}${butterfly ? ', egy pillangó ül rajta' : ''}`;
                const care = `${ripe > 0 ? `, ${ripe} érett ${fruitName(bed!)}` : ''}${dry ? ', szomjas' : ''}`;
                const label = !bed
                  ? `Üres ágyás, ${i + 1}.${selected === i ? ', kiválasztva' : ''}`
                  : grown
                    ? `${name}${guests}${care}, ${i + 1}. ágyás`
                    : `Palánta, ebből ${name.toLowerCase()} lesz. ${tasksLeft(needs - growth)}`;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`kbed${selected === i ? ' is-selected' : ''}${bed ? '' : ' kbed--empty'}${dry ? ' is-thirsty' : ''}${flight ? ' is-visited' : ''}`}
                    aria-label={label}
                    aria-pressed={bed ? undefined : selected === i}
                    onClick={() => tapBed(i)}
                    disabled={!!feast}
                  >
                    <span className="kbed__plant">
                      {bed ? (
                        <span key={grown ? 'grown' : 'sprout'} className="pop-in">
                          <span key={poked(`bed${i}`)} className={`kbed__sway${poked(`bed${i}`) ? ' is-poked' : ''}`}>
                            <GardenPlant kind={bed.kind} grown={grown} fruit={ripe} thirsty={dry} flower={bedFlower(bed)} tree={bedTree(bed)} />
                          </span>
                        </span>
                      ) : (
                        <span className="kbed__plus" aria-hidden="true">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      )}
                      {(bee || flight) && (
                        <span key={`bee${poked(`bed${i}`)}`} className={`kbed__guest kbed__guest--bee${poked(`bed${i}`) ? ' is-poked' : ''}${flight ? ' is-landing' : ''}`}>
                          <SittingBee size={30} />
                        </span>
                      )}
                      {butterfly && !flight && (
                        <span key={`bf${poked(`bed${i}`)}`} className={`kbed__guest kbed__guest--butterfly${poked(`bed${i}`) ? ' is-poked' : ''}`}>
                          <SittingButterfly size={34} />
                        </span>
                      )}
                    </span>
                    <span className="kbed__soil" />
                    {dry && (
                      <span className="kbed__thirst" aria-hidden="true">
                        <DropIcon />
                      </span>
                    )}
                    {bed && !grown && (
                      <span className="kbed__growth" aria-hidden="true">
                        {Array.from({ length: needs }, (_, n) => (
                          <span key={n} className={n < growth ? 'is-full' : ''} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="kk-front">
              <div className="kborder" aria-label="Szegély">
                {Array.from({ length: BORDER_SPOTS }, (_, k) => {
                  const i = plot * BORDER_SPOTS + k;
                  const f = borderAt(progress, i);
                  const on = spot === i;
                  const flight = feastKey === `s${i}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`kborder__spot${on ? ' is-selected' : ''}${f ? '' : ' is-empty'}${flight ? ' is-visited' : ''}`}
                      aria-label={`${f ? flowerOf(f).name : 'Üres hely'} a szegélyben, ${k + 1}.${on ? ', kiválasztva' : ''}`}
                      aria-pressed={on}
                      onClick={() => tapSpot(i)}
                      disabled={!!feast}
                    >
                      {f ? (
                        <span key={f} className="kborder__flower pop-in">
                          <BorderFlower id={f} />
                        </span>
                      ) : (
                        <span className="kborder__dot" aria-hidden="true" />
                      )}
                      {flight && (
                        <span className="kborder__bee is-landing" aria-hidden="true">
                          <SittingBee size={24} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {vegOpen && (
                <div className="kveg" aria-label="Veteményes">
                  {Array.from({ length: VEG_SPOTS }, (_, k) => {
                    const i = plot * VEG_SPOTS + k;
                    const here = vegAt(progress, i);
                    const ripe = !!here && vegRipe(here, progress.worlds.garden.tasks);
                    const on = vegSpot === i;
                    const left = leftIn(i);
                    const eating = feast?.kind === 'veg' && feast.spots.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`kveg__spot${on ? ' is-selected' : ''}${here ? '' : ' is-empty'}`}
                        aria-label={`${here ? `${vegOf(here.kind).name}${ripe ? ', 3 érett' : ', még nő'}` : 'Üres hely'} a veteményesben, ${k + 1}.${on ? ', kiválasztva' : ''}`}
                        aria-pressed={on}
                        onClick={() => tapVeg(i)}
                        disabled={!!feast}
                      >
                        {here && (!eating || left > 0) ? (
                          <span className={`kveg__art kveg__art--${left}`}>
                            <VegPatch kind={here.kind} ripe={ripe} />
                          </span>
                        ) : (
                          <span className="kveg__plus" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {feast?.kind === 'veg' && (
                    <span className="kveg__eater" aria-hidden="true">
                      <span key={bite} className="kveg__chew">
                        <VisitorArt id={feast.visitor} width={110} />
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {feast && (
              <div className="kk-count" aria-live="polite">
                {Math.min(bite, feast.total)}
              </div>
            )}
          </div>
        ) : (
          <Meadow freshDecor={freshDecor} onGuest={(id) => {
            pokeAt(id);
            popBubble(3);
            setGuest(id);
          }} poked={poked} />
        )}

        {sheet === 'bed' && selected !== null && (
          <section className="kk-sheet" aria-labelledby="sheet-title">
            <div className="kk-sheet__top">
              <h2 id="sheet-title" className="kk-sheet__title">
                Mit ültetsz a {selected % PLOT_BEDS + 1}. ágyásba?
              </h2>
              <button type="button" className="kk-sheet__cancel" onClick={() => showView(view)}>
                Mégse
              </button>
            </div>
            <div className="kk-sheet__cards">
              {PLANT_OPTIONS.map((o) => {
                const short = o.cost - balance;
                const ok = short <= 0;
                const isNew = o.id === 'tree' && newTree;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="kk-card"
                    disabled={!ok}
                    onClick={() => choose(o.id)}
                    aria-label={`${o.name}, ${o.cost} mag${isNew ? ', új fajta' : ''}${short > 0 ? `. Még ${short} mag kell hozzá` : ''}`}
                  >
                    {isNew && (
                      <span className="kk-card__new" aria-hidden="true">
                        új
                      </span>
                    )}
                    <PlantIcon kind={o.id} flower={ownsFlower(progress, lastFlower) ? lastFlower : FIRST_FLOWER} tree={ownsTree(progress, lastTree) ? lastTree : FIRST_TREE} />
                    <span className="kk-card__text">
                      <span className="kk-card__name">{o.name}</span>
                      {short > 0 && <span className="kk-card__hint">Még {short} mag kell</span>}
                    </span>
                    <span className="plant-option__cost">
                      <Seed size={20} />
                      {o.cost}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {sheet === 'border' && spot !== null && (
          <section className="kk-sheet" aria-labelledby="sheet-title">
            <div className="kk-sheet__top">
              <h2 id="sheet-title" className="kk-sheet__title">
                Szegély: milyen virág legyen?
              </h2>
              <button type="button" className="kk-sheet__cancel" onClick={() => showView(view)}>
                Kész
              </button>
            </div>
            <div className="kk-sheet__cards kk-sheet__cards--many">
              {ownedFlowers(progress).map((f) => {
                const now = borderAt(progress, spot);
                const here = now === f.id;
                const ok = here || canPlantBorder(progress, spot, f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`kk-card kk-card--small${here ? ' is-here' : ''}`}
                    disabled={!ok}
                    aria-pressed={here}
                    onClick={() => chooseBorder(f.id)}
                    aria-label={`${f.name}${here ? ', ez nyílik itt' : now ? ', csere ingyen' : `, ${BORDER_COST} mag`}`}
                  >
                    <FlowerIcon id={f.id} size={40} />
                    <span className="kk-card__text">
                      <span className="kk-card__name">{f.name}</span>
                    </span>
                    <span className="plant-option__cost">{now ? (here ? '✓' : 'csere') : <><Seed size={16} />{BORDER_COST}</>}</span>
                  </button>
                );
              })}
              {ownedFlowers(progress).length < FLOWERS.length && (
                <button
                  type="button"
                  className="kk-card kk-card--small kk-card--shed"
                  onClick={() => {
                    popBubble(2);
                    setShedOpen(true);
                  }}
                >
                  <span className="kk-card__name">Több virág a Magtárban</span>
                </button>
              )}
            </div>
          </section>
        )}

        {sheet === 'veg' && vegSpot !== null && (
          <section className="kk-sheet" aria-labelledby="sheet-title">
            <div className="kk-sheet__top">
              <h2 id="sheet-title" className="kk-sheet__title">
                Mit ültetsz a veteményesbe?
              </h2>
              <button type="button" className="kk-sheet__cancel" onClick={() => showView(view)}>
                Mégse
              </button>
            </div>
            <div className="kk-sheet__cards">
              {ownedVegs(progress).map((v) => {
                const short = VEG_COST - balance;
                const isNew = newVeg(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="kk-card"
                    disabled={short > 0}
                    onClick={() => chooseVeg(v.id)}
                    aria-label={`${v.name}, ${VEG_COST} mag${isNew ? ', új fajta' : ''}${short > 0 ? `. Még ${short} mag kell hozzá` : ''}`}
                  >
                    {isNew && (
                      <span className="kk-card__new" aria-hidden="true">
                        új
                      </span>
                    )}
                    <span className="kk-card__veg">
                      <VegPatch kind={v.id} ripe />
                    </span>
                    <span className="kk-card__text">
                      <span className="kk-card__name">{v.name}</span>
                      <span className="kk-card__hint kk-card__hint--soft">{visitorOf(v.bringer).name} kedvence</span>
                    </span>
                    <span className="plant-option__cost">
                      <Seed size={20} />
                      {VEG_COST}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!sheet && plot !== null && (
          <nav className="kk-dock" aria-label="A kert dolgai">
            {thirsty.length > 0 && (
              <button type="button" className="water-btn" onClick={waterThirsty} disabled={!!feast}>
                <CanIcon />
                <span>Locsolás</span>
                <span className="water-btn__count" aria-label={`${thirsty.length} szomjas növény`}>
                  {thirsty.length}
                </span>
              </button>
            )}
            {showPantry && (
              <button
                type="button"
                className={`pantry-btn${canMakeAnything(progress) ? ' is-ready' : ''}`}
                disabled={!!feast}
                onClick={() => {
                  popBubble(2);
                  setPantryOpen(true);
                }}
              >
                <TreatArt id="jam" size={40} />
                <span>Kamra</span>
                <span className="water-btn__count" aria-label={`${pantryCount(progress)} finomság a polcon`}>
                  {pantryCount(progress)}
                </span>
              </button>
            )}
            <button
              type="button"
              className="pantry-btn shed-btn"
              disabled={!!feast}
              onClick={() => {
                popBubble(2);
                setShedOpen(true);
              }}
            >
              <span className="shed-btn__packet" aria-hidden="true">
                <SeedPacket id={ownedFlowers(progress).at(-1)!.id} owned />
              </span>
              <span>Magtár</span>
              <span className="water-btn__count" aria-label={`${ownedFlowers(progress).length} virágfajta, ${FLOWERS.length} közül`}>
                {ownedFlowers(progress).length}
              </span>
            </button>
          </nav>
        )}
      </div>

      {pantryOpen && !visitor && (
        <Pantry
          onClose={() => {
            popBubble(1);
            setPantryOpen(false);
          }}
        />
      )}

      {basketOpen && !visitor && (
        <BasketCard
          onClose={() => {
            popBubble(1);
            setBasketOpen(false);
          }}
        />
      )}

      {sowing && sowing !== 'veg' && !visitor && (
        <SowCard
          kind={sowing}
          flower={ownsFlower(progress, lastFlower) ? lastFlower : FIRST_FLOWER}
          tree={ownsTree(progress, lastTree) ? lastTree : FIRST_TREE}
          onDone={(f, t) => sown(sowing, f, t)}
          onClose={() => {
            popBubble(1);
            setSowing(null);
          }}
        />
      )}

      {sowing === 'veg' && !visitor && (
        <VegSowCard
          kind={vegKind}
          onDone={sownVeg}
          onClose={() => {
            popBubble(1);
            setSowing(null);
          }}
        />
      )}

      {shedOpen && !visitor && (
        <FlowerShed
          onBought={setLastFlower}
          onClose={() => {
            popBubble(1);
            setShedOpen(false);
          }}
        />
      )}

      {guest && !visitor && (
        <GiftCard
          id={guest}
          onGive={(how) => gave(guest, how)}
          onFeast={(gift) => startFeast(guest, gift)}
          onSnack={(how) => snackedWith(guest, how)}
          onClose={() => {
            popBubble(1);
            setGuest(null);
            setFreshDecor(givenDecor.current);
          }}
        />
      )}

      {done && !visitor && (
        <Modal className="visitor-pop" labelledBy="done-title">
          <div className="visitor-pop__rays" aria-hidden="true" />
          <p className="visitor-pop__kicker">Minden lakó megkapta az ajándékát</p>
          <h2 id="done-title" className="visitor-pop__title">
            Kész a kert!
          </h2>
          <div className="done-pop__all" aria-hidden="true">
            {VISITORS.map((v) => (
              <VisitorArt key={v.id} id={v.id} width={96} />
            ))}
          </div>
          <button
            type="button"
            className="big-btn"
            autoFocus
            onClick={() => {
              popBubble(2);
              setDone(false);
              setFreshDecor(givenDecor.current);
            }}
          >
            Hurrá!
          </button>
        </Modal>
      )}

      {visitor && <Welcome id={visitor.id} onWelcome={welcome} />}
    </PlaceShell>
  );
}

/** The Rét tab's little meadow. */
function MeadowIcon() {
  return (
    <svg aria-hidden="true" width="26" height="22" viewBox="0 0 26 22">
      <path d="M2 20c2-8 6-12 11-12s9 4 11 12z" fill="currentColor" opacity="0.45" />
      <circle cx="9" cy="14" r="2" fill="#FFFFFF" />
      <circle cx="17" cy="12" r="2" fill="#FFC93C" />
      <path d="M13 8V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** A newly arrived visitor: the whole screen welcomes it, with the seeds it brought, if any. */
function Welcome({ id, onWelcome }: { id: VisitorId; onWelcome: () => void }) {
  const { progress } = useProgress();
  const v = visitorOf(id);
  const brought = broughtBy(id);
  const kind = brought?.tree?.id ?? brought?.veg?.id;
  return (
    <Modal className="visitor-pop" labelledBy="visitor-title">
      <div className="visitor-pop__rays" aria-hidden="true" />
      <p className="visitor-pop__kicker">{Math.min(v.after, progress.beds.filter(Boolean).length)} növény nőtt a kertedben</p>
      <h2 id="visitor-title" className="visitor-pop__title">
        {v.name} beköltözött!
      </h2>
      <div className="visitor-pop__art visitor-pop__art--with">
        <VisitorArt id={id} width={kind ? 240 : 300} />
        {kind && (
          <span className="visitor-pop__packet">
            <GiftPacket tree={brought?.tree?.id} veg={brought?.veg?.id} />
            <span className="visitor-pop__new">új mag</span>
          </span>
        )}
      </div>
      {kind && (
        <p className="visitor-pop__brought">
          {v.name} {BROUGHT_WORD[kind]} hozott!
        </p>
      )}
      <button type="button" className="big-btn" onClick={onWelcome} autoFocus>
        Szia, {v.name}!
      </button>
    </Modal>
  );
}

/**
 * The Rét: a meadow with a home for each of the twelve visitors, always in the same place. A visitor stands in its
 * clearing with the decorations it made around it (two behind, two in front, one at the back), its name on a pill
 * with the five gift dots, or "kér" and what it wants once a gift is ready. The next home holds the "?" ring; the
 * homes after it are only a tuft of grass, so the meadow always looks whole.
 */
function Meadow({
  freshDecor,
  onGuest,
  poked
}: {
  freshDecor: DecorId | null;
  onGuest: (id: VisitorId) => void;
  poked: (id: string) => number;
}) {
  const { progress } = useProgress();
  const welcomed = welcomedVisitors(progress);
  const next = visitorProgress(progress);
  return (
    <div className="kk-ret" aria-label="A kert lakói">
      {VISITORS.map((v, i) => {
        if (i < welcomed.length) {
          const decor = decorOf(progress, v.id);
          const given = giftsOf(progress, v.id);
          const { food, treat } = wishOf(v.id);
          const wants = canGiveFood(progress, v.id) ? 'food' : canGive(progress, v.id) ? 'treat' : canGiveSeeds(progress, v.id) ? 'seeds' : null;
          const full = given >= GIFTS_EACH && snackedToday(progress, v.id);
          return (
            <button
              key={v.id}
              type="button"
              className={`kk-home${wants ? ' is-waiting' : ''}`}
              aria-label={`${v.name}, ${given} ajándék az ötből${full ? ', ma már jóllakott' : ''}${wants ? ', ajándékot vár' : ''}`}
              onClick={() => onGuest(v.id)}
            >
              <span className="kk-home__clearing" aria-hidden="true" />
              {decor.map((d, k) => (
                <span key={d.id} className={`kk-home__thing kk-home__thing--${k}${freshDecor === d.id ? ' pop-in' : ''}`} aria-hidden="true">
                  <DecorArt id={d.id} size={56} />
                </span>
              ))}
              <span key={poked(v.id)} className={`kk-home__animal visitors__hop${poked(v.id) ? ' is-poked' : ''}`} aria-hidden="true">
                <VisitorArt id={v.id} width={120} />
              </span>
              <span className="kk-home__pill">
                {v.name}
                {wants ? (
                  <span className="kk-home__wants" aria-hidden="true">
                    {wants === 'food' ? <FoodIcon id={food!} size={18} /> : wants === 'treat' ? <TreatArt id={treat} size={22} /> : <Seed size={16} />}
                    kér
                  </span>
                ) : (
                  <span className="kk-home__dots" aria-hidden="true">
                    {Array.from({ length: GIFTS_EACH }, (_, k) => (
                      <span key={k} className={k < given ? 'is-given' : ''} />
                    ))}
                  </span>
                )}
                {full && (
                  <span className="kk-home__full" aria-hidden="true">
                    <FullHeart size={16} />
                  </span>
                )}
              </span>
            </button>
          );
        }
        if (i === welcomed.length && next) {
          return (
            <div key={v.id} className="kk-home kk-home--next" role="img" aria-label={`Valaki még jön: még ${next.need - next.done} növény kell`}>
              <span className="kk-home__clearing" aria-hidden="true" />
              <ArrivalRing progress={next} unit="plant" />
            </div>
          );
        }
        return (
          <div key={v.id} className="kk-home kk-home--empty" aria-hidden="true">
            <svg className="kk-home__tuft" viewBox="0 0 60 26">
              <path d="M8 26 Q12 8 16 26 M22 26 Q28 2 32 26 M38 26 Q42 10 46 26" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/** The basket: every fruit picked and not yet used, by kind. */
function BasketCard({ onClose }: { onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  // Each fruit is drawn once big and once per piece, small, so a child who cannot read numbers yet can count it.
  // `goes` says what it is for: pears and blueberries are cooked in the pantry, the rest are a visitor's favourite.
  // A crate per kind of fruit the basket holds (or the garden grows), each with a tray of twenty hollows: two ten-frames.
  const grows = new Set(progress.beds.map((b) => (b ? fruitOf(b) : null)));
  const rows: { key: FruitKind; name: string; n: number; goes: string; pantry: boolean; icon: (size: number) => ReactNode }[] = (
    [
      { key: 'pear', name: 'Körte', goes: 'Kamrába', pantry: true, icon: (s: number) => <PearIcon size={s * 0.9} /> },
      { key: 'berry', name: 'Áfonya', goes: 'Kamrába', pantry: true, icon: (s: number) => <BerryIcon size={s} /> },
      { key: 'apple', name: 'Alma', goes: 'Süninek', pantry: false, icon: (s: number) => <FruitIcon id="apple" size={s} /> },
      { key: 'cherry', name: 'Cseresznye', goes: 'Rigónak', pantry: false, icon: (s: number) => <FruitIcon id="cherry" size={s} /> },
      { key: 'nut', name: 'Dió', goes: 'Mókusnak', pantry: false, icon: (s: number) => <FruitIcon id="nut" size={s} /> }
    ] as const
  )
    .map((r) => ({ ...r, n: basketHolds(progress, r.key) }))
    .filter((r) => r.n > 0 || grows.has(r.key));
  const total = rows.reduce((sum, r) => sum + r.n, 0);
  const fullOnes = rows.filter((r) => r.n >= BASKET_MAX);

  useEffect(() => {
    const what = rows.filter((r) => r.n > 0).map((r) => `${numberAttr(r.n)} ${r.name.toLowerCase()}`);
    const full = fullOnes.length ? ` Tele a ${fullOnes.map((r) => r.name.toLowerCase()).join(' és a ')} helye: ami még terem, ott vár, ahol termett.` : '';
    speak(what.length ? `A kosárban: ${what.join(', ')}.${full}` : 'A kosár még üres. Szedj termést a fákról és a bokrokról!');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  return (
    <div ref={modal} className="pantry kbasket" role="dialog" aria-modal="true" aria-labelledby="basket-title">
      <div className={`pantry__card kbasket__card${rows.length > 2 ? ' is-wide' : ''}`}>
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="basket-title" className="pantry__title">
            Kosár
          </h2>
          <div className="pill pill--basket kbasket__total" aria-label={`Összesen ${total} gyümölcs`}>
            <BasketIcon size={32} />
            <span>{total}</span>
          </div>
        </header>
        <div className="kbasket__tray">
          <ul className="crates">
            {rows.map((r) => (
              <li key={r.key} className="crate" aria-label={`${r.name}: ${r.n} a ${BASKET_MAX} helyből, ${r.goes.toLowerCase()}`}>
                <span className="crate__tag" aria-hidden="true">
                  {r.icon(26)}
                  {r.name}
                  {r.n >= BASKET_MAX && <b className="crate__full">Tele!</b>}
                  {r.n > BASKET_MAX && <b className="crate__more">{r.n}</b>}
                </span>
                <span className="crate__cups" aria-hidden="true">
                  {Array.from({ length: BASKET_MAX }, (_, i) => (
                    <span key={i} className={`crate__cup${i % 10 === 4 ? ' is-half' : ''}`}>
                      {i < r.n && r.icon(24)}
                    </span>
                  ))}
                </span>
                <span className={`kbasket__goes${r.pantry ? '' : ' is-visitor'}`} aria-hidden="true">
                  {r.pantry ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10h16v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
                      <path d="M2 10h20M9 6c0-1 1-2 3-2s3 1 3 2" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                    </svg>
                  )}
                  {r.goes}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** What Csepi says about a visitor's next gift: what they ask for and whether it is ready yet. */
function wishLine(p: Progress, id: VisitorId): string {
  const v = visitorOf(id);
  const n = giftSize(p, id);
  const { food, treat } = wishOf(id);
  if (n === 0) {
    if (!snackDue(p, id)) return `${v.name} ma már jóllakott. Holnap újra örül egy kis uzsonnának.`;
    if (canSnack(p, id)) return `${v.name} nagyon boldog. Kér egy kis uzsonnát? Válassz egyet!`;
    return `${v.name} nagyon boldog. Egy kis uzsonnának is örülne, ha lesz.`;
  }
  const foodN = foodGiftSize(p, id);
  if (food && canGiveFood(p, id)) return `${v.name} ${numberAttr(foodN)} ${FOOD_NAMES[food].wanted} kér. Van a kertben, add oda neki!`;
  const ask = `${v.name} ${numberAttr(n)} ${TREAT_WANTED[treat]} kér.`;
  if (canGive(p, id)) return `${ask} Add oda neki!`;
  const seeds = seedGiftSize(p, id);
  const handful = seeds > 0 ? (canGiveSeeds(p, id) ? ` De ${numberAttr(seeds)} magnak is örül!` : ` Vagy ${numberAttr(seeds)} magnak is örül, ha összegyűjtöd.`) : '';
  const fromGarden = food ? ` Vagy ${numberAttr(foodN)} ${FOOD_NAMES[food].wanted} a kertből.` : '';
  if (!recipeOpen(p, treat)) return `${ask} Kalácsot akkor sütünk, ha tele a kert.${fromGarden}${handful}`;
  if (treatOutOfReach(p, treat) && treatsOf(p, treat) < n) return `${ask} Ehhez nem terem gyümölcs a kertben.${fromGarden}${handful}`;
  const short = n - treatsOf(p, treat);
  return `${ask} Még ${numberCount(short)} kell. Főzz a kamrában!${fromGarden}${handful}`;
}

/** Counting out the seeds for a planting: a flower's or a tree's kind is chosen above the tray from the ones the child has. */
function SowCard({
  kind,
  flower,
  tree,
  onDone,
  onClose
}: {
  kind: PlantKind;
  flower: FlowerId;
  tree: TreeId;
  onDone: (f: FlowerId, t: TreeId) => void;
  onClose: () => void;
}) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const option = PLANT_OPTIONS.find((o) => o.id === kind)!;
  const flowers = ownedFlowers(progress);
  const trees = ownedTrees(progress);
  const [pick, setPick] = useState<FlowerId>(flower);
  const [pickTree, setPickTree] = useState<TreeId>(tree);
  const [counted, setCounted] = useState(0);
  const balance = seedBalance(progress);
  const what = kind === 'flower' ? flowerOf(pick).name : kind === 'tree' ? treeOf(pickTree).name : option.name;
  const intro = `Tegyünk ${numberAttr(option.cost)} magot a földbe! Koppints a zsákra.`;
  const line = counted === 0 ? intro : counted >= option.cost ? `${capitalize(numberCount(counted))}! Elültettük!` : `${capitalize(numberCount(counted))}!`;
  const planted = (t: TreeId) => progress.beds.some((b) => b?.kind === 'tree' && bedTree(b) === t);

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  return (
    <div ref={modal} className="pantry sow" role="dialog" aria-modal="true" aria-labelledby="sow-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe, a magok a zsákban maradnak" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="sow-title" className="pantry__title">
            {what}
          </h2>
          <div className="pill pill--basket" aria-label={`${balance - counted} mag a zsákban`}>
            <Seed size={26} />
            <span>{balance - counted}</span>
          </div>
        </header>

        <GuideSay world="garden" mood="cheer" tone={counted >= option.cost ? 'good' : 'plain'} text={line} />

        {kind === 'flower' && flowers.length > 1 && (
          <div className="sow__kinds" role="group" aria-label="Milyen virág legyen?">
            {flowers.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`sow__kind${pick === f.id ? ' is-on' : ''}`}
                aria-pressed={pick === f.id}
                disabled={counted > 0}
                onClick={() => {
                  popBubble(1);
                  setPick(f.id);
                  speak(f.name);
                }}
              >
                <FlowerIcon id={f.id} size={34} />
                {f.name}
              </button>
            ))}
          </div>
        )}

        {kind === 'tree' && trees.length > 1 && (
          <div className="sow__kinds" role="group" aria-label="Milyen fa legyen?">
            {trees.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`sow__kind${pickTree === t.id ? ' is-on' : ''}`}
                aria-pressed={pickTree === t.id}
                aria-label={`${t.name}${t.id !== FIRST_TREE && !planted(t.id) ? ', új' : ''}`}
                disabled={counted > 0}
                onClick={() => {
                  popBubble(1);
                  setPickTree(t.id);
                  speak(t.name);
                }}
              >
                {t.fruit === 'pear' ? <PearIcon size={30} /> : <FruitIcon id={t.fruit as 'apple' | 'cherry' | 'nut'} size={30} />}
                {t.name}
                {t.id !== FIRST_TREE && !planted(t.id) && <span className="sow__new">új</span>}
              </button>
            ))}
          </div>
        )}

        <div className="sow__stage">
          <span className="sow__plant" aria-hidden="true">
            <PlantIcon kind={kind} flower={pick} tree={pickTree} />
          </span>
          <SeedCount cost={option.cost} balance={balance} label={what} onCount={setCounted} onDone={() => onDone(pick, pickTree)} />
        </div>
        <p className="sow__help">Koppints a zsákra vagy a lyukakra. Ha visszalépsz, minden mag a zsákban marad.</p>
      </div>
    </div>
  );
}

/** Counting out the two seeds of a Veteményes spot. */
function VegSowCard({ kind, onDone, onClose }: { kind: VegId; onDone: () => void; onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const v = vegOf(kind);
  const balance = seedBalance(progress);
  const [counted, setCounted] = useState(0);
  const intro = `Tegyünk ${numberAttr(VEG_COST)} magot a földbe! Koppints a zsákra.`;
  const line = counted === 0 ? intro : counted >= VEG_COST ? `${capitalize(numberCount(counted))}! Elültettük!` : `${capitalize(numberCount(counted))}!`;

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  return (
    <div ref={modal} className="pantry sow" role="dialog" aria-modal="true" aria-labelledby="vegsow-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe, a magok a zsákban maradnak" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="vegsow-title" className="pantry__title">
            {v.name}
          </h2>
          <div className="pill pill--basket" aria-label={`${balance - counted} mag a zsákban`}>
            <Seed size={26} />
            <span>{balance - counted}</span>
          </div>
        </header>
        <GuideSay world="garden" mood="cheer" tone={counted >= VEG_COST ? 'good' : 'plain'} text={line} />
        <div className="sow__stage">
          <span className="sow__plant sow__plant--veg" aria-hidden="true">
            <VegPatch kind={kind} ripe />
          </span>
          <SeedCount cost={VEG_COST} balance={balance} label={v.name} onCount={setCounted} onDone={onDone} />
        </div>
        <p className="sow__help">Koppints a zsákra vagy a lyukakra. Ha visszalépsz, minden mag a zsákban marad.</p>
      </div>
    </div>
  );
}

/** A visitor's corner: what it asks for next (from the garden, the shelf or the seed bag), and the five things it makes in return. */
function GiftCard({
  id,
  onGive,
  onFeast,
  onSnack,
  onClose
}: {
  id: VisitorId;
  onGive: (how: 'treat' | 'seeds' | 'fruit') => void;
  onFeast: (gift: boolean) => void;
  onSnack: (how: SnackHow) => void;
  onClose: () => void;
}) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const v = visitorOf(id);
  const wish = wishOf(id);
  const n = giftSize(progress, id);
  const have = treatsOf(progress, wish.treat);
  const made = decorOf(progress, id).length;
  const [line, setLine] = useState(() => wishLine(progress, id));
  const [fresh, setFresh] = useState(-1);
  // Counting a handful of seeds out (a gift for a bird, or a snack).
  const [counting, setCounting] = useState(false);
  const seeds = n > 0 ? seedGiftSize(progress, id) : takesSeeds(progress, id) ? SNACK_SIZE : 0;
  const food = wish.food;
  const foodN = foodGiftSize(progress, id);
  const onHand = food ? foodOnHand(progress, food) : 0;
  const eatsInGarden = food === 'carrot' || food === 'lettuce' || food === 'pollen';
  // After the five gifts: the day's snack, once a day. Nothing is collected; the visitor is just full until tomorrow.
  const snackToday = n === 0 && snackDue(progress, id);
  const [fedNow, setFedNow] = useState(false);

  useEffect(() => {
    speak(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const tell = (text: string, speech = text) => {
    setLine(text);
    speak(speech);
  };

  const thanks = (how: 'treat' | 'seeds' | 'fruit', counted: string) => {
    const decor = wish.decor[made];
    fanfare();
    setFresh(made);
    onGive(how);
    tell(`${v.name} köszöni! Készített neked valamit.`, `${counted}${v.name} köszöni. Nézd, mit készített neked: egy ${decor.name.toLowerCase()}!`);
  };

  const counting1 = (k: number) => Array.from({ length: k }, (_, j) => capitalize(numberCount(j + 1))).join('! ');

  const offer = () => {
    if (!canGive(progress, id)) {
      popBubble(1);
      tell(wishLine(progress, id));
      return;
    }
    thanks('treat', `${counting1(n)}! `);
  };

  const offerFood = () => {
    if (!food) return;
    if (!canGiveFood(progress, id)) {
      popBubble(1);
      const where = food === 'pollen' ? 'nyíló virág' : food === 'carrot' || food === 'lettuce' ? `érett ${FOOD_NAMES[food].name} a veteményesben` : `${FOOD_NAMES[food].name} a kosárban`;
      tell(`${v.name} ${numberAttr(foodN)} ${FOOD_NAMES[food].wanted} kér. Még ${foodN - onHand} ${where} kell.`);
      return;
    }
    if (eatsInGarden) {
      onFeast(true);
      return;
    }
    thanks('fruit', `${counting1(foodN)}! `);
  };

  /** A snack given here: the card turns to "Jóllakott!" for the rest of the day. */
  const snacked = (how: SnackHow, counted: string) => {
    fanfare();
    onSnack(how);
    setFedNow(true);
    tell(`${v.name} jóllakott!`, `${counted}${snackLine(id)}`);
  };

  const offerSnack = (how: SnackHow) => {
    popBubble(1);
    if (!canSnackWith(progress, id, how)) {
      const missing =
        how === 'treat'
          ? !recipeOpen(progress, wish.treat)
            ? 'Kalácsot akkor sütünk, ha tele a kert.'
            : treatOutOfReach(progress, wish.treat)
              ? 'Ehhez nem terem gyümölcs a kertben.'
              : `Főzz ${TREAT_WANTED[wish.treat]} a kamrában!`
          : how === 'seeds'
            ? `Még ${seeds - seedBalance(progress)} mag kell.`
            : `Még ${SNACK_SIZE - onHand} ${food === 'pollen' ? 'nyíló virág' : FOOD_NAMES[food!].name} kell.`;
      tell(`${v.name} uzsonnának örülne. ${missing}`);
      return;
    }
    if (how === 'seeds') {
      setCounting(true);
      tell(`Számolj ki ${seeds} magot!`, `Számolj ki ${numberAttr(seeds)} magot ${toVisitor(v.name)}! Koppints a zsákra.`);
      return;
    }
    if (how === 'food' && eatsInGarden) {
      onFeast(false);
      return;
    }
    snacked(how, how === 'food' ? `${counting1(SNACK_SIZE)}! ` : '');
  };

  const offerSeeds = () => {
    popBubble(1);
    if (!canGiveSeeds(progress, id)) {
      tell(`${v.name} ${numberAttr(seeds)} magnak örülne. Még ${seeds - seedBalance(progress)} kell.`);
      return;
    }
    setCounting(true);
    tell(`Számolj ki ${seeds} magot!`, `Számolj ki ${numberAttr(seeds)} magot ${toVisitor(v.name)}! Koppints a zsákra.`);
  };

  return (
    <div ref={modal} className="pantry gift" role="dialog" aria-modal="true" aria-labelledby="gift-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a rétre" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="gift-title" className="pantry__title">
            {v.name}
          </h2>
        </header>

        <GuideSay world="garden" mood="cheer" text={line} />

        <div className="gift__main">
          <div className="gift__guest" aria-hidden="true">
            <VisitorArt id={id} width={180} />
          </div>
          <div className="gift__offers">
            {counting && seeds > 0 && (
              <SeedCount
                cost={seeds}
                balance={seedBalance(progress)}
                label={`${numberAttr(seeds)} mag ${v.name} ${n > 0 ? 'ajándékának' : 'uzsonnájának'}`}
                onCount={(k) => setLine(`${capitalize(numberCount(k))}!`)}
                onDone={() => {
                  setCounting(false);
                  if (n > 0) thanks('seeds', '');
                  else snacked('seeds', '');
                }}
              />
            )}
            {!counting && n === 0 && (
              <section className={`snack${snackToday ? '' : ' is-fed'}`} aria-labelledby="snack-title">
                <h3 id="snack-title" className="snack__title">
                  <SnackSun />
                  Mai uzsonna
                </h3>
                {snackToday ? (
                  <SnackOffers id={id} seeds={seeds} onOffer={offerSnack} />
                ) : (
                  <div className={`snack__fed${fedNow ? ' pop-in' : ''}`}>
                    <span className="snack__tick" aria-hidden="true">
                      <FullHeart size={34} />
                    </span>
                    <span className="snack__fed-big">Jóllakott!</span>
                    <span className="snack__fed-small">Holnap újra kér.</span>
                  </div>
                )}
              </section>
            )}
            {!counting && n > 0 && food && (
              <button
                type="button"
                className={`gift__offer${canGiveFood(progress, id) ? ' is-ready' : ''}`}
                onClick={offerFood}
                aria-label={`Odaadom: ${foodN} ${FOOD_NAMES[food].name}. ${food === 'pollen' ? `${onHand} virágon van virágpor.` : `${onHand} van.`}`}
              >
                <span className="gift__treats gift__treats--food" aria-hidden="true">
                  {Array.from({ length: foodN }, (_, k) => (
                    <span key={k} className={`pantry__thing${k < onHand ? '' : ' is-missing'}`}>
                      <FoodIcon id={food} size={foodN > 9 ? 26 : 34} />
                    </span>
                  ))}
                </span>
                <span className="gift__name-big">
                  {foodN} {FOOD_NAMES[food].name} {food === 'pollen' ? 'a virágokról' : food === 'carrot' || food === 'lettuce' ? 'a veteményesből' : 'a kosárból'}
                </span>
                <span className="gift__label">Odaadom!</span>
              </button>
            )}
            {!counting && n > 0 && food && <span className="gift__or">vagy</span>}
            {!counting && n > 0 && (
              <button type="button" className={`gift__offer${canGive(progress, id) ? ' is-ready' : ''}`} onClick={offer} aria-label={`Odaadom: ${n} ${recipeOf(wish.treat).name.toLowerCase()}. A polcon ${have} van.`}>
                <span className="gift__treats" aria-hidden="true">
                  {Array.from({ length: n }, (_, k) => (
                    <span key={k} className={`pantry__thing${k < have ? '' : ' is-missing'}`}>
                      <TreatArt id={wish.treat} size={n > 3 ? 40 : 56} />
                    </span>
                  ))}
                </span>
                <span className="gift__label">{recipeOpen(progress, wish.treat) ? 'Odaadom!' : 'Ha tele a kert'}</span>
              </button>
            )}
            {!counting && n > 0 && takesSeeds(progress, id) && (
              <>
                <span className="gift__or">vagy</span>
                <button
                  type="button"
                  className={`gift__offer${canGiveSeeds(progress, id) ? ' is-ready' : ''}`}
                  onClick={offerSeeds}
                  aria-label={`Egy marék mag: ${seeds} mag. A zsákban ${seedBalance(progress)} van.`}
                >
                  <span className="gift__name-big">Egy marék mag</span>
                  <span className="gift__seeds" aria-hidden="true">
                    {Array.from({ length: seeds }, (_, k) => (
                      <span key={k} className={`pantry__thing${k < seedBalance(progress) ? '' : ' is-missing'}`}>
                        <Seed size={seeds > 9 ? 18 : 26} />
                      </span>
                    ))}
                  </span>
                  <span className="gift__label">Odaadom!</span>
                </button>
              </>
            )}
          </div>
        </div>

        <ul className="gift__decor" aria-label={`${v.name} ajándékai: ${made} az ötből`}>
          {wish.decor.map((d, k) => (
            <li key={d.id} className={`gift__thing${k < made ? '' : ' is-later'}`} aria-label={k < made ? d.name : 'Még nem készült el'}>
              <span className={k === fresh ? 'pop-in' : ''}>
                <DecorArt id={d.id} size={72} />
              </span>
              <span className="gift__name">{k < made ? d.name : `${k + 1}. ajándék`}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}

/** The day's snack after the five gifts, side by side: three of the visitor's garden food, one treat, or (for those who take seeds) three seeds. */
function SnackOffers({ id, seeds, onOffer }: { id: VisitorId; seeds: number; onOffer: (how: SnackHow) => void }) {
  const { progress } = useProgress();
  const { food, treat } = wishOf(id);
  const onHand = food ? foodOnHand(progress, food) : 0;
  const ready = (how: SnackHow) => (canSnackWith(progress, id, how) ? ' is-ready' : '');
  const have = treatsOf(progress, treat);
  const bag = seedBalance(progress);
  return (
    <div className="snack__offers">
      {food && (
        <button type="button" className={`snack__offer${ready('food')}`} onClick={() => onOffer('food')} aria-label={`Uzsonna: ${SNACK_SIZE} ${FOOD_NAMES[food].name}. ${onHand} van.`}>
          <span className="snack__things" aria-hidden="true">
            {Array.from({ length: SNACK_SIZE }, (_, k) => (
              <span key={k} className={`pantry__thing${k < onHand ? '' : ' is-missing'}`}>
                <FoodIcon id={food} size={30} />
              </span>
            ))}
          </span>
          <span className="snack__name">
            {SNACK_SIZE} {FOOD_NAMES[food].name}
          </span>
        </button>
      )}
      <button type="button" className={`snack__offer${ready('treat')}`} onClick={() => onOffer('treat')} aria-label={`Uzsonna: egy ${recipeOf(treat).name.toLowerCase()}. A polcon ${have} van.`}>
        <span className="snack__things" aria-hidden="true">
          <span className={`pantry__thing${have > 0 ? '' : ' is-missing'}`}>
            <TreatArt id={treat} size={44} />
          </span>
        </span>
        <span className="snack__name">{recipeOpen(progress, treat) ? recipeOf(treat).name : 'Ha tele a kert'}</span>
      </button>
      {seeds > 0 && (
        <button type="button" className={`snack__offer${ready('seeds')}`} onClick={() => onOffer('seeds')} aria-label={`Uzsonna: ${seeds} mag. A zsákban ${bag} van.`}>
          <span className="snack__things" aria-hidden="true">
            {Array.from({ length: seeds }, (_, k) => (
              <span key={k} className={`pantry__thing${k < bag ? '' : ' is-missing'}`}>
                <Seed size={26} />
              </span>
            ))}
          </span>
          <span className="snack__name">{seeds} mag</span>
        </button>
      )}
    </div>
  );
}

/** A small sun over a plate: the day's snack. */
function SnackSun() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="10" r="4" fill="#ffd24a" stroke="#c98a00" />
      <path d="M12 2.5v1.6M5.6 5.2l1.1 1.1M18.4 5.2l-1.1 1.1M3 10h1.6M19.4 10H21" stroke="#c98a00" />
      <path d="M3.5 17h17M6 20.5h12" />
    </svg>
  );
}

/** A filled heart: the visitor has had its snack today. */
function FullHeart({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.8c0 5.8-7.5 10.4-7.5 10.4z" fill="#e0475b" stroke="#a8283a" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** "2 körte és 1 áfonya": what a recipe still needs, for Csepi's line. */
function shortOf(r: Recipe, pears: number, berries: number, seeds: number): string {
  const parts = [
    r.pears > pears ? `${r.pears - pears} körte` : '',
    r.berries > berries ? `${r.berries - berries} áfonya` : '',
    r.seeds > seeds ? `${r.seeds - seeds} mag` : ''
  ].filter(Boolean);
  return parts.join(' és ');
}

/** The recipe's ingredients as pictures to count: the ones already in the basket are bright, the rest faded. */
function Ingredients({ r, pears, berries, seeds, size = 24 }: { r: Recipe; pears: number; berries: number; seeds: number; size?: number }) {
  const row = (n: number, have: number, icon: (k: number) => ReactNode) =>
    Array.from({ length: n }, (_, k) => (
      <span key={k} className={`pantry__thing${k < have ? '' : ' is-missing'}`}>
        {icon(k)}
      </span>
    ));
  return (
    <span className="pantry__things" aria-hidden="true">
      {row(r.pears, pears, () => <PearIcon size={size} />)}
      {row(r.berries, berries, () => <BerryIcon size={size + 2} />)}
      {row(r.seeds, seeds, () => <Seed size={size - 2} />)}
    </span>
  );
}

/** Kamra: the child makes the basket's fruit (and, once the garden is full, spare seeds) into treats for the shelf. */
function Pantry({ onClose }: { onClose: () => void }) {
  const { progress, update } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const pears = basketPears(progress);
  const berries = basketBerries(progress);
  const seeds = seedBalance(progress);
  const total = pantryCount(progress);
  const intro = canMakeAnything(progress)
    ? 'Mit főzzünk? Koppints a zöld pluszra egy polcon!'
    : total > 0
      ? 'Nézd, mennyi finomság van a polcokon!'
      : 'Szedj termést a fákról és a bokrokról, és itt finomságot főzünk belőle.';
  const [line, setLine] = useState(intro);
  // The treat just made pops onto the shelf; the count restarts the pop on every new one.
  const [fresh, setFresh] = useState<{ id: TreatId; n: number } | null>(null);

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const tell = (text: string, speech = text) => {
    setLine(text);
    speak(speech);
  };

  const choose = (r: Recipe) => {
    if (!recipeOpen(progress, r.id)) {
      popBubble(1);
      tell('Ezt akkor sütjük, ha tele a kert.', `${r.name}: ezt akkor sütjük, ha mind a harminc ágyásban nő valami.`);
      return;
    }
    if (shelfFull(progress, r.id)) {
      popBubble(1);
      tell('Tele a polc! Vidd a vendégeknek, és lesz hely.', `A ${r.name.toLowerCase()} polcán mind a tíz hely foglalt. Vidd a vendégeknek, és lesz hely!`);
      return;
    }
    if (!canMake(progress, r.id)) {
      popBubble(1);
      tell(`Ehhez még ${shortOf(r, pears, berries, seeds)} kell.`);
      return;
    }
    // Csepi counts the ingredients out as they go into the pot.
    const n = r.pears + r.berries + r.seeds;
    const counted = Array.from({ length: n }, (_, k) => capitalize(numberCount(k + 1))).join('! ');
    fanfare();
    update((p) => make(p, r.id));
    setFresh((f) => ({ id: r.id, n: (f?.n ?? 0) + 1 }));
    tell(`Kész: ${r.name.toLowerCase()}!`, `${counted}! Kész ${article(r.name)} ${r.name.toLowerCase()}. Felkerült a polcra.`);
  };

  return (
    <div ref={modal} className="pantry" role="dialog" aria-modal="true" aria-labelledby="pantry-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="pantry-title" className="pantry__title">
            Kamra
          </h2>
          <div className="pill pill--basket" aria-label={`A kosárban ${pears} körte és ${berries} áfonya, és ${seeds} mag`}>
            <PearIcon size={26} />
            <span>{pears}</span>
            <BerryIcon size={28} />
            <span>{berries}</span>
            <Seed size={24} />
            <span>{seeds}</span>
          </div>
        </header>

        <GuideSay world="garden" mood="cheer" text={line} />

        {/* The cupboard: one shelf of ten places per treat, five and five. What is made stands there; the first free
            place is where the next one is cooked; a full shelf has no free place left. */}
        <div className="cupboard">
          {RECIPES.map((r) => {
            const n = treatsOf(progress, r.id);
            const open = recipeOpen(progress, r.id);
            const full = n >= SHELF_MAX;
            const ok = canMake(progress, r.id);
            const shown = Math.min(n, SHELF_MAX);
            const hint = !open ? 'ha tele a kert' : full ? 'tele a polc' : ok ? 'főzhetsz' : `még ${shortOf(r, pears, berries, seeds)}`;
            return (
              <div key={r.id} className="cupboard__shelf">
                <div className="cupboard__places">
                  {Array.from({ length: SHELF_MAX }, (_, k) => {
                    const half = k === 4 ? ' is-half' : '';
                    if (k < shown) {
                      const isNew = k === shown - 1 && fresh?.id === r.id;
                      return (
                        <span key={isNew ? `new${fresh!.n}` : k} className={`cupboard__place${half}${isNew ? ' pop-in' : ''}`} aria-hidden="true">
                          <TreatArt id={r.id} size={66} />
                        </span>
                      );
                    }
                    if (k === shown) {
                      return (
                        <button
                          key={k}
                          type="button"
                          className={`cupboard__next${half}${ok ? ' is-ready' : ''}${open ? '' : ' is-later'}`}
                          onClick={() => choose(r)}
                          aria-label={`${r.name}: ${n} van a polcon, ${hint}.`}
                        >
                          <span className="cupboard__plus" aria-hidden="true">
                            +
                          </span>
                          <Ingredients r={r} pears={pears} berries={berries} seeds={seeds} size={12} />
                        </button>
                      );
                    }
                    return <span key={k} className={`cupboard__place is-empty${half}`} aria-hidden="true" />;
                  })}
                </div>
                <span className="cupboard__board" aria-hidden="true" />
                {/* Under the shelf: its paper label, then "Tele!" when it is full; on phones, where the places are
                    too small for them, also what the next one takes. */}
                <span className="cupboard__foot">
                  <span className="cupboard__label" aria-hidden="true">
                    {r.name}
                    {n > SHELF_MAX ? ` · ${n}` : ''}
                  </span>
                  {full ? (
                    <button type="button" className="cupboard__full" onClick={() => choose(r)} aria-label={`${r.name}: tele a polc, ${n} van rajta.`}>
                      Tele!
                    </button>
                  ) : (
                    <span className="cupboard__need" aria-hidden="true">
                      <Ingredients r={r} pears={pears} berries={berries} seeds={seeds} size={14} />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Magtár: packets of flower seeds, each bought once for good by counting its seeds in. */
function FlowerShed({ onBought, onClose }: { onBought: (f: FlowerId) => void; onClose: () => void }) {
  const { progress, update } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const balance = seedBalance(progress);
  const tens = packsAndOnes(balance, 'zsák', 'mag');
  const intro = storeFull(progress, 'garden')
    ? 'Tele a Magtár! Ültess vagy főzz, és újra lesz hely.'
    : ownedFlowers(progress).length === FLOWERS.length
      ? `${capitalize(tens)}. Minden virágmagod megvan!`
      : `${capitalize(tens)}. Melyik virág magját vegyük meg?`;
  const [line, setLine] = useState(intro);
  // The packet whose seeds are being counted in, and the one just bought (it pops once).
  const [buying, setBuying] = useState<FlowerId | null>(null);
  const [fresh, setFresh] = useState<FlowerId | null>(null);

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const tell = (text: string, speech = text) => {
    setLine(text);
    speak(speech);
  };

  const tap = (id: FlowerId) => {
    const f = flowerOf(id);
    popBubble(1);
    if (ownsFlower(progress, id)) {
      setBuying(null);
      tell(`Megvan a ${f.name.toLowerCase()}magod! Ültethetsz belőle.`, `Megvan a ${f.name.toLowerCase()}magod! Ültethetsz belőle az ágyásba vagy a szegélybe.`);
      return;
    }
    if (!canBuyFlower(progress, id)) {
      setBuying(null);
      const short = f.cost - balance;
      tell(`Ehhez még ${short} mag kell.`, `A ${f.name.toLowerCase()}maghoz ${numberAttr(f.cost)} mag kell. Gyűjts még ${short === 1 ? 'egyet' : numberAttr(short)} a játékokban!`);
      return;
    }
    setBuying(id);
    tell(`Számolj bele ${f.cost} magot!`, `A ${f.name.toLowerCase()}maghoz ${numberAttr(f.cost)} mag kell. Számold bele őket!`);
  };

  const bought = (id: FlowerId) => {
    const f = flowerOf(id);
    fanfare();
    update((p) => buyFlower(p, id));
    onBought(id);
    setBuying(null);
    setFresh(id);
    tell(`Megvan a ${f.name.toLowerCase()}mag!`, `Megvan a ${f.name.toLowerCase()}mag! Most már ${f.planted} is ültethetsz.`);
  };

  const active = buying ? flowerOf(buying) : null;
  return (
    <div ref={modal} className="pantry shed" role="dialog" aria-modal="true" aria-labelledby="shed-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="shed-title" className="pantry__title">
            Magtár
          </h2>
          <div className="pill pill--basket" aria-label={`${balance} mag`}>
            <Seed size={26} />
            <span>{balance}</span>
          </div>
        </header>

        <GuideSay world="garden" mood="cheer" text={line} />

        <SeedStore n={balance} />

        <div className="shed__packets">
          {FLOWERS.map((f) => {
            const owned = ownsFlower(progress, f.id);
            const short = f.cost - balance;
            return (
              <button
                key={f.id}
                type="button"
                className={`shed__packet${owned ? ' is-owned' : ''}${buying === f.id ? ' is-on' : ''}${!owned && short > 0 ? ' is-later' : ''}`}
                onClick={() => tap(f.id)}
                aria-label={`${f.name}${owned ? ', megvan' : `, ${f.cost} mag${short > 0 ? `, még ${short} kell` : ''}`}`}
              >
                <span key={fresh === f.id ? 'new' : 'old'} className={fresh === f.id ? 'pop-in' : ''}>
                  <SeedPacket id={f.id} owned={owned} />
                </span>
                <span className="shed__name">{f.name}</span>
                {owned ? (
                  <span className="shed__owned">Megvan</span>
                ) : (
                  <span className="plant-option__cost">
                    <Seed size={18} />
                    {f.cost}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {active && (
          <div className="shed__count">
            <SeedCount
              key={active.id}
              cost={active.cost}
              balance={balance}
              label={`${active.name}mag`}
              onDone={() => bought(active.id)}
            />
          </div>
        )}
        {!active && (
          <p className="sow__help">
            Tíz mag egy zsák; a Magtárba húsz zsák fér. A megvett virágmag örökre a tiéd.
          </p>
        )}
      </div>
    </div>
  );
}
