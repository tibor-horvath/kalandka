import { RoundFlower, SmallPot } from '../../art';
import { POTS_LEVELS, POTS_SHEET_LEVELS, boxSize, buildPotsRound, potCells, type PotsRound } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { At, Choices, Pic, roundOf, spec } from '../../../../print/sheet';
import { pickGrid, NumberCard } from '../../printKit';

// Cserépbarátok on paper.

export const pots = spec<PotsRound>({
  id: 'pots',
  rev: 3,
  levels: POTS_LEVELS.slice(0, POTS_SHEET_LEVELS).map((l) => l.name),
  // Letakarva has no sheet, as paper cannot hide the box: it prints the ten friends in a row, the same task in sight.
  current: (p) => {
    const level = ladderOf(p, 'pots').level;
    return level < POTS_SHEET_LEVELS ? level : 1;
  },
  grid: (level, d) =>
    POTS_LEVELS[level].total === 5 ? pickGrid(d, [2, 4], [2, 5], [3, 7]) : POTS_LEVELS[level].total > 10 ? pickGrid(d, [1, 3], [1, 4], [2, 4]) : pickGrid(d, [2, 3], [2, 4], [3, 5]),
  ask: () => 'Rajzolj virágot minden üres cserépbe! Hány virág kellett? Karikázd be!',
  tip: (level) => {
    const { total, totals } = POTS_LEVELS[level];
    if (totals) return 'Hatos–kilences barátok: például 4 meg 3 a 7. Először nézzék meg, hány cserép van, aztán számolják meg együtt az üreseket.';
    if (total === 5) return 'Ötös barátok: például 3 meg 2 az 5. Számolják meg együtt az üres cserepeket.';
    if (total > 10) return 'Húszas barátok: például 14 meg 6 a 20. Az első tízes keret tele van: elég a másodikban megszámolni az üres cserepeket.';
    return 'Tízes barátok: például 4 meg 6 a 10. Számolják meg együtt az üres cserepeket.';
  },

  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildPotsRound(roundOf(req, i), req.level)),
  Task: ({ task: r, answers }) => {
    const box = boxSize(r.total);
    const cw = 170;
    const choicesW = 3 * cw + 2 * 24;
    return (
      <Pic w={box.width} h={box.height + 150}>
        {potCells(r.total).map((c, i) => (
          <g key={i}>
            {(r.filled[i] || answers) && (
              <g opacity={r.filled[i] ? 1 : 0.5}>
                <At x={c.x - 36} y={c.y - 72}>
                  <RoundFlower petal={r.filled[i] ? r.petal : r.friendPetal} width={72} />
                </At>
              </g>
            )}
            <At x={c.x - 50} y={c.y + 6}>
              <SmallPot width={100} />
            </At>
          </g>
        ))}
        <Choices x={(box.width - choicesW) / 2} y={box.height + 20} w={cw} h={124} gap={24} pick={r.choices.indexOf(r.need)} answers={answers}>
          {r.choices.map((n) => (
            <g key={n}>{NumberCard(n, cw, 124, r.level.dotChoices)}</g>
          ))}
        </Choices>
      </Pic>
    );
  }
});
