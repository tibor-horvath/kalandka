import { useCallback, useState } from 'react';
import { openLink, type OpenedLink } from '../../print/catalog';
import { pageKey, readScanned } from '../../print/link';
import { AnswerList, OtherAnswers } from '../../print/sheet';
import { kidName, useProfiles } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { podFill, tasksPerReward } from '../../state/pod';
import { earnedStickers, markPageDone, pageReward, pagesDoneIn, seedBalance } from '../../state/rewards';
import { boltBalance } from '../../state/robotParts';
import { WORLDS } from '../../state/worlds';
import { PageReceipt, type PageWin } from './PageReceipt';
import { Scanner } from './Scanner';

type Opened = Extract<OpenedLink, { kind: 'page' }>;

const BACK = (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const CHECK = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Lap beolvasása: the grown-up holds a finished sheet's QR code to the tablet's camera. The page's own tasks come back
 * from its seed, to tick off one by one against the paper, and "Lap kész" marks it done for the child shown:
 * its tasks fill the child's reward pod as in the app (played back below the button), and the stickers the child then gets at home: Feladatlapok, and the game's own for the page's level. Behind the parents' gate only.
 */
export function ScanSheet({ kidId, onBack }: { kidId: string; onBack: () => void }) {
  const [opened, setOpened] = useState<Opened | null>(null);
  // What the last code that was not a sheet of this app said, so the grown-up knows why nothing happens.
  const [miss, setMiss] = useState<Exclude<OpenedLink['kind'], 'page'> | 'foreign' | null>(null);

  const onCode = useCallback((bytes: Uint8Array) => {
    const link = readScanned(new TextDecoder().decode(bytes));
    const found = link ? openLink(link) : null;
    if (found?.kind === 'page') setOpened(found);
    else setMiss(found?.kind ?? 'foreign');
  }, []);

  return (
    <div className="pa-page">
      <button type="button" className="pa-link ps-back" onClick={onBack}>
        {BACK}
        Minden játék
      </button>
      {opened ? (
        <ScannedPage
          key={pageKey(opened.ref)}
          kidId={kidId}
          opened={opened}
          onAgain={() => {
            setOpened(null);
            setMiss(null);
          }}
        />
      ) : (
        <>
          <header className="pa-head">
            <div>
              <h1 className="pa-h1">Lap beolvasása</h1>
              <p className="pa-lead">Tartsd a kamerát a kitöltött feladatlap jobb alsó sarkában lévő QR-kódra.</p>
            </div>
          </header>
          <section className="pa-card pa-transfer">
            <Scanner onCode={onCode} />
            <div className="pa-transfer__status" role="status">
              {miss === 'older' ? (
                <span>Ez a lap a Kalandka egy régebbi verziójához készült, a feladatai már nem tölthetők be. A „Kész lapok” résznél a játék lapján még megjelölheted.</span>
              ) : miss === 'newer' ? (
                <span>Ez a lap a Kalandka újabb verziójával készült. Frissítsd az alkalmazást a Beállításokban, és olvasd be újra.</span>
              ) : miss === 'bad' || miss === 'foreign' ? (
                <span>Ez nem Kalandka-feladatlap kódja.</span>
              ) : (
                <span>Keresem a kódot…</span>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ScannedPage({ kidId, opened, onAgain }: { kidId: string; opened: Opened; onAgain: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const { spec, ref, tasks } = opened;
  const key = pageKey(ref);
  const world = WORLDS.find((w) => w.id === spec.world)!;
  const kid = profiles.kids.find((k) => k.id === kidId);
  const name = kid ? kidName(kid) : 'a gyerkőc';
  const [ticked, setTicked] = useState(() => tasks.map(() => false));
  // What this mark did (the pod and total before it, the pay, new stickers), played back below "Kész lap".
  const [won, setWon] = useState<PageWin | null>(null);
  const done = progress.pagesDone.includes(key);
  const count = ticked.filter(Boolean).length;
  const unit = spec.world === 'robot' ? 'csavar' : 'mag';
  const reward = pageReward(progress, key, tasks.length);
  const pay = reward.seeds + reward.bolts;

  const mark = () => {
    const had = new Set(earnedStickers(progress).map((s) => s.id));
    const stickers = earnedStickers(markPageDone(progress, key, tasks.length)).filter((s) => !had.has(s.id));
    const total = spec.world === 'robot' ? boltBalance(progress) : seedBalance(progress);
    setWon({ tasks: tasks.length, fill: podFill(progress, spec.world), total, pay, stickers });
    update((p) => markPageDone(p, key, tasks.length));
  };

  return (
    <>
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">{spec.game}</h1>
          <p className="pa-lead">
            {world.name} · {ref.level + 1}. szint · {ref.page + 1}. lap
          </p>
        </div>
      </header>

      <section className="pa-card ps-done">
        <p className="pa-muted">
          Nézd végig a lapot a megoldásokkal, és pipáld ki, amit átnéztetek. A kész lap {tasks.length} feladata úgy tölti a jutalomtartót, mint a játékban a megoldott feladatok: minden{' '}
          {tasksPerReward(spec.world)}. feladatért jár egy {unit}{pay > 0 && `, most ${pay} ${unit}`}. A befejezés számít, nem az, hány feladat lett jó.
        </p>
        <div className="pa-row">
          <button type="button" className={`pa-btn${done ? ' pa-btn--go' : ''}${won ? ' ps-done__btn' : ''}`} disabled={done} onClick={mark}>
            {done && CHECK}
            {done ? `Kész lap: ${name}` : `Lap kész: ${name}`}
          </button>
          <button type="button" className="pa-btn pa-btn--quiet" onClick={onAgain}>
            Másik lap beolvasása
          </button>
        </div>
        <p className="pa-muted" aria-live="polite">
          {count} / {tasks.length} feladat kipipálva · {world.name}: eddig <b>{pagesDoneIn(progress, spec.world)}</b> kész lap.
        </p>
        {won && <PageReceipt win={won} world={spec.world} worldName={world.name} name={name} />}
        {done && !won && <p className="pa-muted">Ezt a lapot már korábban megjelölted, újra nem számít.</p>}
      </section>

      <OtherAnswers spec={spec} level={ref.level} />
      <AnswerList spec={spec} tasks={tasks} ticked={ticked} onTick={(i) => setTicked((t) => t.map((v, k) => (k === i ? !v : v)))} />
    </>
  );
}
