import { Suspense, lazy, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Bee, PatternFlower, RoundFlower, Seed, SmallPot, Sprout } from '../components/art';
import { Csepi } from '../components/Csepi';
import { CodeArt, Csavar, FixArt, MirrorArt, PathArt, ScaleArt, SeqArt, SortArt } from '../components/robot';
import { DotFace } from '../components/seeds';
import { Avatar } from '../components/avatars';
import { KidFields, type KidDraft } from '../components/KidFields';
import { KalandkaIcon, KalandkaWordmark } from '../components/ui';
import { promptInstall, useInstallState } from '../lib/install';
import { AGE_BANDS, AVATAR_IDS, type AgeBand } from '../state/profiles';
import { LegalPage, SOURCE } from './parents/LegalPage';

const PrintArea = lazy(async () => ({ default: (await import('./PrintArea')).PrintArea }));

// The first page on a device that has never played here: it tells the grown-up what Kalandka is,
// and its start button asks for the first child's name and figure, saves that profile and opens the map. It scrolls like a web page, outside the game stage.
// The printable sheets open from here too, by age, before any child is named.
// Motion (landing.css) runs once: the hero on load, each section as it scrolls in; nothing loops.

// Each game with a small copy of its art from the home screens, so the grown-up recognises it there.
const GARDEN_GAMES: [string, string, ReactNode][] = [
  [
    'Számmagok',
    'Ismerkedés a számokkal 1-től 20-ig.',
    <>
      <span className="landing__game-num">3</span>
      <DotFace n={3} size={34} />
    </>
  ],
  ['Locsolás', 'Pontos számlálás egy tízes keretben.', <Sprout />],
  [
    'Mézút',
    'A számjegyek helyes írásának gyakorlása.',
    <>
      <svg aria-hidden="true" width="40" height="30" viewBox="0 0 96 70">
        <path d="M8 58 C26 6 52 70 88 14" fill="none" stroke="#E0A800" strokeWidth="8" strokeLinecap="round" strokeDasharray="0 16" />
      </svg>
      <Bee width={34} />
    </>
  ],
  [
    'Virágsor',
    'Logikai minták felismerése és folytatása.',
    <>
      <PatternFlower kind="tulip" width={24} />
      <PatternFlower kind="sun" width={24} />
      <PatternFlower kind="star" width={24} />
    </>
  ],
  [
    'Villámszem',
    'Mennyiségek felismerése egyetlen pillantás alatt.',
    <>
      <Seed size={22} />
      <Seed size={22} />
      <Seed size={22} />
    </>
  ],
  [
    'Méhkas',
    'Összeadás és kivonás 100-ig.',
    <>
      <Bee width={40} />
      <span className="landing__game-sum">2+1</span>
    </>
  ],
  [
    'Cserépbarátok',
    'Az 5 és a 10 „barátainak” (bontásának) megértése.',
    <>
      {['#E8577D', null].map((petal, i) => (
        <span key={i} className="landing__game-pot">
          {petal ? <RoundFlower petal={petal} width={22} /> : <span className="landing__game-pot-space" />}
          <SmallPot width={28} />
        </span>
      ))}
    </>
  ]
];

const ROBOT_GAMES: [string, string, ReactNode][] = [
  ['Robotút', 'Tervezés és az első saját programok megírása.', <PathArt />],
  ['Válogatógép', 'Csoportosítás és szabálykeresés.', <SortArt />],
  ['Mérleg', 'Több, kevesebb és az egyensúly fogalma.', <ScaleArt />],
  ['Mintagép', 'Összetettebb minták és szabályok felismerése.', <SeqArt />],
  ['Tükörgép', 'Tükrözés és szimmetria a gyakorlatban.', <MirrorArt />],
  ['Kódzár', 'Jelek, kódok és a kódtábla olvasása.', <CodeArt />],
  ['Hibavadász', 'A hibás kártya megtalálása és kijavítása a programban.', <FixArt />]
];

const HIGHLIGHTS = ['Internet nélkül is működik', 'Nincs szükség fiókra', 'Minden adat a készüléken marad'];

