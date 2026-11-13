import { WeightBlock } from '../art';
import { SCALE_LEVELS, buildScaleRound, panSlots, total, type ScaleTask, type Weight } from './scale';
import { ladderOf } from '../../../state/ladder';
import { At, Choices, Gap, INK, LINE, Num, Pic, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';

// Mérleg on paper.

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

export const scale = spec<{ t: ScaleTask; equal: boolean }>({
  id: 'scale',
  rev: 1,
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
