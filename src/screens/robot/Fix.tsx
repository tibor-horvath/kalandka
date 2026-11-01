import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CELL, FRAME_H, FRAME_W, FloorCrates, FloorRobot, FloorTiles, useRover } from '../../components/floor';
import { LevelMeter, LevelUpCard, useLevelUp } from '../../components/LevelMeter';
import { FitBox } from '../../components/FitBox';
import { Battery, Bolt, CmdIcon } from '../../components/robot';
import { BackIcon, GuideBubble, NextIcon, PlayIcon, RoundButton, SpeakerIcon } from '../../components/ui';
import {
  ONE_MORE_FEEDBACK,
  SHOW_CARD_FEEDBACK,
  SHOW_CHOICE_FEEDBACK,
  SHOW_FIX_AFTER,
  buildFixRound,
  fixChoices,
  fixedFeedback,
  foundFeedback,
  goodCardFeedback,
  ranFeedback,
  sameCard,
  solvedFeedback,
  startFeedback,
  wrongPickFeedback,
  type FixFeedback,
  type FixLevel,
  type FixTask
} from '../../games/robot/fix';
import { CMD_LABELS, run, type Card, type Cell, type RunResult } from '../../games/robot/path';
import { speak } from '../../lib/speech';
import { buzz, chime, fanfare, popBubble } from '../../lib/sound';
import { EASIER_SPEECH, LADDER_RULES, afterSolve, ladderMeter, ladderOf, withLadder, type LadderStep } from '../../state/ladder';
import { useProgress } from '../../state/progress';
import { logTask, ROUND_HELP_AFTER } from '../../state/taskLog';

/** Time per robot step while a program runs: room to turn first, then drive. */
const STEP_MS = 600;
/** The robot stays where the program left it for this long, then rolls back to the start. */
const BACK_MS = 1300;
/** After the robot reaches the battery it stays a moment, then the next task comes. */
const NEXT_TASK_MS = 2800;

const cardName = (c: Card) => `${CMD_LABELS[c.cmd]}${c.times > 1 ? `, ${c.times}-szor` : ''}`;

