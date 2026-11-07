import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLadderRound, WinCard } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { FitBox } from '../../../components/FitBox';
import { ArrowTile, BlockStack, SortPart } from '../art';
import { DoneTick, GuideBubble } from '../../../components/ui';
import {
  SHOW_ANSWER_AFTER,
  SHOW_WRONG_AFTER,
  buildSeqRound,
  fixMissFeedback,
  foundFeedback,
  itemFeedback,
  label,
  rightFeedback,
  sameItem,
  solvedFeedback,
  startFeedback,
  wrongFeedback,
  type Item,
  type SeqFeedback,
  type SeqLevel,
  type SeqTask,
} from '../games/seq';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare, popBubble } from '../../../lib/sound';
import { useProgress } from '../../../state/progress';
import { ROUND_HELP_AFTER } from '../../../state/taskLog';

/** After the gap is filled, the finished row stays a moment so the child sees it, then the next task comes. */
const NEXT_TASK_MS = 3000;
/** A wrong pick sits in the gap this long, so the child sees it does not fit, then goes back. */
const PREVIEW_MS = 1300;

// The belt, in drawing units (FitBox scales it on phones).
const BELT_W = 1000;
const BELT_PAD = 40;
const GAP = 14;
/** Biggest slot for parts and arrows; towers are twice as tall as wide, so their slots stay narrower. */
const MAX_SLOT = 124;
const MAX_TOWER = 100;
const RAIL_H = 34;
/** Room under the row for the repeat brackets. */
const BRACKET_H = 30;

