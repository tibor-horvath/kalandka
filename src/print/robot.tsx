import type { ReactNode } from 'react';
import { ArrowTile, Battery, BinSign, BlockStack, CodePic, CodeSign, Crate, Lamp, LampGrid, MIRROR_GLASS, Rover, SortPart, WeightBlock } from '../components/robot';
import { CODE_LEVELS, PICS, PIC_NAMES, buildCodeRound, type CodeTask, type Sign } from '../games/robot/code';
import { FIX_LEVELS, buildFixRound, type FixTask } from '../games/robot/fix';
import { MIRROR_LEVELS, buildMirrorRound, type MirrorTask } from '../games/robot/mirror';
import { CMD_LABELS, PATH_LEVELS, buildPuzzle, routeCells, type Cmd, type Course, type Puzzle } from '../games/robot/path';
import { SCALE_LEVELS, buildScaleRound, panSlots, total, type ScaleTask, type Weight } from '../games/robot/scale';
import { SEQ_LEVELS, buildSeqRound, sameItem, type Item, type SeqTask } from '../games/robot/seq';
import { SORT_LEVELS, binFor, buildRound as buildSortRound, isOdd, type OddRow, type SortRound } from '../games/robot/sort';
import { ladderOf } from '../state/ladder';
import { ANSWER, At, Choices, Cross, FAINT, Gap, INK, LINE, Num, Pic, Ring, flatTasks, roundOf, spec, type Density, type Grid } from './sheet';

// Robotműhely on paper.

const pickGrid = (density: Density, big: Grid, normal: Grid, many: Grid): Grid => (density === 'big' ? big : density === 'many' ? many : normal);

// ---------- Robotút ----------

const CELL = 100;
const ARROW_TURN: Partial<Record<Cmd, number>> = { up: 0, right: 90, down: 180, left: 270, fwd: 0 };

