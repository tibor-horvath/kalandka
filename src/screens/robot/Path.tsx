import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CELL, FRAME_H, FRAME_W, FloorCrates, FloorRobot, FloorTiles, useRover } from '../../components/floor';
import { useLadderRound, WinCard } from '../../components/ladderRound';
import { GameShell } from '../../components/GameShell';
import { FitBox } from '../../components/FitBox';
import { Battery, CmdIcon } from '../../components/robot';
import { GuideBubble, PlayIcon } from '../../components/ui';
import {
  ARROWS,
  CMD_LABELS,
  EMPTY_FEEDBACK,
  FULL_FEEDBACK,
  MAX_TIMES,
  OFFER_FEEDBACK,
  ONE_MORE_FEEDBACK,
  ROUTE_FEEDBACK,
  SHORT_FEEDBACK,
  TOO_LONG_FEEDBACK,
  TURNS,
  buildPuzzle,
  bumpFeedback,
  collect,
  emptyChargeFeedback,
  routeCells,
  run,
  shortest,
  solvedFeedback,
  startFeedback,
  step,
  stepCount,
  type Card,
  type Cell,
  type Cmd,
  type PathFeedback,
} from '../../games/robot/path';
import { speak } from '../../lib/speech';
import { buzz, chime, fanfare, popBubble, powerDown } from '../../lib/sound';
import { useProgress } from '../../state/progress';
import { ROUND_HELP_AFTER } from '../../state/taskLog';

/** Time per robot step while a program runs: room to turn first, then drive. */
const STEP_MS = 600;
/** After a bump or a short program, the robot rests a moment, then rolls back to the start. */
const BACK_MS = 1300;
/** How long the dotted way stays on the floor. */
const ROUTE_MS = 3600;
/** Out of charge, in ms from the moment it runs out: the robot sputters and dims, then the missing steps show, then back to the start. */
const EMPTY_DOTS_MS = 1400;
const EMPTY_BACK_MS = 3800;

/** Ghost cells drawn past the battery for a plan that is too long (the chip says the rest). */
const MAX_GHOSTS = 4;

/** Tries before Csavar offers to show the way (once per course): programs that did not get there, or bumps while stepping. */
const OFFER_AFTER_RUNS = 2;
const OFFER_AFTER_BUMPS = 3;

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** The lightning on the energy bar. */
function Charge() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24">
      <path d="M13.5 2 L5 13.5 H11 L9.5 22 L19 9.5 H12.5 Z" fill="#F2B33D" stroke="#7A5300" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Robotút: lead the robot to its battery, first one arrow at a time, then with a whole program. */
