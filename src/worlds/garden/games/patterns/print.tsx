import { PatternBunch, PatternFlower } from '../../art';
import { rng } from '../../../../lib/rng';
import { CHOICES, FLOWER_LABELS, PATTERN_LEVELS, SHAPES, SHAPE_ORDER, buildGrowRound, buildLevelRound as buildPatternLevelRound, buildRound as buildPatternRound, type FlowerKind, type GrowRound } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { At, Choices, Gap, Num, Pic, roundOf, spec } from '../../../../print/sheet';
import { pickGrid } from '../../printKit';

// Virágsor on paper.

interface PatternRow {
  shown: (FlowerKind | null)[];
  /** The hidden flowers, left to right: one, or two on "Két virág hiányzik". */
  answers: FlowerKind[];
  /** Places the row is laid out for: 6, or 8 on the sheets with whole repeats, so a row of six there sits as large as one of eight. */
  slots: number;
}

/** Eggyel / kettővel több virág: growing bunches, the child circles the size of the next one. */
interface PatternGrow {
  grow: GrowRound;
}

type PatternTask = PatternRow | PatternGrow;

type PatternAsk = 'next' | 'missing' | 'two' | 'grow';

/**
 * One sheet a level of the game, with AAB and ABB apart, as the game's third level holds both. `ladder` is the
 * game level a sheet prints (SHEET_LADDER in state/stickers.ts says the same); the first four print one repeat each.
 */
const PATTERN_SHEETS: { name: string; ladder: number; ask: PatternAsk }[] = [
  { name: 'AB – két virág váltakozik', ladder: 0, ask: 'next' },
  { name: 'ABC – három virág', ladder: 1, ask: 'next' },
  { name: 'AAB – kettő-egy', ladder: 2, ask: 'next' },
  { name: 'ABB – egy-kettő', ladder: 2, ask: 'next' },
  { name: 'Hiányzik a sorból (vegyes)', ladder: 3, ask: 'missing' },
  { name: 'AABB – kettő-kettő', ladder: 4, ask: 'next' },
  { name: 'Eggyel több virág', ladder: 5, ask: 'grow' },
  { name: 'Kettővel több virág', ladder: 6, ask: 'grow' },
  { name: 'ABAC, ABCB – négyes minta', ladder: 7, ask: 'next' },
  { name: 'Hiányzik a sorból (minden minta)', ladder: 8, ask: 'missing' },
  { name: 'Két virág hiányzik', ladder: 9, ask: 'two' }
];

/** The sheet of each game level: the first one that prints it (AAB for the AAB-and-ABB level). */
const patternSheetOf = (ladder: number) => PATTERN_SHEETS.findIndex((s) => s.ladder === ladder);

/** A bunch of a grow round with its number under it. */
function BunchCard({ kind, n, w, h }: { kind: FlowerKind; n: number; w: number; h: number }) {
  return (
    <>
      <At x={(w - 64) / 2} y={4}>
        <PatternBunch kind={kind} n={n} width={64} />
      </At>
      <Num x={w / 2} y={h - 24} n={n} size={36} />
    </>
  );
}

