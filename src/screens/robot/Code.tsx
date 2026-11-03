import { useEffect, useMemo, useRef, useState } from 'react';
import { useLadderRound, WinCard } from '../../components/ladderRound';
import { GameShell } from '../../components/GameShell';
import { FitBox } from '../../components/FitBox';
import { useForm } from '../../components/Stage';
import { Bolt, CodeSign } from '../../components/robot';
import { FriendArt } from '../../components/robotParts';
import { GuideBubble } from '../../components/ui';
import {
  SHOW_ANSWER_AFTER,
  SHOW_HIDDEN_AFTER,
  buildCodeRound,
  hiddenFoundFeedback,
  hiddenWrongFeedback,
  keyRowFeedback,
  noteFeedback,
  openFeedback,
  rowFor,
  sameSign,
  showFeedback,
  signName,
  slotFeedback,
  solvedFeedback,
  startFeedback,
  tapFeedback,
  wrongFeedback,
  type CodeFeedback,
  type CodeLevel,
  type CodeTask,
  type KeyRow,
  type Sign
} from '../../games/robot/code';
import { speak } from '../../lib/speech';
import { buzz, chime, fanfare, popBubble, robotChirp } from '../../lib/sound';
import { useProgress } from '../../state/progress';
import { ROUND_HELP_AFTER } from '../../state/taskLog';

/** After the lock opens, the open crate stays a moment so the child sees it, then the next task comes. */
const NEXT_TASK_MS = 3000;
/** A wrong button sits in the slot this long, so the child sees it does not fit, then pops back out. */
const PREVIEW_MS = 1300;

// The machine, in drawing units (FitBox scales it on phones). An upright phone folds it: what does not fit
// beside the crate (the key, the note) goes above it, so it can be drawn bigger.
const MACHINE_W = 1060;
const MACHINE_H = 340;
const FOLDED_W = 620;
const FOLDED_H = 720;

function SignPic({ sign, size }: { sign: Sign; size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100">
      <CodeSign sign={sign} />
    </svg>
  );
}

/** Orange badge on a wrong button: a cross, the counterpart of the green tick. */
function MissMark() {
  return (
    <span className="seq-miss" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    </span>
  );
}

