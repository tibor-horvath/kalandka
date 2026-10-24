import { GARDEN_SHEETS } from './garden';
import { ROBOT_SHEETS } from './robot';
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

// The last choice per child and game stays on this device, so parents can check a sheet against the answers later.
const KEY = 'kalandka-print';

type Saved = Record<string, Partial<Record<PrintId, PrintChoice>>>;

function readAll(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Saved) : {};
  } catch {
    return {};
  }
}

/** Forgets every child's last choices, with the profiles they belong to. */
export function forgetChoices(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Blocked storage keeps nothing anyway.
  }
}

export function savedChoice(kidId: string, id: PrintId): PrintChoice | null {
  const c = readAll()[kidId]?.[id];
  const s = sheetFor(id);
  if (!c || typeof c.batch !== 'number' || !(c.level >= 0 && c.level < s.levels.length)) return null;
  return { level: c.level, density: ['big', 'normal', 'many'].includes(c.density) ? c.density : 'normal', pages: Math.min(MAX_PAGES, Math.max(1, c.pages || 1)), batch: c.batch };
}

export function saveChoice(kidId: string, id: PrintId, c: PrintChoice): void {
  try {
    const all = readAll();
    all[kidId] = { ...all[kidId], [id]: c };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode or full storage: the sheet still prints, only the answers will not be remembered.
  }
}
