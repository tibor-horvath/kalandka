import { useId, type ReactNode } from 'react';
import { QrCode } from '../components/QrCode';
import { Lamp, TextureContext } from '../components/robot';
import { KalandkaIcon, KalandkaWordmark } from '../components/ui';
import type { Color } from '../games/robot/sort';
import { GAMES, type GameId } from '../state/games';
import type { Progress } from '../state/progress';
import { WORLDS, type WorldId } from '../state/worlds';

// Printable sheets: every game's tasks on A4 paper, for play without a device.
// The tasks come from the games' own generators, so a sheet matches the child's level in the app;
// tapping becomes circling, colouring, drawing a line or crossing out.

/** Every game has its sheets. */
export type PrintId = GameId;

/** Fewer, bigger tasks for the little ones, or more, smaller ones on a page. */
export type Density = 'big' | 'normal' | 'many';
export const DENSITIES: { id: Density; label: string }[] = [
  { id: 'big', label: 'Kevesebb, nagyobb' },
  { id: 'normal', label: 'Normál' },
  { id: 'many', label: 'Sok, kisebb' }
];

/** Pages in one printout; each page has new tasks. */
export const MAX_PAGES = 5;

/** Columns and rows of tasks on one page. */
export type Grid = [cols: number, rows: number];

export interface TaskRequest {
  level: number;
  /** Which printout: "Új feladatok" moves to the next one. */
  batch: number;
  /** Page within the printout, from 0. */
  page: number;
  count: number;
  density: Density;
}

export interface PrintSpec<T> {
  id: PrintId;
  /**
   * Goes up whenever this game's sheets change, so the QR code on an older page says its answers are gone
   * rather than showing the answers to other tasks. catalog.test.ts fails if the tasks change and this does not.
   */
  rev: number;
  world: WorldId;
  game: string;
  /** Level names, easiest first. */
  levels: string[];
  /** Where the child is in the app, as one of `levels`. */
  current: (p: Progress) => number;
  grid: (level: number, density: Density) => Grid;
  /** What the child does, read aloud by the grown-up. */
  ask: (level: number) => string;
  /** A line for the grown-up: how to help on this level. */
  tip: (level: number) => string;
  /**
   * When more than one answer is right on this level, which ones count: the answers show only one of them.
   * Shown with the answers, so a grown-up does not mark a good route or another set of seeds wrong.
   */
  others?: (level: number) => string | null;
  /** Pictures that explain the answer cards, shown beside the instruction. */
  legend?: (level: number) => ReactNode;
  /** Colour is part of the task: the sheet shows which texture stands for which colour, for black-and-white printers. */
  colorKey?: (level: number) => boolean;
  /**
   * Whether "Új feladatok" gives other tasks on this level (yes unless said). Not for sheets that follow a fixed order,
   * such as the numbers 1–20 in Számmagok or the digits in writing order in Mézút.
   */
  reshuffles?: (level: number) => boolean;
  tasks: (req: TaskRequest) => T[];
  /** One task as an SVG; `answers` marks the solution (shown on the tablet only, never printed). */
  Task: (props: { task: T; answers: boolean }) => ReactNode;
}

/** Erases the task type so specs of different games share one list. */
/** A game's sheets; its world and name come from the game list. */
export function spec<T>(s: Omit<PrintSpec<T>, 'world' | 'game'>): PrintSpec<unknown> {
  const { world, name } = GAMES[s.id];
  return { ...s, world, game: name } as unknown as PrintSpec<unknown>;
}

/** Start round of task i on a page: different for every printout and page, the same for the same ones. */
export function roundOf(req: TaskRequest, i: number): number {
  return req.batch * 997 + req.page * req.count + i;
}

/** Fills `count` tasks from rounds that each hold several (Mérleg, Mintagép, Tükörgép, Kakukktojás). */
export function flatTasks<T>(req: TaskRequest, round: (r: number) => T[]): T[] {
  const out: T[] = [];
  for (let k = 0; out.length < req.count; k++) out.push(...round(roundOf(req, k)));
  return out.slice(0, req.count);
}

// ---------- drawing ----------