function KeyArrow() {
  return (
    <svg aria-hidden="true" width="28" height="22" viewBox="0 0 30 24">
      <path d="M3 12h20M16 5l7 7-7 7" stroke="#3E5872" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Kódzár: read the code on the lock, press the keypad, and the crate opens. */
export function Code({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level: levelIndex, win: solve, meter, levelUp } = useLadderRound('code');
  const round = useMemo(() => buildCodeRound(levelIndex, progress.codeRound), [levelIndex, progress.codeRound]);
  const first = progress.codeSolved === 0;
  const [taskIdx, setTaskIdx] = useState(0);
  const [fb, setFb] = useState<CodeFeedback>(() => startFeedback(round.level, round.tasks[0], first));
  const [solved, setSolved] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  /** Corrections, glows and "Mutasd!" this round; enough of them and the round needed help. */
  const oops = useRef(0);
  const say = (f: CodeFeedback) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };
  const noteHelp = () => {
    oops.current += 1;
  };

  useEffect(() => {
    speak(startFeedback(round.level, round.tasks[0], first).speech);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // One round per mount: App keys this screen by round.
  }, []);

  const done = (right: CodeFeedback) => {
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
      game="code"
      className="screen--code"
      title="Kódzár"
      meter={meter}
      justSolved={solved}
      levelUp={levelUp}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="seq-guide code-guide">
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
      </div>

      <ol className="sort-odd__dots seq-dots" aria-label={`${taskIdx + 1}. feladat a ${round.tasks.length}-ből`}>
        {round.tasks.map((_, i) => (
          <li key={i} className={`sort-odd__dot${i < taskIdx || (i === taskIdx && solved) ? ' is-done' : i === taskIdx ? ' is-now' : ''}`} />
        ))}
      </ol>

      <Task key={taskIdx} level={round.level} task={round.tasks[taskIdx]} n={taskIdx} solved={solved} say={say} noteHelp={noteHelp} onDone={done} later={later} />

      {solved && (
        <WinCard onNext={levelUp.advance} />
      )}

    </GameShell>
  );
}

interface TaskProps {
  level: CodeLevel;
  task: CodeTask;
  /** Which task of the round, so the praise varies. */
  n: number;
  solved: boolean;
  say: (f: CodeFeedback) => void;
  /** A glow or "Mutasd!" was used: it counts towards the round needing help. */
  noteHelp: () => void;
  onDone: (right: CodeFeedback) => void;
  later: (fn: () => void, ms: number) => void;
}

/** One lock: the code key, the crate (or the transmitter) and the keypad. */
function Task({ level, task, n, solved, say, noteHelp, onDone, later }: TaskProps) {
  const kind = level.kind;
  const send = kind === 'send';
  const fold = useForm() === 'portrait';
  const [w, h] = fold ? [FOLDED_W, FOLDED_H] : [MACHINE_W, MACHINE_H];
  const hidden = task.hidden;
  /** Slots filled so far, left to right. */
  const [filled, setFilled] = useState(0);
  const [misses, setMisses] = useState(0);
  /** Buttons already tried for this slot: they stay dimmed, so the child sees what is left. */
  const [tried, setTried] = useState<number[]>([]);
  /** The button just pressed by mistake; its id restarts the wobble on every miss. */
  const [wrong, setWrong] = useState<{ i: number; id: number } | null>(null);
  /** A wrong sign shown in the slot for a moment. */
  const [preview, setPreview] = useState<Sign | null>(null);
  /** The key row to look at, glowing once; its id restarts the glow. */
  const [rowGlow, setRowGlow] = useState<{ row: number; id: number } | null>(null);
  /** "Mutasd!" for this slot: the sign, its key row and the right button glow until the slot is filled. */
  const [showing, setShowing] = useState(false);
  const [opened, setOpened] = useState(false);
  // Hiányzó jel: the covered row's meaning picked from three cards first.
  const [found, setFound] = useState(!hidden);
  const [hiddenMisses, setHiddenMisses] = useState(0);
  const [hiddenTried, setHiddenTried] = useState<number[]>([]);
  const [hiddenWrong, setHiddenWrong] = useState<{ i: number; id: number } | null>(null);
  const [hiddenShow, setHiddenShow] = useState(false);

  const slot = filled;
  const asking = found && !opened && !solved;
  const right = asking ? task.keypad.findIndex((k) => sameSign(k, task.answer[slot])) : -1;
  const glowButton = asking && (misses >= SHOW_ANSWER_AFTER || showing) ? right : -1;
  const currentRow = task.key.length && !opened ? rowFor(task, slot, kind) : -1;
  const hiddenRight = hidden ? hidden.choices.findIndex((c) => sameSign(c, task.key[hidden.row].meaning)) : -1;
  const glowHidden = !found && (hiddenMisses >= SHOW_HIDDEN_AFTER || hiddenShow) ? hiddenRight : -1;
  // Pöttykód's key is a reminder only: faded until "Mutasd!" or a miss lights its row.
  const fadedKey = kind === 'dots';

  const glowRow = (row: number) => {
    if (row >= 0) setRowGlow((g) => ({ row, id: (g?.id ?? 0) + 1 }));
  };

  const press = (i: number) => {
    if (!asking) return;
    const want = task.answer[slot];
    const s = task.keypad[i];
    if (sameSign(s, want)) {
      popBubble(slot);
      setFilled(slot + 1);
      setMisses(0);
      setTried([]);
      setWrong(null);
      setPreview(null);
      setShowing(false);
      setRowGlow(null);
      if (slot + 1 === task.code.length) {
        setOpened(true);
        robotChirp();
        onDone(openFeedback(level, task, n));
      } else {
        say(slotFeedback(want));
      }
      return;
    }
    const m = misses + 1;
    setMisses(m);
    if (m >= SHOW_ANSWER_AFTER) noteHelp();
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    setWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
    setPreview(s);
    later(() => setPreview((p) => (p === s ? null : p)), PREVIEW_MS);
    glowRow(currentRow);
    buzz(30);
    say(wrongFeedback(level, task, slot));
  };

  const pickHidden = (i: number) => {
    if (found || solved || !hidden) return;
    const c = hidden.choices[i];
    if (i === hiddenRight) {
      popBubble(n);
      setFound(true);
      say(hiddenFoundFeedback(task));
      return;
    }
    const m = hiddenMisses + 1;
    setHiddenMisses(m);
    if (m >= SHOW_HIDDEN_AFTER) noteHelp();
    setHiddenTried((t) => (t.includes(i) ? t : [...t, i]));
    setHiddenWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
    buzz(30);
    say(hiddenWrongFeedback(task, c));
  };

  const show = () => {
    noteHelp();
    if (!found) {
      setHiddenShow(true);
      say(noteFeedback(task));
      return;
    }
    setShowing(true);
    glowRow(currentRow);
    say(showFeedback(level, task, slot));
  };

  const tapRow = (r: number, row: KeyRow) => say(keyRowFeedback(!found && hidden?.row === r ? null : row));

  const keyBoard = task.key.length > 0 && (
    <div className={`code-key${fadedKey ? ' code-key--faded' : ''}`} aria-label="Kódtábla">
      <span className="code-key__head">Kódtábla</span>
      {task.key.map((row, r) => {
        const covered = !found && hidden?.row === r;
        const lit = (rowGlow?.row === r && !opened) || (showing && r === currentRow) || (covered && hiddenShow);
        return (
          <button
            key={`${r}-${lit ? rowGlow?.id ?? 0 : 'off'}`}
            type="button"
            className={`code-key__row${lit ? ' is-glow' : ''}${covered ? ' is-covered' : ''}`}
            onClick={() => tapRow(r, row)}
            aria-label={covered ? `${signName(row.sign)}: le van takarva` : `${signName(row.sign)}: ${signName(row.meaning)}`}
          >
            <SignPic sign={row.sign} size={52} />
            <KeyArrow />
            {covered ? <span className="code-key__cover">?</span> : <SignPic sign={row.meaning} size={52} />}
          </button>
        );
      })}
    </div>
  );

  const note = hidden && (
    <button type="button" className={`code-note${hiddenShow && !found ? ' is-glow' : ''}`} onClick={() => say(noteFeedback(task))} aria-label="Cetli">
      <span className="code-note__pin" aria-hidden="true" />
      <span className="code-note__row">
        {hidden.note.map((r, i) => (
          <SignPic key={i} sign={r.sign} size={56} />
        ))}
      </span>
      <svg aria-hidden="true" width="22" height="28" viewBox="0 0 24 30">
        <path d="M12 3v22M5 18l7 7 7-7" stroke="#3E5872" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="code-note__row">
        {hidden.note.map((r, i) => (
          <SignPic key={i} sign={r.meaning} size={56} />
        ))}
      </span>
    </button>
  );

  const lock = (
    <div className="code-lock">
      <div className="code-lock__code">
        {task.code.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`code-sign${showing && i === slot && !opened ? ' is-glow' : ''}`}
            onClick={() => say(tapFeedback(s))}
            aria-label={signName(s)}
          >
            <SignPic sign={s} size={64} />
          </button>
        ))}
      </div>
      <div className="code-lock__slots">
        {task.code.map((_, i) => {
          const done = i < filled;
          const now = i === slot && found && !opened;
          const shown = done ? task.answer[i] : now && preview ? preview : null;
          return (
            <span
              key={i}
              className={`code-slot${done ? ' is-right' : now ? (preview ? ' is-wrong' : ' is-now') : ''}`}
              aria-label={done ? signName(task.answer[i]) : now ? 'ide jön a következő' : 'üres hely'}
            >
              {shown ? <SignPic sign={shown} size={58} /> : now ? <span className="code-slot__mark">?</span> : null}
              {now && preview && <MissMark />}
            </span>
          );
        })}
      </div>
    </div>
  );

  const machine = send ? (
    <div className={`code-radio${opened ? ' is-sent' : ''}`}>
      <span className="code-radio__antenna" aria-hidden="true" />
      {lock}
    </div>
  ) : (
    <div className={`code-crate${opened ? ' is-open' : ''}`}>
      <svg className="code-crate__shackle" aria-hidden="true" width="96" height="70" viewBox="0 0 96 70">
        <path d="M14 70 V40 a34 34 0 0 1 68 0 V70" fill="none" stroke="#3E5872" strokeWidth="22" />
        <path d="M14 70 V40 a34 34 0 0 1 68 0 V70" fill="none" stroke="#8FA3B8" strokeWidth="11" />
      </svg>
      <span className="code-crate__inside" aria-hidden="true" />
      {opened && (
        <span className="code-crate__bolt" aria-hidden="true">
          <Bolt size={70} />
        </span>
      )}
      <span className="code-crate__lid" aria-hidden="true" />
      {lock}
    </div>
  );

  const showButton = !opened && !solved && (
    <button type="button" className="peek-btn peek-btn--robot code-show" onClick={show}>
      Mutasd!
    </button>
  );

  return (
    <>
      <div className="code-machine">
        <FitBox className="code-fit" width={w} height={h}>
          <div className={`code-stage${fold ? ' code-stage--fold' : ''}`} style={{ width: w, height: h }}>
            {keyBoard}
            {note}
            {machine}
            {send && (
              <div className={`code-dog${opened ? ' is-got' : ''}`} aria-label="Kutyabot">
                {opened && (
                  <span className="code-dog__got" aria-hidden="true">
                    <SignPic sign={task.code[0]} size={56} />
                  </span>
                )}
                <FriendArt id="dog" width={130} />
              </div>
            )}
          </div>
        </FitBox>
      </div>

      {found ? (
        <div className={`choices code-pad${task.keypad.length > 3 ? ' code-pad--four' : ''}`} aria-hidden={!asking}>
          {task.keypad.map((k, i) => {
            const isGlow = glowButton === i;
            const state = isGlow ? ' is-glow' : wrong?.i === i ? ' is-wrong' : tried.includes(i) ? ' is-tried' : '';
            return (
              <button key={`${i}${wrong?.i === i ? `-${wrong.id}` : ''}`} type="button" className={`choice seq-choice code-btn${state}`} onClick={() => press(i)} disabled={!asking} aria-label={signName(k)}>
                <SignPic sign={k} size={104} />
                {wrong?.i === i && preview && <MissMark />}
              </button>
            );
          })}
          {showButton}
        </div>
      ) : (
        <div className="choices code-pad">
          {hidden!.choices.map((c, i) => {
            const state = glowHidden === i ? ' is-glow' : hiddenWrong?.i === i ? ' is-wrong' : hiddenTried.includes(i) ? ' is-tried' : '';
            return (
              <button key={`${i}${hiddenWrong?.i === i ? `-${hiddenWrong.id}` : ''}`} type="button" className={`choice seq-choice code-btn${state}`} onClick={() => pickHidden(i)} disabled={solved} aria-label={signName(c)}>
                <SignPic sign={c} size={104} />
              </button>
            );
          })}
          {showButton}
        </div>
      )}
    </>
  );
}
