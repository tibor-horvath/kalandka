import { FIX_LEVELS, buildFixRound, type FixTask } from './fix';
import type { Cmd } from './path';
import { ladderOf } from '../../../state/ladder';
import { ANSWER, At, Cross, FAINT, Gap, INK, Pic, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';
import { CELL, CmdGlyph, CmdLegend, FloorPic } from './path.print';

// Hibavadász on paper.

/** A square program card: its arrow or turn, and its number where the number is the question. */
function FixCard({ x, y, size, cmd, times, color = INK }: { x: number; y: number; size: number; cmd: Cmd; times?: number; color?: string }) {
  return (
    <g>
      <rect x={x + 5} y={y + 5} width={size - 10} height={size - 10} rx="12" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      <At x={x + size * 0.18} y={y + size * 0.14} s={(size * 0.6) / 24}>
        <CmdGlyph cmd={cmd} color={color} />
      </At>
      {times !== undefined && (
        <text x={x + size - 24} y={y + size - 14} textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>
          ×{times}
        </text>
      )}
    </g>
  );
}

function FixBoard({ task, answers }: { task: FixTask; answers: boolean }) {
  const { course, level, program, bugs } = task;
  const perRow = Math.max(4, course.cols);
  const size = (course.cols * CELL) / perRow;
  // A card to swap has a box under it for the right one; a card too many only needs crossing out.
  const rowH = size * (level.kind === 'extra' ? 1 : 2);
  const rows = Math.ceil(program.length / perRow);
  const top = course.rows * CELL + 24;
  return (
    <Pic w={course.cols * CELL} h={top + rows * rowH}>
      <FloorPic p={course}>
        {level.dots && task.route.slice(1).map((c, i) => <circle key={i} cx={c.x * CELL + 50} cy={c.y * CELL + 50} r="11" fill={FAINT} />)}
      </FloorPic>
      {program.map((card, i) => {
        const x = (i % perRow) * size;
        const y = top + Math.floor(i / perRow) * rowH;
        const bug = bugs.find((b) => b.at === i);
        return (
          <g key={i}>
            <FixCard x={x} y={y} size={size} cmd={card.cmd} times={level.kind === 'times' ? card.times : undefined} />
            {level.kind !== 'extra' && <Gap x={x + 4} y={y + size + 4} w={size - 8} h={size - 8} />}
            {answers && bug && <Cross x={x + size / 2} y={y + size / 2} size={size * 0.7} />}
            {answers && bug?.want && <FixCard x={x} y={y + size} size={size} cmd={bug.want.cmd} times={level.kind === 'times' ? bug.want.times : undefined} color={ANSWER} />}
          </g>
        );
      })}
    </Pic>
  );
}

export const fix = spec<FixTask>({
  id: 'fix',
  rev: 1,
  levels: FIX_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'fix').level,
  grid: (level, d) => {
    const l = FIX_LEVELS[level];
    return l.cols * l.rows > 16 ? pickGrid(d, [1, 2], [2, 2], [2, 3]) : pickGrid(d, [2, 1], [2, 2], [3, 2]);
  },
  ask: (level) => {
    const l = FIX_LEVELS[level];
    if (l.kind === 'extra') return 'Kövesd ujjal a kártyákat! Melyik kártya nem kell? Húzd át!';
    if (l.kind === 'times') return 'Kövesd ujjal a kártyákat! Melyiken rossz a szám? Húzd át, és írd alá a jót!';
    if (l.kind === 'two') return 'Két kártya hibás! Húzd át mindkettőt, és rajzold alájuk a jót!';
    return 'Kövesd ujjal a kártyákat! Melyik hibás? Húzd át, és rajzold alá a jót!';
  },
  tip: (level) => {
    const l = FIX_LEVELS[level];
    if (l.dots) return 'A pöttyök a jó utat mutatják. Lépjenek végig az ujjukkal kártyáról kártyára: ahol letér a pöttyökről, ott a hiba.';
    if (l.moves === 'relative') return 'A robot arra megy, amerre néz. Forgassák a lapot a robottal együtt, vagy fordítsanak egy tárgyat az asztalon.';
    if (l.kind === 'times') return 'A szám azt mutatja, hányat lép a robot arra. Számolják hangosan a lépéseket.';
    return 'Lépjenek végig az ujjukkal kártyáról kártyára, és mondják ki, hová ér a robot: ahol elromlik, ott a hiba.';
  },
  legend: (level) => <CmdLegend cmds={FIX_LEVELS[level].moves === 'relative' ? ['fwd', 'turnL', 'turnR'] : ['up', 'down', 'left', 'right']} />,
  tasks: (req) => flatTasks(req, (r) => buildFixRound(req.level, r).tasks),
  Task: ({ task, answers }) => <FixBoard task={task} answers={answers} />
});
