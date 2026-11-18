import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from '../../components/avatars';
import { useModal } from '../../components/Modal';
import { openLink, type OpenedLink } from '../../print/catalog';
import { pageKey, readScanned } from '../../print/link';
import { AnswerList, OtherAnswers } from '../../print/sheet';
import { KidScope, kidName, useProfiles, type Kid } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { podFill, tasksPerReward } from '../../state/pod';
import { earnedStickers, markPageDone, pageReward, pagesDoneIn, topFirst } from '../../state/stickers';
import { balanceIn, rewardUnit } from '../../state/balance';
import { WORLDS } from '../../state/worlds';
import { PageReceipt, type PageWin } from './PageReceipt';
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
  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
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
 * fills the screen and keeps watching; a sheet's tasks come up in a panel over it, to tick off against the paper, and
 * "Lap kész" marks it done for the child picked below: its tasks fill that child's reward pod as in the app (played
 * back below the button), and the stickers the child then gets at home. The next code simply replaces the panel.
 * Behind the parents' gate only: opened straight from the gate, or from Nyomtatás.
 */
export function ScanSheet({ kidId, onBack }: { kidId: string; onBack: () => void }) {
  const { profiles } = useProfiles();
  const [pick, setPick] = useState(kidId);
  const kid = profiles.kids.find((k) => k.id === pick) ?? profiles.kids.find((k) => k.id === profiles.activeId) ?? profiles.kids[0];
  const [opened, setOpened] = useState<Opened | null>(null);
  // What the last code that was not a sheet of this app said, so the grown-up knows why nothing happens.
  const [miss, setMiss] = useState<Miss | null>(null);
  const [marked, setMarked] = useState(0);
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const seen = useRef<{ text: string; at: number } | null>(null);
  const modal = useModal<HTMLDivElement>();
  const back = useRef(onBack);
  back.current = onBack;

  // Escape closes the scanner only, not the parents' corner it may sit in: heard first, and kept from the others.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      back.current();
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
          <span role="status">
            {opened ? 'A kamera figyel: jöhet a következő lap' : marked > 0 ? `Most beolvasva: ${marked} kész lap` : 'Csak tartsd a kamera elé a lap QR-kódját'}
          </span>
        </div>
        {hasTorch ? (
          <button type="button" className={`sc__pill sc__pill--round${torch ? ' is-on' : ''}`} aria-label="Lámpa" aria-pressed={torch} onClick={() => setTorch((t) => !t)}>
            {LAMP}
          </button>
        ) : (
          <span className="sc__pill--round" aria-hidden="true" />
        )}
      </header>

      {opened ? (
        <section className="sc__sheet" aria-labelledby="sc-game">
          <KidScope kidId={kid.id}>
            <ScannedPage
              key={`${pageKey(opened.ref)}-${kid.id}`}
              kid={kid}
              opened={opened}
              kids={kids}
              onMarked={() => setMarked((n) => n + 1)}
              onClose={() => setOpened(null)}
            />
          </KidScope>
        </section>
      ) : (
        <div className="sc__bottom">
          <p className="sc__hint" role="status">
            {miss === 'older'
              ? 'Ez a lap a Kalandka egy régebbi verziójához készült, a feladatai már nem tölthetők be. A Nyomtatásban, a játék lapján még megjelölheted.'
              : miss === 'newer'
                ? 'Ez a lap a Kalandka újabb verziójával készült. Frissítsd az alkalmazást a Beállításokban, és olvasd be újra.'
                : miss === 'bad' || miss === 'foreign'
                  ? 'Ez nem Kalandka-feladatlap kódja.'
                  : 'A lap jobb alsó sarkában lévő QR-kódot mutasd a kamerának.'}
          </p>
          {kids && <div className="sc__kids">{kids}</div>}
        </div>
      )}
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

function ScannedPage({ kid, opened, kids, onMarked, onClose }: { kid: Kid; opened: Opened; kids: ReactNode; onMarked: () => void; onClose: () => void }) {
  const { progress, update } = useProgress();
  const { spec, ref, tasks } = opened;
  const key = pageKey(ref);
  const world = WORLDS.find((w) => w.id === spec.world)!;
  const name = kidName(kid);
  const [ticked, setTicked] = useState(() => tasks.map(() => false));
  const [answers, setAnswers] = useState(false);
  // What this mark did (the pod and total before it, the pay, new stickers), played back below "Kész lap".
  const [won, setWon] = useState<PageWin | null>(null);
  const done = progress.pagesDone.includes(key);
  const count = ticked.filter(Boolean).length;
  const unit = rewardUnit(spec.world);
  const pay = pageReward(progress, key, tasks.length);

  const mark = () => {
    const had = new Set(earnedStickers(progress).map((s) => s.id));
    const stickers = topFirst(earnedStickers(markPageDone(progress, key, tasks.length)).filter((s) => !had.has(s.id)));
    const total = balanceIn(progress, spec.world);
    setWon({ tasks: tasks.length, fill: podFill(progress, spec.world), total, pay, stickers });
    update((p) => markPageDone(p, key, tasks.length));
    onMarked();
  };

  return (
    <>
      <header className="sc__head">
        <div>
          <h2 id="sc-game" className="pa-h1">
            {spec.game}
          </h2>
          <p className="pa-lead">
            {world.name} · {ref.level + 1}. szint · {ref.page + 1}. lap · {tasks.length} feladat
          </p>
        </div>
        {kids}
        <button type="button" className="sc__x" aria-label="Lap bezárása" onClick={onClose}>
          {CLOSE}
        </button>
      </header>

      <button type="button" className={`pa-btn sc__mark${done ? ' pa-btn--go' : ''}${won ? ' ps-done__btn' : ''}`} disabled={done} onClick={mark}>
        {done && CHECK}
        {done ? `Kész lap: ${name}` : `Lap kész: ${name}`}
      </button>

      {won ? (
        <PageReceipt win={won} world={spec.world} worldName={world.name} name={name} />
      ) : done ? (
        <p className="pa-muted">Ezt a lapot {name} már korábban megkapta, újra nem számít.</p>
      ) : (
        <p className="pa-muted">
          A befejezés számít, nem az, hány feladat lett jó: a {tasks.length} feladat úgy tölti a jutalomtartót, mint a játékban (minden {tasksPerReward(spec.world)}. feladatért
          egy {unit}){pay > 0 && `, most ${pay} ${unit}`}. {world.name}: eddig <b>{pagesDoneIn(progress, spec.world)}</b> kész lap.
        </p>
      )}

      <button type="button" className="sc__answers" aria-expanded={answers} onClick={() => setAnswers((a) => !a)}>
        {answers ? 'Megoldások elrejtése' : 'Megoldások megnézése'}
        <span aria-live="polite">
          {count} / {tasks.length} kipipálva
        </span>
      </button>
      {answers && (
        <div className="sc__list">
          <OtherAnswers spec={spec} level={ref.level} />
          <AnswerList spec={spec} tasks={tasks} ticked={ticked} onTick={(i) => setTicked((t) => t.map((v, k) => (k === i ? !v : v)))} />
        </div>
      )}
    </>
  );
}