export function Path({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level: levelIndex, win: solve, meter, levelUp } = useLadderRound('path');
  const puzzle = useMemo(() => buildPuzzle(levelIndex, progress.pathRound), [levelIndex, progress.pathRound]);
  const { level } = puzzle;
  const plan = level.mode === 'plan';

  const [cards, setCards] = useState<Card[]>([]);
  const [running, setRunning] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const [route, setRoute] = useState<Cell[] | null>(null);
  const [solved, setSolved] = useState(false);
  /** Single steps used on the current run, for the energy bar. */
  const [used, setUsed] = useState(0);
  /** The charge ran out: the robot sputters, dims and shows the steps it was short of. */
  const [empty, setEmpty] = useState(false);
  const [missingCells, setMissingCells] = useState<Cell[] | null>(null);
  /** Batteries the robot has reached so far (indices into puzzle.goals). */
  const [collected, setCollected] = useState<number[]>([]);
  const [fb, setFb] = useState<PathFeedback>(() => startFeedback(level));

  const live = useRef({ tries: 0, collected: [] as number[] });
  const timers = useRef<number[]>([]);
  /** The child asked for the way (parents' notes). */
  const askedWay = useRef(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const rover = useRover(puzzle.start, later);
  const { pose, moveTo, bump } = rover;
  const say = (f: PathFeedback) => {
    setFb(f);
    speak(f.speech);
  };

  useEffect(() => {
    speak(startFeedback(level).speech);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // One course per mount: App keys this screen by round.
  }, []);

  const win = () => {
    setSolved(true);
    setRoute(null);
    fanfare();
    buzz(40);
    say(solvedFeedback(level));
    solve(askedWay.current || live.current.tries >= ROUND_HELP_AFTER);
  };

  /** Counts a try that did not reach the battery; true exactly once, when it is time to offer help. */
  const missed = (after: number) => {
    live.current.tries += 1;
    return live.current.tries === after;
  };

  // ---------- step mode: each arrow moves at once ----------

  const tapArrow = (cmd: Cmd) => {
    if (solved) return;
    setRoute(null);
    const r = step(puzzle, rover.live.current, cmd);
    moveTo(r.pose);
    if (r.bumped) {
      bump(r.pose.dir, r.bumped);
      say(missed(OFFER_AFTER_BUMPS) ? OFFER_FEEDBACK : bumpFeedback(r.bumped, null));
      return;
    }
    popBubble(Math.abs(r.pose.x - puzzle.start.x) + Math.abs(r.pose.y - puzzle.start.y));
    const got = collect(puzzle.goals, r.pose, live.current.collected);
    if (got !== live.current.collected) {
      chime();
      live.current.collected = got;
      setCollected(got);
    }
    if (got.length === puzzle.goals.length) win();
    else if (fb.tone === 'oops') setFb(startFeedback(level));
  };

  // ---------- plan mode: lay out the cards, then play ----------

  const addCard = (cmd: Cmd) => {
    if (running || solved) return;
    if (cards.length >= level.slots) {
      say(FULL_FEEDBACK);
      return;
    }
    popBubble(cards.length);
    const nextCards = [...cards, { cmd, times: 1 }];
    setCards(nextCards);
    setWrongCard(null);
    warnIfTooLong(nextCards);
  };

  /** Csavar says so the moment a plan grows longer than the charge (once per crossing). */
  const warnIfTooLong = (next: Card[]) => {
    if (puzzle.energy === null) return setFb(startFeedback(level));
    const before = stepCount(cards) > puzzle.energy;
    const after = stepCount(next) > puzzle.energy;
    if (after && !before) say(TOO_LONG_FEEDBACK);
    else if (!after) setFb(startFeedback(level));
  };

  const removeCard = (i: number) => {
    if (running || solved) return;
    popBubble(1);
    const nextCards = cards.filter((_, k) => k !== i);
    setCards(nextCards);
    setWrongCard(null);
    warnIfTooLong(nextCards);
  };

  const repeatLast = (n: number) => {
    if (running || solved) return;
    if (cards.length === 0) {
      say(EMPTY_FEEDBACK);
      return;
    }
    chime();
    const nextCards = cards.map((card, k) => (k === cards.length - 1 ? { ...card, times: card.times === n ? 1 : n } : card));
    setCards(nextCards);
    warnIfTooLong(nextCards);
  };

  const backToStart = () => {
    setActiveCard(null);
    setCollected([]);
    setUsed(0);
    setEmpty(false);
    setMissingCells(null);
    moveTo(puzzle.start);
    setRunning(false);
  };

  /** The charge is gone: power down where the robot stands, then dot the steps it still needed. */
  const runOutOfCharge = (got: number[], offer: boolean) => {
    const at = rover.live.current;
    const goals = puzzle.goals.filter((_, i) => !got.includes(i));
    const course = { ...puzzle, start: at, goals };
    const cmds = shortest(course, level.moves) ?? [];
    setEmpty(true);
    powerDown();
    buzz(30);
    later(() => {
      setMissingCells(routeCells(course, cmds.map((cmd) => ({ cmd, times: 1 }))).slice(1));
      say(offer ? OFFER_FEEDBACK : emptyChargeFeedback(cmds.length));
    }, EMPTY_DOTS_MS);
    later(backToStart, EMPTY_BACK_MS);
  };

  const play = () => {
    if (running || solved) return;
    if (cards.length === 0) {
      say(EMPTY_FEEDBACK);
      return;
    }
    setRoute(null);
    setWrongCard(null);
    setRunning(true);
    // Always from the start: a new try is a new run of the whole program.
    moveTo(puzzle.start);
    setCollected([]);
    setUsed(0);
    const result = run(puzzle, cards);
    result.frames.forEach((f, i) => {
      later(() => {
        setActiveCard(f.card);
        setUsed(i + 1);
        moveTo(f.pose);
        if (f.bumped) bump(f.pose.dir, f.bumped);
        else popBubble(i);
        setCollected((c) => {
          if (f.collected.length > c.length && f.collected.length < puzzle.goals.length) chime();
          return f.collected;
        });
      }, (i + 1) * STEP_MS);
    });
    const end = (result.frames.length + 1) * STEP_MS;
    later(() => {
      if (result.outcome === 'goal') {
        setActiveCard(null);
        setRunning(false);
        win();
        return;
      }
      const offer = missed(OFFER_AFTER_RUNS);
      if (result.outcome === 'bump') {
        setWrongCard(result.card);
        say(offer ? OFFER_FEEDBACK : bumpFeedback(result.frames.at(-1)!.bumped, result.card));
      } else if (result.outcome === 'empty') {
        runOutOfCharge(result.frames.at(-1)?.collected ?? [], offer);
        return;
      } else {
        const some = result.frames.at(-1)?.collected.length ?? 0;
        say(offer ? OFFER_FEEDBACK : some > 0 ? ONE_MORE_FEEDBACK : SHORT_FEEDBACK);
      }
      later(backToStart, BACK_MS);
    }, end);
  };

  /** "Mutasd az utat!": dots on the floor along a shortest way, from where the robot can start now. */
  const showRoute = () => {
    if (running || solved) return;
    // Stepping: from where the robot stands, to the batteries still waiting.
    const from = plan ? puzzle.start : rover.live.current;
    const goals = plan ? puzzle.goals : puzzle.goals.filter((_, i) => !live.current.collected.includes(i));
    const course = { ...puzzle, start: from, goals };
    const cmds = shortest(course, level.moves);
    if (!cmds) return;
    setRoute(routeCells(course, cmds.map((cmd) => ({ cmd, times: 1 }))));
    say(ROUTE_FEEDBACK);
    later(() => setRoute(null), ROUTE_MS);
  };


  const boardW = puzzle.cols * CELL;
  const boardH = puzzle.rows * CELL;
  const palette = level.moves === 'absolute' ? ARROWS : TURNS;
  const planned = stepCount(cards);
  const over = puzzle.energy === null ? 0 : Math.max(0, planned - puzzle.energy);
  const charge = puzzle.energy ?? 0;
  const chip = over ? 'Túl hosszú' : `${charge - (running || empty ? used : planned)} marad`;

  return (
    <GameShell
      game="path"
      className="screen--path"
      title="Robotút"
      meter={meter}
      justSolved={solved}
      levelUp={levelUp}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className={`path-body${plan ? ' is-plan' : ''}`}>
        <div className="path-left">
        <FitBox className="path-fit" width={FRAME_W} height={FRAME_H}>
          <div className="path-frame">
            <div className={`path-board${solved ? ' is-done' : ''}`}>
              <svg
                width={boardW}
                height={boardH}
                viewBox={`0 0 ${boardW} ${boardH}`}
                role="img"
                aria-label={`Pálya: ${puzzle.cols} × ${puzzle.rows} mező, ${puzzle.crates.length} doboz. A robot a(z) ${pose.x + 1}. oszlopban, ${pose.y + 1}. sorban áll. ${puzzle.goals.map((g) => `Elem: ${g.x + 1}. oszlop, ${g.y + 1}. sor.`).join(' ')}`}
              >
                <FloorTiles cols={puzzle.cols} rows={puzzle.rows} />
                {sameCell(pose, puzzle.start) && !solved && (
                  <rect x={puzzle.start.x * CELL + 10} y={puzzle.start.y * CELL + 10} width={CELL - 20} height={CELL - 20} rx="12" className="path-start" />
                )}
                {route &&
                  route.slice(1).map((c, i) => (
                    <circle key={`${c.x},${c.y}`} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="11" className="path-route" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                {missingCells &&
                  missingCells.map((c, i) => (
                    <circle key={`m${c.x},${c.y}`} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="12" className="path-missing" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                <FloorCrates crates={puzzle.crates} hit={rover.hit} />
                {puzzle.goals.map((g, i) => {
                  const got = solved || collected.includes(i);
                  return (
                    <g key={i} transform={`translate(${g.x * CELL} ${g.y * CELL})`} className={got ? 'path-battery is-charged' : 'path-battery'}>
                      <Battery charged={got} />
                    </g>
                  );
                })}
              </svg>
              <FloorRobot rover={rover} happy={solved} empty={empty}>
                {empty && (
                  <>
                    <span className="path-puff" style={{ left: 38, width: 18, height: 18, animationDelay: '0.3s', '--dx': '-10px' } as CSSProperties} />
                    <span className="path-puff" style={{ left: 52, width: 22, height: 22, animationDelay: '0.45s', '--dx': '6px' } as CSSProperties} />
                    <span className="path-puff" style={{ left: 44, width: 16, height: 16, animationDelay: '0.6s', '--dx': '-2px' } as CSSProperties} />
                    <span className="path-empty-badge">
                      <svg width="34" height="20" viewBox="0 0 34 20">
                        <rect x="2" y="2" width="26" height="16" rx="4" fill="#fff1e0" stroke="#d9741a" strokeWidth="3" />
                        <rect x="29" y="6" width="3" height="8" rx="1.5" fill="#d9741a" />
                      </svg>
                    </span>
                  </>
                )}
              </FloorRobot>
            </div>
            {solved && (
              <WinCard title="Feltöltve!" next="Következő pálya" className="" onNext={levelUp.advance} />
            )}
          </div>
        </FitBox>
          {plan && puzzle.energy !== null && (
            <div
              className={`path-energy${over ? ' is-over' : ''}${empty ? ' is-empty' : ''}`}
              role="img"
              aria-label={`A robot energiája ${charge} lépésre elég. A terv ${planned} lépés.${over ? ' Túl hosszú.' : ''}`}
            >
              <span className="path-energy__pack" aria-hidden="true">
                <span className={`path-energy__battery${charge > 12 ? ' is-many' : ''}`}>
                  {Array.from({ length: charge }, (_, i) => (
                    <span key={i} className={`path-energy__cell${i < used ? ' is-spent' : i < planned ? ' is-planned' : ''}`} />
                  ))}
                </span>
                <span className="path-energy__nub" />
                {over > 0 && (
                  <span className="path-energy__ghosts">
                    {Array.from({ length: Math.min(over, MAX_GHOSTS) }, (_, i) => (
                      <span key={i} className="path-energy__ghost" />
                    ))}
                  </span>
                )}
              </span>
              <span className="path-energy__chip" aria-hidden="true">
                <Charge />
                {chip}
              </span>
            </div>
          )}

        </div>

        <div className="path-side">
          <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
            {fb.text}
          </GuideBubble>

          {plan && (
            <ol className={`path-program${level.slots > 8 ? ' is-long' : ''}`} aria-label={`Program: ${cards.length} / ${level.slots} kártya`} style={{ '--slots': level.slots } as CSSProperties}>
              {Array.from({ length: level.slots }, (_, i) => {
                const card = cards[i];
                if (!card) return <li key={i} className="path-slot" aria-hidden="true" />;
                const state = wrongCard === i ? ' is-wrong' : activeCard === i ? ' is-now' : '';
                return (
                  <li key={i} className="path-slot">
                    <button
                      type="button"
                      className={`path-card${state}`}
                      onClick={() => removeCard(i)}
                      disabled={running || solved}
                      aria-label={`${i + 1}. kártya: ${CMD_LABELS[card.cmd]}${card.times > 1 ? `, ${card.times}-szor` : ''}. Koppints, és kiveszem.`}
                    >
                      <span className="path-card__no">{i + 1}</span>
                      <CmdIcon cmd={card.cmd} size={40} />
                      {card.times > 1 && <span className="path-card__times">×{card.times}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {!solved && (
            <div className={`path-palette path-palette--${level.mode === 'step' ? 'cross' : level.moves}`}>
              {palette.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  className={`path-cmd path-cmd--${cmd}`}
                  onClick={() => (plan ? addCard(cmd) : tapArrow(cmd))}
                  disabled={running}
                  aria-label={plan ? `${CMD_LABELS[cmd]} kártya a sor végére` : CMD_LABELS[cmd]}
                >
                  <CmdIcon cmd={cmd} size={level.mode === 'step' ? 48 : 40} />
                  <span className="path-cmd__label">{CMD_LABELS[cmd]}</span>
                </button>
              ))}
              {level.repeat &&
                Array.from({ length: MAX_TIMES - 1 }, (_, k) => k + 2).map((n) => (
                  <button key={n} type="button" className="path-cmd path-cmd--times" onClick={() => repeatLast(n)} disabled={running} aria-label={`Az utolsó kártya ${n}-szor fut`}>
                    <span className="path-cmd__times">×{n}</span>
                    <span className="path-cmd__label">{n === 2 ? 'kétszer' : 'háromszor'}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="path-actions">
            {!solved && (
              <button type="button" className="peek-btn peek-btn--robot" onClick={() => {
                  askedWay.current = true;
                  showRoute();
                }}
                disabled={running}
              >
                Mutasd az utat!
              </button>
            )}
            {plan && !solved && (
              <button type="button" className="big-btn big-btn--robot" onClick={play} disabled={running}>
                <PlayIcon /> Indulás
              </button>
            )}
          </div>
        </div>
      </div>

    </GameShell>
  );
}