const PRINCIPLES: { title: string; text: string; tone: string; icon: ReactNode }[] = [
  {
    title: 'Nincs kudarc, csak egy „Hoppá”',
    text: 'Nincs piros x, és nem ketyeg az óra. Egy tévesztésnél a segítő figura együtt számol a gyerekkel, és megmutatja, mire érdemes figyelni.',
    tone: 'oops',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5q3.5 3 7 0M9 9.5h.01M15 9.5h.01" />
      </>
    )
  },
  {
    title: 'A szint a gyerekhez igazodik',
    text: 'Néhány önálló, helyes válasz után a játék csendben szintet lép, elakadásnál pedig észrevétlenül könnyít a feladaton. Kezdőszintet a szülő is beállíthat.',
    tone: 'good',
    icon: <path d="M4 18h4v-4h4v-4h4V6h4" />
  },
  {
    title: 'Jutalom, ami sosem fogy el',
    text: 'Magok, csavarok, matricák – itt minden csak gyűlik. Semmi sem hervad el, semmi sem múlik a szerencsén vagy az eltöltött játékidőn.',
    tone: 'sun',
    icon: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" />
  },
  {
    title: 'Nem baj, ha még nem tud olvasni',
    text: 'Csepi és Csavar magyarul mondja el a feladatokat. A gyerekek a saját figurájukat keresik a képernyőn, nem a nevüket kell kiolvasniuk.',
    tone: 'drop',
    icon: <path d="M5 10v4M9 7v10M13 9v6M17 6v12M21 10v4" />
  }
];

const PARENTS: { title: string; text: string; tone: string; icon: ReactNode }[] = [
  {
    title: 'Áttekintés',
    text: 'Közérthető visszajelzés arról, mi megy jól és mi nehéz még, gyakorlati ötletekkel az otthoni fejlesztéshez.',
    tone: 'drop',
    icon: <path d="M4 20h16M7 16v-4M12 16V7M17 16v-6" />
  },
  {
    title: 'Képernyőidő',
    text: 'Beállítható napi keret. Két perccel a vége előtt az app figyelmeztet, így a feladat még nyugodtan befejezhető az esti pihenő előtt.',
    tone: 'oops',
    icon: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9.5 2.5h5" />
      </>
    )
  },
  {
    title: 'Szintek testreszabása',
    text: 'Játékonként megadható kezdőszint, hogy a kihívás mindig a gyerek tempójához igazodjon.',
    tone: 'good',
    icon: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 4v6M10 14v6" />
  },
  {
    title: 'Nyomtatható feladatlapok',
    text: 'Minden játék elérhető A4-es formátumban, a gyerek aktuális szintjére szabva. Fekete-fehér nyomtatón is tökéletesen olvasható.',
    tone: 'sun',
    icon: <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
  }
];

// "Miért Kalandka?": the name as a little story, short enough to read aloud to a child.
const STORY: { title: string; text: string; tone: string; art: ReactNode }[] = [
  {
    title: 'A nagy kalandok néha túl nagyok.',
    text: 'Egy egész hegy, egy egész erdő… az sok egyszerre egy kis felfedezőnek.',
    tone: 'drop',
    art: (
      <svg width="150" height="92" viewBox="0 0 220 130" fill="none">
        <path d="M10 130 90 20l40 50 25-25 55 85Z" fill="#9fb6cf" />
        <path d="m90 20 18 25-10-4-8 10-8-9-9 4Z" fill="#ffffff" />
        <circle cx="40" cy="116" r="8" fill="var(--leaf)" />
      </svg>
    )
  },
  { title: 'Ezért kicsiben kezdjük.', text: 'Egy kis feladat, egy kis bátorság, egy kis siker. Lépésről lépésre.', tone: 'good', art: <Sprout /> },
  {
    title: 'Minden sziget egy kis kaland.',
    text: 'Csepi a Számkertben, Csavar a Műhelyben vár. Bármelyik szigetre evezhetsz, amelyikhez épp kedved van.',
    tone: 'sky',
    art: (
      <>
        <Csepi mood="smile" width={56} />
        <Csavar mood="smile" width={56} />
      </>
    )
  },
  {
    title: 'Sok kis kalandból lesz a nagy felfedező.',
    text: 'Minden jó megoldás egy mag vagy egy csavar, és mind megmarad. Holnap jöhet a következő kaland.',
    tone: 'sun',
    art: (
      <>
        <Seed size={26} />
        <Seed size={26} />
        <Seed size={26} />
      </>
    )
  }
];

/** Staggers the hero's entrance (see .landing__in in landing.css). */
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

function scrollTo(id: string) {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
}

