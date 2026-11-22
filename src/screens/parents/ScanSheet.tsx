import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '../../components/avatars';
import { useModal } from '../../components/Modal';
import { openLink, type OpenedLink } from '../../print/catalog';
import { pageKey, readScanned } from '../../print/link';
import { AnswerList, OtherAnswers } from '../../print/sheet';
import { KidScope, kidName, useProfiles, type Kid } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { WORLDS } from '../../state/worlds';
import { PageReceipt } from './PageReceipt';
import { LevelTally, usePageCheck } from './PageCheck';
import { Scanner } from './Scanner';

type Opened = Extract<OpenedLink, { kind: 'page' }>;
type Miss = Exclude<OpenedLink['kind'], 'page'> | 'foreign';

/** A code still in front of the camera is read again every frame; it opens again only after this long out of sight. */
const SAME_CODE_MS = 1500;

const CLOSE = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const CHECK = (
  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const NEXT = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const BACK = (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const SCAN = (
  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
    <path d="M9 9h6v6H9z" />
  </svg>
);

const LAMP = (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h10l-2 6H9z" />
    <path d="M9 9v11h6V9" />
    <path d="M12 13v3" />
  </svg>
);

/**
 * Lap beolvasása: the grown-up holds finished sheets' QR codes to the tablet's camera, one after another. The camera
 * fills the screen and keeps watching; a sheet's code brings up a card over it (which sheet, for the child picked
 * below), and the card opens the sheet's own page with the camera off: each answer to mark right or wrong against the
 * paper, then "Lap kész" counts it for the child (see usePageCheck). "Következő lap beolvasása" goes back to the camera.
 * Behind the parents' gate only: opened straight from the gate, or from Nyomtatás.
 */
export function ScanSheet({ kidId, onBack }: { kidId: string; onBack: () => void }) {
  const { profiles } = useProfiles();
  const [pick, setPick] = useState(kidId);
  const kid = profiles.kids.find((k) => k.id === pick) ?? profiles.kids.find((k) => k.id === profiles.activeId) ?? profiles.kids[0];
  const [opened, setOpened] = useState<Opened | null>(null);
  // The found sheet's own page, with the camera off: its answers to mark, then what it brought.
  const [checking, setChecking] = useState(false);
  // What the last code that was not a sheet of this app said, so the grown-up knows why nothing happens.
  const [miss, setMiss] = useState<Miss | null>(null);
  const [marked, setMarked] = useState(0);
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const seen = useRef<{ text: string; at: number } | null>(null);
  const modal = useModal<HTMLDivElement>();

  const toCamera = () => {
    setChecking(false);
    setOpened(null);
    seen.current = null;
  };
  // Escape steps back: from a sheet's page to the camera, from the camera out. Heard first, and kept from the
  // parents' corner the scanner may sit in.
  const escape = useRef(onBack);
  escape.current = checking ? toCamera : onBack;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      escape.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const onCode = useCallback((bytes: Uint8Array) => {
    const text = new TextDecoder().decode(bytes);
    const now = Date.now();
    const again = seen.current?.text === text && now - seen.current.at < SAME_CODE_MS;
    seen.current = { text, at: now };
    if (again) return;
    const link = readScanned(text);
    const found = link ? openLink(link) : null;
    if (found?.kind === 'page') {
      setOpened(found);
      setMiss(null);
    } else setMiss(found?.kind ?? 'foreign');
  }, []);

  const kids = profiles.kids.length > 1 ? <KidPick kids={profiles.kids} value={kid.id} onPick={setPick} /> : null;

  if (opened && checking) {
    return (
      <div className="pa sc sc--page" ref={modal} role="dialog" aria-modal="true" aria-labelledby="sc-game">
        <KidScope kidId={kid.id}>
          <CheckPage key={`${pageKey(opened.ref)}-${kid.id}`} kid={kid} opened={opened} onMarked={() => setMarked((n) => n + 1)} onCamera={toCamera} onClose={onBack} />
        </KidScope>
      </div>
    );
  }

  return (
    <div className="pa sc" ref={modal} role="dialog" aria-modal="true" aria-labelledby="sc-title">
      <Scanner className="sc__camera" text torch={hasTorch ? torch : undefined} onTorch={setHasTorch} onCode={onCode} />
      {!opened && (
        <div className="sc__frame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      <header className="sc__top">
        <button type="button" className="sc__pill" onClick={onBack}>
          {CLOSE}
          <span className="sc__pill-label">Bezárás</span>
        </button>
        <div className="sc__title">
          <h1 id="sc-title">Lap beolvasása</h1>
          <span role="status">{marked > 0 ? `Most beolvasva: ${marked} kész lap` : 'Tartsd a kamera elé a lap QR-kódját'}</span>
        </div>
        {hasTorch ? (
          <button type="button" className={`sc__pill sc__pill--round${torch ? ' is-on' : ''}`} aria-label="Lámpa" aria-pressed={torch} onClick={() => setTorch((t) => !t)}>
            {LAMP}
          </button>
        ) : (
          <span className="sc__pill--round" aria-hidden="true" />
        )}
      </header>

      <div className="sc__bottom">
        {opened ? (
          <KidScope kidId={kid.id}>
            <FoundCard kid={kid} opened={opened} onOpen={() => setChecking(true)} />
          </KidScope>
        ) : (
          <p className="sc__hint" role="status">
            {miss === 'older'
              ? 'Ez a lap a Kalandka egy régebbi verziójához készült, a feladatai már nem tölthetők be. A Nyomtatásban, a játék lapján még megjelölheted.'
              : miss === 'newer'
                ? 'Ez a lap a Kalandka újabb verziójával készült. Frissítsd az alkalmazást a Beállításokban, és olvasd be újra.'
                : miss === 'bad' || miss === 'foreign'
                  ? 'Ez nem Kalandka-feladatlap kódja.'
                  : 'A lap jobb alsó sarkában lévő QR-kódot mutasd a kamerának.'}
          </p>
        )}
        {kids && <div className="sc__kids">{kids}</div>}
      </div>
    </div>
  );
}

/** Who the scanned sheet counts for: with siblings, both children's sheets can be scanned in one go. */
function KidPick({ kids, value, onPick }: { kids: Kid[]; value: string; onPick: (id: string) => void }) {
  return (
    <div className="sc-kids" role="radiogroup" aria-label="Kinek számít a lap?">
      <span className="sc-kids__label">Kinek számít?</span>
      {kids.map((k) => (
        <button key={k.id} type="button" role="radio" aria-checked={k.id === value} className={`sc-kid${k.id === value ? ' is-on' : ''}`} onClick={() => onPick(k.id)}>
          <Avatar id={k.avatar} size={36} />
          {kidName(k)}
        </button>
      ))}
    </div>
  );
}

const pageLine = (o: Opened) => `${o.ref.level + 1}. szint · ${o.ref.page + 1}. lap · ${o.tasks.length} feladat`;

/** Over the camera once a sheet's code is read: which sheet, for whom, and the way to its page. A new code replaces it. */
function FoundCard({ kid, opened, onOpen }: { kid: Kid; opened: Opened; onOpen: () => void }) {
  const { progress } = useProgress();
  const done = progress.pagesDone.includes(pageKey(opened.ref));
  const name = kidName(kid);
  return (
    <button type="button" className="sc-found" onClick={onOpen}>
      <span className="sc-found__tick" aria-hidden="true">
        {CHECK}
      </span>
      <span className="sc-found__text">
        <b>Megvan: {opened.spec.game}</b>
        <span>
          {pageLine(opened)} · {done ? `${name} már megkapta` : `${name} lapja`}
        </span>
      </span>
      <span className="sc-found__go">
        {done ? 'Megnézem' : 'Ellenőrzés'}
        {NEXT}
      </span>
    </button>
  );
}

/**
 * A scanned sheet's own page, with the camera off so the answers have the whole screen: the meter of the level's
 * right answers on top, the answers to mark below it, and "Lap kész" at the foot. Once marked, the same page shows
 * what it brought and leads back to the camera for the next sheet.
 */
function CheckPage({ kid, opened, onMarked, onCamera, onClose }: { kid: Kid; opened: Opened; onMarked: () => void; onCamera: () => void; onClose: () => void }) {
  const { spec, ref, tasks } = opened;
  const world = WORLDS.find((w) => w.id === spec.world)!;
  const name = kidName(kid);
  const { judged, judge, rest, left, rightCount, tally, done, won, mark } = usePageCheck({ pageKey: pageKey(ref), tasks, world: spec.world, onMarked });
  const judging = !done && !won;
  const [answers, setAnswers] = useState(false);

  return (
    <>
      <header className="sc-page__top">
        {judging ? (
          <button type="button" className="sc-page__back" onClick={onCamera}>
            {BACK}
            Kamera
          </button>
        ) : (
          <span className="sc-page__side" aria-hidden="true" />
        )}
        <div className="sc-page__title">
          <h1 id="sc-game">{spec.game}</h1>
          <span>
            {world.name} · {pageLine(opened)}
          </span>
        </div>
        <span className="sc-page__kid">
          <Avatar id={kid.avatar} size={40} />
          {name}
        </span>
      </header>

      {judging ? (
        <>
          {tally.need !== null && (
            <section className="sc-page__meter" aria-label="A szint matricája">
              <LevelTally tally={tally} />
            </section>
          )}
          <main className="sc-page__body">
            <OtherAnswers spec={spec} level={ref.level} />
            <AnswerList spec={spec} tasks={tasks} judged={judged} onJudge={judge} />
          </main>
          <footer className="sc-page__foot">
            <span aria-live="polite">
              {tasks.length - left} / {tasks.length} ellenőrizve
            </span>
            {left > 0 && (
              <button type="button" className="pa-btn sc-page__rest" onClick={rest}>
                {left === tasks.length ? 'Mind jó' : 'A többi mind jó'}
              </button>
            )}
            <button type="button" className="pa-btn sc-page__main" disabled={left > 0} onClick={mark}>
              {left > 0 ? `Még ${left} feladat` : `Lap kész: ${name}`}
            </button>
          </footer>
        </>
      ) : (
        <>
          <main className="sc-page__body sc-page__body--done">
            <div className="sc-page__done">
              <span className="sc-found__tick" aria-hidden="true">
                {CHECK}
              </span>
              <h2 className="pa-h1">Kész lap: {name}</h2>
            </div>
            {won ? (
              <>
                <p className="pa-lead">
                  {rightCount} jó, {tasks.length - rightCount} hibás válasz · {tasks.length} feladat
                </p>
                <div className="sc-page__receipt">
                  <PageReceipt win={won} world={spec.world} worldName={world.name} name={name} />
                </div>
              </>
            ) : (
              <p className="pa-lead">Ezt a lapot {name} már korábban megkapta, újra nem számít.</p>
            )}
            <button type="button" className="sc__answers" aria-expanded={answers} onClick={() => setAnswers((a) => !a)}>
              {answers ? 'Megoldások elrejtése' : 'Megoldások megnézése'}
            </button>
            {answers && (
              <div className="sc__list">
                <OtherAnswers spec={spec} level={ref.level} />
                <AnswerList spec={spec} tasks={tasks} />
              </div>
            )}
          </main>
          <footer className="sc-page__foot sc-page__foot--done">
            <button type="button" className="pa-btn sc-page__rest" onClick={onClose}>
              Bezárás
            </button>
            <button type="button" className="pa-btn sc-page__main" onClick={onCamera}>
              {SCAN}
              Következő lap beolvasása
            </button>
          </footer>
        </>
      )}
    </>
  );
}
