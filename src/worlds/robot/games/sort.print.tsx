import { BinSign, SortPart } from '../art';
import { SORT_LEVELS, binFor, buildRound as buildSortRound, isOdd, type OddRow, type SortRound } from './sort';
import { ladderOf } from '../../../state/ladder';
import { ANSWER, At, Pic, Ring, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';

// Válogatógép on paper.

type SortTask = { kind: 'sort'; round: SortRound } | { kind: 'odd'; row: OddRow };

const BIN_W = 260;
const BIN_GAP = 60;

function SortBoard({ r, answers }: { r: SortRound; answers: boolean }) {
  const belt = r.parts.slice(r.preset);
  const step = 1000 / belt.length;
  const binsW = r.bins.length * BIN_W + (r.bins.length - 1) * BIN_GAP;
  const binX = (i: number) => (1000 - binsW) / 2 + i * (BIN_W + BIN_GAP);
  const hidden = !!r.level.hidden;
  return (
    <Pic w={1000} h={400}>
      {belt.map((p, i) => (
        <At key={i} x={i * step + step / 2 - 45} y={10} s={0.9}>
          <SortPart part={p} textured />
        </At>
      ))}
      {r.bins.map((b, i) => {
        const x = binX(i);
        const example = r.parts.slice(0, r.preset).find((p) => binFor(r.bins, p) === i);
        return (
          <g key={i}>
            <path d={`M${x} 250 H${x + BIN_W} L${x + BIN_W - 24} 392 H${x + 24} Z`} fill="#F3E3D0" stroke="#8A5A3B" strokeWidth="5" strokeLinejoin="round" />
            <rect x={x + BIN_W / 2 - 46} y={276} width="92" height="92" rx="14" fill="#FFFFFF" stroke="#C9A27C" strokeWidth="3" />
            <At x={x + BIN_W / 2 - 40} y={282}>
              <BinSign match={b.match} hidden={hidden} size={80} textured />
            </At>
            {example && (
              <At x={x + 14} y={300} s={0.6}>
                <SortPart part={example} textured />
              </At>
            )}
          </g>
        );
      })}
      {answers &&
        belt.map((p, i) => {
          const b = binFor(r.bins, p);
          return <line key={i} x1={i * step + step / 2} y1={112} x2={binX(b) + BIN_W / 2} y2={250} stroke={ANSWER} strokeWidth="6" strokeLinecap="round" />;
        })}
    </Pic>
  );
}

export const sort = spec<SortTask>({
  id: 'sort',
  rev: 1,
  colorKey: () => true,
  levels: SORT_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'sort').level,
  grid: (level, d) => (SORT_LEVELS[level].mode === 'odd' ? pickGrid(d, [2, 5], [2, 7], [3, 9]) : pickGrid(d, [1, 2], [1, 3], [2, 4])),
  ask: (level) => {
    const l = SORT_LEVELS[level];
    if (l.mode === 'odd') return 'Melyik más, mint a többi? Karikázd be!';
    if (l.hidden) return 'Nézd meg, mi van már a dobozokban! Kösd a többi alkatrészt is a jó dobozhoz!';
    return 'Kösd össze minden alkatrészt a dobozával!';
  },
  tip: (level) => {
    const l = SORT_LEVELS[level];
    if (l.mode === 'odd') return 'Kérdezze meg: miben más ez az egy, mint a többi három? A színében, a formájában vagy a méretében?';
    if (l.hidden) return 'Hasonlítsák össze a két dobozban lévő alkatrészt: miben különböznek? Ez a szabály.';
    return 'Kérdezze meg minden alkatrésznél: milyen a színe, a formája, a mérete? Melyik dobozon van ugyanez?';
  },
  tasks: (req) =>
    flatTasks(req, (r) => {
      const round = buildSortRound(req.level, r);
      return isOdd(round) ? round.rows.map((row): SortTask => ({ kind: 'odd', row })) : [{ kind: 'sort', round }];
    }),
  Task: ({ task, answers }) => {
    if (task.kind === 'sort') return <SortBoard r={task.round} answers={answers} />;
    return (
      <Pic w={470} h={120}>
        {task.row.parts.map((p, i) => (
          <g key={i}>
            <At x={i * 117 + 10} y={10}>
              <SortPart part={p} textured />
            </At>
            {answers && i === task.row.odd && <Ring x={i * 117 + 10} y={10} w={100} h={100} />}
          </g>
        ))}
      </Pic>
    );
  }
});
