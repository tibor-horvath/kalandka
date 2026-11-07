import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLadderRound, WinCard } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { FitBox } from '../../../components/FitBox';
import { Lamp, LampGrid } from '../art';
import { DoneTick, GuideBubble } from '../../../components/ui';
import {
  SHOW_AFTER,
  SHOW_FAULT_AFTER,
  boardDoneFeedback,
  buildMirrorRound,
  cellLabel,
  fixFoundFeedback,
  fixMissFeedback,
  givenSideFeedback,
  key,
  lampFeedback,
  lampRightFeedback,
  lampWrongFeedback,
  nearestTarget,
  nextTaskFeedback,
  onGivenSide,
  paintColors,
  paintFeedback,
  pickRightFeedback,
  pickWrongFeedback,
  reflect,
  solvedFeedback,
  startFeedback,
  wrongPaintFeedback,
  type Axis,
  type Cell,
  type FixTask,
  type Lamp as LampT,
  type LightTask,
  type MirrorFeedback,
  type PickTask,
} from '../games/mirror';
import { COLOR_NAMES, type Color } from '../games/sort';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare, popBubble } from '../../../lib/sound';
import { useProgress } from '../../../state/progress';
import { ROUND_HELP_AFTER } from '../../../state/taskLog';

/** After a board is finished, it stays a moment so the child sees the whole picture, then the next task comes. */
const NEXT_TASK_MS = 3000;
/** A wrong lamp blinks this long, then goes out. */
const BLINK_MS = 900;

// The board, in drawing units (FitBox scales it on phones); the room it gets, its frame included.
const BOARD_W = 940;
const BOARD_H = 480;
/** The board's frame around the lamps. */
const FRAME = 30;
const GAP = 6;
/** The mirror strip and the room either side of it. */
const MIRROR = 22;
const MIRROR_ROOM = MIRROR + 2 * GAP;
const MAX_CELL = 112;

type Say = (f: MirrorFeedback) => void;

/** Orange badge on a wrong pick: a cross, the counterpart of the green tick. */
function MissMark() {
  return (
    <span className="seq-miss" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    </span>
  );
}

/** Tükörgép: light the reflections, tell a reflection from a copy, or find where the machine went wrong. */
export function Mirror({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level: levelIndex, win: solve, meter, goNext } = useLadderRound('mirror');
  const round = useMemo(() => buildMirrorRound(levelIndex, progress.mirrorRound), [levelIndex, progress.mirrorRound]);
  const first = progress.mirrorSolved === 0;
  const [taskIdx, setTaskIdx] = useState(0);
  const [fb, setFb] = useState<MirrorFeedback>(() => startFeedback(round.level, first));
  const [solved, setSolved] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  /** Corrections Csavar gave this round; enough of them and the round needed help (parents' notes). */
  const oops = useRef(0);
  const say: Say = (f) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };

  useEffect(() => {
    speak(startFeedback(round.level, first).speech);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);

  const done = (right: MirrorFeedback) => {
    const last = taskIdx === round.tasks.length - 1;
    if (!last) {
      chime();
      say(right);
      later(() => {
        setTaskIdx(taskIdx + 1);
        say(nextTaskFeedback(round.level));
      }, NEXT_TASK_MS);
      return;
    }
    const win = solvedFeedback(round.level);
    setSolved(true);
    fanfare();
    buzz(40);
    say({ ...win, speech: `${right.speech} ${win.speech}` });
    solve(oops.current >= ROUND_HELP_AFTER);
  };

  const task = round.tasks[taskIdx];
  const props = { n: taskIdx, solved, say, onDone: done, later };

  return (
    <GameShell
      game="mirror"
      className="screen--mirror"
      title={round.level.kind === 'fix' ? 'Hibás tükör' : 'Tükörgép'}
      meter={meter}
      justSolved={solved}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="seq-guide mirror-guide">
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
      </div>

      <ol className="sort-odd__dots seq-dots" aria-label={`${taskIdx + 1}. feladat a ${round.tasks.length}-ből`}>
        {round.tasks.map((_, i) => (
          <li key={i} className={`sort-odd__dot${i < taskIdx || (i === taskIdx && solved) ? ' is-done' : i === taskIdx ? ' is-now' : ''}`} />
        ))}
      </ol>

      {task.mode === 'light' && <LightBoard key={taskIdx} task={task} {...props} />}
      {task.mode === 'pick' && <PickBoard key={taskIdx} task={task} {...props} />}
      {task.mode === 'fix' && <FixBoard key={taskIdx} task={task} {...props} />}

      {solved && (
        <WinCard onNext={goNext} />
      )}

    </GameShell>
  );
}