function ItemPic({ item, size }: { item: Item; size: number }) {
  if (item.kind === 'stack') {
    return (
      <svg aria-hidden="true" width={size} height={size * 2} viewBox="0 0 100 200">
        <BlockStack n={item.n} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100">
      {item.kind === 'part' ? <SortPart part={{ color: item.color, shape: item.shape, size: 'big' }} /> : <ArrowTile dir={item.dir} color={item.color} />}
    </svg>
  );
}

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

/** Mintagép: carry on the pattern on the belt, or find the part that does not fit. */
export function Seq({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level: levelIndex, win: solve, meter, goNext } = useLadderRound('seq');
  const round = useMemo(() => buildSeqRound(levelIndex, progress.seqRound), [levelIndex, progress.seqRound]);
  const first = progress.seqSolved === 0;
  const [taskIdx, setTaskIdx] = useState(0);
  const [fb, setFb] = useState<SeqFeedback>(() => startFeedback(round.level, round.tasks[0], first));
  const [solved, setSolved] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  /** Corrections Csavar gave this round; enough of them and the round needed help (parents' notes). */
  const oops = useRef(0);
  const say = (f: SeqFeedback) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };

  useEffect(() => {
    speak(startFeedback(round.level, round.tasks[0], first).speech);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);

  const done = (right: SeqFeedback) => {
    const last = taskIdx === round.tasks.length - 1;
    if (!last) {
      chime();
      say(right);
      later(() => {
        const next = startFeedback(round.level, round.tasks[taskIdx + 1], false);
        setTaskIdx(taskIdx + 1);
        // Only the short line: the child heard the whole instruction at the start of the round.
        say({ ...next, speech: next.text });
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


  return (
    <GameShell
      game="seq"
      className="screen--seq"
      title={round.level.kind === 'fix' ? 'Hibavadász' : 'Mintagép'}
      meter={meter}
      justSolved={solved}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="seq-guide">
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
      </div>

      <ol className="sort-odd__dots seq-dots" aria-label={`${taskIdx + 1}. feladat a ${round.tasks.length}-ből`}>
        {round.tasks.map((_, i) => (
          <li key={i} className={`sort-odd__dot${i < taskIdx || (i === taskIdx && solved) ? ' is-done' : i === taskIdx ? ' is-now' : ''}`} />
        ))}
      </ol>

      <Task key={taskIdx} level={round.level} task={round.tasks[taskIdx]} n={taskIdx} solved={solved} say={say} onDone={done} later={later} />

      {solved && (
        <WinCard onNext={goNext} />
      )}

    </GameShell>
  );
}

interface TaskProps {
  level: SeqLevel;
  task: SeqTask;
  /** Which task of the round, so the praise varies. */
  n: number;
  solved: boolean;
  say: (f: SeqFeedback) => void;
  onDone: (right: SeqFeedback) => void;
  later: (fn: () => void, ms: number) => void;
}

/** One row on the belt and the three parts to choose from. */
function Task({ level, task, n, solved, say, onDone, later }: TaskProps) {
  const fix = task.mode === 'fix';
  /** Hibavadász: the part out of place has been tapped, and its place is now the gap. */
  const [found, setFound] = useState(false);
  const [misses, setMisses] = useState(0);
  const [rowMisses, setRowMisses] = useState(0);
  /** The choice just picked by mistake; its id restarts the wobble on every miss. */
  const [wrong, setWrong] = useState<{ i: number; id: number } | null>(null);
  /** A wrong pick shown in the gap for a moment. */
  const [preview, setPreview] = useState<Item | null>(null);
  /** Choices already tried: they stay dimmed, so the child sees what is left. */
  const [tried, setTried] = useState<number[]>([]);
  const [placed, setPlaced] = useState(false);

  const tower = task.answer.kind === 'stack';
  const gapAt = fix ? task.wrong : task.row.length;
  const slots = Math.max(fix ? task.row.length : task.row.length + 1, task.ref?.length ?? 0);
  const size = Math.min(tower ? MAX_TOWER : MAX_SLOT, Math.floor((BELT_W - 2 * BELT_PAD - GAP * (slots - 1)) / slots));
  const itemH = tower ? size * 2 : size;
  const showBrackets = task.unit > 0 && (misses > 0 || rowMisses > 1) && !placed;
  const asking = !fix || found;
  const glowChoice = misses >= SHOW_ANSWER_AFTER && !placed ? task.choices.findIndex((c) => sameItem(c, task.answer)) : -1;
  const glowWrong = fix && !found && rowMisses >= SHOW_WRONG_AFTER;
  const rowW = slots * size + (slots - 1) * GAP;
  const beltH = (task.ref ? size + 18 : 0) + itemH + RAIL_H + BRACKET_H + 16;

  const tapItem = (i: number) => {
    if (solved || placed) return;
    const item = task.row[i];
    if (!fix || found) {
      say(itemFeedback(item));
      return;
    }
    if (i === task.wrong) {
      setFound(true);
      chime();
      say(foundFeedback());
      return;
    }
    const m = rowMisses + 1;
    setRowMisses(m);
    buzz(30);
    say(fixMissFeedback(task, m));
  };

  const pick = (i: number) => {
    if (solved || placed || !asking) return;
    const c = task.choices[i];
    if (sameItem(c, task.answer)) {
      popBubble(n);
      setPlaced(true);
      setPreview(null);
      setWrong(null);
      onDone(rightFeedback(task, n));
      return;
    }
    setMisses(misses + 1);
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    setWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
    setPreview(c);
    later(() => setPreview((p) => (p === c ? null : p)), PREVIEW_MS);
    buzz(30);
    say(wrongFeedback(level, task));
  };

  const gap = (
    <div key="gap" className={`seq-gap${placed ? ' is-right' : preview ? ' is-wrong' : ''}`} style={{ width: size, height: itemH }} aria-label={placed ? label(task.answer) : 'üres hely'}>
      {placed ? <ItemPic item={task.answer} size={size - 16} /> : preview ? <ItemPic item={preview} size={size - 16} /> : <span className="seq-gap__mark">?</span>}
      {placed && <DoneTick />}
      {preview && !placed && <MissMark />}
      {fix && !placed && (
        <span className="seq-lifted" aria-hidden="true">
          <ItemPic item={task.row[task.wrong]} size={Math.round(size * 0.55)} />
        </span>
      )}
    </div>
  );

  const brackets: { x: number; w: number; open: boolean }[] = [];
  if (showBrackets) {
    const upto = fix ? task.row.length : task.row.length + 1;
    for (let g = 0; g * task.unit < upto; g++) {
      const from = g * task.unit;
      const count = Math.min(task.unit, upto - from);
      brackets.push({ x: from * (size + GAP), w: count * size + (count - 1) * GAP, open: gapAt >= from && gapAt < from + task.unit });
    }
  }

  return (
    <>
      <div className="seq-machine">
        <FitBox className="seq-fit" width={BELT_W} height={beltH}>
          <div className="seq-belt" style={{ width: BELT_W, height: beltH } as CSSProperties}>
            <div className="seq-rows" style={{ width: rowW }}>
              {task.ref && (
                <div className="seq-row seq-row--ref" aria-label={`A minta színekkel: ${task.ref.map(label).join(', ')}`}>
                  {task.ref.map((it, i) => (
                    <button key={i} type="button" className="seq-item" style={{ width: size, height: size }} onClick={() => say(itemFeedback(it))} aria-label={label(it)}>
                      <ItemPic item={it} size={size - 10} />
                    </button>
                  ))}
                </div>
              )}
              <div className="seq-row" style={{ height: itemH }}>
                {task.row.map((it, i) => {
                  if (i === gapAt && (found || placed)) return gap;
                  const state = glowWrong && i === task.wrong ? ' is-glow' : '';
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`seq-item${state}`}
                      style={{ width: size, height: itemH }}
                      onClick={() => tapItem(i)}
                      disabled={solved}
                      aria-label={fix && !found ? `${label(it)}: ez nem illik ide?` : label(it)}
                    >
                      <ItemPic item={it} size={size} />
                    </button>
                  );
                })}
                {!fix && gap}
                {brackets.map((b, i) => (
                  <span key={i} className={`seq-bracket${b.open ? ' is-open' : ''}`} style={{ left: b.x, width: b.w }} aria-hidden="true" />
                ))}
              </div>
            </div>
            <span className="seq-rail" aria-hidden="true" />
          </div>
        </FitBox>
      </div>

      <div className={`choices seq-choices${tower ? ' seq-choices--tower' : ''}`} aria-hidden={!asking}>
        {asking &&
          task.choices.map((c, i) => {
            const right = placed && sameItem(c, task.answer);
            const state = right ? ' is-right' : glowChoice === i ? ' is-glow' : wrong?.i === i && !placed ? ' is-wrong' : tried.includes(i) || placed ? ' is-tried' : '';
            return (
              <button
                key={`${i}${wrong?.i === i ? `-${wrong.id}` : ''}`}
                type="button"
                className={`choice seq-choice${state}`}
                onClick={() => pick(i)}
                disabled={solved || placed}
                aria-label={label(c)}
              >
                <ItemPic item={c} size={tower ? 84 : 120} />
                {right && <DoneTick />}
                {wrong?.i === i && !placed && <MissMark />}
              </button>
            );
          })}
      </div>
    </>
  );
}
