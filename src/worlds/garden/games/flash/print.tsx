import { Seed } from '../../art';
import { FIELD_H, FIELD_W, LEVELS as FLASH_LEVELS, buildFlashRound, type FlashRound } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { At, Choices, Pic, roundOf, spec } from '../../../../print/sheet';
import { pickGrid, NumberCard } from '../../printKit';

// Villámszem on paper.

export const flash = spec<FlashRound>({
  id: 'flash',
  rev: 2,
  levels: FLASH_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'flash').level,
  grid: (_, d) => pickGrid(d, [2, 4], [3, 4], [4, 5]),
  ask: () => 'Hány magot látsz? Karikázd be a számot!',
  tip: () => 'Játszhatják villantósan is: mutassa meg a képet három másodpercig, aztán takarja le a kezével, és kérdezze meg, hány magot látott.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildFlashRound(roundOf(req, i), req.level)),
  Task: ({ task, answers }) => (
    <Pic w={FIELD_W} h={FIELD_H + 150}>
      <rect x="2" y="2" width={FIELD_W - 4} height={FIELD_H - 4} rx="24" fill="#F7F1E8" stroke="#E6D6C2" strokeWidth="3" />
      {task.seeds.map((s, i) => (
        <At key={i} x={s.x} y={s.y} r={s.rot}>
          <At x={-36} y={-36}>
            <Seed size={72} />
          </At>
        </At>
      ))}
      <Choices x={15} y={FIELD_H + 20} w={180} h={124} gap={15} pick={task.choices.indexOf(task.count)} answers={answers}>
        {task.choices.map((n) => (
          <g key={n}>{NumberCard(n, 180, 124, task.level.dotChoices)}</g>
        ))}
      </Choices>
    </Pic>
  )
});