export const INK = '#10233A';
export const FAINT = '#B9CBD8';
export const LINE = '#D6E4EE';
/** Answer marks, on the tablet only. */
export const ANSWER = '#2F7D32';
export const FONT = "'Baloo 2', 'Trebuchet MS', sans-serif";

/** A task picture that scales into its cell. */
export function Pic({ w, h, x = 0, y = 0, children }: { w: number; h: number; x?: number; y?: number; children: ReactNode }) {
  return (
    <svg className="ps-svg" viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {children}
    </svg>
  );
}

export function At({ x, y, s = 1, r = 0, children }: { x: number; y: number; s?: number; r?: number; children: ReactNode }) {
  return <g transform={`translate(${x} ${y})${r ? ` rotate(${r})` : ''}${s !== 1 ? ` scale(${s})` : ''}`}>{children}</g>;
}

export function Num({ x, y, n, size = 56, fill = INK }: { x: number; y: number; n: ReactNode; size?: number; fill?: string }) {
  return (
    <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight="800" fill={fill}>
      {n}
    </text>
  );
}

/** A ring drawn round the right answer. */
export function Ring({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2 + 6} ry={h / 2 + 6} fill="none" stroke={ANSWER} strokeWidth="7" />;
}

/** A cross over a part to take away or the one out of place. */
export function Cross({ x, y, size = 70 }: { x: number; y: number; size?: number }) {
  const d = size / 2;
  return <path d={`M${x - d} ${y - d} L${x + d} ${y + d} M${x + d} ${y - d} L${x - d} ${y + d}`} stroke={ANSWER} strokeWidth="8" strokeLinecap="round" />;
}