export const patterns = spec<PatternTask>({
  id: 'patterns',
  rev: 3,
  levels: PATTERN_SHEETS.map((s) => s.name),
  current: (p) => patternSheetOf(Math.min(PATTERN_LEVELS.length - 1, ladderOf(p, 'patterns').level)),
  grid: (_, d) => pickGrid(d, [1, 6], [1, 8], [2, 10]),
  ask: (level) =>
    ({
      next: 'Melyik virág jön ezután? Karikázd be!',
      missing: 'Melyik virág hiányzik a sorból? Karikázd be!',
      two: 'Melyik két virág hiányzik a sorból? Karikázd be mindkettőt!',
      grow: 'Hány virág lesz a következő csokorban? Karikázd be!'
    })[PATTERN_SHEETS[level].ask],
  tip: (level) =>
    ({
      next: 'Mondják ki együtt hangosan a sort, virágról virágra, és álljanak meg a végén: a gyerkőc hallani fogja, mi jön.',
      missing: 'Mondják ki együtt hangosan a sort, virágról virágra: a kérdőjelnél hallani, melyik virág maradt ki.',
      two: 'Mondják ki együtt hangosan a sort, virágról virágra: a két kérdőjelnél hallani, melyik két virág maradt ki.',
      grow:
        PATTERN_LEVELS[PATTERN_SHEETS[level].ladder].grow === 2
          ? 'Mondják ki együtt a csokrok számát: minden csokorban kettővel több virág van, mint az előzőben.'
          : 'Mondják ki együtt a csokrok számát: minden csokorban eggyel több virág van, mint az előzőben.'
    })[PATTERN_SHEETS[level].ask],
  tasks: (req) =>
    Array.from({ length: req.count }, (_, i): PatternTask => {
      const r = roundOf(req, i);
      const { ladder, ask } = PATTERN_SHEETS[req.level];
      if (ask === 'grow') return { grow: buildGrowRound(ladder, r) };
      if (ladder >= 4) {
        const round = buildPatternLevelRound(ladder, r);
        return { shown: round.shown, answers: round.gaps.map((g) => round.sequence[g]), slots: PATTERN_LEVELS[ladder].whole ? 8 : 6 };
      }
      if (ask === 'missing') {
        const round = buildPatternRound(SHAPE_ORDER.length + r);
        return { shown: round.shown, answers: [round.answer], slots: 6 };
      }
      // The same repeat each time, with the flowers swapped round so no two rows look alike.
      const rand = rng(r + 71);
      const kinds = [...CHOICES];
      for (let k = kinds.length - 1; k > 0; k--) {
        const j = Math.floor(rand() * (k + 1));
        [kinds[k], kinds[j]] = [kinds[j], kinds[k]];
      }
      const sequence = SHAPES[SHAPE_ORDER[req.level]].map((slot) => kinds[slot]);
      return { shown: [...sequence.slice(0, 5), null], answers: [sequence[5]], slots: 6 };
    }),
  Task: ({ task, answers }) => {
    if ('grow' in task) {
      const g = task.grow;
      const choicesX = (g.counts.length + 1) * 90 + 50;
      return (
        <Pic w={choicesX + 3 * 110 + 2 * 10} h={210}>
          {g.counts.map((n, i) => (
            <At key={i} x={i * 90} y={0}>
              <BunchCard kind={g.flower} n={n} w={90} h={210} />
            </At>
          ))}
          <Gap x={g.counts.length * 90} y={2} w={90} h={206} />
          {answers && (
            <g opacity="0.45">
              <At x={g.counts.length * 90} y={0}>
                <BunchCard kind={g.flower} n={g.answer} w={90} h={210} />
              </At>
            </g>
          )}
          <Choices x={choicesX} y={2} w={110} h={206} gap={10} pick={g.choices.indexOf(g.answer)} answers={answers}>
            {g.choices.map((n) => (
              <BunchCard key={n} kind={g.flower} n={n} w={110} h={206} />
            ))}
          </Choices>
        </Pic>
      );
    }
    // Rows of eight keep the same flower size and push the choices right.
    const choicesX = task.slots * 90 + 50;
    const gaps = task.shown.flatMap((k, i) => (k ? [] : [i]));
    return (
      <Pic w={choicesX + 300} h={136}>
        {task.shown.map((k, i) =>
          k ? (
            <At key={i} x={i * 90 + 10} y={4}>
              <PatternFlower kind={k} width={70} />
            </At>
          ) : (
            <g key={i}>
              <Gap x={i * 90} y={2} w={90} h={132} />
              {answers && (
                <g opacity="0.45">
                  <At x={i * 90 + 10} y={4}>
                    <PatternFlower kind={task.answers[gaps.indexOf(i)]} width={70} />
                  </At>
                </g>
              )}
            </g>
          )
        )}
        <Choices x={choicesX} y={2} w={90} h={132} gap={10} pick={task.answers.map((a) => CHOICES.indexOf(a))} answers={answers}>
          {CHOICES.map((k) => (
            <At key={k} x={10} y={2}>
              <PatternFlower kind={k} width={70} />
              <title>{FLOWER_LABELS[k]}</title>
            </At>
          ))}
        </Choices>
      </Pic>
    );
  }
});
