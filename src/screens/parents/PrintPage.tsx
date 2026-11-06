import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Csepi } from '../../components/Csepi';
import { Csavar, Rover } from '../../components/robot';
import { MAX_PAGES, PRINT_SHEETS, buildPages, nextPrintout, pageRef, saveChoice, savedChoice, sheetFor, tasksPerPage, type PrintChoice } from '../../print/catalog';
import { EXTRAS, extraFor, type ExtraId } from '../../print/extras';
import { linkUrl, pageKey } from '../../print/link';
import { DENSITIES, OtherAnswers, Sheet, type PrintId, type PrintSpec } from '../../print/sheet';
import { useProfiles, type AgeBand } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { markPageDone, pagesDoneIn } from '../../state/rewards';
import { WORLDS } from '../../state/worlds';
import { WorldGroup } from './controls';
import { ScanSheet } from './ScanSheet';

/** Width of an A4 sheet in CSS pixels (210 mm); the preview scales it to its column. */
const SHEET_PX = 793.7;
const SHEET_RATIO = 297 / 210;

const TILES: Record<PrintId, { glyph: string; tile: string }> = {
  learn: { glyph: '12', tile: 'pa-tile--blue' },
  water: { glyph: '10', tile: 'pa-tile--sky' },
  patterns: { glyph: 'AB', tile: 'pa-tile--pink' },
  flash: { glyph: '5', tile: 'pa-tile--sand' },
  add: { glyph: '+', tile: 'pa-tile--sun' },
  trace: { glyph: '3', tile: 'pa-tile--sun' },
  pots: { glyph: '3+7', tile: 'pa-tile--pink' },
  path: { glyph: '↑→', tile: 'pa-tile--sky' },
  sort: { glyph: '●▲', tile: 'pa-tile--sand' },
  scale: { glyph: '=', tile: 'pa-tile--sun' },
  seq: { glyph: 'AB?', tile: 'pa-tile--blue' },
  mirror: { glyph: '•|•', tile: 'pa-tile--sky' },
  code: { glyph: '●→?', tile: 'pa-tile--sand' },
  fix: { glyph: '↑✗', tile: 'pa-tile--pink' }
};

const EXTRA_TILES: Record<ExtraId, { glyph: ReactNode; tile: string }> = {
  figures: { glyph: <Csepi />, tile: 'pa-tile--blue' },
  badges: { glyph: <Csavar mood="cheer" />, tile: 'pa-tile--sun' },
  robot: {
    glyph: (
      <svg className="px-tile-rover" viewBox="0 0 100 100">
        <Rover />
      </svg>
    ),
    tile: 'pa-tile--sky'
  }
};

/** "az 5 éves", "a 6 éves", "a 7 éves": the age a visitor picked on the landing page, with its article. */
function theAge(age: AgeBand): string {
  return age === '5' ? 'az 5 éves' : `a ${age === '7+' ? '7' : age} éves`;
}

function pagesOf(s: PrintSpec<unknown>, c: PrintChoice, answers: boolean): ReactNode[] {
  return buildPages(s, c).map((p, i) => (
    <Sheet key={i} spec={s} level={c.level} grid={p.grid} tasks={p.tasks} answers={answers} footer={c.pages > 1 ? `${i + 1}/${c.pages}. lap` : ''} link={linkUrl(pageRef(s, c, i))} />
  ));
}