interface BoardProps {
  /** Which task of the round, so the praise varies. */
  n: number;
  solved: boolean;
  say: Say;
  onDone: (right: MirrorFeedback) => void;
  later: (fn: () => void, ms: number) => void;
}

// ---------- the lamp board ----------

interface Geometry {
  cell: number;
  w: number;
  h: number;
  pos: (p: Cell) => { x: number; y: number };
  mirror: CSSProperties;
}

/** Where every cell sits, with the mirror strip between the two halves. */
function geometry(axis: Axis, rows: number, cols: number): Geometry {
  const extraW = axis === 'v' ? MIRROR_ROOM : 0;
  const extraH = axis === 'h' ? MIRROR_ROOM : 0;
  const cell = Math.min(MAX_CELL, Math.floor((BOARD_W - FRAME - extraW - GAP * (cols - 1)) / cols), Math.floor((BOARD_H - FRAME - extraH - GAP * (rows - 1)) / rows));
  const step = cell + GAP;
  const w = cols * cell + (cols - 1) * GAP + extraW;
  const h = rows * cell + (rows - 1) * GAP + extraH;
  const pos = ({ r, c }: Cell) => ({
    x: c * step + (axis === 'v' && c >= cols / 2 ? MIRROR_ROOM - GAP : 0),
    y: r * step + (axis === 'h' && r >= rows / 2 ? MIRROR_ROOM - GAP : 0)
  });
  const mirror: CSSProperties =
    axis === 'v'
      ? { left: (cols / 2) * step, top: -6, width: MIRROR, height: h + 12 }
      : { top: (rows / 2) * step, left: -6, height: MIRROR, width: w + 12 };
  return { cell, w, h, pos, mirror };
}

interface CellView {
  lamp: LampT | undefined;
  state?: string;
  label: string;
  children?: ReactNode;
}

/** The board itself: a lamp in every cell, the mirror across the middle. */
function Board({
  axis,
  rows,
  cols,
  view,
  onTap,
  shine,
  disabled
}: {
  axis: Axis;
  rows: number;
  cols: number;
  view: (p: Cell) => CellView;
  onTap: (p: Cell) => void;
  shine: boolean;
  disabled: boolean;
}) {
  const g = geometry(axis, rows, cols);
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c });
  return (
    <div className="mirror-machine">
      <FitBox className="seq-fit" width={g.w + FRAME} height={g.h + FRAME}>
        <div className="mirror-board" style={{ width: g.w + FRAME, height: g.h + FRAME }}>
          <div className="mirror-board__inner" style={{ width: g.w, height: g.h }}>
            <span className={`mirror-glass mirror-glass--${axis}${shine ? ' is-shine' : ''}`} style={g.mirror} aria-hidden="true" />
            {cells.map((p) => {
              const { x, y } = g.pos(p);
              const v = view(p);
              return (
                <button
                  key={key(p)}
                  type="button"
                  className={`mirror-cell${v.state ?? ''}`}
                  style={{ left: x, top: y, width: g.cell, height: g.cell }}
                  onClick={() => onTap(p)}
                  disabled={disabled}
                  aria-label={v.label}
                >
                  <svg aria-hidden="true" width={g.cell} height={g.cell} viewBox="0 0 100 100">
                    <Lamp color={v.lamp?.color ?? null} />
                  </svg>
                  {v.children}
                </button>
              );
            })}
          </div>
        </div>
      </FitBox>
    </div>
  );
}

/** The cells strictly between a lamp and its reflection, for the "Mutasd!" dots. */
function between(a: Cell, b: Cell): Set<string> {
  const out = new Set<string>();
  if (a.r === b.r) for (let c = Math.min(a.c, b.c) + 1; c < Math.max(a.c, b.c); c++) out.add(key({ r: a.r, c }));
  else for (let r = Math.min(a.r, b.r) + 1; r < Math.max(a.r, b.r); r++) out.add(key({ r, c: a.c }));
  return out;
}

const at = (lamps: LampT[], p: Cell) => lamps.find((l) => l.r === p.r && l.c === p.c);

