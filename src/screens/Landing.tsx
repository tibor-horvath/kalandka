import { useEffect, useState, type ReactNode } from 'react';
import { Csepi } from '../components/Csepi';
import { Csavar } from '../components/robot';
import { Avatar } from '../components/avatars';
import { KidFields, type KidDraft } from '../components/KidFields';
import { KalandkaIcon, KalandkaWordmark } from '../components/ui';
import { promptInstall, useInstallState } from '../lib/install';
import { AVATAR_IDS } from '../state/profiles';

// The first page on a device that has never played here: it tells the grown-up what Kalandka is,
// and its start button asks for the first child's name and figure, saves that profile and opens the map. It scrolls like a web page, outside the game stage.

const GARDEN_GAMES: [string, string][] = [
  ['Számvetés', 'a számok 1–20-ig'],
  ['Locsolás', 'pontos számlálás, tízes keret'],
  ['Mézút', 'a számjegyek írása'],
  ['Virágsor', 'minták folytatása'],
  ['Magvillantás', 'mennyiség egy pillantásra'],
  ['Méhecske', 'összeadás, kivonás 100-ig'],
  ['Cserépbarátok', 'az 5 és a 10 barátai']
];

const ROBOT_GAMES: [string, string][] = [
  ['Robotút', 'tervezés, első programok'],
  ['Válogatógép', 'csoportosítás, szabálykeresés'],
  ['Mérleg', 'több, kevesebb, egyensúly'],
  ['Mintagép', 'nehezebb minták, szabályok'],
  ['Tükörgép', 'tükrözés, szimmetria']
];

const PRINCIPLES: { title: string; text: string; tone: string; icon: ReactNode }[] = [
  {
    title: 'Nincs kudarc, csak „Hoppá”',
    text: 'Nincs piros, nincs időzítő. Egy rossz válasznál a segítő együtt számol a gyerekkel, és megmutatja, mire figyeljen.',
    tone: 'oops',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5q3.5 3 7 0M9 9.5h.01M15 9.5h.01" />
      </>
    )
  },
  {
    title: 'A szint követi a gyereket',
    text: 'Néhány segítség nélküli válasz után egy lépcsővel feljebb lép, elakadásnál csendben könnyebbre vált. A szülő kezdőszintet is megadhat.',
    tone: 'good',
    icon: <path d="M4 18h4v-4h4v-4h4V6h4" />
  },
  {
    title: 'Jutalom, ami nem fogy el',
    text: 'Magok, csavarok, matricák: csak gyűlnek. Semmi sem hervad el, semmi sem véletlen, és semmi sem függ a játékidőtől.',
    tone: 'sun',
    icon: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" />
  },
  {
    title: 'Olvasni nem kell',
    text: 'Csepi és Csavar magyarul mondja el a feladatot. A gyerek a saját figuráját keresi meg, nem a nevét.',
    tone: 'drop',
    icon: <path d="M5 10v4M9 7v10M13 9v6M17 6v12M21 10v4" />
  }
];

const PARENTS: [string, string][] = [
  ['Áttekintés', 'Mi megy jól, mi nehéz még – közérthetően, ötlettel, mit gyakoroljatok otthon.'],
  ['Képernyőidő', 'Napi keret, figyelmeztetés két perccel előtte, a feladat befejezhető, esti pihenő.'],
  ['Szintek', 'Játékonként kezdőszint, minden játék nyitva – a gyerek tempójában.'],
  ['Feladatlapok', 'Minden játék A4-es lapként, a gyerek szintjén. Fekete-fehér nyomtatón is jól olvasható.']
];

function GameList({ games }: { games: [string, string][] }) {
  return (
    <ul className="landing__games">
      {games.map(([name, skill]) => (
        <li key={name}>
          <b>{name}</b>
          <span>{skill}</span>
        </li>
      ))}
    </ul>
  );
}

function StartButton({ onStart, children = 'Indulhat a kaland!' }: { onStart: () => void; children?: ReactNode }) {
  return (
    <button type="button" className="landing__start" onClick={onStart}>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
        <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
      </svg>
      {children}
    </button>
  );
}

function Install() {
  const state = useInstallState();
  if (state === 'installed') return null;

  return (
    <section className="landing__section landing__section--tight" aria-labelledby="l-install">
      <div className="landing__wrap landing__install">
        <div className="landing__install-text">
          <h2 id="l-install">Tegyétek a kezdőképernyőre</h2>
          <p>Saját ikonnal, teljes képernyőn, böngészősáv nélkül indul, és internet nélkül is működik.</p>
          {state === 'ready' && (
            <button type="button" className="landing__ghost" onClick={() => void promptInstall()}>
              Kalandka telepítése
            </button>
          )}
        </div>
        {state === 'ios' && (
          <ol className="landing__steps">
            <li>Nyisd meg az oldalt a Safariban.</li>
            <li>Koppints a Megosztás gombra.</li>
            <li>Válaszd: Főképernyőhöz adás.</li>
          </ol>
        )}
        {state === 'manual' && (
          <ol className="landing__steps">
            <li>Nyisd meg a böngésző menüjét.</li>
            <li>Válaszd: Alkalmazás telepítése vagy Hozzáadás a kezdőképernyőhöz.</li>
          </ol>
        )}
      </div>
    </section>
  );
}

