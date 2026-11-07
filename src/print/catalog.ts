import { GARDEN_SHEETS } from '../worlds/garden/print';
import { pageKey, type PageRef, type ReadLink } from './link';
import { readJson, removeKeys, writeKey } from '../lib/storage';
import { ROBOT_SHEETS } from '../worlds/robot/print';
import { MAX_PAGES, type Density, type Grid, type PrintId, type PrintSpec } from './sheet';

/** Every game's sheet, in the order the games stand in the parents' corner. */
export const PRINT_SHEETS: PrintSpec<unknown>[] = [...GARDEN_SHEETS, ...ROBOT_SHEETS];

export { MAX_PAGES } from './sheet';

export interface PrintChoice {
  level: number;
  density: Density;
  pages: number;
  /** Which set of tasks: kept, so the answers on the tablet match the sheet that was printed. */
  batch: number;
}

export function sheetFor(id: PrintId): PrintSpec<unknown> {
  return PRINT_SHEETS.find((s) => s.id === id)!;
}

export function tasksPerPage(s: PrintSpec<unknown>, level: number, density: Density): number {
  const [cols, rows] = s.grid(level, density);
  return cols * rows;
}

export function buildPages(s: PrintSpec<unknown>, c: PrintChoice): { grid: Grid; tasks: unknown[] }[] {
  const grid = s.grid(c.level, c.density);
  const count = grid[0] * grid[1];
  return Array.from({ length: c.pages }, (_, page) => ({ grid, tasks: s.tasks({ level: c.level, batch: c.batch, page, count, density: c.density }) }));
}

/** The link printed on page `page` (from 0) of a printout. */
export function pageRef(s: PrintSpec<unknown>, c: PrintChoice, page: number): PageRef {
  return { id: s.id, rev: s.rev, level: c.level, density: c.density, batch: c.batch, page };
}

/**
 * The printout to show when a sheet opens: once every page of `c` is marked done, the next batch,
 * so the child gets new tasks without "Új feladatok" and the new pages count again. `done` is `Progress.pagesDone`.
 */
export function nextPrintout(s: PrintSpec<unknown>, c: PrintChoice, done: string[]): PrintChoice {
  const finished = (x: PrintChoice) => Array.from({ length: x.pages }, (_, i) => pageKey(pageRef(s, x, i))).every((k) => done.includes(k));
  let next = c;
  while (finished(next)) next = { ...next, batch: next.batch + 1 };
  return next;
}

export type OpenedLink = { kind: 'page'; spec: PrintSpec<unknown>; ref: PageRef; tasks: unknown[] } | { kind: 'older' } | { kind: 'newer' } | { kind: 'bad' };

/** What a link's address opens. Tasks only ever come back for the revision they were printed from: wrong answers are worse than none. */
export function openLink(link: ReadLink): OpenedLink {
  if (link.kind !== 'page') return link;
  const { ref } = link;
  const s = PRINT_SHEETS.find((p) => p.id === ref.id);
  if (!s || ref.level >= s.levels.length || ref.page >= MAX_PAGES) return { kind: 'bad' };
  if (ref.rev > s.rev) return { kind: 'newer' };
  if (ref.rev < s.rev) return { kind: 'older' };
  const pages = buildPages(s, { level: ref.level, density: ref.density, pages: ref.page + 1, batch: ref.batch });
  return { kind: 'page', spec: s, ref, tasks: pages[ref.page].tasks };
}

// The last choice per child and game stays on this device, so parents can check a sheet against the answers later.
const KEY = 'kalandka-print';

type Saved = Record<string, Partial<Record<PrintId, PrintChoice>>>;

function readAll(): Saved {
  return readJson<Saved>(KEY) as Saved;
}

/** Forgets every child's last choices, with the profiles they belong to. */
export function forgetChoices(): void {
  removeKeys(KEY);
}

export function savedChoice(kidId: string, id: PrintId): PrintChoice | null {
  const c = readAll()[kidId]?.[id];
  const s = sheetFor(id);
  if (!c || typeof c.batch !== 'number' || !(c.level >= 0 && c.level < s.levels.length)) return null;
  return { level: c.level, density: ['big', 'normal', 'many'].includes(c.density) ? c.density : 'normal', pages: Math.min(MAX_PAGES, Math.max(1, c.pages || 1)), batch: c.batch };
}

export function saveChoice(kidId: string, id: PrintId, c: PrintChoice): void {
  const all = readAll();
  // Private mode or full storage: the sheet still prints, only the answers will not be remembered.
  writeKey(KEY, JSON.stringify({ ...all, [kidId]: { ...all[kidId], [id]: c } }));
}