/** A program card's picture in a 24 × 24 box, drawn like the app's cards. */
function CmdGlyph({ cmd, color = INK }: { cmd: Cmd; color?: string }) {
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
function CmdLegend({ cmds }: { cmds: Cmd[] }) {
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
function FloorPic({ p, children }: { p: Course; children?: ReactNode }) {
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

const path = spec<Puzzle>({
  id: 'path',
  rev: 1,
  world: 'robot',
  game: 'Robotút',
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

// ---------- Válogatógép ----------

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

const sort = spec<SortTask>({
  id: 'sort',
  rev: 1,
  world: 'robot',
  game: 'Válogatógép',
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

// ---------- Mérleg ----------

const PAN_L = 190;
const PAN_R = 570;
const PAN_Y = 205;

function Weights({ ws, cx, from = 0, ghost = false }: { ws: Weight[]; cx: number; from?: number; ghost?: boolean }) {
  return (
    <>
      {panSlots(ws)
        .slice(from)
        .map((s, i) => (
          <g key={i} opacity={ghost ? 0.55 : 1}>
            <At x={cx - 125 + s.col * 50} y={PAN_Y - (s.row + 1) * 48}>
              <WeightBlock w={s.w} />
            </At>
          </g>
        ))}
    </>
  );
}

/** The crate on Titkos doboz, at the far end of the left pan: what it weighs is the question. */
function SecretCrate() {
  return (
    <g>
      <rect x="34" y={PAN_Y - 74} width="72" height="72" rx="9" fill="#C98B50" stroke="#8A5A3B" strokeWidth="5" />
      <text x="70" y={PAN_Y - 20} textAnchor="middle" fontSize="50" fontWeight="800" fill="#FFFFFF">
        ?
      </text>
    </g>
  );
}

/** An arrow pointing down: "this side goes down". */
const DOWN = 'M70 12 V50 M54 36 L70 52 L86 36';

function ScaleBoard({ t, equal, answers }: { t: ScaleTask; equal: boolean; answers: boolean }) {
  const compare = t.kind === 'compare';
  const secret = t.kind === 'choose' && t.secret;
  const pick = t.kind === 'compare' ? ['left', 'equal', 'right'].indexOf(t.answer) : -1;
  // The weights a child draws on the balancing tasks, shown faintly on the tablet.
  const missing = t.kind === 'balance' ? total(t.left) - total(t.right) : 0;
  return (
    <Pic x={30} y={56} w={700} h={364}>
      <path d="M380 230 L330 336 H430 Z" fill="#5E7184" />
      <rect x="70" y="220" width="620" height="16" rx="8" fill="#5E7184" />
      <rect x={secret ? 30 : PAN_L - 135} y={PAN_Y} width={secret ? 340 : 270} height="14" rx="7" fill="#3E5872" />
      <rect x={PAN_R - 135} y={PAN_Y} width="270" height="14" rx="7" fill="#3E5872" />
      <circle cx="380" cy="228" r="12" fill="#F2B33D" stroke="#7A5300" strokeWidth="3" />
      {compare && (
        <>
          <rect x={PAN_L - 14} y="236" width="28" height="100" rx="6" fill="#B7C4D2" />
          <rect x={PAN_R - 14} y="236" width="28" height="100" rx="6" fill="#B7C4D2" />
        </>
      )}
      <rect x="40" y="336" width="680" height="10" rx="5" fill={LINE} />
      <Weights ws={t.left} cx={secret ? PAN_L + 50 : PAN_L} />
      <Weights ws={t.right} cx={PAN_R} />
      {t.kind === 'balance' && answers && missing > 0 && <Weights ws={[...t.right, ...Array.from({ length: missing }, () => 1 as Weight)]} cx={PAN_R} from={t.right.length} ghost />}
      {secret && <SecretCrate />}
      {t.kind === 'choose' && !t.secret && (
        <g>
          {(() => {
            const slot = panSlots([...t.right, 1]).at(-1)!;
            return <Gap x={PAN_R - 125 + slot.col * 50 - 4} y={PAN_Y - (slot.row + 1) * 48 - 4} w={56} h={56} />;
          })()}
        </g>
      )}
      {t.kind === 'compare' && (
        <Choices x={PAN_L - 70} y={352} w={140} h={64} gap={equal ? 50 : 240} pick={equal ? pick : pick / 2} answers={answers}>
          {[
            <path key="l" d={DOWN} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />,
            ...(equal ? [<Num key="e" x={70} y={32} n="=" size={56} />] : []),
            <path key="r" d={DOWN} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          ]}
        </Choices>
      )}
      {t.kind === 'choose' && (
        <Choices x={380 - (3 * 110 + 2 * 20) / 2} y={352} w={110} h={64} gap={20} pick={t.choices.indexOf(t.answer)} answers={answers}>
          {t.choices.map((n) => (
            <Num key={n} x={55} y={32} n={n} size={52} />
          ))}
        </Choices>
      )}
    </Pic>
  );
}

const scale = spec<{ t: ScaleTask; equal: boolean }>({
  id: 'scale',
  rev: 1,
  world: 'robot',
  game: 'Mérleg',
  levels: SCALE_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'scale').level,
  grid: (_, d) => pickGrid(d, [2, 3], [2, 4], [3, 5]),
  ask: (level) => {
    const l = SCALE_LEVELS[level];
    if (l.mode === 'compare') return l.equal ? 'Melyik oldal megy le? Karikázd be a nyilat, vagy az egyenlőségjelet, ha egyformák!' : 'Melyik oldal megy le? Karikázd be a nyilat!';
    if (l.mode === 'balance') return 'Rajzolj súlyokat a jobb tányérra, hogy egyensúlyban legyen!';
    return l.secret ? 'Mennyit nyom a láda? Karikázd be!' : 'Hány súly hiányzik a jobb tányérról? Karikázd be!';
  },
  tip: (level) => {
    const l = SCALE_LEVELS[level];
    if (l.mode === 'compare') return 'Számolják meg a súlyokat mindkét oldalon: amelyik oldalon több van, az megy le.';
    if (l.mode === 'balance') return l.twos ? 'Számolják meg a bal oldalt; a széles súly kettőnek számít. A jobb oldalon is ugyanannyi legyen.' : 'Számolják meg a bal oldalt: a jobb oldalon is ugyanannyi legyen.';
    return l.secret ? 'A láda a mellette álló súlyokkal együtt annyit nyom, mint a jobb oldal. Ami a bal oldalon a súlyokból hiányzik, annyit nyom a láda.' : 'Számolják meg mindkét oldalt: mennyivel van több a bal oldalon?';
  },
  others: (level) => {
    const l = SCALE_LEVELS[level];
    return l.mode === 'balance' && l.twos ? 'A rajzon csupa kis súly van, de széles súlyok is jók: a széles kettőnek számít, csak a két oldal legyen egyforma.' : null;
  },
  tasks: (req) => flatTasks(req, (r) => buildScaleRound(req.level, r).tasks.map((t) => ({ t, equal: !!SCALE_LEVELS[req.level].equal }))),
  Task: ({ task, answers }) => <ScaleBoard t={task.t} equal={task.equal} answers={answers} />
});

// ---------- Mintagép ----------

const STEP = 108;

function SeqItem({ item }: { item: Item }) {
  if (item.kind === 'part') return <SortPart part={{ color: item.color, shape: item.shape, size: 'big' }} textured />;
  if (item.kind === 'arrow') return <ArrowTile dir={item.dir} color={item.color} textured />;
  return <BlockStack n={item.n} />;
}

const seq = spec<SeqTask>({
  id: 'seq',
  rev: 1,
  world: 'robot',
  game: 'Mintagép',
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

// ---------- Tükörgép ----------

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

const mirror = spec<MirrorTask>({
  id: 'mirror',
  rev: 1,
  world: 'robot',
  game: 'Tükörgép',
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

// ---------- Kódzár ----------

const SIGN = 100;
const SIGN_STEP = 112;
const KEY_W = 320;

function SignAt({ sign, x, y, s = 0.9 }: { sign: Sign; x: number; y: number; s?: number }) {
  return (
    <At x={x + (SIGN * (1 - s)) / 2} y={y + (SIGN * (1 - s)) / 2} s={s}>
      <CodeSign sign={sign} textured />
    </At>
  );
}

/** One lock on paper: the key on the left, the code with an empty box under each sign, the note on the right. */
function CodeLock({ task, answers }: { task: CodeTask; answers: boolean }) {
  const hidden = task.hidden;
  // Pöttykód's key would give every answer away on paper: there the child counts.
  const key = task.code[0].kind === 'dots' ? [] : task.key;
  const keyW = key.length ? KEY_W : 0;
  const n = task.code.length;
  const codeW = n * SIGN_STEP;
  const noteX = keyW + codeW + 40;
  const w = hidden ? noteX + 2 * SIGN_STEP + 20 : keyW + codeW;
  const h = Math.max(270, key.length * SIGN_STEP);
  return (
    <Pic w={w} h={h}>
      {key.length > 0 && (
        <g>
          <rect x="0" y="0" width={KEY_W - 30} height={key.length * SIGN_STEP} rx="18" fill="#F4F7FA" stroke={FAINT} strokeWidth="3" />
          {key.map((row, r) => {
            const y = r * SIGN_STEP + 6;
            const covered = hidden?.row === r;
            return (
              <g key={r}>
                <SignAt sign={row.sign} x={8} y={y} s={0.8} />
                <path d={`M112 ${y + 50} H150 M138 ${y + 38} L150 ${y + 50} L138 ${y + 62}`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {covered ? (
                  <g>
                    <Gap x={166} y={y} w={SIGN} h={SIGN} />
                    {answers && (
                      <g opacity="0.45">
                        <SignAt sign={row.meaning} x={166} y={y} s={0.8} />
                      </g>
                    )}
                  </g>
                ) : (
                  <SignAt sign={row.meaning} x={166} y={y} s={0.8} />
                )}
              </g>
            );
          })}
        </g>
      )}
      {task.code.map((s, i) => {
        const x = keyW + i * SIGN_STEP;
        return (
          <g key={i}>
            <SignAt sign={s} x={x} y={0} />
            <path d={`M${x + 50} 108 V136 M${x + 40} 126 L${x + 50} 136 L${x + 60} 126`} stroke={FAINT} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Gap x={x} y={150} w={SIGN} h={SIGN} />
            {answers && (
              <g opacity="0.45">
                <SignAt sign={task.answer[i]} x={x} y={150} />
              </g>
            )}
          </g>
        );
      })}
      {hidden && (
        <g>
          <rect x={noteX} y="0" width={2 * SIGN_STEP + 20} height="260" rx="10" fill="#FFFBEA" stroke={FAINT} strokeWidth="3" />
          {hidden.note.map((r, i) => (
            <g key={i}>
              <SignAt sign={r.sign} x={noteX + 14 + i * SIGN_STEP} y={8} s={0.8} />
              <SignAt sign={r.meaning} x={noteX + 14 + i * SIGN_STEP} y={150} s={0.8} />
            </g>
          ))}
          <path d={`M${noteX + 126} 100 V150 M${noteX + 114} 138 L${noteX + 126} 150 L${noteX + 138} 138`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </Pic>
  );
}

/** The pictures a lamp can mean, named for the grown-up. */
function PicLegend() {
  return (
    <>
      {PICS.map((p) => (
        <span key={p} className="ps-legend__item">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <CodePic pic={p} />
          </svg>
          {PIC_NAMES[p]}
        </span>
      ))}
    </>
  );
}

const code = spec<CodeTask>({
  id: 'code',
  rev: 1,
  world: 'robot',
  game: 'Kódzár',
  // Lamps are on every sheet but the dice one, in the code or in the answer.
  colorKey: (level) => CODE_LEVELS[level].kind !== 'dots',
  levels: CODE_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'code').level,
  grid: (level, d) => {
    const kind = CODE_LEVELS[level].kind;
    if (kind === 'copy' || kind === 'long' || kind === 'dots') return pickGrid(d, [2, 3], [2, 5], [3, 6]);
    return pickGrid(d, [1, 3], [1, 5], [2, 6]);
  },
  ask: (level) => {
    switch (CODE_LEVELS[level].kind) {
      case 'copy':
      case 'long':
        return 'Színezd ki a dobozokat ugyanolyan színűre, mint a lámpák fölöttük!';
      case 'dots':
        return 'Számold meg a pöttyöket, és írd a dobozba a számot!';
      case 'send':
        return 'Küldj üzenetet! Keresd meg a képet a kódtáblán, és színezd a dobozt a lámpa színére!';
      case 'missing':
        return 'Az egyik sort letakarták. Nézd meg a cetlit, rajzold be a hiányzó jelet, aztán fejtsd meg a kódot!';
      default:
        return 'Mit jelentenek a lámpák? Nézd meg a kódtáblát, és rajzold a dobozokba!';
    }
  },
  tip: (level) => {
    switch (CODE_LEVELS[level].kind) {
      case 'copy':
      case 'long':
        return 'Balról jobbra haladjanak, és mondják ki a színeket hangosan.';
      case 'dots':
        return 'Ujjal érintsék meg a pöttyöket, miközben számolnak.';
      case 'send':
        return 'Itt fordítva olvassák a kódtáblát: a képtől a lámpáig. Segíthet, ha ujjal követik a sort.';
      case 'missing':
        return 'A cetlin az egyik lámpa a letakart sorból van: abból derül ki, mit jelent.';
      default:
        return 'Minden lámpánál keressék meg a kódtáblán ugyanazt a színt, és nézzék meg, mi áll mellette.';
    }
  },
  legend: (level) => (['copy', 'long', 'dots'].includes(CODE_LEVELS[level].kind) ? null : <PicLegend />),
  tasks: (req) => flatTasks(req, (r) => buildCodeRound(req.level, r).tasks),
  Task: ({ task, answers }) => <CodeLock task={task} answers={answers} />
});

// ---------- Hibakereső ----------

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

const fix = spec<FixTask>({
  id: 'fix',
  rev: 1,
  world: 'robot',
  game: 'Hibakereső',
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

export const ROBOT_SHEETS = [path, sort, scale, seq, mirror, code, fix];