/** The grown-up names the first child before anything is saved; cancelling leaves the device untouched. */
function FirstKid({ onCreate, onCancel }: { onCreate: (kid: KidDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<KidDraft>({ name: '', avatar: 'frog', age: null });
  const [missingName, setMissingName] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const create = () => {
    const name = draft.name.trim();
    if (!name) {
      setMissingName(true);
      return;
    }
    onCreate({ ...draft, name });
  };

  return (
    <div className="landing__modal" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        className="landing__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-kid-title"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <div className="landing__dialog-head">
          <Avatar id={draft.avatar} size={64} />
          <div>
            <h2 id="first-kid-title">Ki fog játszani?</h2>
            <p>Saját kertet, magokat és szinteket kap. Testvéreket később a Szülői sarokban adhatsz hozzá.</p>
          </div>
        </div>
        <KidFields
          draft={draft}
          onChange={(patch) => {
            setDraft((d) => ({ ...d, ...patch }));
            if (patch.name !== undefined) setMissingName(false);
          }}
          free={AVATAR_IDS}
          missingName={missingName}
          ageHint="Ebből állítjuk a kezdő szinteket. Később a Szülői sarokban bármikor módosíthatod."
          autoFocus
        />
        <div className="pa-row landing__dialog-buttons">
          <button type="button" className="pa-btn pa-btn--quiet" onClick={onCancel}>
            Mégse
          </button>
          <button type="submit" className="pa-btn pa-btn--go">
            Kezdhetjük!
          </button>
        </div>
      </form>
    </div>
  );
}

export function Landing({ onStart }: { onStart: (kid: KidDraft) => void }) {
  const [asking, setAsking] = useState(false);
  const ask = () => setAsking(true);

  return (
    <div className="landing">
      {asking && <FirstKid onCreate={onStart} onCancel={() => setAsking(false)} />}
      <header className="landing__top">
        <div className="landing__wrap landing__bar">
          <span className="landing__brand">
            <KalandkaIcon size={44} />
            <KalandkaWordmark size={30} />
          </span>
          <StartButton onStart={ask}>Indítás</StartButton>
        </div>
      </header>

      <main>
        <section className="landing__hero">
          <div className="landing__wrap landing__hero-row">
            <div className="landing__hero-text">
              <p className="landing__tag">5–7 éveseknek · magyarul</p>
              <h1>Számolás, minták, programozás – játszva, kudarc nélkül.</h1>
              <p className="landing__lead">
                Gondolkodós játékok tabletre és telefonra. Csepi, a vízcsepp a számkertbe kalauzol, Csavar, a robot a műhelybe. A gyerek választ szigetet, a szint pedig magától követi
                őt.
              </p>
              <StartButton onStart={ask} />
              <p className="landing__small">Internet nélkül is működik · nem kell fiók · minden adat ezen a készüléken marad</p>
            </div>
            <div className="landing__hero-art" aria-hidden="true">
              <div className="landing__island landing__island--garden">
                <Csepi mood="cheer" width={150} />
              </div>
              <div className="landing__island landing__island--robot">
                <Csavar mood="cheer" width={150} />
              </div>
            </div>
          </div>
        </section>

        <section className="landing__section" aria-labelledby="l-worlds">
          <div className="landing__wrap">
            <h2 id="l-worlds">Két sziget, tizenkét játék</h2>
            <p className="landing__intro">Minden gyerek bármelyik szigetre evezhet, nincs lezárt világ. Az app abban a világban nyílik meg, ahol a gyerek legutóbb járt.</p>
            <div className="landing__worlds">
              <article className="landing__world landing__world--garden">
                <div className="landing__world-head">
                  <Csepi mood="smile" width={64} />
                  <div>
                    <h3>Számkertész</h3>
                    <p>Csepivel · számok, számolás, minták</p>
                  </div>
                </div>
                <GameList games={GARDEN_GAMES} />
                <p>Minden megoldott feladat egy mag: a gyerek a saját Kiskertjébe ülteti, és vendégek érkeznek hozzá.</p>
              </article>
              <article className="landing__world landing__world--robot">
                <div className="landing__world-head">
                  <Csavar mood="smile" width={64} />
                  <div>
                    <h3>Robotműhely</h3>
                    <p>Csavarral · programozás, logika</p>
                  </div>
                </div>
                <GameList games={ROBOT_GAMES} />
                <p>Minden kör egy csavar: ebből a gyerek a saját robotját építi, és robotbarátok költöznek a polcra.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing__section landing__section--soft" aria-labelledby="l-how">
          <div className="landing__wrap">
            <h2 id="l-how">Így tanul a gyerek</h2>
            <div className="landing__principles">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="landing__principle">
                  <span className={`landing__icon landing__icon--${p.tone}`}>
                    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {p.icon}
                    </svg>
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__section" aria-labelledby="l-parents">
          <div className="landing__wrap landing__parents">
            <div className="landing__parents-text">
              <h2 id="l-parents">A szülői sarok a tiétek</h2>
              <p className="landing__intro">
                Egy szorzós kapu mögött, amit egy 5–7 éves még nem old meg, minden beállítás egy helyen. Akár hat gyerek is játszhat ugyanazon a készüléken, mindegyik a saját haladásával.
              </p>
            </div>
            <ul className="landing__features">
              {PARENTS.map(([title, text]) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Install />

        <section className="landing__section landing__section--tight landing__end">
          <div className="landing__wrap">
            <h2>Hova evezünk ma?</h2>
            <StartButton onStart={ask} />
          </div>
        </section>
      </main>

      <footer className="landing__foot">
        <div className="landing__wrap">
          <KalandkaWordmark size={24} color="#ffffff" accent="#9fd3ef" />
          <p>Gondolkodós játékok 5–7 éveseknek</p>
        </div>
      </footer>
    </div>
  );
}