/** Hibakereső: run the broken program, find the card that is to blame, put it right. */
export function Fix({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  // The ladder when this round started: the round keeps its level even after its win steps up or down.
  const [startLadder] = useState(() => ladderOf(progress, 'fix'));
  const levelIndex = startLadder.level;
  /** This round's win on the ladder: the meter shows it, and it may step up or down. */
  const [step, setStep] = useState<LadderStep | null>(null);
  const round = useMemo(() => buildFixRound(levelIndex, progress.fixRound), [levelIndex, progress.fixRound]);
  const [taskIdx, setTaskIdx] = useState(0);
  const [fb, setFb] = useState<FixFeedback>(() => startFeedback(round.level));
  const [solved, setSolved] = useState(false);
  const rewarded = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Corrections, glows and "Mutasd!" this round; enough of them and the round needed help. */
  const oops = useRef(0);
  const say = (f: FixFeedback) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };
  const helped = () => {
    oops.current += 1;
  };

  useEffect(() => {
    speak(startFeedback(round.level).speech);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // One round per mount: App keys this screen by round.
  }, []);

  const done = () => {
    const right = fixedFeedback(taskIdx);
    if (taskIdx < round.tasks.length - 1) {
      chime();
      say(right);
      later(() => {
        const next = startFeedback(round.level);
        setTaskIdx(taskIdx + 1);
        // Only the short line: the child heard the whole instruction at the start of the round.
        say({ ...next, speech: next.text });
      }, NEXT_TASK_MS);
      return;
    }
    const win = solvedFeedback();
    setSolved(true);
    fanfare();
    buzz(40);
    say({ ...win, speech: `${right.speech} ${win.speech}` });
    if (!rewarded.current) {
      rewarded.current = true;
      const needed = oops.current >= ROUND_HELP_AFTER;
      const s = afterSolve(startLadder, LADDER_RULES.fix, needed);
      setStep(s);
      if (s.change === 'down') speak(EASIER_SPEECH, { queue: true });
      update((p) => withLadder(logTask({ ...p, bolts: p.bolts + 1, fixSolved: p.fixSolved + 1 }, 'fix', needed), 'fix', s.ladder));
    }
  };

  const next = () => update((p) => ({ ...p, fixRound: p.fixRound + 1 }));
  const meter = ladderMeter(startLadder, LADDER_RULES.fix, step);
  const levelUp = useLevelUp(meter, next);

  return (
    <div className="screen screen--path screen--fix world--robot">
      <div className="floor" aria-hidden="true" />

      <header className="topbar topbar--meter">
        <RoundButton label="Vissza a műhelybe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="topbar__title">
          <h1 className="screen-title">Hibakereső</h1>
          <LevelMeter meter={meter} world="robot" justSolved={solved} />
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(fb.speech)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <Task key={taskIdx} level={round.level} task={round.tasks[taskIdx]} solved={solved} say={say} helped={helped} onDone={done} later={later}>
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
        <ol className="sort-odd__dots seq-dots" aria-label={`${taskIdx + 1}. feladat a ${round.tasks.length}-ből`}>
          {round.tasks.map((_, i) => (
            <li key={i} className={`sort-odd__dot${i < taskIdx || (i === taskIdx && solved) ? ' is-done' : i === taskIdx ? ' is-now' : ''}`} />
          ))}
        </ol>
      </Task>

      {solved && (
        <div className="path-win sort-win" role="status">
          <span className="path-win__rays" aria-hidden="true" />
          <span className="path-win__title">Kész!</span>
          <span className="path-win__reward">
            +1 <Bolt size={34} /> csavar
          </span>
          <button type="button" className="big-btn big-btn--robot" onClick={levelUp.advance}>
            Következő kör <NextIcon />
          </button>
        </div>
      )}

      {levelUp.open && <LevelUpCard meter={meter} world="robot" onNext={levelUp.finish} />}
    </div>
  );
}

interface TaskProps {
  level: FixLevel;
  task: FixTask;
  solved: boolean;
  say: (f: FixFeedback) => void;
  /** A glow or "Mutasd!" was used: it counts towards the round needing help. */
  helped: () => void;
  onDone: () => void;
  later: (fn: () => void, ms: number) => void;
  /** Csavar's bubble and the task dots, above the program. */
  children: ReactNode;
}

