import { rng } from '../lib/rng';
import type { Progress } from '../state/progress';
import { WORLDS, type WorldId } from '../state/worlds';
import { mixIdOf, type Density, type Grid, type PrintId, type PrintSpec, type TaskRequest } from './sheet';

// Vegyes kör on paper: one sheet per world whose tasks come from that world's games, each in a cell of its own
// with its game's name and question above it, so the grown-up reads each one out. Its levels are stages across
// the games' own sheet levels. Like Vegyes kör in the app it is practice: a page counts and pays as any other,
// but it never moves a game's level (see pageLadder in state/stickers.ts).

/** The stages, easiest first: each takes its share of every game's sheet levels. */
export const MIX_STAGES = ['Első lépések', 'Haladó', 'Ügyes', 'Mester'];

/** One task of a mixed page: which game's sheet, on which of its levels, and the game's own task. */
export interface MixTask {
  id: PrintId;
  level: number;
  task: unknown;
}

/** A game's sheet levels on stage `stage`: an even share of them, at least one. */
export function stageLevels(levels: number, stage: number): number[] {
  const lo = Math.min(levels - 1, Math.floor((stage * levels) / MIX_STAGES.length));
  const hi = Math.max(lo, Math.floor(((stage + 1) * levels) / MIX_STAGES.length) - 1);
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
}

const GRIDS: Record<Density, Grid> = { big: [2, 2], normal: [2, 3], many: [3, 3] };

/** The world's Vegyes kör sheet, mixing these games' sheets (Számmagok walks its own order and stays out). */
export function mixSheet(world: WorldId, games: PrintSpec<unknown>[]): PrintSpec<unknown> {
  const sheets = games.filter((s) => s.world === world && s.id !== 'learn');
  const byId = (id: PrintId) => sheets.find((s) => s.id === id)!;

  const tasks = (req: TaskRequest): MixTask[] => {
    const r = rng(req.batch * 7919 + req.page * 131 + req.level * 17 + 1);
    // Every game once before any comes again, in a new order each pass and never the same game twice in a row.
    const order: PrintSpec<unknown>[] = [];
    while (order.length < req.count) {
      const pass = [...sheets];
      for (let i = pass.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [pass[i], pass[j]] = [pass[j], pass[i]];
      }
      if (pass.length > 1 && pass[0] === order[order.length - 1]) pass.push(pass.shift()!);
      order.push(...pass);
    }
    return order.slice(0, req.count).map((s, i) => {
      const levels = stageLevels(s.levels.length, req.level);
      const level = levels[Math.floor(r() * levels.length)];
      // One task of the game's own sheet, from a page of its own so no two cells repeat a task.
      const [task] = s.tasks({ level, batch: req.batch, page: req.page * req.count + i, count: 1, density: 'normal' });
      return { id: s.id, level, task };
    });
  };

  function Task({ task: t, answers }: { task: MixTask; answers: boolean }) {
    const s = byId(t.id);
    const { Task: Own } = s;
    return (
      <div className="ps-mix">
        <p className="ps-mix__ask">
          <b>{s.game}:</b> {s.ask(t.level)}
        </p>
        <div className="ps-mix__pic">
          <Own task={t.task} answers={answers} />
        </div>
      </div>
    );
  }

  const name = WORLDS.find((w) => w.id === world)!.name;
  const spec: PrintSpec<MixTask> = {
    id: mixIdOf(world),
    // Its tasks are its games' tasks: it moves on whenever one of theirs does, so an old page never shows other answers.
    rev: 1 + sheets.reduce((sum, s) => sum + s.rev - 1, 0),
    world,
    game: 'Vegyes kör',
    levels: MIX_STAGES,
    // The stage nearest to where the child stands in the world's games on average.
    current: (p: Progress) => {
      const share = sheets.reduce((sum, s) => sum + (s.levels.length > 1 ? s.current(p) / (s.levels.length - 1) : 0), 0) / sheets.length;
      return Math.min(MIX_STAGES.length - 1, Math.floor(share * MIX_STAGES.length));
    },
    grid: (_level, density) => GRIDS[density],
    ask: () => `Minden feladat a ${name} egy másik játékából jön. Olvasd fel a feladat fölötti kérdést!`,
    tip: () => 'Vegyes lap: a játékok feladatai keverve, a választott fokon. A kész lap jutalmat ad, de a játékok szintjét nem lépteti.',
    colorKey: () => world === 'robot',
    tasks,
    Task
  };
  return spec as unknown as PrintSpec<unknown>;
}