/** Light the reflection of every given lamp; with paint pots, in its own colour. */
function LightBoard({ task, n, solved, say, onDone, later }: BoardProps & { task: LightTask }) {
  const { axis, rows, cols } = task;
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [blink, setBlink] = useState<{ k: string; id: number } | null>(null);
  /** The pair shown by "Mutasd!" or after misses. */
  const [hint, setHint] = useState<LampT | null>(null);
  const pots = paintColors(task);
  const [paint, setPaint] = useState<Color>(pots[0]);
  const finished = lit.size === task.targets.length;

  const show = (target: LampT | null) => setHint(target);

  const tap = (p: Cell) => {
    if (solved || finished) return;
    const k = key(p);
    if (onGivenSide(p, axis, rows, cols)) {
      const lamp = at(task.given, p);
      say(lamp ? lampFeedback(lamp, axis, rows, cols) : givenSideFeedback(axis));
      return;
    }
    if (lit.has(k)) {
      say(lampFeedback(at(task.targets, p)!, axis, rows, cols));
      return;
    }
    const target = at(task.targets, p);
    if (target && (!task.paint || target.color === paint)) {
      const now = new Set(lit).add(k);
      setLit(now);
      setMisses(0);
      setHint(null);
      popBubble(now.size);
      if (now.size === task.targets.length) {
        onDone(boardDoneFeedback(n, task.picture));
        return;
      }
      say(lampRightFeedback(now.size));
      return;
    }
    const m = misses + 1;
    setMisses(m);
    setBlink((b) => ({ k, id: (b?.id ?? 0) + 1 }));
    later(() => setBlink((b) => (b?.k === k ? null : b)), BLINK_MS);
    buzz(30);
    if (target) {
      say(wrongPaintFeedback(target));
      if (m >= SHOW_AFTER) show(target);
      return;
    }
    const near = nearestTarget(task, lit, p);
    say(lampWrongFeedback(task, near));
    if (m >= SHOW_AFTER) show(near);
  };

  const hintSrc = hint ? reflect(hint, axis, rows, cols) : null;
  const dots = hint && hintSrc ? between(hintSrc, hint) : new Set<string>();

  const view = (p: Cell): CellView => {
    const k = key(p);
    const given = at(task.given, p);
    const target = at(task.targets, p);
    const on = given ?? (lit.has(k) ? target : undefined);
    const blinking = blink?.k === k;
    const shown = blinking ? { ...p, color: task.paint ? paint : task.given[0].color } : on;
    let state = '';
    if (blinking) state = ' is-wrong';
    else if (hint && (k === key(hint) || (hintSrc && k === key(hintSrc)))) state = ' is-glow';
    else if (dots.has(k)) state = ' is-step';
    else if (lit.has(k)) state = ' is-lit';
    return {
      lamp: shown,
      state,
      label: cellLabel(p, on),
      children: (
        <>
          {lit.has(k) && finished && k === key(task.targets[task.targets.length - 1]) && <DoneTick />}
          {blinking && <MissMark key={blink.id} />}
        </>
      )
    };
  };

  return (
    <>
      <Board axis={axis} rows={rows} cols={cols} view={view} onTap={tap} shine={finished} disabled={solved} />
      <div className="mirror-actions">
        {task.paint && (
          <div className="mirror-pots" role="radiogroup" aria-label="Festék">
            {pots.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={paint === c}
                aria-label={`${COLOR_NAMES[c]} festék`}
                className={`mirror-pot${paint === c ? ' is-on' : ''}`}
                onClick={() => {
                  setPaint(c);
                  say(paintFeedback(c));
                }}
                disabled={solved || finished}
              >
                <svg aria-hidden="true" width="74" height="74" viewBox="0 0 100 100">
                  <Lamp color={c} />
                </svg>
              </button>
            ))}
          </div>
        )}
        {!finished && !solved && (
          <button type="button" className="peek-btn peek-btn--robot" onClick={() => show(nearestTarget(task, lit, null))}>
            Mutasd!
          </button>
        )}
      </div>
    </>
  );
}