/** One broken program: the floor, the cards, and what goes in the wrong card's place. */
function Task({ level, task, solved, say, helped, onDone, later, children }: TaskProps) {
  const { course } = task;
  const rover = useRover(course.start, later);
  const [cards, setCards] = useState(task.program);
  /** Wrong cards still to find. */
  const [bugs, setBugs] = useState(task.bugs);
  /** The wrong card the child found: what goes in its place comes next. */
  const [open, setOpen] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  /** Where the robot went on its last run, so the child can see where it left the way. */
  const [trail, setTrail] = useState<Cell[]>([]);
  const [charged, setCharged] = useState(false);
  /** Cards put right so far. */
  const [mended, setMended] = useState<number[]>([]);
  /** Fine cards tapped since the last find: they stay dimmed. */
  const [tried, setTried] = useState<number[]>([]);
  /** The card just tapped by mistake; its id restarts the wobble on every miss. */
  const [wrong, setWrong] = useState<{ i: number; id: number } | null>(null);
  const [misses, setMisses] = useState(0);
  /** Choices already tried for the open card. */
  const [triedChoices, setTriedChoices] = useState<Card[]>([]);
  /** "Mutasd!" for this step: the card or the choice glows until it is used. */
  const [showing, setShowing] = useState(false);
  /** The child asked to see the way: the dots stay for this task. */
  const [sawWay, setSawWay] = useState(false);

  const finished = charged || solved;
  const looking = open === null && !running && !finished;
  const dots = level.dots || sawWay;
  const glowing = misses >= SHOW_FIX_AFTER || showing;
  const glowCard = glowing && looking ? bugs[0]?.at ?? -1 : -1;
  const openBug = bugs.find((b) => b.at === open);

  /** Runs a program from the start; `then` gets the result where the robot stopped. */
  const go = (program: Card[], then: (r: RunResult) => void) => {
    setRunning(true);
    setTrail([]);
    setWrong(null);
    const result = run(course, program);
    result.frames.forEach((f, i) => {
      later(() => {
        const before = rover.live.current;
        setActiveCard(f.card);
        rover.moveTo(f.pose);
        if (f.bumped) rover.bump(f.pose.dir, f.bumped);
        else if (before.x !== f.pose.x || before.y !== f.pose.y) {
          popBubble(i);
          setTrail((t) => [...t, f.pose]);
        }
      }, (i + 1) * STEP_MS);
    });
    later(() => {
      setActiveCard(null);
      then(result);
      if (result.outcome === 'goal') return;
      later(() => {
        rover.moveTo(course.start);
        setRunning(false);
      }, BACK_MS);
    }, (result.frames.length + 1) * STEP_MS);
  };

  const reached = () => {
    setRunning(false);
    setCharged(true);
    onDone();
  };

  const play = () => {
    if (!looking) return;
    go(cards, () => say(ranFeedback(level)));
  };

  const tapCard = (i: number) => {
    if (!looking) return;
    const bug = bugs.find((b) => b.at === i);
    if (!bug) {
      const m = misses + 1;
      setMisses(m);
      if (m === SHOW_FIX_AFTER) helped();
      setTried((t) => (t.includes(i) ? t : [...t, i]));
      setWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
      buzz(30);
      say(goodCardFeedback(i, bugs));
      return;
    }
    popBubble(2);
    setMisses(0);
    setTried([]);
    setWrong(null);
    setShowing(false);
    say(foundFeedback(level));
    if (bug.want) {
      setOpen(i);
      return;
    }
    // A card too many just comes out, and the robot tries again.
    const next = cards.filter((_, k) => k !== i);
    setCards(next);
    setBugs([]);
    go(next, reached);
  };

  const pick = (c: Card) => {
    if (open === null || running || !openBug) return;
    const at = open;
    const next = cards.map((k, i) => (i === at ? c : k));
    popBubble(3);
    setCards(next);
    if (sameCard(c, openBug.want!)) {
      const left = bugs.filter((b) => b !== openBug);
      setBugs(left);
      setOpen(null);
      setMended((m) => [...m, at]);
      setTriedChoices([]);
      setMisses(0);
      setShowing(false);
      go(next, left.length ? () => say(ONE_MORE_FEEDBACK) : reached);
      return;
    }
    // The robot tries the child's card: they see for themselves that it does not get there.
    const m = misses + 1;
    setMisses(m);
    if (m === SHOW_FIX_AFTER) helped();
    setTriedChoices((t) => [...t, c]);
    const before = cards;
    go(next, () => {
      setCards(before);
      say(wrongPickFeedback(level));
    });
  };

  const show = () => {
    if (running || finished) return;
    helped();
    setShowing(true);
    setSawWay(true);
    say(open === null ? SHOW_CARD_FEEDBACK : SHOW_CHOICE_FEEDBACK);
  };

  const cardState = (i: number) => {
    if (activeCard === i) return ' is-now';
    if (open === i) return ' is-open';
    if (mended.includes(i)) return ' is-fixed';
    if (glowCard === i) return ' is-glow';
    if (wrong?.i === i) return ' is-wrong';
    return tried.includes(i) ? ' is-tried' : '';
  };

  return (
    <div className="path-body is-plan">
      <div className="path-left">
        <FitBox className="path-fit" width={FRAME_W} height={FRAME_H}>
          <div className="path-frame">
            <div className={`path-board${finished ? ' is-done' : ''}`}>
              <svg
                width={course.cols * CELL}
                height={course.rows * CELL}
                viewBox={`0 0 ${course.cols * CELL} ${course.rows * CELL}`}
                role="img"
                aria-label={`Pálya: ${course.cols} × ${course.rows} mező, ${course.crates.length} doboz. A robot a(z) ${rover.pose.x + 1}. oszlopban, ${rover.pose.y + 1}. sorban áll. Elem: ${course.goals[0].x + 1}. oszlop, ${course.goals[0].y + 1}. sor.`}
              >
                <FloorTiles cols={course.cols} rows={course.rows} />
                <rect x={course.start.x * CELL + 10} y={course.start.y * CELL + 10} width={CELL - 20} height={CELL - 20} rx="12" className="path-start" />
                {dots &&
                  task.route.slice(1).map((c, i) => (
                    <circle key={`${c.x},${c.y}`} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="11" className="path-route" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                {trail.map((c, i) => (
                  <circle key={i} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="7" className="fix-trail" />
                ))}
                <FloorCrates crates={course.crates} hit={rover.hit} />
                {course.goals.map((g, i) => (
                  <g key={i} transform={`translate(${g.x * CELL} ${g.y * CELL})`} className={charged ? 'path-battery is-charged' : 'path-battery'}>
                    <Battery charged={charged} />
                  </g>
                ))}
              </svg>
              <FloorRobot rover={rover} happy={finished} />
            </div>
          </div>
        </FitBox>
      </div>

      <div className="path-side">
        {children}

        <ol className="path-program fix-program" aria-label={`Program: ${cards.length} kártya`} style={{ '--slots': cards.length } as CSSProperties}>
          {cards.map((card, i) => (
            <li key={`${i}-${cards.length}`} className="path-slot">
              <button
                key={`${card.cmd}${card.times}${wrong?.i === i ? `-${wrong.id}` : ''}`}
                type="button"
                className={`path-card${cardState(i)}`}
                onClick={() => tapCard(i)}
                disabled={!looking}
                aria-label={`${i + 1}. kártya: ${cardName(card)}. Koppints rá, ha ez a hibás.`}
              >
                <span className="path-card__no">{i + 1}</span>
                <CmdIcon cmd={card.cmd} size={40} />
                {(card.times > 1 || level.kind === 'times') && <span className="path-card__times">×{card.times}</span>}
              </button>
            </li>
          ))}
        </ol>

        {open !== null && openBug && (
          <div className={`path-palette path-palette--${level.moves}`}>
            {fixChoices(level, task.program[open]).map((c) => {
              const used = sameCard(c, task.program[open]) || triedChoices.some((t) => sameCard(t, c));
              const glow = glowing && !running && sameCard(c, openBug.want!);
              return level.kind === 'times' ? (
                <button key={c.times} type="button" className={`path-cmd path-cmd--times${glow ? ' is-glow' : ''}`} onClick={() => pick(c)} disabled={running || used} aria-label={`${c.times}-szor`}>
                  <span className="path-cmd__times">×{c.times}</span>
                </button>
              ) : (
                <button key={c.cmd} type="button" className={`path-cmd path-cmd--${c.cmd}${glow ? ' is-glow' : ''}`} onClick={() => pick(c)} disabled={running || used} aria-label={CMD_LABELS[c.cmd]}>
                  <CmdIcon cmd={c.cmd} size={40} />
                  <span className="path-cmd__label">{CMD_LABELS[c.cmd]}</span>
                </button>
              );
            })}
          </div>
        )}

        {!finished && (
          <div className="path-actions">
            <button type="button" className="peek-btn peek-btn--robot" onClick={show} disabled={running}>
              Mutasd!
            </button>
            {open === null && (
              <button type="button" className="big-btn big-btn--robot" onClick={play} disabled={running}>
                <PlayIcon /> Indulás
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
