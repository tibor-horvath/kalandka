import { useEffect, useMemo, useRef, useState } from 'react';
import { useLadderRound, WinCard } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { FitBox } from '../../../components/FitBox';
import { useForm } from '../../../components/Stage';
import { Crate, WeightBlock } from '../art';
import { GuideBubble } from '../../../components/ui';
import {
  BALANCE_MAX,
  FULL_FEEDBACK,
  SHOW_ANSWER_AFTER,
  balanceFeedback,
  buildScaleRound,
  chooseMissFeedback,
  chooseRightFeedback,
  chooseTotals,
  compareMissFeedback,
  compareRightFeedback,
  panSlots,
  solvedFeedback,
  startFeedback,
  tilt,
  total,
  type BalanceTask,
  type ChooseTask,
  type CompareTask,
  type ScaleFeedback,
  type ScaleLevel,
  type Side,
  type Weight,
} from '../games/scale';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare, popBubble, thud } from '../../../lib/sound';
import { useProgress } from '../../../state/progress';
import { ROUND_HELP_AFTER } from '../../../state/taskLog';

// The scale, in board units.
const BOARD_H = 440;
const PIVOT_Y = 300;
/**
 * The board's width, the pivot and half the beam (from the pivot to where a pan stands). Phones draw
 * the pans closer together, so the whole scale, and every weight on it, can be drawn bigger.
 */
interface Geo {
  w: number;
  cx: number;
  arm: number;
}
const TABLET_GEO: Geo = { w: 900, cx: 450, arm: 290 };
const PHONE_GEO: Geo = { w: 670, cx: 335, arm: 175 };
/** The top of a pan's plate, above the beam end. */
const PLATE_Y = -34;
const SLOT = 52;

/** After a task is done, the scale stays a moment so the child sees it, then the next task comes. */
const NEXT_TASK_MS = 2000;
/** A wrong weight in a choose task stays on the pan this long, so the tilt is seen, then comes off. */
const PREVIEW_MS = 1800;

/** What stands on a pan besides its weights: the gap for the missing one, the closed crate, or the weight picked for it. */
interface Extra {
  side: 'left' | 'right';
  kind: 'gap' | 'crate' | 'block';
  value: number | null;
}

/** Where a weight of the given width (in slots) goes after the ones already on the pan. */
function nextSlot(ws: Weight[], width: 1 | 2): { col: number; row: number } {
  const slots = panSlots([...ws, width]);
  return slots[slots.length - 1];
}

const slotY = (row: number) => PLATE_Y - (row + 1) * SLOT + 4;

