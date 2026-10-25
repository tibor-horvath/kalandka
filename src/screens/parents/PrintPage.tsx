import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MAX_PAGES, PRINT_SHEETS, buildPages, saveChoice, savedChoice, sheetFor, tasksPerPage, type PrintChoice } from '../../print/catalog';
import { DENSITIES, Sheet, type PrintId, type PrintSpec } from '../../print/sheet';
import { useProfiles, type AgeBand } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { WORLDS } from '../../state/worlds';
import { WorldGroup } from './controls';

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
  code: { glyph: '●→?', tile: 'pa-tile--sand' }
};

/** "az 5 éves", "a 6 éves", "a 7 éves": the age a visitor picked on the landing page, with its article. */
function theAge(age: AgeBand): string {
  return age === '5' ? 'az 5 éves' : `a ${age === '7+' ? '7' : age} éves`;
}

function pagesOf(s: PrintSpec<unknown>, c: PrintChoice, answers: boolean): ReactNode[] {
  return buildPages(s, c).map((p, i) => (
    <Sheet key={i} spec={s} level={c.level} grid={p.grid} tasks={p.tasks} answers={answers} footer={c.pages > 1 ? `${i + 1}/${c.pages}. lap` : ''} />
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

/** One game's sheet: level, size and pages, a preview, the answers (on the tablet only) and the print button. */
function GameSheet({ id, kidId, guestAge, onBack }: { id: PrintId; kidId: string; guestAge?: AgeBand; onBack: () => void }) {
  const { progress } = useProgress();
  const { profiles } = useProfiles();
  const s = sheetFor(id);
  const young = (guestAge ?? profiles.kids.find((k) => k.id === kidId)?.age) === '5';
  const [choice, setChoice] = useState<PrintChoice>(
    () => savedChoice(kidId, id) ?? { level: s.current(progress), density: young ? 'big' : 'normal', pages: 1, batch: Math.floor(Math.random() * 10_000) }
  );
  const [answers, setAnswers] = useState(false);
  const [printing, setPrinting] = useState(false);

  const change = (patch: Partial<PrintChoice>) => {
    const next = { ...choice, ...patch };
    setChoice(next);
    saveChoice(kidId, id, next);
  };

  // The sheets go into a layer of their own beside the app, which print.css shows on paper and hides everything else.
  useEffect(() => {
    if (!printing) return;
    const title = document.title;
    // Also the file name when the sheet is saved as a PDF.
    document.title = `Kalandka – ${s.game}`;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
      document.title = title;
    };
  }, [printing, s.game]);

  const perPage = tasksPerPage(s, choice.level, choice.density);

  return (
    <div className="pa-page">
      <button type="button" className="pa-link ps-back" onClick={onBack}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Minden játék
      </button>
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
              <p className="pa-muted">{choice.level === s.current(progress) ? `Ezzel a szinttel indulnak ${theAge(guestAge)} gyerekek.` : `${theAge(guestAge).replace('a', 'A')} gyerekek a(z) ${s.current(progress) + 1}. szinttel indulnak.`}</p>
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
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V3h12v6" />
                <rect x="3" y="9" width="18" height="8" rx="2" />
                <path d="M7 14h10v7H7z" />
              </svg>
              Nyomtatás
            </button>
            {(s.reshuffles?.(choice.level) ?? true) && (
              <button type="button" className="pa-btn pa-btn--quiet" onClick={() => change({ batch: choice.batch + 1 })}>
                Új feladatok
              </button>
            )}
          </div>
          <p className="pa-muted">
            A megoldások csak itt, a képernyőn látszanak, a kinyomtatott lapon nincsenek. A Kalandka megjegyzi az utoljára választott feladatokat, így később is ellenőrizhetitek.
          </p>
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
          <Preview>{pagesOf(s, choice, answers)}</Preview>
        </div>
      </div>

      {printing && createPortal(<div className="ps-print">{pagesOf(s, choice, false)}</div>, document.body)}
    </div>
  );
}

/** Printable sheets: every game on paper, for play without a device. In the parents' corner, and open to all from "Ki játszik?" and the home screens (PrintArea). */
export function PrintPage({ kidId, guestAge }: { kidId: string; guestAge?: AgeBand }) {
  const { progress } = useProgress();
  const [open, setOpen] = useState<PrintId | null>(null);

  if (open) return <GameSheet key={`${kidId}-${open}`} id={open} kidId={kidId} guestAge={guestAge} onBack={() => setOpen(null)} />;

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Nyomtatás</h1>
          <p className="pa-lead">
            {guestAge
              ? `Feladatlapok papírra, eszköz nélküli játékhoz. Minden játék a saját lapján, ${theAge(guestAge)} gyerekeknek való kezdőszinten; ceruza és zsírkréta kell hozzá.`
              : 'Feladatlapok papírra, eszköz nélküli játékhoz. Minden játék a saját lapján, a gyerek mostani szintjén; ceruza és zsírkréta kell hozzá.'}
          </p>
        </div>
      </header>
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
    </div>
  );
}