/** The sheets at the width of their column. */
function Preview({ children }: { children: ReactNode[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / SHEET_PX);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="ps-preview">
      {children.map((page, i) => (
        <div key={i} className="ps-preview__page" style={{ height: SHEET_PX * SHEET_RATIO * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>{page}</div>
        </div>
      ))}
    </div>
  );
}

function Stepper({ label, value, dots, onStep, atMin, atMax }: { label: string; value: string; dots?: [number, number]; onStep: (by: number) => void; atMin: boolean; atMax: boolean }) {
  return (
    <div className="pa-stepper">
      <button type="button" className="pa-stepper__btn" disabled={atMin} onClick={() => onStep(-1)} aria-label={`${label}: kevesebb`}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <div className="pa-stepper__value" aria-live="polite">
        <span>{value}</span>
        {dots && (
          <span className="pa-dots" aria-hidden="true">
            {Array.from({ length: dots[1] }, (_, k) => (
              <i key={k} className={k <= dots[0] ? (k === dots[0] ? 'is-now' : 'is-done') : ''} />
            ))}
          </span>
        )}
      </div>
      <button type="button" className="pa-stepper__btn pa-stepper__btn--up" disabled={atMax} onClick={() => onStep(1)} aria-label={`${label}: több`}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>
    </div>
  );
}

/** The grown-up marks the pages the child finished: the pages of the printout chosen here. Each counts once, towards the Feladatlapok stickers and the game's own sticker for its level. */
function DonePages({ s, choice }: { s: PrintSpec<unknown>; choice: PrintChoice }) {
  const { progress, update } = useProgress();
  return (
    <section className="pa-card ps-done">
      <h2 className="pa-h2">Kész lapok</h2>
      <p className="pa-muted">Ha a gyerkőc befejezett egy lapot, jelöld meg itt. A feladatai úgy töltik a jutalomtartót, mint a játékban: minden négy feladatért egy mag (a Robotműhelyben csavar) jár, és mindkét világban matrica az első, az ötödik és a tizenötödik kész lapért.</p>
      <div className="pa-row">
        {Array.from({ length: choice.pages }, (_, i) => {
          const key = pageKey(pageRef(s, choice, i));
          const done = progress.pagesDone.includes(key);
          const name = choice.pages > 1 ? `${i + 1}. lap` : 'A lap';
          return (
            <button key={key} type="button" className={`pa-btn${done ? ' pa-btn--go' : ''}`} disabled={done} onClick={() => update((p) => markPageDone(p, key, tasksPerPage(s, choice.level, choice.density)))}>
              {done && (
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              {name} {done ? 'kész' : 'megjelölése'}
            </button>
          );
        })}
      </div>
      <p className="pa-muted" aria-live="polite">
        Ebben a világban eddig <b>{pagesDoneIn(progress, s.world)}</b> kész lap.
      </p>
    </section>
  );
}

/**
 * While true, the sheets go into a layer of their own beside the app, which print.css shows on paper and hides everything else.
 * `name` is the document's title meanwhile: also the file name when the sheet is saved as a PDF.
 */
function usePrinting(name: string): [boolean, (on: boolean) => void] {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    const title = document.title;
    document.title = `Kalandka – ${name}`;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
      document.title = title;
    };
  }, [printing, name]);
  return [printing, setPrinting];
}

function PrintIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  );
}