/** Pick the true reflection of a shape from three cards. */
function PickBoard({ task, n, solved, say, onDone, later }: BoardProps & { task: PickTask }) {
  const [misses, setMisses] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  const [wrong, setWrong] = useState<{ i: number; id: number } | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [placed, setPlaced] = useState(false);
  const right = task.choices.findIndex((c) => c.kind === 'mirror');
  const px = 220;

  const pick = (i: number) => {
    if (solved || placed) return;
    const c = task.choices[i];
    if (c.kind === 'mirror') {
      popBubble(n);
      setPlaced(true);
      setPreview(null);
      setWrong(null);
      onDone(pickRightFeedback(n));
      return;
    }
    setMisses(misses + 1);
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    setWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
    setPreview(i);
    later(() => setPreview((p) => (p === i ? null : p)), BLINK_MS + 400);
    buzz(30);
    say(pickWrongFeedback(c.kind));
  };

  const inFrame = placed ? right : preview;

  return (
    <>
      <div className="mirror-machine">
        <div className="mirror-board mirror-pick">
          <div className="mirror-pick__frame">
            <LampGrid cells={task.shape} size={task.size} color={task.color} px={px} />
          </div>
          <span className={`mirror-glass mirror-glass--v mirror-pick__glass${placed ? ' is-shine' : ''}`} aria-hidden="true" />
          <div className={`mirror-pick__frame mirror-pick__gap${placed ? ' is-right' : inFrame !== null ? ' is-wrong' : ''}`} aria-label={placed ? 'a tükörkép' : 'üres hely'}>
            {inFrame !== null ? <LampGrid cells={task.choices[inFrame].cells} size={task.size} color={task.color} px={px} /> : <span className="seq-gap__mark">?</span>}
            {placed && <DoneTick />}
            {!placed && inFrame !== null && <MissMark />}
          </div>
        </div>
      </div>
      <div className="choices mirror-choices">
        {task.choices.map((c, i) => {
          const isRight = placed && i === right;
          const state = isRight ? ' is-right' : misses >= SHOW_AFTER && i === right && !placed ? ' is-glow' : wrong?.i === i && !placed ? ' is-wrong' : tried.includes(i) || placed ? ' is-tried' : '';
          return (
            <button
              key={`${i}${wrong?.i === i ? `-${wrong.id}` : ''}`}
              type="button"
              className={`choice seq-choice${state}`}
              onClick={() => pick(i)}
              disabled={solved || placed}
              aria-label={`${i + 1}. kártya`}
            >
              <LampGrid cells={c.cells} size={task.size} color={task.color} px={130} />
              {isRight && <DoneTick />}
              {wrong?.i === i && !placed && <MissMark />}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** The machine lit the second half with one place wrong: tap it and it is put right. */
function FixBoard({ task, n, solved, say, onDone }: BoardProps & { task: FixTask }) {
  const { axis, rows, cols } = task;
  const [misses, setMisses] = useState(0);
  const [fixed, setFixed] = useState(false);
  const faultKey = key(task.fault);

  const tap = (p: Cell) => {
    if (solved || fixed) return;
    const lamp = at(task.given, p) ?? at(task.shown, p);
    if (key(p) === faultKey) {
      setFixed(true);
      popBubble(n);
      const found = fixFoundFeedback(task);
      onDone({ ...found, text: `${found.text} ${boardDoneFeedback(n, task.picture).text}`, speech: `${found.speech} ${boardDoneFeedback(n, task.picture).speech}` });
      return;
    }
    const m = misses + 1;
    setMisses(m);
    buzz(30);
    if (lamp && onGivenSide(p, axis, rows, cols)) {
      say(lampFeedback(lamp, axis, rows, cols));
      return;
    }
    say(fixMissFeedback(task, p, m));
  };

  const pair = key(reflect(task.fault, axis, rows, cols));
  const glow = !fixed && misses >= SHOW_FAULT_AFTER;

  const view = (p: Cell): CellView => {
    const k = key(p);
    const isFault = k === faultKey;
    const lamp = at(task.given, p) ?? (isFault ? (fixed ? task.fault.lamp ?? undefined : at(task.shown, p)) : at(task.shown, p));
    return {
      lamp,
      state: isFault && fixed ? ' is-lit' : glow && (isFault || k === pair) ? ' is-glow' : '',
      label: cellLabel(p, lamp),
      children: isFault && fixed ? <DoneTick /> : null
    };
  };

  return (
    <>
      <Board axis={axis} rows={rows} cols={cols} view={view} onTap={tap} shine={fixed} disabled={solved} />
      <div className="mirror-actions" />
    </>
  );
}
