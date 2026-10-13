import { useEffect, useState, type CSSProperties } from 'react';
import { Seed } from '../components/art';
import { GardenPlant, PlantIcon, VisitorArt } from '../components/garden';
import { BackIcon, GuideBubble, RoundButton, SpeakerIcon } from '../components/ui';
import { chime, fanfare, popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import type { Mood, Tone } from '../lib/types';
import { useProgress } from '../state/progress';
import {
  BEDS,
  PLANT_OPTIONS,
  VISITORS,
  bedAt,
  canPlant,
  growAfter,
  growthOf,
  newVisitor,
  plant,
  seedBalance,
  visitorsOf,
  type PlantKind
} from '../state/rewards';

interface Say {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const CHEAPEST = Math.min(...PLANT_OPTIONS.map((o) => o.cost));

function tasksLeft(n: number): string {
  return n === 1 ? 'Még egy feladat, és kinő.' : `Még ${n} feladat, és kinő.`;
}

/** Kiskert: the child plants the seeds earned in the games; plantings grow as they keep playing. */
export function Garden({ onBack, onAlbum }: { onBack: () => void; onAlbum: () => void }) {
  const { progress, update } = useProgress();
  const balance = seedBalance(progress);
  const empty = Array.from({ length: BEDS }, (_, i) => i).filter((i) => !bedAt(progress, i));
  const [selected, setSelected] = useState<number | null>(() => (balance >= CHEAPEST ? (empty[0] ?? null) : null));
  const [say, setSay] = useState<Say>(() => opening());
  // The last plant or visitor the child tapped; the count restarts its little reaction on every tap.
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  const poked = (id: string) => (poke?.id === id ? poke.n : 0);
  const pokeAt = (id: string) => setPoke((p) => ({ id, n: (p?.id === id ? p.n : 0) + 1 }));
  const visitor = newVisitor(progress);
  const welcomed = visitorsOf(progress).slice(0, progress.visitorsSeen);
  const nextVisitor = VISITORS[welcomed.length];

  function opening(): Say {
    if (empty.length === 0) {
      return { text: 'Tele a kert! Nézd, milyen szép lett.', speech: 'Tele a kert! Nézd, milyen szép lett.', mood: 'cheer', tone: 'good' };
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
    // Runs once per visit.
  }, []);

  // Each newly arrived visitor is greeted in turn, the earliest first.
  useEffect(() => {
    if (visitor) speak(visitor.speech);
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
    const left = growAfter(bed.kind) - growthOf(bed, progress.seeds);
    const name = PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name.toLowerCase();
    if (left > 0) tell({ text: tasksLeft(left), speech: `Ebből ${name} lesz. ${tasksLeft(left)}`, mood: 'smile', tone: 'plain' });
    else tell({ text: `Szép ${name}!`, speech: `Milyen szép ${name}!`, mood: 'cheer', tone: 'good' });
  };

  const choose = (kind: PlantKind) => {
    if (selected === null || !canPlant(progress, selected, kind)) return;
    const name = PLANT_OPTIONS.find((o) => o.id === kind)!.name.toLowerCase();
    const after = plant(progress, selected, kind);
    update((p) => plant(p, selected, kind));
    chime();
    // Ready for the next planting when there are seeds for it.
    const nextBed = Array.from({ length: BEDS }, (_, i) => i).find((i) => !bedAt(after, i));
    setSelected(nextBed !== undefined && seedBalance(after) >= CHEAPEST ? nextBed : null);
    tell({
      text: 'Elültettük!',
      speech: `Elültettük! Ebből ${name} lesz. Minden megoldott feladattal nő egy kicsit. ${tasksLeft(growAfter(kind))}`,
      mood: 'cheer',
      tone: 'good'
    });
  };

  const welcome = () => {
    if (!visitor) return;
    fanfare();
    update((p) => ({ ...p, visitorsSeen: p.visitorsSeen + 1 }));
  };

  return (
    <div className="screen screen--garden">
      <div className="meadow" aria-hidden="true" />

      <header className="topbar">
        <RoundButton label="Vissza a kezdőképre" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <h1 className="screen-title">Kiskertem</h1>
        <div className="topbar__right">
          <button type="button" className="album-btn" onClick={onAlbum}>
            <span className="album-btn__icon" aria-hidden="true" />
            <span className="album-btn__label">Matricáim</span>
          </button>
          <div className="pill" aria-label={`${balance} mag`}>
            <Seed />
            <span>
              {balance}
              <span className="pill__unit"> mag</span>
            </span>
          </div>
        </div>
      </header>

      <div className="kiskert">
        <div className="kiskert__field">
          <div className="kbeds">
            {Array.from({ length: BEDS }, (_, i) => {
              const bed = bedAt(progress, i);
              const growth = bed ? growthOf(bed, progress.seeds) : 0;
              const needs = bed ? growAfter(bed.kind) : 0;
              const grown = !!bed && growth >= needs;
              const name = bed ? PLANT_OPTIONS.find((o) => o.id === bed.kind)!.name : '';
              const label = !bed
                ? `Üres ágyás, ${i + 1}.${selected === i ? ', kiválasztva' : ''}`
                : grown
                  ? `${name}, ${i + 1}. ágyás`
                  : `Palánta, ebből ${name.toLowerCase()} lesz. ${tasksLeft(needs - growth)}`;
              return (
                <button
                  key={i}
                  type="button"
                  className={`kbed${selected === i ? ' is-selected' : ''}${bed ? '' : ' kbed--empty'}`}
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
                          <GardenPlant kind={bed.kind} grown={grown} />
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
            {welcomed.map((v) => (
              <button
                key={v.id}
                type="button"
                className="visitors__one pop-in"
                aria-label={v.name}
                onClick={() => {
                  pokeAt(v.id);
                  popBubble(3);
                  tell({ text: `Szia, ${v.name}!`, speech: `Ő ${v.name}. Itt lakik a kertedben.`, mood: 'cheer', tone: 'good' });
                }}
              >
                <span key={poked(v.id)} className={`visitors__hop${poked(v.id) ? ' is-poked' : ''}`}>
                  <VisitorArt id={v.id} width={92} />
                </span>
              </button>
            ))}
            {nextVisitor && (
              <div className="visitors__next" aria-label={`${nextVisitor.after} kinőtt növénynél valaki beköltözik`}>
                <span className="visitors__q" aria-hidden="true">
                  ?
                </span>
                <span className="visitors__when">{nextVisitor.after} növénynél</span>
              </div>
            )}
          </div>
        </div>

        <aside className="kiskert__panel">
          <div className="kiskert__say">
            <GuideBubble mood={say.mood} tone={say.tone} csepiWidth={56}>
              {say.text}
            </GuideBubble>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(say.speech)}>
              <SpeakerIcon />
            </RoundButton>
          </div>
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
          <p className="kiskert__note">A palánta minden megoldott feladattal nő egy kicsit. A virág 3, a bokor 5, a fa 8 feladat alatt nő ki.</p>
        </aside>
      </div>

      {visitor && (
        <div className="visitor-pop" role="dialog" aria-modal="true" aria-labelledby="visitor-title">
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
        </div>
      )}
    </div>
  );
}