/** Each row of weights stands in the middle of the pan. */
function rowCentres(cells: { col: number; row: number; w: number }[]): (col: number, row: number) => number {
  const widths = new Map<number, number>();
  for (const c of cells) widths.set(c.row, Math.max(widths.get(c.row) ?? 0, c.col + c.w));
  return (col, row) => -((widths.get(row) ?? 0) * SLOT) / 2 + col * SLOT + 2;
}
function Pan({
  geo,
  side,
  weights,
  extra,
  angle,
  count,
  onTap,
  onTapWeight
}: {
  geo: Geo;
  side: 'left' | 'right';
  weights: Weight[];
  extra: Extra | null;
  angle: number;
  count: number | null;
  onTap?: () => void;
  onTapWeight?: (i: number) => void;
}) {
  const rad = (angle * Math.PI) / 180;
  const s = side === 'left' ? -1 : 1;
  const x = geo.cx + s * geo.arm * Math.cos(rad);
  const y = PIVOT_Y + s * geo.arm * Math.sin(rad);
  const slots = panSlots(weights);
  const mine = extra && extra.side === side ? extra : null;
  const at = mine ? nextSlot(weights, 2) : null;
  const rows = Math.max(0, ...slots.map((sl) => sl.row + 1), at ? at.row + 1 : 0);
  const slotX = rowCentres([...slots, ...(at ? [{ ...at, w: 2 }] : [])]);
  return (
    <g className="scale-pan" style={{ transform: `translate(${x}px, ${y}px)` }} onClick={onTap}>
      {/* A wide invisible target, so a tap anywhere on the pan or its weights counts. */}
      {onTap && <rect x="-160" y={PLATE_Y - 3 * SLOT - 20} width="320" height={3 * SLOT + 60} fill="transparent" />}
      <rect x="-6" y={PLATE_Y + 12} width="12" height={-PLATE_Y - 12} fill="#5E7184" />
      <rect x="-150" y={PLATE_Y} width="300" height="14" rx="7" className="scale-plate" />
      {slots.map((sl, i) => (
        <g
          key={i}
          className="scale-weight"
          transform={`translate(${slotX(sl.col, sl.row)} ${slotY(sl.row)})`}
          onClick={
            onTapWeight
              ? (e) => {
                  e.stopPropagation();
                  onTapWeight(i);
                }
              : undefined
          }
        >
          <WeightBlock w={sl.w} />
        </g>
      ))}
      {mine && at && (
        <g transform={`translate(${slotX(at.col, at.row)} ${slotY(at.row)})`}>
          {mine.kind === 'gap' && (
            <>
              <rect x="2" y="2" width="96" height="44" rx="9" className="scale-gap" />
              <text x="50" y="36" textAnchor="middle" className="scale-gap__mark">
                ?
              </text>
            </>
          )}
          {mine.kind === 'crate' && (
            <>
              <g transform="translate(2 -50) scale(0.96)">
                <Crate />
              </g>
              <circle cx="50" cy="-2" r="22" fill="#FFFFFF" stroke="#8A5A3B" strokeWidth="4" />
              <text x="50" y="9" textAnchor="middle" className="scale-crate__mark">
                {mine.value ?? '?'}
              </text>
            </>
          )}
          {mine.kind === 'block' && (
            <g className="scale-drop">
              <rect x="2" y="2" width="96" height="44" rx="9" fill="#F6C65B" stroke="#C98A1A" strokeWidth="4" />
              <text x="50" y="36" textAnchor="middle" className="scale-block__mark">
                {mine.value}
              </text>
            </g>
          )}
        </g>
      )}
      {count !== null && (
        <g transform={`translate(0 ${PLATE_Y - rows * SLOT - 34})`}>
          {/* The pop animates its own transform, so it sits inside the one that places it. */}
          <g className="scale-count">
            <circle r="26" fill="#FFFFFF" stroke="#F2B33D" strokeWidth="5" />
            <text y="11" textAnchor="middle" className="scale-count__num">
              {count}
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/**
 * The answer, stamped over the scale: a green tick that stays once the task is done, or an orange
 * "Hoppá" that fades after a moment (no red and no cross: nothing fails).
 */
interface Verdict {
  kind: 'right' | 'oops';
  word: string;
  /** Restarts the stamp on every new answer. */
  id: number;
}

function useVerdict(): [Verdict | null, (kind: Verdict['kind'], word: string) => void] {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const show = (kind: Verdict['kind'], word: string) => setVerdict((v) => ({ kind, word, id: (v?.id ?? 0) + 1 }));
  return [verdict, show];
}

function Stamp({ verdict }: { verdict: Verdict }) {
  return (
    <div key={verdict.id} className={`scale-stamp scale-stamp--${verdict.kind}`} aria-hidden="true">
      <span className="scale-stamp__icon">
        {verdict.kind === 'right' ? (
          <svg width="64" height="64" viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          '!'
        )}
      </span>
      <span className="scale-stamp__word">{verdict.word}</span>
    </div>
  );
}

/** The balance: a stand, a beam that tips, and a pan on each end. Held level by two props until let go. */
function Board({
  left,
  right,
  extra = null,
  angle,
  held = false,
  counts = null,
  onPan,
  onTapRight,
  label,
  verdict = null
}: {
  left: Weight[];
  right: Weight[];
  extra?: Extra | null;
  angle: number;
  held?: boolean;
  counts?: { left: number; right: number } | null;
  onPan?: (side: 'left' | 'right') => void;
  onTapRight?: (i: number) => void;
  label: string;
  verdict?: Verdict | null;
}) {
  const geo = useForm() === 'tablet' ? TABLET_GEO : PHONE_GEO;
  const { w: BOARD_W, cx: PIVOT_X, arm: ARM } = geo;
  return (
    <FitBox className="scale-fit" width={BOARD_W} height={BOARD_H}>
      <div className={`scale-board${verdict?.kind === 'right' ? ' is-right' : ''}`}>
        <svg width={BOARD_W} height={BOARD_H} viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} role="img" aria-label={label}>
          <path d={`M${PIVOT_X} ${PIVOT_Y} L${PIVOT_X - 60} ${BOARD_H - 18} H${PIVOT_X + 60} Z`} fill="#5E7184" />
          <rect x={PIVOT_X - 110} y={BOARD_H - 22} width="220" height="18" rx="9" fill="#3E5872" />
          {/* The props that hold the beam level until Csavar lets go. */}
          {[-1, 1].map((s) => (
            <rect key={s} x={PIVOT_X + s * (ARM - 40) - 16} y={PIVOT_Y + 8} width="32" height={BOARD_H - PIVOT_Y - 30} rx="8" className={`scale-prop${held ? '' : ' is-off'}`} />
          ))}
          <g className="scale-beam" style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}>
            <rect x={PIVOT_X - ARM - 12} y={PIVOT_Y - 9} width={2 * ARM + 24} height="18" rx="9" className="scale-beam__bar" />
            <path d={`M${PIVOT_X - 8} ${PIVOT_Y - 9} L${PIVOT_X} ${PIVOT_Y - 30} L${PIVOT_X + 8} ${PIVOT_Y - 9} Z`} fill={angle === 0 ? '#138A86' : '#9FB3C8'} />
          </g>
          <Pan geo={geo} side="left" weights={left} extra={extra} angle={angle} count={counts?.left ?? null} onTap={onPan && (() => onPan('left'))} />
          <Pan geo={geo} side="right" weights={right} extra={extra} angle={angle} count={counts?.right ?? null} onTap={onPan && (() => onPan('right'))} onTapWeight={onTapRight} />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="14" fill="#F2B33D" stroke="#7A5300" strokeWidth="4" />
        </svg>
        {verdict && <Stamp key={verdict.id} verdict={verdict} />}
      </div>
    </FitBox>
  );
}

function sideLabel(left: number, right: number): string {
  return `Mérleg. A bal tányéron ${left}, a jobb tányéron ${right}.`;
}

interface TaskProps<T> {
  level: ScaleLevel;
  task: T;
  say: (f: ScaleFeedback) => void;
  onDone: (f: ScaleFeedback) => void;
  later: (fn: () => void, ms: number) => void;
}

/** Which side goes down? The beam is held level; the right answer lets it go. */
function CompareTaskView({ level, task, say, onDone }: TaskProps<CompareTask>) {
  const [released, setReleased] = useState(false);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<{ side: Side; id: number } | null>(null);
  const [verdict, stamp] = useVerdict();
  const l = total(task.left);
  const r = total(task.right);

  const pick = (side: Side) => {
    if (released) return;
    if (side === task.answer) {
      setReleased(true);
      setWrong(null);
      if (side !== 'equal') thud();
      stamp('right', side === 'equal' ? 'Egyformák!' : 'Úgy van!');
      onDone(compareRightFeedback(task));
      return;
    }
    setMisses((m) => m + 1);
    setWrong((w) => ({ side, id: (w?.id ?? 0) + 1 }));
    buzz(30);
    stamp('oops', 'Számoljuk meg!');
    say(compareMissFeedback(task));
  };
  const glow = misses >= SHOW_ANSWER_AFTER && !released ? task.answer : null;
  const sides: Side[] = level.equal ? ['left', 'equal', 'right'] : ['left', 'right'];
  const names: Record<Side, string> = { left: 'A bal nehezebb', equal: 'Egyformák', right: 'A jobb nehezebb' };

  return (
    <>
      <Board
        left={task.left}
        right={task.right}
        angle={released ? tilt(l, r) : 0}
        held={!released}
        counts={misses > 0 || released ? { left: l, right: r } : null}
        onPan={(s) => pick(s)}
        label={sideLabel(l, r)}
        verdict={verdict}
      />
      <div className={`scale-answers scale-answers--${sides.length}`}>
        {sides.map((s) => {
          const state = released && s === task.answer ? ' is-right' : glow === s ? ' is-glow' : '';
          return (
            <button key={`${s}${wrong?.side === s ? wrong.id : ''}`} type="button" className={`scale-answer scale-answer--${s}${state}${wrong?.side === s ? ' is-wrong' : ''}`} onClick={() => pick(s)} disabled={released}>
              <span className="scale-answer__icon" aria-hidden="true">
                {s === 'equal' ? '=' : '↓'}
              </span>
              {names[s]}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Put weights on the right pan until the beam levels out. */
function BalanceTaskView({ level, task, say, onDone }: TaskProps<BalanceTask>) {
  const [right, setRight] = useState<Weight[]>(task.right);
  const [done, setDone] = useState(false);
  const [verdict, stamp] = useVerdict();
  const l = total(task.left);
  const r = total(right);

  const change = (next: Weight[]) => {
    setRight(next);
    const nr = total(next);
    const f = balanceFeedback(l, nr, !!level.twos);
    if (nr === l) {
      setDone(true);
      stamp('right', 'Egyensúly!');
      onDone(f!);
    } else if (f) {
      // Only when it first tips too far, not on every weight added after that.
      if (r <= l) stamp('oops', 'Túl sok!');
      say(f);
    } else if (r > l) {
      // Back below from too heavy: the opening line again.
      say(startFeedback(level, task));
    }
  };
  const add = (w: Weight) => {
    if (done) return;
    if (r + w > BALANCE_MAX || panSlots([...right, w]).some((s) => s.row > 2)) {
      say(FULL_FEEDBACK);
      return;
    }
    popBubble(right.length);
    change([...right, w]);
  };
  const removeAt = (i: number) => {
    if (done || right.length === 0) return;
    popBubble(1);
    change(right.filter((_, k) => k !== i));
  };

  return (
    <>
      <Board left={task.left} right={right} angle={tilt(l, r)} counts={done ? { left: l, right: r } : null} onTapRight={removeAt} label={sideLabel(l, r)} verdict={verdict} />
      <div className="scale-tray">
        <button type="button" className="scale-tray__btn scale-tray__btn--off" onClick={() => removeAt(right.length - 1)} disabled={done || right.length === 0}>
          <span className="scale-tray__sign" aria-hidden="true">
            −
          </span>
          Levesz
        </button>
        {task.tray.map((w) => (
          <button key={w} type="button" className="scale-tray__btn" onClick={() => add(w)} disabled={done} aria-label={w === 2 ? 'Kettes súlyt teszek a jobb oldalra' : 'Egy súlyt teszek a jobb oldalra'}>
            <svg aria-hidden="true" width={w === 2 ? 84 : 44} height="44" viewBox={`0 0 ${w === 2 ? 100 : 48} 48`}>
              <WeightBlock w={w} />
            </svg>
            +{w}
          </button>
        ))}
      </div>
    </>
  );
}

/** Pick the weight that is missing on the right, or hidden in the crate on the left. */
function ChooseTaskView({ task, say, onDone, later }: TaskProps<ChooseTask>) {
  const [shown, setShown] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [verdict, stamp] = useVerdict();
  const previewing = shown !== null && !done;
  const totals = chooseTotals(task, shown);
  // The crate's weight counts from the start (the scale is level); a gap does not.
  const live = task.secret && shown === null ? chooseTotals(task, task.answer) : totals;

  const pick = (x: number) => {
    if (done || previewing) return;
    setShown(x);
    if (x === task.answer) {
      setDone(true);
      setWrong(null);
      stamp('right', 'Úgy van!');
      onDone(chooseRightFeedback(task));
      return;
    }
    const m = misses + 1;
    setMisses(m);
    setWrong(x);
    thud();
    buzz(30);
    const over = chooseTotals(task, x);
    stamp('oops', (task.unknown === 'left' ? over.left > over.right : over.right > over.left) ? 'Túl sok!' : 'Kevés!');
    say(chooseMissFeedback(task, x, m));
    later(() => setShown(null), PREVIEW_MS);
  };
  const glow = misses >= SHOW_ANSWER_AFTER && !done ? task.answer : null;
  const extra: Extra = {
    side: task.unknown,
    kind: task.secret ? 'crate' : shown === null ? 'gap' : 'block',
    value: task.secret ? (done ? task.answer : shown) : shown
  };

  return (
    <>
      <Board
        left={task.left}
        right={task.right}
        extra={extra}
        angle={tilt(live.left, live.right)}
        counts={misses >= 2 || done ? { left: total(task.left), right: total(task.right) } : null}
        label={`${sideLabel(total(task.left), total(task.right))} ${task.secret ? 'A bal oldalon egy titkos doboz is van.' : 'A jobb oldalról hiányzik egy súly.'}`}
        verdict={verdict}
      />
      <div className="scale-choices">
        {task.choices.map((c) => {
          const state = done && c === task.answer ? ' is-right' : glow === c ? ' is-glow' : wrong === c && previewing ? ' is-wrong' : '';
          return (
            <button key={c} type="button" className={`choice choice--short scale-choice${state}`} onClick={() => pick(c)} disabled={done || previewing} aria-label={task.secret ? `A doboz súlya ${c}` : `${c} súly kell`}>
              <span className="scale-choice__num">{c}</span>
              <span className="scale-choice__dots" aria-hidden="true">
                {Array.from({ length: c }, (_, i) => (
                  <span key={i} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Mérleg: weigh, compare and balance on Csavar's scale. */
export function Scale({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const [solved, setSolved] = useState(false);
  // The meter fills when the round's last line is over and the win card shows.
  const { level: levelIndex, win: solve, meter, goNext } = useLadderRound('scale', { showStep: solved });
  const round = useMemo(() => buildScaleRound(levelIndex, progress.scaleRound), [levelIndex, progress.scaleRound]);
  const { level, tasks } = round;
  const [at, setAt] = useState(0);
  const [taskDone, setTaskDone] = useState(false);
  const [fb, setFb] = useState<ScaleFeedback>(() => startFeedback(level, tasks[0]));
  const timers = useRef<number[]>([]);

  /** Corrections Csavar gave this round; enough of them and the round needed help (parents' notes). */
  const oops = useRef(0);
  const say = (f: ScaleFeedback) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    speak(startFeedback(level, tasks[0]).speech);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);

  const done = (f: ScaleFeedback) => {
    setTaskDone(true);
    if (at === tasks.length - 1) {
      setFb(f);
      fanfare();
      buzz(40);
      speak(`${f.speech} ${solvedFeedback().speech}`);
      later(() => {
        setSolved(true);
        setFb(solvedFeedback());
      }, NEXT_TASK_MS);
      solve(oops.current >= ROUND_HELP_AFTER);
      return;
    }
    chime();
    say(f);
    later(() => {
      setAt(at + 1);
      setTaskDone(false);
      say(startFeedback(level, tasks[at + 1]));
    }, NEXT_TASK_MS);
  };

  const task = tasks[at];
  const props = { level, say, onDone: done, later };

  return (
    <GameShell
      game="scale"
      className="screen--scale"
      title="Mérleg"
      meter={meter}
      justSolved={solved}
      tasks={{ at, of: tasks.length, done: taskDone }}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="scale-guide">
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
      </div>

      <div key={at} className="scale-task">
        {task.kind === 'compare' && <CompareTaskView task={task} {...props} />}
        {task.kind === 'balance' && <BalanceTaskView task={task} {...props} />}
        {task.kind === 'choose' && <ChooseTaskView task={task} {...props} />}
      </div>

      {solved && (
        <WinCard onNext={goNext} />
      )}

    </GameShell>
  );
}