function BackLink({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button type="button" className="pa-link ps-back" onClick={onBack}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}

/** A Kellékek page: the same for every child, so nothing to choose; a preview and the print button. */
function ExtraSheet({ id, onBack }: { id: ExtraId; onBack: () => void }) {
  const e = extraFor(id);
  const [printing, setPrinting] = usePrinting(e.title);
  return (
    <div className="pa-page">
      <BackLink label="Minden lap" onBack={onBack} />
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">{e.title}</h1>
          <p className="pa-lead">{e.lead}</p>
        </div>
      </header>
      <div className="ps-layout">
        <div className="ps-controls">
          <div className="pa-row">
            <button type="button" className="pa-btn pa-btn--go" onClick={() => setPrinting(true)}>
              <PrintIcon />
              Nyomtatás
            </button>
          </div>
          <p className="pa-muted">Vastagabb papírra nyomtatva tovább bírja. A kivágás a felnőtt dolga, a gyerkőc a ragasztásban segíthet.</p>
        </div>
        <div className="ps-side">
          <Preview>{[<e.Page key="page" />]}</Preview>
        </div>
      </div>
      {printing && createPortal(<div className="ps-print"><e.Page /></div>, document.body)}
    </div>
  );
}

/** One game's sheet: level, size and pages, a preview, the answers (on the tablet only) and the print button. */
function GameSheet({ id, kidId, guestAge, canMark, onBack, onExtra }: { id: PrintId; kidId: string; guestAge?: AgeBand; canMark?: boolean; onBack: () => void; onExtra: (id: ExtraId) => void }) {
  const { progress } = useProgress();
  const { profiles } = useProfiles();
  const s = sheetFor(id);
  const young = (guestAge ?? profiles.kids.find((k) => k.id === kidId)?.age) === '5';
  const [choice, setChoice] = useState<PrintChoice>(() => {
    const saved = savedChoice(kidId, id);
    if (!saved) return { level: s.current(progress), density: young ? 'big' : 'normal', pages: 1, batch: Math.floor(Math.random() * 10_000) };
    // A printout marked done gives way to new tasks, kept so the answers match the sheet printed next.
    const next = nextPrintout(s, saved, progress.pagesDone);
    if (next !== saved) saveChoice(kidId, id, next);
    return next;
  });
  const [answers, setAnswers] = useState(false);
  const [printing, setPrinting] = usePrinting(s.game);

  const change = (patch: Partial<PrintChoice>) => {
    const next = { ...choice, ...patch };
    setChoice(next);
    saveChoice(kidId, id, next);
  };

  const perPage = tasksPerPage(s, choice.level, choice.density);

  return (
    <div className="pa-page">
      <BackLink label="Minden lap" onBack={onBack} />
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">{s.game}</h1>
          <p className="pa-lead">{s.ask(choice.level)}</p>
        </div>
      </header>

      <div className="ps-layout">
        <div className="ps-controls">
          <section className="pa-card">
            <h2 className="pa-h2">Szint</h2>
            <Stepper
              label="Szint"
              value={`${choice.level + 1}. ${s.levels[choice.level]}`}
              dots={[choice.level, s.levels.length]}
              atMin={choice.level === 0}
              atMax={choice.level === s.levels.length - 1}
              onStep={(by) => change({ level: choice.level + by })}
            />
            {guestAge ? (
              <p className="pa-muted">{choice.level === s.current(progress) ? `Ezzel a szinttel indulnak ${theAge(guestAge)} gyerkőcök.` : `${theAge(guestAge).replace('a', 'A')} gyerkőcök a(z) ${s.current(progress) + 1}. szinttel indulnak.`}</p>
            ) : choice.level === s.current(progress) ? (
              <p className="pa-muted">Ezen a szinten tart most a játékban.</p>
            ) : (
              <p className="pa-muted">A játékban most a(z) {s.current(progress) + 1}. szinten tart.</p>
            )}
          </section>

          <section className="pa-card">
            <h2 className="pa-h2" id="ps-size">
              Feladatok egy lapon
            </h2>
            <div className="pa-seg ps-seg" role="radiogroup" aria-labelledby="ps-size">
              {DENSITIES.map((d) => (
                <button key={d.id} type="button" role="radio" aria-checked={choice.density === d.id} className={`pa-seg__btn${choice.density === d.id ? ' is-on' : ''}`} onClick={() => change({ density: d.id })}>
                  {d.label}
                  <small>{tasksPerPage(s, choice.level, d.id)} feladat</small>
                </button>
              ))}
            </div>
            <div className="pa-spread">
              <span className="pa-stack">
                <b>Lapok</b>
                <small>Minden lapon új feladatok vannak.</small>
              </span>
              <Stepper label="Lapok" value={`${choice.pages} lap · ${choice.pages * perPage} feladat`} atMin={choice.pages <= 1} atMax={choice.pages >= MAX_PAGES} onStep={(by) => change({ pages: choice.pages + by })} />
            </div>
          </section>

          <div className="pa-row">
            <button type="button" className="pa-btn pa-btn--go" onClick={() => setPrinting(true)}>
              <PrintIcon />
              Nyomtatás
            </button>
            {(s.reshuffles?.(choice.level) ?? true) && (
              <button type="button" className="pa-btn pa-btn--quiet" onClick={() => change({ batch: choice.batch + 1 })}>
                Új feladatok
              </button>
            )}
          </div>
          <p className="pa-muted">
            A megoldások a kinyomtatott lapon nincsenek, csak a képernyőn látszanak: a lap QR-kódját telefonnal beolvasva bármikor megnézhetitek őket.
          </p>
          {id === 'path' && (
            <p className="pa-muted">
              Papíron is léptetnétek a robotot?{' '}
              <button type="button" className="pa-link ps-inline" onClick={() => onExtra('robot')}>
                Kis robot és parancskártyák
              </button>
            </p>
          )}
          {canMark && <DonePages s={s} choice={choice} />}
        </div>

        <div className="ps-side">
          <div className="pa-seg pa-seg--pill" role="radiogroup" aria-label="Mit mutasson?">
            <button type="button" role="radio" aria-checked={!answers} className={`pa-seg__btn${!answers ? ' is-on' : ''}`} onClick={() => setAnswers(false)}>
              Feladatlap
            </button>
            <button type="button" role="radio" aria-checked={answers} className={`pa-seg__btn${answers ? ' is-on' : ''}`} onClick={() => setAnswers(true)}>
              Megoldások
            </button>
          </div>
          {answers && <OtherAnswers spec={s} level={choice.level} />}
          <Preview>{pagesOf(s, choice, answers)}</Preview>
        </div>
      </div>

      {printing && createPortal(<div className="ps-print">{pagesOf(s, choice, false)}</div>, document.body)}
    </div>
  );
}

/**
 * Printable sheets: every game on paper, for play without a device. In the parents' corner, and open to all from "Ki játszik?" and the home screens (PrintArea).
 * `canMark` only behind the parents' gate: marking a page earns stickers, so a child must not reach it.
 */
export function PrintPage({ kidId, guestAge, canMark }: { kidId: string; guestAge?: AgeBand; canMark?: boolean }) {
  const { progress } = useProgress();
  const [open, setOpen] = useState<PrintId | null>(null);
  const [scanning, setScanning] = useState(false);
  // Opened over a game's sheet, the way back leads to that sheet again.
  const [extra, setExtra] = useState<ExtraId | null>(null);

  if (scanning && canMark) return <ScanSheet kidId={kidId} onBack={() => setScanning(false)} />;
  if (extra) return <ExtraSheet id={extra} onBack={() => setExtra(null)} />;
  if (open) return <GameSheet key={`${kidId}-${open}`} id={open} kidId={kidId} guestAge={guestAge} canMark={canMark} onBack={() => setOpen(null)} onExtra={setExtra} />;

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Nyomtatás</h1>
          <p className="pa-lead">
            {guestAge
              ? `Feladatlapok papírra, eszköz nélküli játékhoz. Minden játék a saját lapján, ${theAge(guestAge)} gyerkőcöknek való kezdőszinten; ceruza és zsírkréta kell hozzá.`
              : 'Feladatlapok papírra, eszköz nélküli játékhoz. Minden játék a saját lapján, a gyerkőc mostani szintjén; ceruza és zsírkréta kell hozzá.'}
          </p>
        </div>
      </header>
      {canMark && (
        <section className="pa-card">
          <h2 className="pa-h2">Kész lap megjelölése</h2>
          <p className="pa-muted">Ha a gyerkőc befejezett egy feladatlapot, olvasd be a QR-kódját: megnézheted a megoldásokat, és a kész lapért matrica jár.</p>
          <div className="pa-row">
            <button type="button" className="pa-btn" onClick={() => setScanning(true)}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                <path d="M8 12h8" />
              </svg>
              Lap beolvasása
            </button>
            <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setExtra('badges')}>
              Jelvények a kész lapokra
            </button>
          </div>
        </section>
      )}
      {WORLDS.map((w) => (
        <WorldGroup key={w.id} world={w} heading="h2">
          <div className="pa-levels">
            {PRINT_SHEETS.filter((s) => s.world === w.id).map((s) => {
              const level = savedChoice(kidId, s.id)?.level ?? s.current(progress);
              return (
                <button key={s.id} type="button" className="pa-level ps-game" onClick={() => setOpen(s.id)}>
                  <div className={`pa-tile ${TILES[s.id].tile}`} aria-hidden="true">
                    {TILES[s.id].glyph}
                  </div>
                  <div className="pa-level__text">
                    <div className="pa-level__title">
                      <h3>{s.game}</h3>
                      <span>{`${level + 1}. ${s.levels[level]}`}</span>
                    </div>
                    <span className="pa-level__mode">{s.ask(level)}</span>
                  </div>
                  <svg className="ps-game__go" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </WorldGroup>
      ))}
      <section className="pa-card" aria-labelledby="ps-extras">
        <h2 className="pa-h2" id="ps-extras">
          Kellékek
        </h2>
        <p className="pa-muted">Kivágós lapok a feladatlapok mellé, minden gyerkőcnek ugyanazok.</p>
        <div className="pa-levels">
          {EXTRAS.map((e) => (
            <button key={e.id} type="button" className="pa-level ps-game" onClick={() => setExtra(e.id)}>
              <div className={`pa-tile ${EXTRA_TILES[e.id].tile}`} aria-hidden="true">
                {EXTRA_TILES[e.id].glyph}
              </div>
              <div className="pa-level__text">
                <div className="pa-level__title">
                  <h3>{e.title}</h3>
                </div>
                <span className="pa-level__mode">{e.lead}</span>
              </div>
              <svg className="ps-game__go" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
