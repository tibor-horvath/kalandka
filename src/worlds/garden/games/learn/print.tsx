import { LEARN_CYCLE, LEARN_MAX } from './logic';
import { rng } from '../../../../lib/rng';
import { digitShape, pathData } from '../trace/logic';
import { At, INK, MAX_PAGES, Pic, spec } from '../../../../print/sheet';
import { pickGrid, Dots } from '../../printKit';

// Számmagok on paper.

const LEARN_STARTS = [1, 6, 11, 16];

function SeedOutline({ x, y, rx, filled }: { x: number; y: number; rx: number; filled: boolean }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={rx * 1.33} fill={filled ? '#B77B45' : '#FFFFFF'} stroke="#8A5A2E" strokeWidth="3" />;
}

export const learn = spec<number>({
  id: 'learn',
  rev: 2,
  levels: ['1-től', '6-tól', '11-től', '16-tól', 'Vegyesen, 1–20'],
  // After 20 the game mixes the numbers it has met: so does the last sheet.
  current: (p) => (p.learnRound % LEARN_CYCLE >= LEARN_MAX ? LEARN_STARTS.length : LEARN_STARTS.filter((s) => (p.learnRound % LEARN_CYCLE) + 1 >= s).length - 1),
  grid: (_, d) => pickGrid(d, [1, 4], [1, 5], [1, 7]),
  ask: () => 'Nézd meg a számot, és színezz ki pont ennyi magot!',
  tip: (level) =>
    level === LEARN_STARTS.length
      ? 'A számok most összevissza jönnek. Mondják ki együtt a számot, és számolják meg hangosan a magokat, mindegyikre rábökve.'
      : 'Mondják ki együtt a számot, és számolják meg hangosan a magokat, mindegyikre rábökve.',
  others: () => 'Bármelyik magokat kiszínezheti, csak az számít, hogy pont annyi legyen.',
  // The numbers go in order, except on Vegyesen.
  reshuffles: (level) => level === LEARN_STARTS.length,
  tasks: (req) => {
    if (req.level === LEARN_STARTS.length) {
      // A fresh mix of 1–20 on every page, no number twice on one page.
      const rand = rng((req.batch * MAX_PAGES + req.page) * 13 + 5);
      const pool = Array.from({ length: LEARN_MAX }, (_, i) => i + 1);
      for (let k = pool.length - 1; k > 0; k--) {
        const j = Math.floor(rand() * (k + 1));
        [pool[k], pool[j]] = [pool[j], pool[k]];
      }
      return pool.slice(0, req.count);
    }
    const start = LEARN_STARTS[req.level];

    const span = 21 - start;
    return Array.from({ length: req.count }, (_, i) => start + ((req.page * req.count + i) % span));
  },
  Task: ({ task: n, answers }) => {
    const two = n > 10;
    return (
      <Pic w={1000} h={200}>
        {/* The child meets the number here, not writes it: printed solid, in the same shape as in Mézút. */}
        {[...String(n)].map((d, i, all) => (
          <At key={i} x={(all.length === 1 ? 63 : 0) + i * 126} y={6} s={0.63}>
            {digitShape(Number(d)).strokes.map((pts, k) => (
              <path key={k} d={pathData(pts)} fill="none" stroke={INK} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </At>
        ))}
        <Dots n={n} x={270} y={30} w={210} h={140} />
        {Array.from({ length: two ? 20 : 10 }, (_, k) => {
          const frame = Math.floor(k / 10);
          const i = k % 10;
          const x = two ? 525 + frame * 245 + (i % 5) * 47 : 545 + (i % 5) * 92;
          const y = 62 + Math.floor(i / 5) * 78;
          return <SeedOutline key={k} x={x} y={y} rx={two ? 16 : 24} filled={answers && k < n} />;
        })}
      </Pic>
    );
  }
});