function Check({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function GameList({ games }: { games: [string, string, ReactNode][] }) {
  return (
    <ul className="landing__games">
      {games.map(([name, skill, art]) => (
        <li key={name}>
          <span className="landing__game-art" aria-hidden="true">
            {art}
          </span>
          <span className="landing__game-text">
            <b>{name}</b>
            <span>{skill}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StartButton({ onStart, className = '', style, children = 'Indulhat a kaland!' }: { onStart: () => void; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <button type="button" className={`landing__start ${className}`} style={style} onClick={onStart}>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
        <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
      </svg>
      {children}
    </button>
  );
}

/** Three sheets drawn in black and white, the way they come out of the printer. */
function SheetPreviews() {
  return (
    <div className="landing__sheets-art" aria-hidden="true">
      <div className="landing__paper landing__paper--left">
        <b>Számmagok</b>
        <small>Hány pötty van? Írd a négyzetbe!</small>
        <svg viewBox="0 0 124 150" fill="none" stroke="currentColor" strokeWidth="1.5">
          {[2, 54, 106].map((y) => [2, 66].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="56" height={y === 106 ? 42 : 44} rx="6" />))}
          <g fill="currentColor" stroke="none">
            {[[14, 16], [26, 16], [38, 16], [78, 14], [90, 14], [78, 26], [90, 26], [102, 20], [14, 68], [26, 68], [78, 68], [90, 68], [102, 68], [78, 80], [14, 120], [26, 120], [38, 120], [14, 132], [78, 122]].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />
            ))}
          </g>
          {[30, 82, 132].map((y) => [40, 104].map((x) => <rect key={`b${x}-${y}`} x={x} y={y} width="12" height="12" rx="2" />))}
        </svg>
      </div>
      <div className="landing__paper landing__paper--mid">
        <b>Virágsor</b>
        <small>Mi jön ezután? Rajzold le!</small>
        <svg viewBox="0 0 134 160" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="16" r="9" />
          <path d="M30 25 L39 7 L48 25 Z" />
          <circle cx="66" cy="16" r="9" />
          <path d="M84 25 L93 7 L102 25 Z" />
          <g transform="translate(0 44)">
            <circle cx="12" cy="16" r="9" fill="currentColor" />
            <circle cx="34" cy="16" r="9" />
            <circle cx="56" cy="16" r="9" />
            <circle cx="78" cy="16" r="9" fill="currentColor" />
            <circle cx="100" cy="16" r="9" />
          </g>
          <g transform="translate(0 88)">
            <rect x="3" y="7" width="18" height="18" rx="2" />
            <rect x="27" y="7" width="18" height="18" rx="2" fill="currentColor" />
            <path d="M54 25 L63 7 L72 25 Z" />
            <rect x="78" y="7" width="18" height="18" rx="2" />
          </g>
          <g transform="translate(0 132)">
            <path d="M3 25 L12 7 L21 25 Z" fill="currentColor" />
            <path d="M27 25 L36 7 L45 25 Z" />
            <path d="M51 25 L60 7 L69 25 Z" fill="currentColor" />
            <path d="M75 25 L84 7 L93 25 Z" />
          </g>
          {[4, 48, 92, 136].map((y) => (
            <rect key={y} x="112" y={y} width="20" height="24" rx="4" strokeDasharray="3 3" />
          ))}
        </svg>
      </div>
      <div className="landing__paper landing__paper--right">
        <b>Robotút</b>
        <small>Rajzold be a robot útját a csillagig!</small>
        <svg viewBox="0 0 124 150" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="2" y="2" width="120" height="120" />
          <path d="M32 2V122M62 2V122M92 2V122M2 32H122M2 62H122M2 92H122" />
          <rect x="10" y="98" width="14" height="16" rx="3" fill="currentColor" />
          <path d="M107 70 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.5 -7 3.5 1.5 -7.5 -5.5 -5 7.5 -1 Z" fill="currentColor" stroke="none" />
          <rect x="36" y="36" width="22" height="22" fill="currentColor" fillOpacity=".25" />
          <rect x="66" y="96" width="22" height="22" fill="currentColor" fillOpacity=".25" />
          {[2, 24, 46, 68, 90].map((x) => (
            <rect key={x} x={x} y="132" width="16" height="16" rx="3" />
          ))}
        </svg>
      </div>
    </div>
  );
}

/** The paper way in, right under the start button: one tap on an age opens that age's sheets. */
function HeroSheets({ onOpen, className = '', style }: { onOpen: (age: AgeBand) => void; className?: string; style?: CSSProperties }) {
  return (
    <div className={`landing__hero-sheets ${className}`} style={style} role="group" aria-labelledby="l-hero-sheets">
      <p id="l-hero-sheets">
        <PrinterIcon />
        Inkább papíron? Nyomtatható feladatlapok:
      </p>
      <div className="landing__ages">
        {AGE_BANDS.map((a) => (
          <button key={a} type="button" className="landing__age" onClick={() => onOpen(a)}>
            {a === '7+' ? '7' : a} éves
          </button>
        ))}
      </div>
    </div>
  );
}

/** Every game on paper, at the starting level for the age picked here; no child needs to be named first. */
function Sheets({ onOpen }: { onOpen: (age: AgeBand) => void }) {
  const [age, setAge] = useState<AgeBand>('6');

  return (
    <section id="l-sheets" className="landing__section landing__section--tight" aria-labelledby="l-sheets-title">
      <div className="landing__wrap landing__sheets landing__reveal">
        <div className="landing__sheets-text">
          <p className="landing__tag landing__tag--sun">
            <PrinterIcon />
            Képernyő nélkül, papíron is
          </p>
          <h2 id="l-sheets-title">Nyomtatható feladatlapok percek alatt</h2>
          <p className="landing__sheets-lead">
            Mind a tizennégy játékunk kinyomtatható A4-es feladatlapként – regisztráció és profil nélkül, akár most rögtön. Csak válaszd ki, hány éves a gyerek, és máris a neki megfelelő
            szintű feladatok nyílnak meg. A lapokat úgy terveztük, hogy fekete-fehér nyomtatón is tökéletesen olvashatók legyenek.
          </p>
          <div className="landing__ages" role="radiogroup" aria-labelledby="l-sheets-age">
            <span id="l-sheets-age">Hány éves a gyerek?</span>
            {AGE_BANDS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={age === a} className={`landing__age${age === a ? ' is-on' : ''}`} onClick={() => setAge(a)}>
                {a === '7+' ? '7' : a} éves
              </button>
            ))}
          </div>
          <div className="landing__sheets-go">
            <button type="button" className="landing__dark" onClick={() => onOpen(age)}>
              <PrinterIcon />
              Feladatlapok megnyitása
            </button>
            <p>Internet nélkül is nyomtatható.</p>
          </div>
        </div>
        <SheetPreviews />
      </div>
    </section>
  );
}

/** Why the name: kaland + -ka, then the same idea as a four-step story. */
function NameStory() {
  return (
    <section className="landing__section landing__section--soft" aria-labelledby="l-name">
      <div className="landing__wrap landing__name">
        <p className="landing__tag landing__reveal">Miért Kalandka?</p>
        <h2 id="l-name" className="landing__reveal">
          Mert minden napba belefér egy kis kaland.
        </h2>
        <div className="landing__name-sum landing__reveal" role="group" aria-label="kaland meg -ka, az Kalandka">
          <div className="landing__name-part">
            <b>kaland</b>
            <span>valami új és izgalmas, amit még nem próbáltál</span>
          </div>
          <span className="landing__name-op" aria-hidden="true">
            +
          </span>
          <div className="landing__name-part">
            <b className="landing__name-ka">-ka</b>
            <span>a becéző kis végződés: kicsivé és kedvessé teszi a szót</span>
          </div>
          <span className="landing__name-op" aria-hidden="true">
            =
          </span>
          <div className="landing__name-part landing__name-part--whole">
            <KalandkaWordmark size={40} color="#ffffff" accent="#9fd3ef" />
            <span>egy kis kaland, pont akkora, amekkora neked való</span>
          </div>
        </div>
        <ol className="landing__story">
          {STORY.map((s, i) => (
            <li key={s.title} className="landing__reveal">
              <span className={`landing__story-art landing__story-art--${s.tone}`} aria-hidden="true">
                {s.art}
              </span>
              <span className="landing__story-step">{i + 1}.</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Install() {
  const state = useInstallState();
  // Shown on this visit: when the browser reports the install, the card turns into a "done" moment instead of vanishing.
  const [offered] = useState(state !== 'installed');
  if (state === 'installed' && !offered) return null;

  if (state === 'installed') {
    return (
      <section id="l-install" className="landing__section landing__section--tight">
        <div className="landing__wrap landing__installed" role="status">
          <span className="landing__done-ring">
            <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="landing__done-check" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div>
            <h2>Kész! Kalandka a kezdőképernyőn van.</h2>
            <p>Mostantól a saját ikonjáról indul, teljes képernyőn.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="l-install" className="landing__section landing__section--tight" aria-labelledby="l-install-title">
      <div className="landing__wrap landing__install landing__reveal">
        <KalandkaIcon size={96} />
        <div className="landing__install-text">
          <h2 id="l-install-title">Tegyétek a kezdőképernyőre!</h2>
          <p>Saját ikonnal, teljes képernyőn, zavaró böngészősávok nélkül indul – és telepítés után internet sem kell hozzá.</p>
          {state === 'ready' && (
            <button type="button" className="landing__ghost" onClick={() => void promptInstall()}>
              <DownloadIcon />
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
            <li>Nyisd meg a böngésző menüjét (⋮).</li>
            <li>Válaszd az Alkalmazás telepítése vagy a Hozzáadás a kezdőképernyőhöz lehetőséget.</li>
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

/** The privacy notice and operator details, open to any visitor in the same calm adult space as the sheets: no gate, it is for grown-ups. */
function LegalSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pa pa--print" role="dialog" aria-modal="true" aria-label="Adatkezelés és impresszum">
      <header className="pa-printbar">
        <div className="pa-nav__brand">
          <KalandkaIcon size={44} />
          <div>
            <div className="pa-nav__title">Jogi információk</div>
            <div className="pa-nav__sub">Kalandka · adatkezelés és impresszum</div>
          </div>
        </div>
        <button type="button" className="pa-nav__back" onClick={onClose} autoFocus>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Vissza
        </button>
      </header>
      <main className="pa-main">
        <LegalPage />
      </main>
    </div>
  );
}

/**
 * `onResume` is set when a child is already saved on this device (the page was opened at / in a browser or from the
 * parents' corner): the start buttons then go straight back to the game instead of asking for a first child.
 */
export function Landing({ onStart, onResume }: { onStart: (kid: KidDraft) => void; onResume?: () => void }) {
  const [asking, setAsking] = useState(false);
  const [sheetsFor, setSheetsFor] = useState<AgeBand | null>(null);
  const [legal, setLegal] = useState(false);
  const installed = useInstallState() === 'installed';
  const ask = onResume ?? (() => setAsking(true));
  const back = onResume ? 'Vissza a játékhoz' : undefined;

  return (
    <>
      <div className="landing">
        {asking && <FirstKid onCreate={onStart} onCancel={() => setAsking(false)} />}
        <header className="landing__top">
          <div className="landing__wrap landing__bar landing__in landing__in--bar">
            <span className="landing__brand">
              <KalandkaIcon size={44} />
              <KalandkaWordmark size={30} />
            </span>
            <nav className="landing__nav" aria-label="Gyors elérés">
              <button type="button" className="landing__chip landing__chip--plain" onClick={() => scrollTo('l-sheets')}>
                <PrinterIcon />
                Feladatlapok
              </button>
              {!installed && (
                <button type="button" className="landing__chip" onClick={() => scrollTo('l-install')}>
                  <DownloadIcon />
                  Telepítés
                </button>
              )}
              <StartButton onStart={ask}>{back ?? 'Indítás'}</StartButton>
            </nav>
          </div>
        </header>

        <main>
          <section className="landing__hero">
            <div className="landing__wrap landing__hero-row">
              <div className="landing__hero-text">
                <p className="landing__tag landing__in" style={delay(120)}>
                  5–7 éveseknek · magyarul
                </p>
                <h1 className="landing__in" style={delay(200)}>
                  Számolás, logika és programozás – játszva, kudarc nélkül.
                </h1>
                <p className="landing__lead landing__in" style={delay(280)}>
                  Fejlesztő játékok tabletre és telefonra. Csepi, a vízcsepp a Számkertben, Csavar, a robot pedig a Műhelyben várja a gyerekeket. Ők választanak szigetet, a feladatok
                  nehézsége pedig észrevétlenül alkalmazkodik hozzájuk.
                </p>
                <StartButton onStart={ask} className="landing__in" style={delay(360)}>
                  {back}
                </StartButton>
                <HeroSheets onOpen={setSheetsFor} className="landing__in" style={delay(440)} />
                <ul className="landing__highlights landing__in" style={delay(520)}>
                  {HIGHLIGHTS.map((h) => (
                    <li key={h}>
                      <Check />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="landing__hero-art" aria-hidden="true">
                <div className="landing__island landing__island--garden landing__pop" style={delay(300)}>
                  <Csepi mood="cheer" width={150} className="landing__hop" />
                </div>
                <div className="landing__island landing__island--robot landing__pop" style={delay(420)}>
                  <Csavar mood="cheer" width={150} className="landing__hop landing__hop--late" />
                </div>
              </div>
            </div>
          </section>

          <NameStory />

          <section className="landing__section" aria-labelledby="l-worlds">
            <div className="landing__wrap">
              <h2 id="l-worlds" className="landing__reveal">
                Két sziget, tizennégy játék
              </h2>
              <p className="landing__intro landing__reveal">Nincsenek lezárt világok, a gyerekek szabadon evezhetnek bármelyik szigetre. Az app mindig ott nyílik meg, ahol legutóbb jártak.</p>
              <div className="landing__worlds">
                <article className="landing__world landing__world--garden landing__reveal">
                  <div className="landing__world-head">
                    <Csepi mood="smile" width={64} />
                    <div>
                      <h3>Számkertész</h3>
                      <p>Csepivel · számok, számolás és minták</p>
                    </div>
                  </div>
                  <GameList games={GARDEN_GAMES} />
                  <p>
                    <b>A jutalom:</b> minden jól megoldott feladat egy mag, amit a gyerek a saját Kiskertjébe ültethet, hogy új vendégeket csalogasson oda.
                  </p>
                </article>
                <article className="landing__world landing__world--robot landing__reveal">
                  <div className="landing__world-head">
                    <Csavar mood="smile" width={64} />
                    <div>
                      <h3>Robotműhely</h3>
                      <p>Csavarral · programozás és logika</p>
                    </div>
                  </div>
                  <GameList games={ROBOT_GAMES} />
                  <p>
                    <b>A jutalom:</b> minden sikeres kör egy csavart ér, amiből a gyerek saját robotot építhet a polcára.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="landing__section landing__section--soft" aria-labelledby="l-how">
            <div className="landing__wrap">
              <h2 id="l-how" className="landing__reveal">
                Így tanulnak a gyerekek észrevétlenül
              </h2>
              <div className="landing__principles">
                {PRINCIPLES.map((p) => (
                  <div key={p.title} className="landing__principle landing__reveal">
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
              <div className="landing__parents-text landing__reveal">
                <h2 id="l-parents">A szülői sarok a tiétek</h2>
                <p className="landing__intro">
                  Egy szorzós kapu védi, amit egy 5–7 éves még nem tud kinyitni. Egyetlen készüléken akár hat gyerek is játszhat, mindegyik a saját tempójában és profiljával.
                </p>
              </div>
              <ul className="landing__features">
                {PARENTS.map((f) => (
                  <li key={f.title} className="landing__reveal">
                    <span className={`landing__icon landing__icon--${f.tone}`}>
                      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        {f.icon}
                      </svg>
                    </span>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Sheets onOpen={setSheetsFor} />

          <Install />

          <section className="landing__section landing__section--tight landing__end">
            <div className="landing__wrap landing__reveal">
              <h2>Hova evezünk ma?</h2>
              <StartButton onStart={ask}>{back}</StartButton>
            </div>
          </section>
        </main>

        <footer className="landing__foot">
          <div className="landing__wrap">
            <div className="landing__foot-brand">
              <KalandkaWordmark size={24} color="#ffffff" accent="#9fd3ef" />
              <p>Gondolkodós játékok 5–7 éveseknek</p>
              <button type="button" className="landing__foot-link" onClick={() => setLegal(true)}>
                Adatkezelés és impresszum
              </button>
              <a className="landing__foot-link" href={SOURCE.repo} target="_blank" rel="noreferrer">
                Forráskód (AGPL-3.0)
              </a>
            </div>
            {/* The maker's badge, kept in public/badge so it works offline like the rest of the app. */}
            <a className="landing__badge" href="https://tiborhorvath.dev" lang="hu" target="_blank" rel="noopener">
              <img src="/badge/built-by-hu-dark.svg" alt="Készítette: Horváth Tibor, portfólió megnyitása (új lapon)" width="167" height="50" />
            </a>
          </div>
        </footer>
      </div>

      {sheetsFor && (
        <div className="landing__print">
          <Suspense fallback={null}>
            <PrintArea guestAge={sheetsFor} onClose={() => setSheetsFor(null)} />
          </Suspense>
        </div>
      )}

      {legal && (
        <div className="landing__print">
          <LegalSheet onClose={() => setLegal(false)} />
        </div>
      )}
    </>
  );
}
