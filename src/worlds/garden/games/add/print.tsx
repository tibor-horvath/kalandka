import { Basket, Bouquet, Hive, RoundFlower } from '../../art';
import { ADD_LEVELS, BOX_W, RIGHT_X, SCENE_H, bedWidth, buildAddRound, hiveX, type AddItem, type AddRound } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { At, Choices, Cross, FONT, INK, Num, Pic, WriteBox, roundOf, spec } from '../../../../print/sheet';
import { pickGrid, paper, Dots, NumberCard } from '../../printKit';

// Méhkas on paper.

const DIGIT_FREE = (r: AddRound) => r.level.answers === 'dots';

export const add = spec<AddRound>({
  id: 'add',
  rev: 2,
  levels: ADD_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'add').level,
  grid: (level, d) => (ADD_LEVELS[level].bundles ? pickGrid(d, [1, 5], [2, 5], [2, 7]) : pickGrid(d, [2, 3], [2, 5], [3, 6])),
  ask: (level) => {
    const l = ADD_LEVELS[level];
    const how = l.answers === 'digits' ? 'Írd be a dobozba!' : 'Karikázd be!';
    if (l.strategy === 'take') return `A kaptár mellett látod, hány virágot visz el a méhecske. Húzz át ennyit! Hány maradt? ${how}`;
    return `Hány virág van összesen? ${how}`;
  },
  tip: (level) => {
    const l = ADD_LEVELS[level];
    const count = l.strategy === 'on' ? 'A kosáron álló számtól számoljanak tovább, minden virágra rábökve.' : 'Számolhatnak ujjal: minden virágra rá lehet bökni.';
    return l.bundles ? `${count} Egy csokor tíz virág.` : count;
  },
  others: (level) => (ADD_LEVELS[level].strategy === 'take' ? 'Bármelyik virágokat áthúzhatja, csak az számít, hogy annyit, amennyit a méhecske elvisz.' : null),
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildAddRound(roundOf(req, i), req.level)),
  Task: ({ task: r, answers }) => {
    const take = r.level.strategy === 'take';
    const wide = take && r.level.bundles;
    // On paper the second bed (or the hive) moves closer, so the flowers can be drawn bigger.
    const shift = wide ? -40 : -150;
    const xOf = (it: AddItem) => (it.group === 'b' ? it.x + shift : it.x);
    const hive = hiveX(r) + shift;
    const right = Math.max(...r.items.map((it) => xOf(it) + 50), take ? hive + 90 : RIGHT_X + shift + BOX_W);
    const w = Math.max(right, 760);
    const cx = w / 2;
    // The flowers the bee carries away on the take levels: whole bouquets first, then loose flowers from the end.
    const tens = r.items.filter((i) => i.kind === 'ten');
    const ones = r.items.filter((i) => i.kind === 'one');
    const crossed = take && Math.floor(r.b / 10) <= tens.length && r.b % 10 <= ones.length ? [...tens.slice(tens.length - Math.floor(r.b / 10)), ...ones.slice(ones.length - (r.b % 10))] : [];
    const eqY = SCENE_H + 20;
    const sum = `${r.a} ${take ? '−' : '+'} ${r.b} =`;
    const petal = (it: AddItem) => paper(it.group === 'a' ? r.petalA : r.petalB);
    return (
      <Pic w={w} h={SCENE_H + 140}>
        <rect x="4" y="4" width={bedWidth(r) - 8} height={SCENE_H - 8} rx="24" fill="#F1F8EA" stroke="#CFE6BC" strokeWidth="3" />
        {!take && <rect x={RIGHT_X + shift + 4} y="4" width={BOX_W - 8} height={SCENE_H - 8} rx="24" fill="#F1F8EA" stroke="#CFE6BC" strokeWidth="3" />}
        {r.level.strategy === 'on' && (
          <g>
            <At x={BOX_W / 2 - 95} y={20}>
              <Basket petal={paper(r.petalA)} count={r.a} />
            </At>
            <circle cx={BOX_W / 2} cy={205} r="34" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
            <Num x={BOX_W / 2} y={205} n={r.a} size={46} />
          </g>
        )}
        {r.items.map((it) => (
          <At key={it.id} x={xOf(it)} y={it.y}>
            {it.kind === 'ten' ? (
              <At x={-32} y={-46}>
                <Bouquet petal={petal(it)} width={64} />
              </At>
            ) : (
              <At x={-36} y={-39}>
                <RoundFlower petal={petal(it)} width={72} />
              </At>
            )}
          </At>
        ))}
        {answers && crossed.map((it) => <Cross key={it.id} x={xOf(it)} y={it.y} size={it.kind === 'ten' ? 60 : 50} />)}
        {take && (
          <g>
            <At x={hive - 55} y={20}>
              <Hive width={110} />
            </At>
            {DIGIT_FREE(r) ? <Dots n={r.b} x={hive - 80} y={125} w={160} h={100} /> : <Num x={hive} y={165} n={`−${r.b}`} size={70} />}
          </g>
        )}
        {DIGIT_FREE(r) ? (
          <Choices x={cx - (3 * 220 + 60) / 2} y={eqY} w={220} h={116} gap={30} pick={r.choices.indexOf(r.answer)} answers={answers}>
            {r.choices.map((n) => (
              <Dots key={n} n={n} x={15} y={12} w={190} h={92} />
            ))}
          </Choices>
        ) : r.level.answers === 'both' ? (
          <g>
            <text x={cx - 130} y={eqY + 80} textAnchor="end" fontFamily={FONT} fontSize="72" fontWeight="800" fill={INK}>
              {sum}
            </text>
            <Choices x={cx - 105} y={eqY} w={150} h={116} gap={20} pick={r.choices.indexOf(r.answer)} answers={answers}>
              {r.choices.map((n) => (
                <g key={n}>{NumberCard(n, 150, 116, true)}</g>
              ))}
            </Choices>
          </g>
        ) : (
          <g>
            <text x={cx + 40} y={eqY + 84} textAnchor="end" fontFamily={FONT} fontSize="84" fontWeight="800" fill={INK}>
              {sum}
            </text>
            <WriteBox x={cx + 64} y={eqY} size={116} answer={r.answer} answers={answers} />
          </g>
        )}
      </Pic>
    );
  }
});