/** The empty place in a row, drawn dashed. */
export function Gap({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx="14" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeDasharray="10 8" />;
}

/** A row of answer cards; the right one is ringed when `answers`. */
export function Choices({ x, y, w, h, gap = 16, pick, answers, children }: { x: number; y: number; w: number; h: number; gap?: number; pick: number; answers: boolean; children: ReactNode[] }) {
  return (
    <g>
      {children.map((c, i) => {
        const cx = x + i * (w + gap);
        return (
          <g key={i}>
            <rect x={cx} y={y} width={w} height={h} rx="16" fill="#FFFFFF" stroke={FAINT} strokeWidth="3" />
            <At x={cx} y={y}>
              {c}
            </At>
            {answers && i === pick && <Ring x={cx} y={y} w={w} h={h} />}
          </g>
        );
      })}
    </g>
  );
}

/** An answer box to write a number in; on the tablet the answer stands in it. */
export function WriteBox({ x, y, size = 90, answer, answers }: { x: number; y: number; size?: number; answer: number; answers: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx="14" fill="#FFFFFF" stroke={INK} strokeWidth="3.5" />
      {answers && <Num x={x + size / 2} y={y + size / 2} n={answer} size={size * 0.7} fill={ANSWER} />}
    </g>
  );
}

/**
 * The textures that keep colours apart in black and white (TextureContext in components/robot.tsx):
 * red striped, blue dotted, yellow plain. Hidden but not display:none, so the patterns still paint.
 */
function Textures({ red, blue }: { red: string; blue: string }) {
  return (
    <svg className="ps-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <pattern id={red} width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="13" fill={INK} opacity="0.45" />
        </pattern>
        <pattern id={blue} width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="7.5" cy="7.5" r="3.4" fill="#FFFFFF" />
        </pattern>
      </defs>
    </svg>
  );
}

const COLOR_KEY: { color: Color; label: string }[] = [
  { color: 'red', label: 'piros: csíkos' },
  { color: 'blue', label: 'kék: pöttyös' },
  { color: 'yellow', label: 'sárga: sima' }
];

/** The star a child colours in when a task is done. */
function Star() {
  return (
    <svg className="ps-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFFFFF" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Where parents find the app, printed on every sheet: the address it runs at, without "https://" (www.kalandka.hu). */
export function siteAddress(): string {
  return `${window.location.host}${import.meta.env.BASE_URL}`.replace(/\/+$/, '');
}

/** Pattern ids of a sheet's own: the preview and the printed copy each use theirs (see TextureContext). */
function useTextures() {
  const uid = `ps-tex-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return { ids: { red: `${uid}-red`, blue: `${uid}-blue` }, value: { red: `url(#${uid}-red)`, blue: `url(#${uid}-blue)`, yellow: null } };
}

/** One A4 page: name line, the instruction, a line for the grown-up, and the tasks in a grid. `footer` says which page of the printout this is, `link` where its answers are. */
export function Sheet({ spec, level, grid, tasks, answers, footer, link }: { spec: PrintSpec<unknown>; level: number; grid: Grid; tasks: unknown[]; answers: boolean; footer: string; link: string }) {
  const [cols, rows] = grid;
  const { Task } = spec;
  const textures = useTextures();
  return (
    <TextureContext.Provider value={textures.value}>
      <section className={`ps-sheet ps-sheet--${spec.world}`}>
        <Textures {...textures.ids} />
        {/* The header names the task; the brand stands once, in the footer. */}
        <header className="ps-head">
          <div className="ps-head__text">
            <span className="ps-world">
              {WORLDS.find((w) => w.id === spec.world)!.name} · {level + 1}. szint: {spec.levels[level]}
            </span>
            <h2 className="ps-title">{spec.game}</h2>
          </div>
          <span className="ps-name">Név: </span>
        </header>
        <div className="ps-ask">
          <p>{spec.ask(level)}</p>
          {spec.legend && <div className="ps-legend">{spec.legend(level)}</div>}
          {spec.colorKey?.(level) && (
            <div className="ps-legend">
              {COLOR_KEY.map((k) => (
                <span key={k.color} className="ps-legend__item">
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <Lamp color={k.color} textured />
                  </svg>
                  {k.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="ps-tip">
          <b>Szülőknek:</b> {spec.tip(level)} Ha egy feladat kész, a gyerkőc kiszínezheti a csillagot.
        </p>
        <div className="ps-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {tasks.map((t, i) => (
            <div key={i} className="ps-cell">
              <span className="ps-num">{i + 1}.</span>
              <Star />
              <div className="ps-pic">
                <Task task={t} answers={answers} />
              </div>
            </div>
          ))}
        </div>
        <footer className="ps-foot">
          <KalandkaIcon size={22} />
          <KalandkaWordmark size={15} />
          <span className="ps-foot__site">{siteAddress()}</span>
          <span className="ps-foot__about">Gondolkodtató játékok 5–7 éveseknek</span>
          <span className="ps-foot__key">
            <b>Megoldások: olvasd be telefonnal</b>
            {footer}
          </span>
          {/* Half a millimetre a square reads from a home printer; M survives a crayon mark. */}
          <QrCode data={link} correction="M" moduleMm={0.5} className="ps-foot__qr" label="QR-kód a lap megoldásaihoz" />
        </footer>
      </section>
    </TextureContext.Provider>
  );
}

/** One page's tasks solved, in the page's numbering, to read on a phone beside the paper. */
/** The line beside the answers when other answers are right too; nothing when the drawn answer is the only one. */
export function OtherAnswers({ spec, level }: { spec: PrintSpec<unknown>; level: number }) {
  const text = spec.others?.(level);
  return text ? (
    <p className="pa-muted ps-others">
      <b>Más megoldás is jó.</b> {text}
    </p>
  ) : null;
}

export function AnswerList({ spec, tasks, ticked, onTick }: { spec: PrintSpec<unknown>; tasks: unknown[]; ticked?: boolean[]; onTick?: (i: number) => void }) {
  const { Task } = spec;
  const textures = useTextures();
  return (
    <TextureContext.Provider value={textures.value}>
      <Textures {...textures.ids} />
      <ol className="ps-answers">
        {tasks.map((t, i) => (
          <li key={i} className={`ps-answer${onTick ? ' ps-answer--tick' : ''}${ticked?.[i] ? ' is-ticked' : ''}`}>
            <span className="ps-num">{i + 1}.</span>
            {onTick && (
              <button type="button" className="ps-answer__tick" aria-pressed={!!ticked?.[i]} aria-label={`${i + 1}. feladat ellenőrizve`} onClick={() => onTick(i)}>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </button>
            )}
            <Task task={t} answers />
          </li>
        ))}
      </ol>
    </TextureContext.Provider>
  );
}
