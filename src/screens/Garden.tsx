import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrivalRing } from '../components/ArrivalRing';
import { Seed } from '../components/art';
import { BerryIcon, CanIcon, DecorArt, DropIcon, GardenPlant, PearIcon, PlantIcon, TreatArt, VisitorArt } from '../components/garden';
import { GuideSay, type Say } from '../components/GuideSay';
import { Modal, useModal } from '../components/Modal';
import { PlaceShell } from '../components/PlaceShell';
import { BackIcon, RoundButton } from '../components/ui';
import { chime, fanfare, popBubble } from '../lib/sound';
import { article, capitalize, numberAttr, numberCount } from '../lib/numbers';
import { speak } from '../lib/speech';
import { useProgress, type Progress } from '../state/progress';
import {
  PLANT_OPTIONS,
  PLOT_BEDS,
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
} from '../state/rewards';

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
    if (left > 0) tell({ text: tasksLeft(left), speech: `Ebből ${name} lesz. ${tasksLeft(left)}`, mood: 'smile', tone: 'plain' });
    else tell({ text: `Szép ${name}!`, speech: `Milyen szép ${name}!`, mood: 'cheer', tone: 'good' });
  };

  const choose = (kind: PlantKind) => {
    if (selected === null || !canPlant(progress, selected, kind)) return;
    const name = PLANT_OPTIONS.find((o) => o.id === kind)!.name.toLowerCase();
    const after = plant(progress, selected, kind);
    update((p) => plant(p, selected, kind));
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

  const waterThirsty = () => {
    if (thirsty.length === 0) return;
    const before = basketPears(progress) + basketBerries(progress);
    const after = waterAll(progress);
    const moved = basketPears(after) + basketBerries(after) - before;
    chime();
    update(waterAll);
    const fruit = moved > 0 ? ` A termést a kosárba tettük: ${numberAttr(moved)} darab.` : '';
    tell({
      text: 'Megöntöztük! Köszönik.',
      speech: `Megöntöztük őket! Köszönik.${fruit} Ha tovább játszol, megint teremnek.`,
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

  const gave = (v: VisitorId) => {
    const after = give(progress, v);
    update((p) => give(p, v));
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
              const name = bed ? PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name : '';
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
                          <GardenPlant kind={bed.kind} grown={grown} fruit={ripe} thirsty={dry} />
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

          <div className="visitors" aria-label="A kert lakói">
            {welcomed.map((v, k) => (
              <button
                key={v.id}
                type="button"
                className="visitors__one pop-in"
                aria-label={`${v.name}${canGive(progress, v.id) ? ', ajándékot vár' : ''}`}
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
                {canGive(progress, v.id) && (
                  <span className="visitors__gift" aria-hidden="true">
                    <TreatArt id={wishOf(v.id).treat} size={34} />
                  </span>
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
          {showPantry && (
            <button
              type="button"
              className={`pantry-btn${canMakeAnything(progress) ? ' is-ready' : ''}`}
              onClick={() => {
                popBubble(2);
                setPantryOpen(true);
              }}
            >
              <TreatArt id="jam" size={44} />
              <span>Kamra</span>
              <span className="water-btn__count" aria-label={`${pantryCount(progress)} finomság a polcon`}>
                {pantryCount(progress)}
              </span>
            </button>
          )}
          {thirsty.length > 0 && (
            <button type="button" className="water-btn" onClick={waterThirsty}>
              <CanIcon />
              <span>Locsolás</span>
              <span className="water-btn__count" aria-label={`${thirsty.length} szomjas növény`}>
                {thirsty.length}
              </span>
            </button>
          )}
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
                    <PlantIcon kind={o.id} />
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
          {/* With both care buttons up the panel is full: the note for grown-ups makes way. */}
          {!(showPantry && thirsty.length > 0) && (
            <p className="kiskert__note">
              A palánta minden megoldott feladattal nő egy kicsit. A virág 3, a bokor 5, a fa 8 feladat alatt nő ki. A kinőtt bokor és fa
              termést hoz; néhány feladat után megszomjazik, de sosem hervad el. A termésből a kamrában finomság lesz.
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

      {guest && !visitor && (
        <GiftCard
          id={guest}
          onGive={() => gave(guest)}
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
  const short = n - treatsOf(p, treat);
  const later = recipeOpen(p, treat) ? 'Főzz a kamrában!' : 'Kalácsot akkor sütünk, ha tele a kert.';
  return `${ask} Még ${numberCount(short)} kell. ${later}`;
}

/** A visitor's corner: the gift they ask for next, counted out from the shelf, and the three things they make in return. */
function GiftCard({ id, onGive, onClose }: { id: VisitorId; onGive: () => void; onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const v = VISITORS.find((x) => x.id === id)!;
  const wish = wishOf(id);
  const n = giftSize(progress, id);
  const have = treatsOf(progress, wish.treat);
  const made = decorOf(progress, id).length;
  const [line, setLine] = useState(() => wishLine(progress, id));
  const [fresh, setFresh] = useState(-1);

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
    const decor = wish.decor[made];
    fanfare();
    setFresh(made);
    onGive();
    tell(`${v.name} köszöni! Készített neked valamit.`, `${counted}! ${v.name} köszöni. Nézd, mit készített neked: egy ${decor.name.toLowerCase()}!`);
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
          {n > 0 && (
            <button type="button" className={`gift__offer${canGive(progress, id) ? ' is-ready' : ''}`} onClick={offer} aria-label={`Odaadom: ${n} ${recipeOf(wish.treat).name.toLowerCase()}. A polcon ${have} van.`}>
              <span className="gift__treats" aria-hidden="true">
                {Array.from({ length: n }, (_, k) => (
                  <span key={k} className={`pantry__thing${k < have ? '' : ' is-missing'}`}>
                    <TreatArt id={wish.treat} size={56} />
                  </span>
                ))}
              </span>
              <span className="gift__label">Odaadom!</span>
            </button>
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
