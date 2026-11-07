import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrivalRing } from '../../../components/ArrivalRing';
import { Seed } from '../art';
import { BerryIcon, BorderFlower, CanIcon, DecorArt, DropIcon, FlowerIcon, GardenPlant, PearIcon, PlantIcon, SeedPacket, TreatArt, VisitorArt } from '../kiskert';
import { SeedCount } from '../SeedCount';
import { GuideSay, type Say } from '../../../components/GuideSay';
import { Modal, useModal } from '../../../components/Modal';
import { PlaceShell } from '../../../components/PlaceShell';
import { BackIcon, RoundButton } from '../../../components/ui';
import { chime, fanfare, popBubble } from '../../../lib/sound';
import { article, capitalize, numberAttr, numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { useProgress, type Progress } from '../../../state/progress';
import {
  BORDER_COST,
  BORDER_SPOTS,
  FIRST_FLOWER,
  FLOWERS,
  PLANT_OPTIONS,
  PLOT_BEDS,
  bedFlower,
  borderAt,
  borderPattern,
  buyFlower,
  canBuyFlower,
  canGiveSeeds,
  canPlantBorder,
  eatsSeeds,
  emptyBorder,
  flowerOf,
  giveSeeds,
  ownedFlowers,
  ownsFlower,
  plantBorder,
  seedGiftSize,
  type FlowerId,
  RECIPES,
  TREAT_WANTED,
  VISITORS,
  basketBerries,
  basketPears,
  bedAt,
  canMake,
  canMakeAnything,
  canGive,
  canPlant,
  decorOf,
  emptyBeds,
  fruitName,
  gardenDone,
  gardenFull,
  giftSize,
  giftsReady,
  give,
  make,
  openBeds,
  pantryCount,
  recipeOf,
  recipeOpen,
  treatsOf,
  growAfter,
  growthOf,
  isThirsty,
  newVisitor,
  pickFruit,
  pickedFruit,
  plant,
  ripeFruit,
  ripeTotal,
  seedBalance,
  thirstyBeds,
  water,
  waterAll,
  welcomedVisitors,
  wishOf,
  type DecorId,
  type PlantKind,
  type Recipe,
  type TreatId,
  type VisitorId,
  visitorProgress
} from '../../../state/rewards';

const CHEAPEST = Math.min(...PLANT_OPTIONS.map((o) => o.cost));

function tasksLeft(n: number): string {
  return n === 1 ? 'Még egy feladat, és kinő.' : `Még ${n} feladat, és kinő.`;
}

/** Kiskert: the child plants the seeds earned in the games; plantings grow as they keep playing. */
export function Garden({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const balance = seedBalance(progress);
  const empty = emptyBeds(progress);
  const thirsty = thirstyBeds(progress);
  const plots = openBeds(progress) / PLOT_BEDS;
  const pears = basketPears(progress);
  const berries = basketBerries(progress);
  const [selected, setSelected] = useState<number | null>(() => (balance >= CHEAPEST ? (empty[0] ?? null) : null));
  // The plot on show: the one with the next empty bed, so planting picks up where it left off.
  const [plot, setPlot] = useState(() => Math.floor((empty[0] ?? 0) / PLOT_BEDS));
  const [pantryOpen, setPantryOpen] = useState(false);
  const [shedOpen, setShedOpen] = useState(false);
  // The border spot chosen for a flower; choosing one clears the chosen bed, and the other way round.
  const [spot, setSpot] = useState<number | null>(null);
  // The planting whose seeds are being counted out, and the flower kind last chosen for a flower.
  const [sowing, setSowing] = useState<PlantKind | null>(null);
  const [lastFlower, setLastFlower] = useState<FlowerId>(FIRST_FLOWER);
  const showPantry = pears + berries > 0 || pantryCount(progress) > 0 || gardenFull(progress);
  const [say, setSay] = useState<Say>(() => opening());
  // The last plant or visitor the child tapped; the count restarts its little reaction on every tap.
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  const poked = (id: string) => (poke?.id === id ? poke.n : 0);
  const pokeAt = (id: string) => setPoke((p) => ({ id, n: (p?.id === id ? p.n : 0) + 1 }));
  const visitor = newVisitor(progress);
  const welcomed = welcomedVisitors(progress);
  // The visitor whose gift card is open, the decoration just left (it pops in once), and the "Kész a kert!" card.
  const [guest, setGuest] = useState<VisitorId | null>(null);
  const [freshDecor, setFreshDecor] = useState<DecorId | null>(null);
  const givenDecor = useRef<DecorId | null>(null);
  const [done, setDone] = useState(false);
  const toVisitor = visitorProgress(progress);

  function opening(): Say {
    if (thirsty.length > 0) {
      return {
        text: 'Szomjasak a növényeid! Koppints rájuk, vagy a kannára.',
        speech: 'Szomjasak a növényeid! Koppints rájuk, vagy a locsolókannára, és megöntözzük őket.',
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
    if (ready && !canGive(progress, ready.id)) {
      return {
        text: `${ready.name} ajándékot vár! Koppints rá.`,
        speech: `${ready.name} egy marék magnak is örülne! Koppints rá, és számolj ki neki ${numberAttr(seedGiftSize(progress, ready.id))} magot.`,
        mood: 'cheer',
        tone: 'plain'
      };
    }
    if (ready) {
      return {
        text: `${ready.name} ajándékot vár! Koppints rá.`,
        speech: `Van a polcon ${TREAT_WANTED[wishOf(ready.id).treat]}. ${ready.name} nagyon szereti! Koppints rá, és add oda neki.`,
        mood: 'cheer',
        tone: 'plain'
      };
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
    return { text: 'Mit ültessünk ide?', speech: 'Hová ültessünk? Koppints egy üres ágyásra, aztán válassz!', mood: 'cheer', tone: 'plain' };
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
    if (visitor) speak(visitor.speech);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Greeted once per visitor, not on every render of the same one.
  }, [visitor?.id]);

  const tapBed = (i: number) => {
    const bed = bedAt(progress, i);
    if (bed) pokeAt(`bed${i}`);
    setSpot(null);
    if (!bed) {
      setSelected(i);
      if (balance >= CHEAPEST) tell({ text: 'Mit ültessünk ide?', speech: 'Mit ültessünk ide?', mood: 'smile', tone: 'plain' });
      else tell(opening());
      return;
    }
    const left = growAfter(bed.kind) - growthOf(bed, progress.gardenTasks);
    const name = PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name.toLowerCase();
    // Ripe fruit first, one per tap, counted aloud; then a thirsty plant gets its water.
    const ripe = ripeFruit(bed, progress.gardenTasks);
    if (ripe > 0) {
      const count = pickedFruit(bed) + 1;
      const word = capitalize(numberCount(count));
      popBubble(Math.min(count, 5));
      update((p) => pickFruit(p, i));
      if (ripe > 1) {
        tell({ text: `${word}!`, speech: `${word}!`, mood: 'cheer', tone: 'plain' });
      } else {
        const all = `${word}! ${capitalize(numberAttr(count))} ${fruitName(bed.kind)} a kosárban.`;
        const thirst = isThirsty(bed, progress.gardenTasks) ? ' Most locsold meg, és újra terem!' : '';
        tell({ text: all + thirst, speech: all + thirst, mood: 'cheer', tone: 'good' });
      }
      return;
    }
    if (isThirsty(bed, progress.gardenTasks)) {
      chime();
      update((p) => water(p, i));
      tell({ text: 'Köszöni! Megint teremni fog.', speech: `Megöntözted! A ${name} köszöni. Ha tovább játszol, megint terem.`, mood: 'cheer', tone: 'good' });
      return;
    }
    const shown = bed.kind === 'flower' ? flowerOf(bedFlower(bed)).name.toLowerCase() : name;
    if (left > 0) tell({ text: tasksLeft(left), speech: `Ebből ${name} lesz. ${tasksLeft(left)}`, mood: 'smile', tone: 'plain' });
    else tell({ text: `Szép ${shown}!`, speech: `Milyen szép ${shown}!`, mood: 'cheer', tone: 'good' });
  };

  // Choosing a plant opens the seed count; it is planted once every seed is counted in.
  const choose = (kind: PlantKind) => {
    if (selected === null || !canPlant(progress, selected, kind)) return;
    popBubble(1);
    setSowing(kind);
  };

  const sown = (kind: PlantKind, flower: FlowerId) => {
    setSowing(null);
    if (selected === null || !canPlant(progress, selected, kind)) return;
    if (kind === 'flower') setLastFlower(flower);
    const name = kind === 'flower' ? flowerOf(flower).name.toLowerCase() : PLANT_OPTIONS.find((o) => o.id === kind)!.name.toLowerCase();
    const after = plant(progress, selected, kind, flower);
    update((p) => plant(p, selected, kind, flower));
    // Ready for the next planting when there are seeds for it.
    const nextBed = emptyBeds(after)[0];
    setSelected(nextBed !== undefined && seedBalance(after) >= CHEAPEST ? nextBed : null);
    if (openBeds(after) > openBeds(progress)) {
      // The first plot is planted full: the second one opens next to it.
      fanfare();
      setPlot(1);
      tell({
        text: 'Megtelt az első kert! Itt a második.',
        speech: `Elültettük! Megtelt az első kert, mind a tíz ágyás. Nézd, kinyílt a második kert! Ott is tíz ágyás vár.`,
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
    setSelected(null);
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
    update((p) => ({ ...p, visitorsSeen: p.visitorsSeen + 1 }));
    const wanted = TREAT_WANTED[wishOf(visitor.id).treat];
    tell({
      text: `${visitor.name} ${wanted} szeret.`,
      speech: `${visitor.name} ${wanted} szeret. Ha főzöl neki a kamrában, megajándékozhatod. Koppints rá!`,
      mood: 'cheer',
      tone: 'plain'
    });
  };

  const gave = (v: VisitorId, seeds: boolean) => {
    const giving = seeds ? giveSeeds : give;
    const after = giving(progress, v);
    update((p) => giving(p, v));
    // It pops into the visitor's corner once the card is closed and the garden is in view again.
    givenDecor.current = decorOf(after, v).at(-1)!.id;
    if (gardenDone(after)) {
      setGuest(null);
      setDone(true);
      speak('Kész a kert! Minden lakó megkapta az ajándékát, és mindegyik készített neked valamit. Nézd, milyen szép lett!');
    }
  };

  return (
    <PlaceShell
      world="garden"
      className="screen--garden"
      title="Kiskertem"
      onBack={onBack}
      counters={
        <>
          {pears + berries > 0 && (
            <div className="pill pill--basket" aria-label={`A kosárban ${pears} körte és ${berries} áfonya`}>
              <PearIcon size={26} />
              <span>{pears}</span>
              <BerryIcon size={28} />
              <span>{berries}</span>
            </div>
          )}
          <div className="pill" aria-label={`${balance} mag`}>
            <Seed />
            <span>
              {balance}
              <span className="pill__unit"> mag</span>
            </span>
          </div>
        </>
      }
    >

      <div className="kiskert">
        <div className="kiskert__field">
          {plots > 1 && (
            <div className="kplots" role="tablist" aria-label="Kertek">
              {Array.from({ length: plots }, (_, k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={plot === k}
                  className={`kplots__tab${plot === k ? ' is-on' : ''}`}
                  onClick={() => {
                    popBubble(1);
                    setPlot(k);
                  }}
                >
                  {k + 1}. kert
                </button>
              ))}
            </div>
          )}
          <div className="kbeds">
            {Array.from({ length: PLOT_BEDS }, (_, k) => {
              const i = plot * PLOT_BEDS + k;
              const bed = bedAt(progress, i);
              const growth = bed ? growthOf(bed, progress.gardenTasks) : 0;
              const needs = bed ? growAfter(bed.kind) : 0;
              const grown = !!bed && growth >= needs;
              const dry = !!bed && isThirsty(bed, progress.gardenTasks);
              const ripe = bed ? ripeFruit(bed, progress.gardenTasks) : 0;
              const name = !bed ? '' : bed.kind === 'flower' ? flowerOf(bedFlower(bed)).name : PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name;
              const care = `${ripe > 0 ? `, ${ripe} érett ${fruitName(bed!.kind)}` : ''}${dry ? ', szomjas' : ''}`;
              const label = !bed
                ? `Üres ágyás, ${i + 1}.${selected === i ? ', kiválasztva' : ''}`
                : grown
                  ? `${name}${care}, ${i + 1}. ágyás`
                  : `Palánta, ebből ${name.toLowerCase()} lesz. ${tasksLeft(needs - growth)}`;
              return (
                <button
                  key={i}
                  type="button"
                  className={`kbed${selected === i ? ' is-selected' : ''}${bed ? '' : ' kbed--empty'}${dry ? ' is-thirsty' : ''}`}
                  aria-label={label}
                  aria-pressed={bed ? undefined : selected === i}
                  onClick={() => tapBed(i)}
                >
                  <span className="kbed__plant">
                    {bed ? (
                      <span key={grown ? 'grown' : 'sprout'} className="pop-in">
                        <span
                          key={poked(`bed${i}`)}
                          className={`kbed__sway${poked(`bed${i}`) ? ' is-poked' : ''}`}
                          style={{ '--sway-delay': `${-((i * 0.7) % 4.5)}s` } as CSSProperties}
                        >
                          <GardenPlant kind={bed.kind} grown={grown} fruit={ripe} thirsty={dry} flower={bedFlower(bed)} />
                        </span>
                      </span>
                    ) : (
                      <span className="kbed__plus" aria-hidden="true">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
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
                      {Array.from({ length: needs }, (_, k) => (
                        <span key={k} className={k < growth ? 'is-full' : ''} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="kborder" aria-label="Szegély">
            {Array.from({ length: BORDER_SPOTS }, (_, k) => {
              const i = plot * BORDER_SPOTS + k;
              const f = borderAt(progress, i);
              const on = spot === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={`kborder__spot${on ? ' is-selected' : ''}${f ? '' : ' is-empty'}`}
                  aria-label={`${f ? flowerOf(f).name : 'Üres hely'} a szegélyben, ${k + 1}.${on ? ', kiválasztva' : ''}`}
                  aria-pressed={on}
                  onClick={() => tapSpot(i)}
                >
                  {f ? (
                    <span key={f} className="kborder__flower pop-in">
                      <BorderFlower id={f} />
                    </span>
                  ) : (
                    <span className="kborder__dot" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="visitors" aria-label="A kert lakói">
            {welcomed.map((v, k) => (
              <button
                key={v.id}
                type="button"
                className="visitors__one pop-in"
                aria-label={`${v.name}${canGive(progress, v.id) || canGiveSeeds(progress, v.id) ? ', ajándékot vár' : ''}`}
                onClick={() => {
                  pokeAt(v.id);
                  popBubble(3);
                  setGuest(v.id);
                }}
              >
                <span className="visitors__decor" aria-hidden="true">
                  {decorOf(progress, v.id).map((d) => (
                    <span key={d.id} className={`visitors__thing${freshDecor === d.id ? ' pop-in' : ''}`}>
                      <DecorArt id={d.id} />
                    </span>
                  ))}
                </span>
                {canGive(progress, v.id) ? (
                  <span className="visitors__gift" aria-hidden="true">
                    <TreatArt id={wishOf(v.id).treat} size={34} />
                  </span>
                ) : (
                  canGiveSeeds(progress, v.id) && (
                    <span className="visitors__gift" aria-hidden="true">
                      <Seed size={26} />
                    </span>
                  )
                )}
                <span className={`visitors__roam visitors__roam--${v.id}`} style={{ '--roam-delay': `${-k * 3.5}s` } as CSSProperties}>
                  <span key={poked(v.id)} className={`visitors__hop${poked(v.id) ? ' is-poked' : ''}`}>
                    <VisitorArt id={v.id} width={92} />
                  </span>
                </span>
              </button>
            ))}
            {toVisitor && <ArrivalRing progress={toVisitor} unit="plant" />}
          </div>
        </div>

        <aside className="kiskert__panel">
          <GuideSay world="garden" {...say} />
          <div className={`kiskert__places${showPantry ? '' : ' is-one'}`}>
            {showPantry && (
              <button
                type="button"
                className={`pantry-btn${canMakeAnything(progress) ? ' is-ready' : ''}`}
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
          </div>
          {thirsty.length > 0 && (
            <button type="button" className="water-btn" onClick={waterThirsty}>
              <CanIcon />
              <span>Locsolás</span>
              <span className="water-btn__count" aria-label={`${thirsty.length} szomjas növény`}>
                {thirsty.length}
              </span>
            </button>
          )}
          {spot !== null ? (
            <div className="border-options">
              <h2 className="border-options__title">Szegély: milyen virág legyen?</h2>
              <div className="border-options__grid">
                {ownedFlowers(progress).map((f) => {
                  const now = borderAt(progress, spot);
                  const here = now === f.id;
                  const ok = here || canPlantBorder(progress, spot, f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`border-option${here ? ' is-here' : ''}`}
                      disabled={!ok}
                      aria-pressed={here}
                      onClick={() => chooseBorder(f.id)}
                      aria-label={`${f.name}${here ? ', ez nyílik itt' : now ? ', csere ingyen' : `, ${BORDER_COST} mag`}`}
                    >
                      <FlowerIcon id={f.id} size={40} />
                      <span className="border-option__name">{f.name}</span>
                      <span className="plant-option__cost">{now ? (here ? '✓' : 'csere') : <><Seed size={16} />{BORDER_COST}</>}</span>
                    </button>
                  );
                })}
                {ownedFlowers(progress).length < FLOWERS.length && (
                  <button
                    type="button"
                    className="border-option border-option--shed"
                    onClick={() => {
                      popBubble(2);
                      setShedOpen(true);
                    }}
                  >
                    <span className="border-option__name">Több virág a Magtárban</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
          <div className="plant-options">
            {PLANT_OPTIONS.map((o) => {
              const short = o.cost - balance;
              const ok = selected !== null && short <= 0;
              const hint = short > 0 ? `Még ${short} mag kell hozzá` : '';
              return (
                <div key={o.id} className="plant-option">
                  <button
                    type="button"
                    className="plant-option__btn"
                    disabled={!ok}
                    onClick={() => choose(o.id)}
                    aria-label={`${o.name}, ${o.cost} mag${hint ? `. ${hint}` : ''}`}
                  >
                    <PlantIcon kind={o.id} flower={ownsFlower(progress, lastFlower) ? lastFlower : FIRST_FLOWER} />
                    <span className="plant-option__name">{o.name}</span>
                    <span className="plant-option__cost">
                      <Seed size={22} />
                      {o.cost}
                    </span>
                  </button>
                  {hint && <span className="plant-option__hint">{hint}</span>}
                </div>
              );
            })}
            {selected === null && empty.length > 0 && balance >= CHEAPEST && <p className="plant-options__pick">Koppints egy üres ágyásra!</p>}
          </div>
          )}
          {/* With both care buttons up the panel is full: the note for grown-ups makes way. */}
          {!(showPantry && thirsty.length > 0) && (
            <p className="kiskert__note">
              Ültetéskor a gyerek egyenként számolja ki a magokat. A palánta minden megoldott feladattal nő egy kicsit; a kinőtt bokor és fa
              termést hoz, és néhány feladat után megszomjazik, de sosem hervad el. A szegélybe 1 magért kerül virág, a színe ingyen cserélhető.
            </p>
          )}
        </aside>
      </div>

      {pantryOpen && !visitor && (
        <Pantry
          onClose={() => {
            popBubble(1);
            setPantryOpen(false);
          }}
        />
      )}

      {sowing && !visitor && (
        <SowCard
          kind={sowing}
          flower={ownsFlower(progress, lastFlower) ? lastFlower : FIRST_FLOWER}
          onDone={(f) => sown(sowing, f)}
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
          onGive={(seeds) => gave(guest, seeds)}
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
              <VisitorArt key={v.id} id={v.id} width={120} />
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

      {visitor && (
        <Modal className="visitor-pop" labelledBy="visitor-title">
          <div className="visitor-pop__rays" aria-hidden="true" />
          <p className="visitor-pop__kicker">{visitor.after} növény nőtt a kertedben</p>
          <h2 id="visitor-title" className="visitor-pop__title">
            {visitor.name} beköltözött!
          </h2>
          <div className="visitor-pop__art">
            <VisitorArt id={visitor.id} width={300} />
          </div>
          <button type="button" className="big-btn" onClick={welcome} autoFocus>
            Szia, {visitor.name}!
          </button>
        </Modal>
      )}
    </PlaceShell>
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
function Ingredients({ r, pears, berries, seeds }: { r: Recipe; pears: number; berries: number; seeds: number }) {
  const row = (n: number, have: number, icon: (k: number) => ReactNode) =>
    Array.from({ length: n }, (_, k) => (
      <span key={k} className={`pantry__thing${k < have ? '' : ' is-missing'}`}>
        {icon(k)}
      </span>
    ));
  return (
    <span className="pantry__things" aria-hidden="true">
      {row(r.pears, pears, () => <PearIcon size={24} />)}
      {row(r.berries, berries, () => <BerryIcon size={26} />)}
      {row(r.seeds, seeds, () => <Seed size={22} />)}
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
    ? 'Mit főzzünk? Válassz egy receptet!'
    : total > 0
      ? 'Nézd, mennyi finomság van a polcon!'
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
      tell('Ezt akkor sütjük, ha tele a kert.', `${r.name}: ezt akkor sütjük, ha mind a húsz ágyásban nő valami.`);
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

        <div className="pantry__recipes">
          {RECIPES.map((r) => {
            const open = recipeOpen(progress, r.id);
            const ok = canMake(progress, r.id);
            const hint = !open ? 'Ha tele a kert' : ok ? 'Elkészítem!' : `Még ${shortOf(r, pears, berries, seeds)}`;
            return (
              <button
                key={r.id}
                type="button"
                className={`pantry__recipe${ok ? ' is-ready' : ''}${open ? '' : ' is-later'}`}
                onClick={() => choose(r)}
                aria-label={`${r.name}. ${hint}.`}
              >
                <TreatArt id={r.id} size={64} />
                <span className="pantry__name">{r.name}</span>
                <Ingredients r={r} pears={pears} berries={berries} seeds={seeds} />
                <span className="pantry__hint">{hint}</span>
              </button>
            );
          })}
        </div>

        <div className="pantry__shelf" aria-label={`A polcon ${total} finomság`}>
          {total === 0 && <p className="pantry__empty">Itt lesz a polc. Még üres.</p>}
          {RECIPES.filter((r) => treatsOf(progress, r.id) > 0).map((r) => {
            const n = treatsOf(progress, r.id);
            // Up to ten stand on the shelf, like a ten-frame; past that the number tells the rest.
            const shown = Math.min(n, 10);
            return (
              <div key={r.id} className="pantry__row" aria-label={`${r.name}: ${n}`}>
                <span className="pantry__jars">
                  {Array.from({ length: shown }, (_, k) => (
                    <span key={k === shown - 1 && fresh?.id === r.id ? `new${fresh.n}` : k} className={k === shown - 1 && fresh?.id === r.id ? 'pop-in' : ''}>
                      <TreatArt id={r.id} size={40} />
                    </span>
                  ))}
                </span>
                <span className="pantry__count">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** What Csepi says about a visitor's next gift: what they ask for and whether it is on the shelf yet. */
function wishLine(p: Progress, id: VisitorId): string {
  const v = VISITORS.find((x) => x.id === id)!;
  const n = giftSize(p, id);
  if (n === 0) return `${v.name} nagyon boldog. Nézd, mi mindent készített neked!`;
  const { treat } = wishOf(id);
  const ask = `${v.name} ${numberAttr(n)} ${TREAT_WANTED[treat]} kér.`;
  if (canGive(p, id)) return `${ask} Add oda neki!`;
  // The birds also take a handful of seeds instead.
  const seeds = seedGiftSize(p, id);
  const handful = seeds > 0 ? (canGiveSeeds(p, id) ? ` De ${numberAttr(seeds)} magnak is örül!` : ` Vagy ${numberAttr(seeds)} magnak is örül, ha összegyűjtöd.`) : '';
  if (!recipeOpen(p, treat)) return `${ask} Kalácsot akkor sütünk, ha tele a kert.${handful}`;
  const short = n - treatsOf(p, treat);
  return `${ask} Még ${numberCount(short)} kell. Főzz a kamrában!${handful}`;
}

/** Counting out the seeds for a planting: a flower's kind is chosen above the tray from the ones the child has. */
function SowCard({ kind, flower, onDone, onClose }: { kind: PlantKind; flower: FlowerId; onDone: (f: FlowerId) => void; onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const option = PLANT_OPTIONS.find((o) => o.id === kind)!;
  const owned = ownedFlowers(progress);
  const [pick, setPick] = useState<FlowerId>(flower);
  const [counted, setCounted] = useState(0);
  const balance = seedBalance(progress);
  const what = kind === 'flower' ? flowerOf(pick).name : option.name;
  const intro = `Tegyünk ${numberAttr(option.cost)} magot a földbe! Koppints a zsákra.`;
  const line = counted === 0 ? intro : counted >= option.cost ? `${capitalize(numberCount(counted))}! Elültettük!` : `${capitalize(numberCount(counted))}!`;

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

        {kind === 'flower' && owned.length > 1 && (
          <div className="sow__kinds" role="group" aria-label="Milyen virág legyen?">
            {owned.map((f) => (
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

        <div className="sow__stage">
          <span className="sow__plant" aria-hidden="true">
            <PlantIcon kind={kind} flower={pick} />
          </span>
          <SeedCount cost={option.cost} balance={balance} label={what} onCount={setCounted} onDone={() => onDone(pick)} />
        </div>
        <p className="sow__help">Koppints a zsákra vagy a lyukakra. Ha visszalépsz, minden mag a zsákban marad.</p>
      </div>
    </div>
  );
}

/** Magtár: packets of flower seeds, each bought once for good by counting its seeds in. */
function FlowerShed({ onBought, onClose }: { onBought: (f: FlowerId) => void; onClose: () => void }) {
  const { progress, update } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const balance = seedBalance(progress);
  const intro = ownedFlowers(progress).length === FLOWERS.length ? 'Minden virágmagod megvan! Nézd, milyen szépek.' : 'Melyik virág magját vegyük meg? Koppints egy zacskóra!';
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
        {!active && <p className="sow__help">Amit egyszer megvettél, az örökre a tiéd. Az ágyásba és a szegélybe is ültethetsz belőle.</p>}
      </div>
    </div>
  );
}

/** A visitor's corner: the gift they ask for next, counted out from the shelf, and the three things they make in return. */
function GiftCard({ id, onGive, onClose }: { id: VisitorId; onGive: (seeds: boolean) => void; onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const v = VISITORS.find((x) => x.id === id)!;
  const wish = wishOf(id);
  const n = giftSize(progress, id);
  const have = treatsOf(progress, wish.treat);
  const made = decorOf(progress, id).length;
  const [line, setLine] = useState(() => wishLine(progress, id));
  const [fresh, setFresh] = useState(-1);
  // Counting a handful of seeds out for a bird.
  const [counting, setCounting] = useState(false);
  const seeds = seedGiftSize(progress, id);

  useEffect(() => {
    speak(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const tell = (text: string, speech = text) => {
    setLine(text);
    speak(speech);
  };

  const offer = () => {
    if (!canGive(progress, id)) {
      popBubble(1);
      tell(wishLine(progress, id));
      return;
    }
    const counted = Array.from({ length: n }, (_, k) => capitalize(numberCount(k + 1))).join('! ');
    thanks(false, `${counted}! `);
  };

  const thanks = (bySeeds: boolean, counted: string) => {
    const decor = wish.decor[made];
    fanfare();
    setFresh(made);
    onGive(bySeeds);
    tell(`${v.name} köszöni! Készített neked valamit.`, `${counted}${v.name} köszöni. Nézd, mit készített neked: egy ${decor.name.toLowerCase()}!`);
  };

  const offerSeeds = () => {
    popBubble(1);
    if (!canGiveSeeds(progress, id)) {
      tell(`${v.name} ${numberAttr(seeds)} magnak örülne. Még ${seeds - seedBalance(progress)} kell.`);
      return;
    }
    setCounting(true);
    tell(`Számolj ki ${seeds} magot!`, `Számolj ki ${numberAttr(seeds)} magot ${v.name === 'Rigó' ? 'a rigónak' : `${v.name}nak`}! Koppints a zsákra.`);
  };

  return (
    <div ref={modal} className="pantry gift" role="dialog" aria-modal="true" aria-labelledby="gift-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a kertbe" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="gift-title" className="pantry__title">
            {v.name}
          </h2>
          <div className="pill pill--basket" aria-label={`A polcon ${have} ${recipeOf(wish.treat).name.toLowerCase()}`}>
            <TreatArt id={wish.treat} size={30} />
            <span>{have}</span>
          </div>
        </header>

        <GuideSay world="garden" mood="cheer" text={line} />

        <div className="gift__main">
          <div className="gift__guest" aria-hidden="true">
            <VisitorArt id={id} width={180} />
          </div>
          {counting && seeds > 0 && (
            <SeedCount
              cost={seeds}
              balance={seedBalance(progress)}
              label={`${numberAttr(seeds)} mag ${v.name} ajándékának`}
              onCount={(k) => setLine(`${capitalize(numberCount(k))}!`)}
              onDone={() => {
                setCounting(false);
                thanks(true, '');
              }}
            />
          )}
          {!counting && n > 0 && (
            <button type="button" className={`gift__offer${canGive(progress, id) ? ' is-ready' : ''}`} onClick={offer} aria-label={`Odaadom: ${n} ${recipeOf(wish.treat).name.toLowerCase()}. A polcon ${have} van.`}>
              <span className="gift__treats" aria-hidden="true">
                {Array.from({ length: n }, (_, k) => (
                  <span key={k} className={`pantry__thing${k < have ? '' : ' is-missing'}`}>
                    <TreatArt id={wish.treat} size={56} />
                  </span>
                ))}
              </span>
              <span className="gift__label">{recipeOpen(progress, wish.treat) ? 'Odaadom!' : 'Ha tele a kert'}</span>
            </button>
          )}
          {!counting && n > 0 && eatsSeeds(id) && (
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
                      <Seed size={26} />
                    </span>
                  ))}
                </span>
                <span className="gift__label">Odaadom!</span>
              </button>
            </>
          )}
        </div>

        <ul className="gift__decor" aria-label={`${v.name} ajándékai: ${made} a háromból`}>
          {wish.decor.map((d, k) => (
            <li key={d.id} className={`gift__thing${k < made ? '' : ' is-later'}`} aria-label={k < made ? d.name : 'Még nem készült el'}>
              <span className={k === fresh ? 'pop-in' : ''}>
                <DecorArt id={d.id} size={96} />
              </span>
              <span className="gift__name">{k < made ? d.name : `${k + 1}. ajándék`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
