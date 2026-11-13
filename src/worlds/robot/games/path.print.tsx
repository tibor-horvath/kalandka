import type { ReactNode } from 'react';
import { Battery, Crate, Rover } from '../art';
import { CMD_LABELS, PATH_LEVELS, buildPuzzle, routeCells, type Cmd, type Course, type Puzzle } from './path';
import { ladderOf } from '../../../state/ladder';
import { ANSWER, At, FAINT, INK, LINE, Pic, roundOf, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';

// Robotút on paper.

export const CELL = 100;
const ARROW_TURN: Partial<Record<Cmd, number>> = { up: 0, right: 90, down: 180, left: 270, fwd: 0 };

/** A program card's picture in a 24 × 24 box, drawn like the app's cards. */
export function CmdGlyph({ cmd, color = INK }: { cmd: Cmd; color?: string }) {
  const props = { fill: 'none', stroke: color, strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (cmd === 'turnL' || cmd === 'turnR') {
    return (
      <g transform={cmd === 'turnR' ? 'translate(24 0) scale(-1 1)' : undefined}>
        <path d="M17 20 V12 a5 5 0 0 0 -5 -5 H6" {...props} />
        <path d="M10 3 L6 7 L10 11" {...props} />
      </g>
    );
  }
  return (
    <g transform={`rotate(${ARROW_TURN[cmd]} 12 12)`}>
      <path d="M12 20 V5" {...props} />
      <path d="M6 11 L12 5 L18 11" {...props} />
      {cmd === 'fwd' && <path d="M8 20 H16" {...props} />}
    </g>
  );
}

/** The cards a child draws into the program boxes, shown beside the instruction. */
export function CmdLegend({ cmds }: { cmds: Cmd[] }) {
  return (
    <>
      {cmds.map((c) => (
        <span key={c} className="ps-legend__item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <CmdGlyph cmd={c} />
          </svg>
          {CMD_LABELS[c]}
        </span>
      ))}
    </>
  );
}

/** The floor with its crates and battery; `children` go under the robot. */
export function FloorPic({ p, children }: { p: Course; children?: ReactNode }) {
  return (
    <>
      {Array.from({ length: p.cols * p.rows }, (_, i) => (
        <rect key={i} x={(i % p.cols) * CELL + 2} y={Math.floor(i / p.cols) * CELL + 2} width={CELL - 4} height={CELL - 4} rx="12" fill="#F4F7FA" stroke={LINE} strokeWidth="3" />
      ))}
      {p.crates.map((c, i) => (
        <At key={i} x={c.x * CELL} y={c.y * CELL}>
          <Crate />
        </At>
      ))}
      {p.goals.map((g, i) => (
        <At key={i} x={g.x * CELL} y={g.y * CELL}>
          <Battery />
        </At>
      ))}
      {children}
      <At x={p.start.x * CELL + 50} y={p.start.y * CELL + 50} r={p.start.dir * 90}>
        <At x={-50} y={-50}>
          <Rover />
        </At>
      </At>
    </>
  );
}

export const path = spec<Puzzle>({
  id: 'path',
  rev: 1,
  levels: PATH_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'path').level,
  grid: (level, d) => {
    const l = PATH_LEVELS[level];
    if (l.mode === 'step') return pickGrid(d, [2, 2], [2, 3], [3, 4]);
    return l.cols * l.rows > 20 ? pickGrid(d, [1, 2], [2, 2], [2, 3]) : pickGrid(d, [2, 2], [2, 3], [3, 3]);
  },
  ask: (level) => {
    const l = PATH_LEVELS[level];
    if (l.mode === 'step') return 'Rajzold be az utat a robottól az elemig! A dobozokon nem tud átmenni.';
    const two = l.batteries === 2 ? ' Mindkét elemet szedje fel!' : '';
    const repeat = l.repeat ? ' Ha egy kártya többször ismétlődik, írd mellé, hányszor!' : '';
    const turn = l.moves === 'relative' ? ' A robot arra néz, amerre a szeme.' : '';
    return `Rajzold be az utat, aztán rajzold a kártyákra, merre menjen a robot!${turn}${two}${repeat}`;
  },
  tip: () => 'Lépjenek végig együtt az ujjukkal a rácson. Ha elakad, kezdje újra a robottól: a javítás is a játék része.',
  others: (level) => {
    const l = PATH_LEVELS[level];
    const goal = l.batteries === 2 ? 'mindkét elemet felszedi' : 'eljut az elemhez';
    const cards = l.mode === 'plan' ? ', és a kártyák kiférnek a helyekre' : '';
    return `A rajzolt út a legrövidebb, de minden út jó, amelyen a robot nem megy át dobozon, és ${goal}${cards}. Lépjenek végig rajta együtt.`;
  },
  legend: (level) => {
    const l = PATH_LEVELS[level];
    if (l.mode === 'step') return null;
    return <CmdLegend cmds={l.moves === 'relative' ? ['fwd', 'turnL', 'turnR'] : ['up', 'down', 'left', 'right']} />;
  },
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildPuzzle(req.level, roundOf(req, i))),
  Task: ({ task: p, answers }) => {
    const plan = p.level.mode === 'plan';
    const slots = plan ? p.level.slots : 0;
    const perRow = Math.max(4, p.cols);
    const cardW = (p.cols * CELL) / perRow;
    const cardRows = Math.ceil(slots / perRow);
    const h = p.rows * CELL + (plan ? 24 + cardRows * cardW : 0);
    const route = routeCells(p, p.solution);
    return (
      <Pic w={p.cols * CELL} h={h}>
        <FloorPic p={p}>
          {answers && (
            <polyline points={route.map((c) => `${c.x * CELL + 50},${c.y * CELL + 50}`).join(' ')} fill="none" stroke={ANSWER} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 16" />
          )}
        </FloorPic>
        {Array.from({ length: slots }, (_, i) => {
          const x = (i % perRow) * cardW;
          const y = p.rows * CELL + 24 + Math.floor(i / perRow) * cardW;
          const card = answers ? p.solution[i] : undefined;
          return (
            <g key={i}>
              <rect x={x + 5} y={y + 5} width={cardW - 10} height={cardW - 10} rx="12" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
              {card && (
                <At x={x + cardW * 0.18} y={y + cardW * 0.14} s={(cardW * 0.6) / 24}>
                  <CmdGlyph cmd={card.cmd} color={ANSWER} />
                </At>
              )}
              {p.level.repeat && (
                <g>
                  <circle cx={x + cardW - 20} cy={y + cardW - 20} r="19" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
                  <text x={x + cardW - 20} y={y + cardW - 12} textAnchor="middle" fontSize="22" fontWeight="800" fill={card && card.times > 1 ? ANSWER : FAINT}>
                    {card && card.times > 1 ? card.times : '×'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </Pic>
    );
  }
});
