import { Lamp, LampGrid, MIRROR_GLASS } from '../art';
import { MIRROR_LEVELS, buildMirrorRound, type MirrorTask } from './mirror';
import { ladderOf } from '../../../state/ladder';
import { At, Choices, Pic, Ring, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';
import { CELL } from './path.print';

// Tükörgép on paper.

function MirrorBoard({ task, answers }: { task: Exclude<MirrorTask, { mode: 'pick' }>; answers: boolean }) {
  const { rows, cols, axis } = task;
  const lit = new Map((task.mode === 'light' ? [...task.given, ...(answers ? task.targets : [])] : [...task.given, ...task.shown]).map((l) => [`${l.r},${l.c}`, l.color]));
  return (
    <Pic w={cols * CELL} h={rows * CELL}>
      <rect x="0" y="0" width={cols * CELL} height={rows * CELL} rx="16" fill="#F4F7FA" />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          <At key={i} x={c * CELL} y={r * CELL}>
            <Lamp color={lit.get(`${r},${c}`) ?? null} textured />
          </At>
        );
      })}
      {axis === 'v' ? (
        <rect x={(cols / 2) * CELL - 7} y="-6" width="14" height={rows * CELL + 12} rx="7" fill={MIRROR_GLASS} stroke="#5FA8C2" strokeWidth="3" />
      ) : (
        <rect x="-6" y={(rows / 2) * CELL - 7} width={cols * CELL + 12} height="14" rx="7" fill={MIRROR_GLASS} stroke="#5FA8C2" strokeWidth="3" />
      )}
      {answers && task.mode === 'fix' && <Ring x={task.fault.c * CELL + 10} y={task.fault.r * CELL + 10} w={80} h={80} />}
    </Pic>
  );
}

export const mirror = spec<MirrorTask>({
  id: 'mirror',
  rev: 1,
  // Only the coloured pictures ask for a colour; the other boards are one colour.
  colorKey: (level) => MIRROR_LEVELS[level].kind === 'paint' || MIRROR_LEVELS[level].kind === 'fix',
  levels: MIRROR_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'mirror').level,
  grid: (level, d) => {
    const kind = MIRROR_LEVELS[level].kind;
    if (kind === 'pick') return pickGrid(d, [1, 4], [1, 6], [2, 7]);
    if (kind === 'one' || kind === 'many') return pickGrid(d, [2, 3], [2, 4], [3, 5]);
    if (kind === 'flat') return pickGrid(d, [2, 2], [3, 2], [4, 3]);
    return pickGrid(d, [2, 2], [2, 3], [3, 4]);
  },
  ask: (level) => {
    const kind = MIRROR_LEVELS[level].kind;
    if (kind === 'pick') return 'Melyik a tükörképe? Karikázd be!';
    if (kind === 'fix') return 'A gép egy lámpát elrontott: egy hiányzik, vagy eggyel több világít. Karikázd be, hol!';
    if (kind === 'picture' || kind === 'paint') return 'Fejezd be a képet a tükör túloldalán! Színezd ki a lámpákat ugyanolyan színűre.';
    return 'Színezd ki a lámpák tükörképét a tükör túloldalán!';
  },
  tip: (level) =>
    MIRROR_LEVELS[level].kind === 'pick'
      ? 'Tegyenek egy kis kézitükröt az alakzat mellé: amit benne látnak, az a tükörkép.'
      : 'Számolják meg, hány lépésre van a lámpa a tükörtől: a tükörképe ugyanannyira van a túloldalon. Egy kis kézitükörrel ki is próbálhatják.',
  tasks: (req) => flatTasks(req, (r) => buildMirrorRound(req.level, r).tasks),
  Task: ({ task, answers }) => {
    if (task.mode !== 'pick') return <MirrorBoard task={task} answers={answers} />;
    const px = 300;
    return (
      <Pic w={1360} h={px}>
        <LampGrid cells={task.shape} size={task.size} color={task.color} px={px} textured />
        <rect x={px + 18} y="0" width="16" height={px} rx="8" fill={MIRROR_GLASS} stroke="#5FA8C2" strokeWidth="3" />
        <Choices x={px + 90} y={0} w={px} h={px} gap={20} pick={task.choices.findIndex((c) => c.kind === 'mirror')} answers={answers}>
          {task.choices.map((c, i) => (
            <At key={i} x={20} y={20}>
              <LampGrid cells={c.cells} size={task.size} color={task.color} px={px - 40} textured />
            </At>
          ))}
        </Choices>
      </Pic>
    );
  }
});
