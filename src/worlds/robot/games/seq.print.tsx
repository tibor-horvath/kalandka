import { ArrowTile, BlockStack, SortPart } from '../art';
import { SEQ_LEVELS, buildSeqRound, sameItem, type Item, type SeqTask } from './seq';
import { ladderOf } from '../../../state/ladder';
import { At, Choices, Cross, Gap, Pic, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';

// Mintagép on paper.

const STEP = 108;

function SeqItem({ item }: { item: Item }) {
  if (item.kind === 'part') return <SortPart part={{ color: item.color, shape: item.shape, size: 'big' }} textured />;
  if (item.kind === 'arrow') return <ArrowTile dir={item.dir} color={item.color} textured />;
  return <BlockStack n={item.n} />;
}

export const seq = spec<SeqTask>({
  id: 'seq',
  rev: 1,
  // Towers are one colour; every other row has coloured parts or arrows.
  colorKey: (level) => SEQ_LEVELS[level].kind !== 'grow',
  levels: SEQ_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'seq').level,
  grid: (level, d) => (SEQ_LEVELS[level].kind === 'grow' ? pickGrid(d, [1, 4], [1, 5], [1, 7]) : SEQ_LEVELS[level].kind === 'translate' ? pickGrid(d, [1, 4], [1, 5], [1, 7]) : pickGrid(d, [1, 6], [1, 8], [1, 10])),
  ask: (level) => {
    const kind = SEQ_LEVELS[level].kind;
    if (kind === 'fix') return 'Húzd át, ami nem illik a sorba, és karikázd be, mi kellene a helyére!';
    if (kind === 'translate') return 'A színes sor nyilakkal is ugyanaz. Karikázd be, melyik nyíl jön!';
    return 'Mi jön a helyére? Karikázd be!';
  },
  tip: (level) => {
    switch (SEQ_LEVELS[level].kind) {
      case 'grow':
        return 'Számolják meg a kockákat minden toronyban: mennyivel magasabb a következő?';
      case 'turn':
        return 'Kövessék az ujjukkal, merre fordul a nyíl egyik lépésről a másikra.';
      case 'fix':
        return 'Mondják ki együtt hangosan a sort, elemről elemre: ahol megbicsaklik, ott van a hiba.';
      case 'translate':
        return 'Keressék meg együtt, melyik színnek melyik nyíl felel meg.';
      default:
        return 'Mondják ki együtt hangosan a sort, elemről elemre: így hallani, mi jön a helyére.';
    }
  },
  tasks: (req) => flatTasks(req, (r) => buildSeqRound(req.level, r).tasks),
  Task: ({ task, answers }) => {
    const tall = task.row.some((i) => i.kind === 'stack') || task.choices.some((i) => i.kind === 'stack');
    const ih = tall ? 200 : 100;
    const top = task.ref ? 130 : 0;
    const slots = task.mode === 'next' ? task.row.length + 1 : task.row.length;
    const width = Math.max(task.ref?.length ?? 0, slots) * STEP + 50 + 3 * STEP;
    const choicesX = width - 3 * STEP;
    const gapX = task.row.length * STEP;
    return (
      <Pic w={width} h={top + ih + 24}>
        {task.ref?.map((it, i) => (
          <At key={i} x={i * STEP} y={10}>
            <SeqItem item={it} />
          </At>
        ))}
        <rect x="0" y={top + ih + 6} width={slots * STEP} height="14" rx="7" fill="#C8D3DE" />
        {task.row.map((it, i) => (
          <g key={i}>
            <At x={i * STEP} y={top}>
              <SeqItem item={it} />
            </At>
            {answers && task.mode === 'fix' && i === task.wrong && <Cross x={i * STEP + 50} y={top + ih / 2} size={80} />}
          </g>
        ))}
        {task.mode === 'next' && (
          <g>
            <Gap x={gapX} y={top} w={100} h={ih} />
            {answers && (
              <g opacity="0.45">
                <At x={gapX} y={top}>
                  <SeqItem item={task.answer} />
                </At>
              </g>
            )}
          </g>
        )}
        <Choices x={choicesX} y={top} w={100} h={ih} gap={STEP - 100} pick={task.choices.findIndex((c) => sameItem(c, task.answer))} answers={answers}>
          {task.choices.map((c, i) => (
            <SeqItem key={i} item={c} />
          ))}
        </Choices>
      </Pic>
    );
  }
});
